import React from 'react';
import { Line, ChartProps } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
// import { enUS } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StockData {
  date: string;
  close: number;
  SMA?: number;
  EMA?: number;
  RSI?: number;
  MACD?: number;
  BB_UPPER?: number;
  BB_MIDDLE?: number;
  BB_LOWER?: number;
}

interface StockChartProps {
  historicalData: StockData[];
  forecastData: StockData[];
  selectedIndicators: string[];
}

const StockChart: React.FC<StockChartProps> = ({ historicalData, forecastData, selectedIndicators }) => {
  const stockData = {
    labels: historicalData.map((d) => d.date),
    datasets: [
      {
        label: 'Stock Price',
        data: historicalData.map((d) => d.close),
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
        yAxisID: 'y-axis-1',
      },
      {
        label: 'Forecasted Price',
        data: forecastData.map((d) => d.close),
        borderColor: 'rgba(255, 99, 132, 1)',
        fill: false,
        yAxisID: 'y-axis-1',
      },
      ...selectedIndicators.includes('sma') ? [{
        label: 'Simple Moving Average (SMA)',
        data: historicalData.map((d) => d.SMA),
        borderColor: 'rgba(84, 227, 111, 89)',
        fill: false,
        yAxisID: 'y-axis-1',
      }] : [],
      ...selectedIndicators.includes('ema') ? [{
        label: 'Exponential Moving Average (EMA)',
        data: historicalData.map((d) => d.EMA),
        borderColor: 'rgba(227, 84, 225, 1)',
        fill: false,
        yAxisID: 'y-axis-1',
      }] : [],
      ...selectedIndicators.includes('bbands') ? [
        {
          label: 'Bollinger Bands Upper',
          data: historicalData.map((d) => d.BB_UPPER),
          borderColor: 'rgba(225, 99, 132, 1)',
          fill: false,
          yAxisID: 'y-axis-1',
        },
        {
          label: 'Bollinger Bands Middle',
          data: historicalData.map((d) => d.BB_MIDDLE),
          borderColor: 'rgba(153, 102, 255, 1)',
          fill: false,
          yAxisID: 'y-axis-1',
        },
        {
          label: 'Bollinger Bands Lower',
          data: historicalData.map((d) => d.BB_LOWER),
          borderColor: 'rgba(54, 162, 235, 1)',
          fill: false,
          yAxisID: 'y-axis-1',
        }
      ] : [],
    ],
  };

  const indicatorData = {
    labels: historicalData.map((d) => d.date),
    datasets: [
      ...selectedIndicators.includes('rsi') ? [{
        label: 'Relative Strength Index (RSI)',
        data: historicalData.map((d) => d.RSI),
        borderColor: 'rgba(255, 159, 64, 1)',
        fill: false,
        yAxisID: 'y-axis-2',
      }] : [],
      ...selectedIndicators.includes('macd') ? [
        {
          label: 'MACD',
          data: historicalData.map((d) => d.MACD),
          borderColor: 'rgba(255, 206, 86, 1)',
          fill: false,
          yAxisID: 'y-axis-3',
        }
      ] : [],
    ],
  };

  const stockOptions: ChartProps<'line'>['options'] = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'PP',
          displayFormats: {
            day: 'MMM dd',
          },
        },
      },
      'y-axis-1': {
        position: 'left',
        title: {
          display: true,
          text: 'Stock Price and Moving Averages',
        },
      },
    },
  };

  const indicatorOptions: ChartProps<'line'>['options'] = {
    // responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'PP',
          displayFormats: {
            day: 'MMM dd',
          },
        },
      },
      'y-axis-2': {
        position: 'left',
        title: {
          display: true,
          text: 'Relative Strength Index (RSI)',
        },
      },
      'y-axis-3': {
        position: 'right',
        title: {
          display: true,
          text: 'MACD',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div style={{ flex: 1 }}>
        <Line data={stockData} options={stockOptions} />
      </div>
      <div style={{ flex: 1, height: "25%" }}>
        <Line data={indicatorData} options={indicatorOptions} />
      </div>
    </div>
  );
};

export default StockChart;
