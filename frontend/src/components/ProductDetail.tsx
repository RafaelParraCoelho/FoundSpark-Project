import { useState, useEffect } from 'react';
import { Product, PriceSnapshot, getProductHistory } from '../api';
import PriceChart from './PriceChart';
import './ProductDetail.css';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

const ProductDetail = ({ product, onBack }: ProductDetailProps) => {
  const [history, setHistory] = useState<PriceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [product.id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getProductHistory(product.id);
      setHistory(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar histórico de preços');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceBadge = (source: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      kabum: { label: 'Kabum', color: '#ff6600' },
      amazon_br: { label: 'Amazon BR', color: '#ff9900' },
      kiwi_tequila: { label: 'Kiwi', color: '#00a698' },
    };
    return badges[source] || { label: source, color: '#666' };
  };

  const badge = getSourceBadge(product.source);

  const stats = history.length > 0 ? {
    min: Math.min(...history.map(h => h.price_brl)),
    max: Math.max(...history.map(h => h.price_brl)),
    avg: history.reduce((sum, h) => sum + h.price_brl, 0) / history.length,
    count: history.length,
  } : null;

  return (
    <div className="product-detail">
      <button className="back-button" onClick={onBack}>
        ← Voltar
      </button>

      <div className="detail-header">
        <div className="detail-title-section">
          <span className="source-badge" style={{ backgroundColor: badge.color }}>
            {badge.label}
          </span>
          <h1>{product.title}</h1>
          <p className="detail-meta">
            Categoria: {product.category || 'Não definida'} | Coletado: {formatDate(product.collected_at)}
          </p>
        </div>
        <div className="detail-price-section">
          <span className="current-price">{formatPrice(product.price_brl)}</span>
          <span className="price-label">Preço Atual</span>
        </div>
      </div>

      {product.url && (
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="store-link"
        >
          Ver na loja original ↗
        </a>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Preço Mínimo</span>
            <span className="stat-value min">{formatPrice(stats.min)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Preço Máximo</span>
            <span className="stat-value max">{formatPrice(stats.max)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Preço Médio</span>
            <span className="stat-value avg">{formatPrice(stats.avg)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Registros</span>
            <span className="stat-value">{stats.count}</span>
          </div>
        </div>
      )}

      <div className="chart-section">
        <h2>Histórico de Preços</h2>
        {loading ? (
          <div className="loading-chart">
            <div className="spinner"></div>
            <p>Carregando histórico...</p>
          </div>
        ) : error ? (
          <div className="error-chart">
            <p>{error}</p>
            <button onClick={fetchHistory}>Tentar Novamente</button>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-chart">
            <p>Nenhum registro de preço encontrado</p>
          </div>
        ) : (
          <PriceChart data={history} />
        )}
      </div>

      <div className="history-section">
        <h2>Registros Recentes</h2>
        {history.length > 0 ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Preço</th>
                <th>Variação</th>
              </tr>
            </thead>
            <tbody>
              {history.slice().reverse().slice(0, 10).map((snapshot, index, arr) => {
                const prevPrice = index < arr.length - 1 ? arr[index + 1].price_brl : null;
                const variation = prevPrice ? ((snapshot.price_brl - prevPrice) / prevPrice) * 100 : null;
                return (
                  <tr key={index}>
                    <td>{formatDate(snapshot.collected_at)}</td>
                    <td className="price-cell">{formatPrice(snapshot.price_brl)}</td>
                    <td className={`variation-cell ${variation !== null ? (variation > 0 ? 'up' : variation < 0 ? 'down' : '') : ''}`}>
                      {variation !== null ? `${variation > 0 ? '+' : ''}${variation.toFixed(2)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="no-data">Nenhum registro disponível</p>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
