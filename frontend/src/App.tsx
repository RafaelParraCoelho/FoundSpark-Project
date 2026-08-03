import { useState, useEffect } from 'react';
import { Product, getProducts } from './api';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import './App.css';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar produtos. Verifique se o backend está rodando.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleBack = () => {
    setSelectedProduct(null);
  };

  const uniqueSources = [...new Set(products.map(p => p.source))];
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const stats = {
    totalProducts: products.length,
    sources: uniqueSources.length,
    categories: uniqueCategories.length,
    lowestPrice: products.length > 0
      ? Math.min(...products.map(p => p.price_brl))
      : 0,
  };

  if (loading) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="navbar-inner">
            <div className="navbar-brand">
              <span className="logo-icon"></span>
              <span className="logo-text">FoundSpark</span>
            </div>
            <div className="navbar-nav">
              <a href="#produtos" className="nav-link">Produtos</a>
              <a href="#alertas" className="nav-link">Alertas</a>
              <a href="#sobre" className="nav-link">Sobre</a>
            </div>
          </div>
        </nav>
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="navbar-inner">
            <div className="navbar-brand">
              <span className="logo-icon"></span>
              <span className="logo-text">FoundSpark</span>
            </div>
            <div className="navbar-nav">
              <a href="#produtos" className="nav-link">Produtos</a>
              <a href="#alertas" className="nav-link">Alertas</a>
              <a href="#sobre" className="nav-link">Sobre</a>
            </div>
          </div>
        </nav>
        <div className="error">
          <h2>Erro</h2>
          <p>{error}</p>
          <button onClick={fetchProducts}>Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <span className="logo-icon"></span>
            <span className="logo-text">FoundSpark</span>
          </div>
          <div className="navbar-nav">
            <a href="#produtos" className="nav-link">Produtos</a>
            <a href="#alertas" className="nav-link">Alertas</a>
            <a href="#sobre" className="nav-link">Sobre</a>
          </div>
        </div>
      </nav>

      <main className="main">
        {selectedProduct ? (
          <ProductDetail product={selectedProduct} onBack={handleBack} />
        ) : (
          <>
            <section className="hero">
              <div className="hero-content">
                <h1 className="hero-title">
                  Encontre os <span className="hero-highlight">melhores precos</span> do Brasil
                </h1>
                <p className="hero-subtitle">
                  Rastreamos precos em tempo real para voce nunca mais pagar caro.
                </p>
                <a href="#produtos" className="hero-cta">Ver produtos monitorados</a>
              </div>
            </section>

            <section className="stats-bar">
              <div className="stat-item">
                <span className="stat-number">{stats.totalProducts}</span>
                <span className="stat-label">Produtos monitorados</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">{stats.sources}</span>
                <span className="stat-label">Fontes de dados</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">{stats.categories}</span>
                <span className="stat-label">Categorias</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">24h</span>
                <span className="stat-label">Atualizacao diaria</span>
              </div>
            </section>

            <section className="products-section" id="produtos">
              <ProductList products={products} onSelect={handleProductSelect} />
            </section>

            <section className="about-section" id="sobre">
              <div className="about-grid">
                <div className="about-text">
                  <h2>Como funciona</h2>
                  <p>
                    O FoundSpark coleta precos automaticamente de lojas brasileiras
                    como Kabum, Amazon BR e fontes de passagens aereas. Os dados
                    sao atualizados regularmente e armazenados para analise de historico.
                  </p>
                  <p>
                    Acompanhe a evolucao de precos e tome decisoes de compra mais
                    inteligentes. Receba alertas quando o preco baixar.
                  </p>
                </div>
                <div className="about-features">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <span></span>
                    </div>
                    <h3>Coleta automatica</h3>
                    <p>Precos coletados via API e web scraping respeitando robots.txt</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <span></span>
                    </div>
                    <h3>Historico completo</h3>
                    <p>Visualize a evolucao de precos ao longo do tempo</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <span></span>
                    </div>
                    <h3>Multi-fontes</h3>
                    <p>Dados de Kabum, Amazon BR e Kiwi.com em um so lugar</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="alerts-section" id="alertas">
              <div className="alerts-content">
                <h2>Alertas de preco</h2>
                <p>
                  Em breve: configure alertas para ser notificado quando um produto
                  atingir o preco desejado.
                </p>
                <div className="alert-badge">Em desenvolvimento</div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="logo-icon"></span>
              <span className="logo-text">FoundSpark</span>
              <p className="footer-tagline">Rastreador de precos para o Brasil</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Produto</h4>
                <a href="#produtos">Produtos</a>
                <a href="#alertas">Alertas</a>
              </div>
              <div className="footer-column">
                <h4>Fontes</h4>
                <a href="https://www.kabum.com.br" target="_blank" rel="noopener noreferrer">Kabum</a>
                <a href="https://www.amazon.com.br" target="_blank" rel="noopener noreferrer">Amazon BR</a>
                <a href="https://www.kiwi.com" target="_blank" rel="noopener noreferrer">Kiwi.com</a>
              </div>
              <div className="footer-column">
                <h4>Projeto</h4>
                <a href="#sobre">Sobre</a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>2026 FoundSpark. Todos os direitos reservados. Precos em BRL.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
