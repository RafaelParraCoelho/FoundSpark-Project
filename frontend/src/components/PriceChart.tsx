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
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="collected_at"
            tickFormatter={formatDate}
            stroke="#94a3b8"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => `R$ ${value}`}
            stroke="#94a3b8"
            tick={{ fontSize: 12 }}
            domain={['dataMin - 50', 'dataMax + 50']}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avgPrice}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            label={{
              value: `Média: ${formatPrice(avgPrice)}`,
              position: 'right',
              fill: '#f59e0b',
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="price_brl"
            stroke="#d4752f"
            strokeWidth={2}
            dot={{ fill: '#d4752f', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#d4752f', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
