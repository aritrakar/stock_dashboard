'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import StockChart from './components/StockChart';

interface StockData {
  date: string;
  close: number;
}

const Home: React.FC = () => {
  const [data, setData] = useState<StockData[]>([]);
  const [symbol, setSymbol] = useState('AAPL');
  const [forecast, setForecast] = useState<StockData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistoricalData();
  }, [symbol]);

  const fetchHistoricalData = async () => {
    if (!symbol || symbol.length !== 4) {
      return;
    }
    try {
      const response = await axios.get<StockData[]>(`/api/historical`, {
        params: { symbol },
      });
      setData(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error fetching historical data:", error.message);
        setError("Error fetching historical data: " + error.message);
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
      setForecast(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error fetching forecast data:", error.message);
        setError("Error fetching forecast data: " + error.message);
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
      <StockChart data={data} />
      {forecast.length > 0 && <StockChart data={forecast} />}
    </div>
  );
};

export default Home;
