'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import StockChart from './components/StockChart';

interface StockData {
  date: string;
  close: number;
}

const Home: React.FC = () => {
  const [historicalData, setHistoricalData] = useState<StockData[]>([]);
  const [forecastData, setForecastData] = useState<StockData[]>([]);
  const [symbol, setSymbol] = useState('AAPL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistoricalData();
  }, [symbol]);

  const fetchHistoricalData = async () => {
    try {
      const response = await axios.get<StockData[]>(`/api/historical`, {
        params: { symbol },
      });
      setHistoricalData(response.data);
      setForecastData([]);  // Clear forecast data when fetching new historical data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error fetching historical data:", error.message);
        setError("Error fetching historical data: " + error.message);
        if (error.response) {
          console.error("Response data:", error.response.data);
        }
      } else {
        console.error("Unexpected error fetching historical data:", error);
        setError("Unexpected error fetching historical data.");
      }
    }
  };

  const handleForecast = async () => {
    try {
      const response = await axios.post<StockData[]>('/api/forecast', { symbol }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // console.log("Got forecast data:", response.data)
      setForecastData(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error fetching forecast data:", error.message);
        setError("Error fetching forecast data: " + error.message);
        if (error.response) {
          console.error("Response data:", error.response.data);
        }
      } else {
        console.error("Unexpected error fetching forecast data:", error);
        setError("Unexpected error fetching forecast data.");
      }
    }
  };

  return (
    <div>
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        placeholder="Enter stock symbol"
      />
      <button onClick={handleForecast}>Get Forecast</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <StockChart historicalData={historicalData} forecastData={forecastData} />
    </div>
  );
};

export default Home;
