import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_talisman import Talisman
from io import StringIO
import os
import pandas as pd
import pandas_ta as ta
from prophet import Prophet
import redis
import yfinance as yf

CACHE_DURATION = 5 * 60  # 5 minutes

app = Flask(__name__)
CORS(app) # Enable CORS
Talisman(app) # Secure app with Talisman

redis_host = os.getenv('REDIS_HOST', 'localhost')
redis_port = os.getenv('REDIS_PORT', 6379)
r = redis.Redis(host=redis_host, port=int(redis_port), db=0)

def fetch_data(symbol, interval, start_date=None, end_date=None, indicators=None):
    if end_date is None:
        end_date = datetime.datetime.now()
    if start_date is None:
        # Map of intervals to number of days to fetch due to yfinance limitations
        interval_map = {
            '1m': 1,
            '5m': 1,
            '15m': 7,
            '30m': 60,
            '1h': 60,
            '1d': 365,
        }
        
        start_date = end_date - datetime.timedelta(days=interval_map.get(interval, 30))

    hist: pd.DataFrame = yf.download(tickers=symbol, start=start_date, end=end_date, interval=interval)

    # Clean the data
    hist = hist.reset_index()
    hist = hist.rename(columns={
        'Datetime': 'date',
        'Date': 'date',
        'Open': 'open',
        'High': 'high',
        'Low': 'low',
        'Close': 'close',
        'Volume': 'volume'
    })

    # Compute additional indicators if requested
    if indicators:
        for indicator in indicators:
            if indicator == 'sma':
                hist["SMA"] = ta.sma(hist['close'], length=14)
            if indicator == 'ema':
                hist["EMA"] = ta.ema(hist['close'], length=14)
            if indicator == 'rsi':
                hist["RSI"] = ta.rsi(hist['close'], length=14)
            if indicator == 'macd':
                macd = ta.macd(hist['close'], fast=12, slow=26, signal=9)
                if 'MACD_12_26_9' in macd:
                    hist["MACD"] = macd['MACD_12_26_9']
                else:
                    # Error. MACD likely not available due to invalid time period.
                    hist["MACD"] = []
            if indicator == 'bbands':
                bbands = ta.bbands(hist['close'], length=20)
                if "BBU_20_2.0" in bbands and "BBM_20_2.0" in bbands and "BBL_20_2.0" in bbands:
                    hist["BB_UPPER"], hist["BB_MIDDLE"], hist["BB_LOWER"] = bbands['BBU_20_2.0'], bbands['BBM_20_2.0'], bbands['BBL_20_2.0']
                else:
                    # Error. Bollinger Bands likely not available due to invalid time period.
                    hist["BB_UPPER"], hist["BB_MIDDLE"], hist["BB_LOWER"] = [], [], []

    return hist

@app.route('/historical', methods=['GET'])
def get_historical_data():
    '''
    Returns historical data for a given stock symbol and interval.
    Valid intervals are: 1m, 5m, 15m, 1h, 1d due to yfinance limitations.
    This method does not detect weekends or holidays. So, for example,
    if you request 1d data on a Saturday, you will get data for Friday.
    '''
    symbol = request.args.get('symbol')
    interval = request.args.get('interval', '1d')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    indicators = request.args.getlist('indicators')

    if start_date:
        start_date = datetime.datetime.strptime(start_date, '%Y-%m-%d')
    if end_date:
        end_date = datetime.datetime.strptime(end_date, '%Y-%m-%d')

    cache_key = f"{symbol}_{interval}_{start_date}_{end_date}_{'_'.join(indicators)}"
    cached_data = r.get(cache_key)

    if cached_data:
        data = pd.read_json(StringIO(cached_data.decode('utf-8')), convert_dates=True)
    else:
        data = fetch_data(symbol, interval, start_date, end_date, indicators)
        r.set(cache_key, data.to_json(), ex=CACHE_DURATION)

    return data.to_json(orient='records')


@app.route('/forecast', methods=['POST'])
def forecast():
    '''
    Returns a forecast for a given stock symbol and forecast period (not necessarily days).
    NOTE: The forecast is not very accurate.
    '''
    symbol = request.json['symbol']
    interval = request.json.get('interval', '1d')
    start_date = request.json.get('start_date')
    end_date = request.json.get('end_date')
    indicators = request.json.get('indicators', [])
    forecast_period = request.json.get('forecast_period', 30)

    # Handle negative forecast periods
    if forecast_period < 0:
        forecast_period = 0

    # Parse dates if provided
    if start_date:
        start_date = datetime.datetime.strptime(start_date, '%Y-%m-%d')
    if end_date:
        end_date = datetime.datetime.strptime(end_date, '%Y-%m-%d')

    # Check if data is cached
    cache_key = f"{symbol}_{interval}_{start_date}_{end_date}"
    cached_data = r.get(cache_key)
    if cached_data:
        data = pd.read_json(StringIO(cached_data.decode('utf-8')), convert_dates=True)
    else:
        data = fetch_data(symbol, interval, start_date, end_date, indicators)
        r.set(cache_key, data.to_json(), ex=CACHE_DURATION)

    data['ds'] = pd.to_datetime(data['date']).dt.tz_localize(None)  # Remove timezone information
    data['y'] = data['close']

    # Remove negative values from the dataset
    data = data[data['y'] >= 0]

    # Ensure data is sorted by date
    data = data.sort_values(by='ds')

    # Fit the model
    model = Prophet()
    model.fit(data[['ds', 'y']])
    future = model.make_future_dataframe(periods=forecast_period)
    forecast = model.predict(future)

    # Handle potential edge cases with negative values
    # NOTE: Normally, this would not be necessary because the model
    # should not predict negative values in the first place.
    for i in range(1, len(forecast)):
        if forecast.loc[i, 'yhat'] < 0:
            forecast.loc[i, 'yhat'] = forecast.loc[i - 1, 'yhat']    

    # Convert to original format
    forecast = forecast[['ds', 'yhat']]  # Not included: 'yhat_lower', 'yhat_upper'
    forecast = forecast.rename(columns={'ds': 'date', 'yhat': 'close'})

    return forecast.to_json(orient='records')

@app.route('/stock-info', methods=['GET'])
def stock_info():
    '''
    Returns information about a stock.
    '''
    symbol = request.args.get('symbol')
    ticker = yf.Ticker(symbol)
    info = ticker.info
    stock_info = {
        'name': info.get('longName'),
        'sector': info.get('sector'),
        'website': info.get('website'),
        'financials': {
            'marketCap': info.get('marketCap'),
            'ebitda': info.get('ebitda'),
            'peRatio': info.get('trailingPE'),
            'close': info.get('previousClose'),
            'open': info.get('open'),
            'high': info.get('dayHigh'),
            'low': info.get('dayLow'),
            'volume': info.get('volume'),
            'pctChange': info.get('regularMarketChangePercent'),
        }
    }
    return jsonify(stock_info)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) # Only for development
