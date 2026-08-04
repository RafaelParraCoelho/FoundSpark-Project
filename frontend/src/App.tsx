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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar produtos. Verifique se o backend esta rodando.');
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

  const featuredProducts = products.slice(0, 3);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="app">
        <Navbar scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
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
        <Navbar scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
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
      <Navbar scrolled={scrolled} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

    <main className="main">
        {selectedProduct ? (
          <ProductDetail product={selectedProduct} onBack={handleBack} />
        ) : (
          <>
            {/* Hero */}
            <section className="hero">
              <div className="hero-inner">
                <div className="hero-content">
                  <h1 className="hero-title fade-up fade-up-1">
                    Encontre os <span className="hero-highlight">melhores precos</span> do Brasil
                  </h1>
                  <p className="hero-subtitle fade-up fade-up-2">
                    Rastreamos precos em tempo real para voce nunca mais pagar caro.
                    Acompanhe historico, receba alertas e compre inteligente.
                  </p>
                  <div className="hero-buttons fade-up fade-up-3">
                    <a href="#produtos" className="hero-cta">Ver produtos monitorados</a>
                    <a href="#como-funciona" className="hero-cta-ghost">Como funciona</a>
                  </div>
                </div>
                <div className="hero-visual fade-up fade-up-2">
                  <div className="hero-cards">
                    <div className="price-card price-card-1">
                      <div className="price-card-img"></div>
                      <div className="price-card-body">
                        <span className="price-card-source kabum">Kabum</span>
                        <span className="price-card-title">PlayStation 5</span>
                        <span className="price-card-price">R$ 3.799,00</span>
                        <div className="price-card-trend">
                          <span className="trend-arrow down">↓ 12%</span>
                          <span className="trend-period">30 dias</span>
                        </div>
                      </div>
                    </div>
                    <div className="price-card price-card-2">
                      <div className="price-card-img"></div>
                      <div className="price-card-body">
                        <span className="price-card-source amazon">Amazon</span>
                        <span className="price-card-title">Xbox Series X</span>
                        <span className="price-card-price">R$ 3.499,00</span>
                        <div className="price-card-trend">
                          <span className="trend-arrow down">↓ 8%</span>
                          <span className="trend-period">15 dias</span>
                        </div>
                      </div>
                    </div>
                    <div className="price-card price-card-3">
                      <div className="price-card-img"></div>
                      <div className="price-card-body">
                        <span className="price-card-source kiwi">Kiwi</span>
                        <span className="price-card-title">GRU → REC</span>
                        <span className="price-card-price">R$ 847,00</span>
                        <div className="price-card-trend">
                          <span className="trend-arrow down">↓ 23%</span>
                          <span className="trend-period">7 dias</span>
                        </div>
                      </div>
                    </div>
                    <div className="price-chart-mini">
                      <svg viewBox="0 0 160 60" className="mini-chart-svg">
                        <polyline
                          points="0,50 20,42 40,45 60,30 80,35 100,18 120,22 140,12 160,15"
                          fill="none"
                          stroke="#d4752f"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="160" cy="15" r="3" fill="#d4752f" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="stats-bar">
              <div className="stat-item">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4752f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </div>
                <span className="stat-number">{stats.totalProducts}</span>
                <span className="stat-label">Produtos monitorados</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4752f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                </div>
                <span className="stat-number">{stats.sources}</span>
                <span className="stat-label">Fontes de dados</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4752f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <span className="stat-number">{stats.categories}</span>
                <span className="stat-label">Categorias</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4752f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <span className="stat-number">24h</span>
                <span className="stat-label">Atualizacao diaria</span>
              </div>
            </section>

            {/* Featured Products */}
            <section className="featured-section" id="como-funciona">
              <div className="section-container">
                <div className="section-header-center">
                  <h2>Produtos em destaque</h2>
                  <p className="section-subtitle">Acompanhe os precos dos produtos mais monitorados</p>
                </div>
                <div className="featured-grid">
                  {featuredProducts.map((product) => (
                    <div key={product.id} className="featured-card" onClick={() => handleProductSelect(product)}>
                      <div className="featured-img-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      </div>
                      <div className="featured-body">
                        <span className="featured-source">{product.source}</span>
                        <h3 className="featured-title">{product.title}</h3>
                        <div className="featured-price-row">
                          <span className="featured-price">{formatPrice(product.price_brl)}</span>
                          <span className="featured-trend">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                            -12%
                          </span>
                        </div>
                        <a href="#" className="featured-link" onClick={(e) => { e.stopPropagation(); handleProductSelect(product); }}>
                          Ver historico
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </a>
                      </div>
                    </div>
                  ))}
                  {featuredProducts.length === 0 && (
                    <div className="featured-empty">
                      <p>Nenhum produto para exibir. Execute um coletor primeiro.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Why FoundSpark */}
            <section className="why-section">
              <div className="section-container">
                <div className="section-header-center">
                  <h2>Por que FoundSpark?</h2>
                  <p className="section-subtitle">Ferramentas pensadas para voce economizar</p>
                </div>
                <div className="why-grid">
                  <div className="why-card">
                    <div className="why-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4752f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </div>
                    <h3>Historico de precos</h3>
                    <p>Veja como o preco evoluiu nos ultimos 7, 30 ou 90 dias antes de comprar.</p>
                  </div>
                  <div className="why-card">
                    <div className="why-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4752f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    </div>
                    <h3>Alertas em tempo real</h3>
                    <p>Configure alertas e receba notificacao quando o preco atingir seu objetivo.</p>
                  </div>
                  <div className="why-card">
                    <div className="why-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4752f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <h3>Comparacao entre lojas</h3>
                    <p>Compare precos de Kabum, Amazon BR e passagens de Kiwi em um so lugar.</p>
                  </div>
                  <div className="why-card">
                    <div className="why-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4752f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h3>Dados confiaveis</h3>
                    <p>Coletamos de forma respeitosa, armazenamos em BRL e nunca escondemos nada.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Products */}
            <section className="products-section" id="produtos">
              <ProductList products={products} onSelect={handleProductSelect} />
            </section>

            {/* Alerts */}
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

            {/* About */}
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
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4752f" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <h3>Coleta automatica</h3>
                    <p>Precos coletados via API e web scraping respeitando robots.txt</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4752f" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </div>
                    <h3>Historico completo</h3>
                    <p>Visualize a evolucao de precos ao longo do tempo</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4752f" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                    </div>
                    <h3>Multi-fontes</h3>
                    <p>Dados de Kabum, Amazon BR e Kiwi.com em um so lugar</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand-col">
              <span className="logo-text">FoundSpark</span>
              <p className="footer-tagline">Rastreador de precos para o Brasil. Economize em cada compra.</p>
              <div className="footer-social">
                <a href="#" aria-label="Twitter">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
                </a>
                <a href="#" aria-label="GitHub">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                </a>
              </div>
            </div>
            <div className="footer-columns">
              <div className="footer-column">
                <h4>Produto</h4>
                <a href="#produtos">Produtos</a>
                <a href="#alertas">Alertas</a>
                <a href="#como-funciona">Como funciona</a>
                <a href="#sobre">Sobre</a>
              </div>
              <div className="footer-column">
                <h4>Fontes</h4>
                <a href="https://www.kabum.com.br" target="_blank" rel="noopener noreferrer">Kabum</a>
                <a href="https://www.amazon.com.br" target="_blank" rel="noopener noreferrer">Amazon BR</a>
                <a href="https://www.kiwi.com" target="_blank" rel="noopener noreferrer">Kiwi.com</a>
              </div>
              <div className="footer-column">
                <h4>Suporte</h4>
                <a href="#">Central de ajuda</a>
                <a href="#">Reportar erro</a>
                <a href="#">Politica de privacidade</a>
              </div>
              <div className="footer-column">
                <h4>Redes sociais</h4>
                <a href="#">Twitter</a>
                <a href="#">Instagram</a>
                <a href="#">GitHub</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 FoundSpark. Todos os direitos reservados. Precos em BRL.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Navbar component extracted for reuse in loading/error states */
function Navbar({ scrolled, mobileMenuOpen, setMobileMenuOpen }: {
  scrolled: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
}) {
  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner">
        <div className="navbar-brand">
          <span className="logo-text">FoundSpark</span>
        </div>
        <div className={`navbar-nav ${mobileMenuOpen ? 'navbar-nav-open' : ''}`}>
          <a href="#produtos" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Produtos</a>
          <a href="#alertas" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Alertas</a>
          <a href="#sobre" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Sobre</a>
          <a href="#alertas" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>Criar alerta</a>
        </div>
        <button className="navbar-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          )}
        </button>
      </div>
    </nav>
  );
}

export default App;
