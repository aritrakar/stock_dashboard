from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from prophet import Prophet
import redis
import json
import os
from io import StringIO

app = Flask(__name__)
CORS(app)
app.config['ENV'] = 'development'

redis_host = os.getenv('REDIS_HOST', 'localhost')
redis_port = os.getenv('REDIS_PORT', 6379)
r = redis.Redis(host=redis_host, port=int(redis_port), db=0)

def fetch_data(symbol):
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="1y")
    # hist = ticker.history(start="2024-05-02", end="2024-05-07", interval="1m")

    # Clean the data
    hist = hist.reset_index()
    hist = hist.rename(columns={'Date': 'date', 'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'volume'})
    return hist

@app.route('/historical', methods=['GET'])
def get_historical_data():
    symbol = request.args.get('symbol')
    # interval = request.args.get('interval', '1d')  # Default to '1d' if not provided

    # Check if data is cached
    # cache_key = f"{symbol}_{interval}"
    # cached_data = r.get(cache_key)
    # if cached_data:
    #     data = pd.read_json(StringIO(cached_data.decode('utf-8')), convert_dates=True)
    # else:
    #     data = fetch_data(symbol)
    #     r.set(cache_key, data.to_json(), ex=3600)  # Cache for 1 hour

    data = fetch_data(symbol)

    # print(data.columns)
    # print(data.head())

    return data.to_json(orient='records')

@app.route('/forecast', methods=['POST'])
def forecast():
    print("FORECASTING")
    symbol = request.json['symbol']
    # interval = request.json.get('interval', '1d')  # Default to '1d' if not provided

    # Check if data is cached
    # cache_key = f"{symbol}_{interval}"
    # cached_data = r.get(cache_key)
    # if cached_data:
    #     data = pd.read_json(StringIO(cached_data.decode('utf-8')), convert_dates=True)
    # else:
    #     data = fetch_data(symbol)
    #     r.set(cache_key, data.to_json(), ex=3600)  # Cache for 1 hour

    data = fetch_data(symbol)

    data['ds'] = pd.to_datetime(data['date']).dt.tz_localize(None)  # Remove timezone information
    data['y'] = data['close']

    # Remove negative values from the dataset
    data = data[data['y'] >= 0]

    # Ensure data is sorted by date
    data = data.sort_values(by='ds')

    # Fit the model
    model = Prophet()
    model.fit(data[['ds', 'y']])
    future = model.make_future_dataframe(periods=30)  # TODO: Make this configurable
    forecast = model.predict(future)

    # Convert to original format
    forecast = forecast[['ds', 'yhat']]  # Not included: 'yhat_lower', 'yhat_upper'
    forecast = forecast.rename(columns={'ds': 'date', 'yhat': 'close'})

    # print(forecast)
    return forecast.to_json(orient='records')

from pprint import pprint
@app.route('/stock-info', methods=['GET'])
def stock_info():
    symbol = request.args.get('symbol')
    ticker = yf.Ticker(symbol)
    info = ticker.info
    # pprint(info)
    stock_info = {
        'name': info.get('longName'),
        # 'description': info.get('longBusinessSummary'),
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
