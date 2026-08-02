import { PriceSnapshot } from '../api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import './PriceChart.css';

interface PriceChartProps {
  data: PriceSnapshot[];
}

const PriceChart = ({ data }: PriceChartProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate average for reference line
  const avgPrice = data.reduce((sum, d) => sum + d.price_brl, 0) / data.length;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: PriceSnapshot }> }) => {
    if (active && payload && payload.length) {
      const snapshot = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{formatDateTime(snapshot.collected_at)}</p>
          <p className="tooltip-price">{formatPrice(snapshot.price_brl)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="price-chart">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="collected_at"
            tickFormatter={formatDate}
            stroke="#666"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => `R$ ${value}`}
            stroke="#666"
            tick={{ fontSize: 12 }}
            domain={['dataMin - 50', 'dataMax + 50']}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avgPrice}
            stroke="#fbbf24"
            strokeDasharray="5 5"
            label={{
              value: `Média: ${formatPrice(avgPrice)}`,
              position: 'right',
              fill: '#fbbf24',
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="price_brl"
            stroke="#4ade80"
            strokeWidth={2}
            dot={{ fill: '#4ade80', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#4ade80' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
