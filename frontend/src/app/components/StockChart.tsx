import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { ChartProps } from 'react-chartjs-2';
import 'chart.js/auto';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);


interface StockChartProps {
  historicalData: { date: string; close: number }[];
  forecastData: { date: string; close: number }[];
}

const StockChart: React.FC<StockChartProps> = ({ historicalData, forecastData }) => {
  // Combine historical and forecast data for the x-axis labels
  const allDates = [
    ...historicalData.map(d => d.date),
    ...forecastData.map(d => d.date)
  ];

  const chartData = {
    labels: allDates,
    datasets: [
      {
        label: 'Stock Price',
        data: [
          ...historicalData.map(d => d.close),
          ...Array(forecastData.length).fill(null)  // Fill forecast data gap with null
        ],
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1,
      },
      {
        label: 'Forecasted Price',
        data: [
          ...Array(historicalData.length).fill(null),  // Fill historical data gap with null
          ...forecastData.map(d => d.close)
        ],
        fill: false,
        borderColor: 'rgba(255,99,132,1)',
        tension: 0.1,
      },
    ],
  };

  const options: ChartProps<'line'>['options'] = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
        },
      },
      y: {
        beginAtZero: false,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default StockChart;
