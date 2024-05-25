from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pandas as pd
from prophet import Prophet
import redis
import json
import os

app = Flask(__name__)
CORS(app)
app.config['ENV'] = 'development'

redis_host = os.getenv('REDIS_HOST', 'localhost')
redis_port = os.getenv('REDIS_PORT', 6379)
r = redis.Redis(host=redis_host, port=int(redis_port), db=0)

# TODO: Read from environment variable
API_KEY = '7GK5ACZ7DFZWCE46'
BASE_URL = 'https://www.alphavantage.co/query'

def fetch_data(symbol):
    URL = f'{BASE_URL}?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={API_KEY}'
    response = requests.get(URL)
    data = response.json()
    print("GOT DATA FOR SYMBOL: ", symbol)
    return data

@app.route('/historical', methods=['GET'])
def get_historical_data():
    symbol = request.args.get('symbol')
    cached_data = r.get(symbol)
    if cached_data:
        data = json.loads(cached_data)
    else:
        data = fetch_data(symbol)
        r.set(symbol, json.dumps(data), ex=3600)  # Cache for 1 hour
    df = pd.DataFrame.from_dict(data['Time Series (Daily)'], orient='index')
    df = df.reset_index().rename(columns={'index': 'date', '1. open': 'open', '2. high': 'high', '3. low': 'low', '4. close': 'close', '5. volume': 'volume'})
    return df.to_json(orient='records')

@app.route('/forecast', methods=['POST'])
def forecast():
    symbol = request.json['symbol']
    cached_data = r.get(symbol)
    if cached_data:
        data = json.loads(cached_data)
    else:
        data = fetch_data(symbol)
        r.set(symbol, json.dumps(data), ex=3600)  # Cache for 1 hour
    df = pd.DataFrame.from_dict(data['Time Series (Daily)'], orient='index')
    df = df.reset_index().rename(columns={'index': 'date', '1. open': 'open', '2. high': 'high', '3. low': 'low', '4. close': 'close', '5. volume': 'volume'})
    df['ds'] = pd.to_datetime(df['date'])
    df['y'] = df['close']
    model = Prophet()
    model.fit(df[['ds', 'y']])
    future = model.make_future_dataframe(periods=30)
    forecast = model.predict(future)
    return forecast.to_json(orient='records')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
