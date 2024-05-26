# Stock Dashboard

## Overview

The Stock Forecasting Dashboard is a web application that allows users to visualize historical stock data and generate future forecasts using Facebook Prophet. It also supports multiple technical indicators such as Simple Moving Average (SMA), Exponential Moving Average (EMA), Relative Strength Index (RSI), MACD, and Bollinger Bands (BB).

## Features

- **Historical Data Visualization**: Display historical stock price data for certain time intervals (e.g., 1 minute, 5 minutes, 1 hour, 1 day).
- **Forecasting**: Generate and display future stock price forecasts using Facebook Prophet. Note that the forecast is based on historical data and may not be accurate.
- **Technical Indicators**: Visualize technical indicators including (14 period) SMA, EMA, RSI, MACD, and Bollinger Bands.
- **Interactive UI**: Select stock symbols, time intervals, start and end dates, and technical indicators through an intuitive interface.

## Technologies Used

- **Frontend**:

  - [Next.js](https://nextjs.org/) - React framework for server-side rendering.
  - [React Chart.js 2](https://react-chartjs-2.js.org/) - Charting library for React.
  - [Axios](https://axios-http.com/) - Promise-based HTTP client for the browser and Node.js.
  - [React Datepicker](https://reactdatepicker.com/) - A simple and reusable datepicker component for React.

- **Backend**:

  - [Flask](https://flask.palletsprojects.com/) - A lightweight WSGI web application framework for Python.
  - [yfinance](https://pypi.org/project/yfinance/) - Yahoo! Finance market data downloader.
  - [Prophet](https://facebook.github.io/prophet/) - Forecasting tool from Facebook.
  - [TA-Lib](https://mrjbq7.github.io/ta-lib/) - Technical Analysis Library for Python.
  - [Redis](https://redis.io/) - In-memory data structure store for caching.

- **Docker**:
  - Containerization of the frontend, backend, and Redis services.

## Installation

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) (if running locally without Docker)
- [Python 3.8+](https://www.python.org/)

### Running with Docker (recommended)

1. Clone the repository:

   ```bash
   git clone https://github.com/aritrakar/stock_dashboard.git
   cd stock_dashboard
   ```

2. Build and start the containers:

   ```bash
   docker-compose up --build
   ```

3. Access the application at `http://localhost:3000`.

### Running Locally

#### Backend

1. Navigate to the `backend` directory:

   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use .venv\Scripts\activate
   ```

3. Install the dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask server:
   ```bash
   flask run
   ```

#### Frontend

1. Navigate to the `frontend` directory:

   ```bash
   cd ../frontend
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Start the Next.js development server:

   ```bash
   npm run dev
   ```

4. Access the application at `http://localhost:3000`.

#### Redis

1. Install and start Redis:

   ```bash
   sudo apt-get install redis-server
   sudo systemctl start redis-server
   ```

2. Start the Redis container:

   ```bash
   docker run -d -p 6379:6379 redis
   ```

## Usage

1. **Enter Stock Symbol**: Type the stock symbol (e.g., AAPL for Apple Inc.) in the input box (AAPL by default).
2. **Select Interval**: Choose the desired time interval (e.g., 1 minute, 1 hour, 1 day) from the dropdown menu (`1d` or 1 day by default).
3. **Select Date Range**: Pick the start and end dates using the date pickers.
4. **Select Indicators**: Choose the technical indicators you want to visualize.
5. **Forecast Period**: Enter the number of periods (not necessarily days) to forecast. Note that simply entering a number is not enough; you must also click the "Generate" button to generate the forecast.
6. **Generate Forecast**: Click the "Generate" button to fetch historical data and generate the forecast.

## API Endpoints

### GET `/api/historical`

Fetch historical stock data.

#### Query Parameters

- `symbol` (string): Stock symbol.
- `interval` (string): Time interval (e.g., `1m`, `1d`).
- `start_date` (string): Start date in `YYYY-MM-DD` format.
- `end_date` (string): End date in `YYYY-MM-DD` format.
- `indicators` (array): List of technical indicators to include.

### POST `/api/forecast`

Generate stock price forecast.

#### Request Body

- `symbol` (string): Stock symbol.
- `interval` (string): Time interval (e.g., `1m`, `1d`).
- `start_date` (string): Start date in `YYYY-MM-DD` format.
- `end_date` (string): End date in `YYYY-MM-DD` format.
- `indicators` (array): List of technical indicators to include.
- `forecast_period` (int): Number of _periods_ (not necessarily days) to forecast.

### GET `/api/stock-info`

Fetch stock information.

#### Query Parameters

- `symbol` (string): Stock symbol.

#### Request Body

- `symbol` (string): Stock symbol.
- `interval` (string): Time interval (e.g., `1m`, `1d`).
- `start_date` (string): Start date in `YYYY-MM-DD` format.
- `end_date` (string): End date in `YYYY-MM-DD` format.
- `indicators` (array): List of technical indicators to include.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
