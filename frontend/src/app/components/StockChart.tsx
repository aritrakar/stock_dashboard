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

// Register the components with Chart.js
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
  data: { date: string; close: number }[];
}

const StockChart: React.FC<StockChartProps> = ({ data }) => {
  const chartData: ChartProps<'line'>['data'] = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'Stock Price',
        data: data.map((d) => d.close),
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
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
