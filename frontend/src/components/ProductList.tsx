import { Product } from '../api';
import './ProductList.css';

interface ProductListProps {
  products: Product[];
  onSelect: (product: Product) => void;
}

const ProductList = ({ products, onSelect }: ProductListProps) => {
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

  if (products.length === 0) {
    return (
      <div className="product-list empty">
        <h2>Nenhum produto encontrado</h2>
        <p>Execute um coletor para adicionar produtos ao banco de dados.</p>
      </div>
    );
  }

  return (
    <div className="product-list">
      <h2>Produtos Monitorados ({products.length})</h2>
      <div className="products-grid">
        {products.map((product) => {
          const badge = getSourceBadge(product.source);
          return (
            <div key={product.id} className="product-card" onClick={() => onSelect(product)}>
              <div className="product-header">
                <span className="source-badge" style={{ backgroundColor: badge.color }}>
                  {badge.label}
                </span>
                <span className="product-id">#{product.id}</span>
              </div>
              <h3 className="product-title">{product.title}</h3>
              <div className="product-price">
                <span className="price">{formatPrice(product.price_brl)}</span>
              </div>
              <div className="product-meta">
                <span className="category">{product.category || 'Sem categoria'}</span>
                <span className="date">{formatDate(product.collected_at)}</span>
              </div>
              {product.url && (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver na loja ↗
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductList;
