from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from prophet import Prophet
import redis
import json
import os
from io import StringIO
import datetime
from typing import Any

CACHE_DURATION = 5 * 60  # 5 minutes

app = Flask(__name__)
CORS(app)
app.config['ENV'] = 'development'

redis_host = os.getenv('REDIS_HOST', 'localhost')
redis_port = os.getenv('REDIS_PORT', 6379)
r = redis.Redis(host=redis_host, port=int(redis_port), db=0)

def fetch_data(symbol, interval, start_date=None, end_date=None):
    if end_date is None:
        end_date = datetime.datetime.now()
    if start_date is None:
        if interval == '1m':
            start_date = end_date - datetime.timedelta(days=30)
        elif interval in ['2m', '5m', '15m', '30m', '60m']:
            start_date = end_date - datetime.timedelta(days=60)
        else:
            start_date = end_date - datetime.timedelta(days=365)

    hist = yf.download(tickers=symbol, start=start_date, end=end_date, interval=interval)

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
    return hist

@app.route('/historical', methods=['GET'])
def get_historical_data():
    symbol = request.args.get('symbol')
    interval = request.args.get('interval', '1d')  # Default to '1d' if not provided
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    # Parse dates if provided
    if start_date:
        start_date = datetime.datetime.strptime(start_date, '%Y-%m-%d')
    if end_date:
        end_date = datetime.datetime.strptime(end_date, '%Y-%m-%d')

    # Check if data is cached
    cache_key = f"{symbol}_{interval}_{start_date}_{end_date}"
    cached_data = r.get(cache_key)
    if cached_data:
        print("CACHE HIT")
        data = pd.read_json(StringIO(cached_data.decode('utf-8')), convert_dates=True)
    else:
        data = fetch_data(symbol, interval, start_date, end_date)
        r.set(cache_key, data.to_json(), ex=CACHE_DURATION)  # Cache for 5 minutes
        print("STORED IN CACHE")

    return data.to_json(orient='records')

@app.route('/forecast', methods=['POST'])
def forecast():
    print("FORECASTING")
    symbol = request.json['symbol']
    interval = request.json.get('interval', '1d')  # Default to '1d' if not provided
    start_date = request.json.get('start_date')
    end_date = request.json.get('end_date')

    # Parse dates if provided
    if start_date:
        start_date = datetime.datetime.strptime(start_date, '%Y-%m-%d')
    if end_date:
        end_date = datetime.datetime.strptime(end_date, '%Y-%m-%d')

    # Check if data is cached
    cache_key = f"{symbol}_{interval}_{start_date}_{end_date}"
    cached_data = r.get(cache_key)
    if cached_data:
        print("CACHE HIT")
        data = pd.read_json(StringIO(cached_data.decode('utf-8')), convert_dates=True)
    else:
        data = fetch_data(symbol, interval, start_date, end_date)
        r.set(cache_key, data.to_json(), ex=CACHE_DURATION)  # Cache for 5 minutes
        print("STORED IN CACHE")

    data['ds'] = pd.to_datetime(data['date']).dt.tz_localize(None)  # Remove timezone information
    data['y'] = data['close']

    # Remove negative values from the dataset
    data = data[data['y'] >= 0]

    # Ensure data is sorted by date
    data = data.sort_values(by='ds')

    # Fit the model
    model = Prophet()
    model.fit(data[['ds', 'y']])
    future = model.make_future_dataframe(periods=30)  # Forecast 30 periods into the future
    forecast = model.predict(future)

    # Convert to original format
    forecast = forecast[['ds', 'yhat']]  # Not included: 'yhat_lower', 'yhat_upper'
    forecast = forecast.rename(columns={'ds': 'date', 'yhat': 'close'})

    return forecast.to_json(orient='records')

@app.route('/stock-info', methods=['GET'])
def stock_info():
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
    app.run(host='0.0.0.0', port=5000, debug=True)
