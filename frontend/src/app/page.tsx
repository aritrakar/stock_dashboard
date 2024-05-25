'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import StockChart from './components/StockChart';
import { debounce } from 'lodash';

interface StockData {
  date: string;
  close: number;
}

interface StockInfo {
  name: string;
  description: string;
  sector: string;
  website: string;
  financials: {
    [key: string]:  number;
  };
}

const formatNumber = (marketCap: number) => {
  if (marketCap >= 1_000_000_000_000) {
    return `${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
  }
  else if (marketCap >= 1_000_000_000) {
    return `${(marketCap / 1_000_000_000).toFixed(2)}B`;
  } else if (marketCap >= 1_000_000) {
    return `${(marketCap / 1_000_000).toFixed(2)}M`;
  } else {
    return `${marketCap}`;
  }
}

const formatWebsite = (website: string) => {
  return website?.replace(/(^\w+:|^)\/\//, '') ?? '';
}

const Home: React.FC = () => {
  const [historicalData, setHistoricalData] = useState<StockData[]>([]);
  const [forecastData, setForecastData] = useState<StockData[]>([]);
  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('1m');  // Default interval
  const [error, setError] = useState<string | null>(null);
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);

  const fetchHistoricalData = async () => {
    try {
      const response = await axios.get<StockData[]>(`/api/historical`, {
        params: { symbol, interval },
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

  const fetchStockInfo = async () => {
    try {
      const response = await axios.get<StockInfo>(`/api/stock-info`, {
        params: { symbol },
      });
      setStockInfo(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error fetching stock info:", error.message);
        setError("Error fetching stock info: " + error.message);
        if (error.response) {
          console.error("Response data:", error.response.data);
        }
      } else {
        console.error("Unexpected error fetching stock info:", error);
        setError("Unexpected error fetching stock info.");
      }
    }
  };

  const handleForecast = async () => {
    try {
      const response = await axios.post<StockData[]>('/api/forecast', { symbol, interval }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
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

  // Create a debounced version of the fetch functions
  // to avoid making too many requests
  const debouncedFetchData = useCallback(
    debounce(() => {
      fetchHistoricalData();
      fetchStockInfo();
    }, 500), // Adjust the delay as needed
    [symbol, interval]
  );

  useEffect(() => {
    debouncedFetchData();
    // Cancel the debounced function call if the component unmounts
    return () => {
      debouncedFetchData.cancel();
    };
  }, [symbol, interval, debouncedFetchData]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Enter stock symbol"
            style={{ marginRight: '10px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <select onChange={(e) => setInterval(e.target.value)} value={interval} style={{ marginRight: '10px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
            <option value="30m">30 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="1d">1 Day</option>
          </select>
          <button onClick={handleForecast} style={{ padding: '5px 10px', borderRadius: '4px', backgroundColor: '#007bff', color: '#fff', border: 'none' }}>Generate</button>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ width: '80%', textAlign: 'center' }}>
          <StockChart historicalData={historicalData} forecastData={forecastData} />
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {stockInfo ? (
          <div style={{ width: '100%', maxWidth: '350px', padding: '20px', backgroundColor: '#fff', borderLeft: '1px solid #ddd', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', borderRadius: '10px', textAlign: 'left' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: '#333' }}>{stockInfo.name}</h1>
            {/* <p style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#555' }}>{stockInfo.description}</p> */}
            <p style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#555' }}><strong>Website:</strong> <a href={stockInfo.website} target="_blank" rel="noopener noreferrer">{formatWebsite(stockInfo.website)}</a></p>
            <p style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#555' }}><strong>Sector:</strong> {stockInfo.sector}</p>

            <h2 style={{ fontSize: '1.25rem', marginBottom: '10px', color: '#333' }}>Financials</h2>
            <p style={{ fontSize: '1rem', marginBottom: '5px', color: '#555' }}><strong>Market Cap:</strong> ${formatNumber(stockInfo.financials.marketCap)}</p>
            <p style={{ fontSize: '1rem', marginBottom: '5px', color: '#555' }}><strong>EBITDA:</strong> ${formatNumber(stockInfo.financials.ebitda)}</p>
            <p style={{ fontSize: '1rem', marginBottom: '5px', color: '#555' }}><strong>P/E Ratio:</strong> {stockInfo.financials.peRatio}</p>
            <p style={{ fontSize: '1rem', marginBottom: '5px', color: '#555' }}><strong>Close:</strong> ${formatNumber(stockInfo.financials.close)}</p>
            <p style={{ fontSize: '1rem', marginBottom: '5px', color: '#555' }}><strong>Open:</strong> ${formatNumber(stockInfo.financials.open)}</p>
            <p style={{ fontSize: '1rem', marginBottom: '5px', color: '#555' }}><strong>High:</strong> ${formatNumber(stockInfo.financials.high)}</p>
            <p style={{ fontSize: '1rem', marginBottom: '5px', color: '#555' }}><strong>Low:</strong> ${formatNumber(stockInfo.financials.low)}</p>
            <p style={{ fontSize: '1rem', marginBottom: '5px', color: '#555' }}><strong>Volume:</strong> {formatNumber(stockInfo.financials.volume)}</p>
            <p style={{ fontSize: '1rem', marginBottom: '5px', color: '#555' }}><strong>Pct. Change Today:</strong> {stockInfo.financials.pctChange ?? '-'}%</p>
          </div>
        ) : (
          <p>Loading stock information...</p>
        )}
      </div>
    </div>
  );
};

export default Home;
