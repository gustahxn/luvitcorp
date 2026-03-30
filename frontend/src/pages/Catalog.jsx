import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../contexts/CartContext';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);
  const navigate = useNavigate();
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true);
      
      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    }
    
    fetchProducts();
  }, []);

  const handleAddToCart = useCallback((product) => {
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  }, [addItem]);

  if (loading) {
    return <div className="container" style={{textAlign: 'center', marginTop: '4rem'}}>Carregando catálogo...</div>;
  }

  return (
    <>
      {/* Hero Section */}
      <div style={{ backgroundColor: 'var(--text-color)', color: '#fff', padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="container" style={{ padding: '0' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Minimalismo Essencial.
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Descubra produtos pensados para o seu dia a dia. Design limpo, materiais premium e usabilidade sem distrações.
          </p>
        </div>
      </div>
      
      <main className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Coleção Atual <span style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600' }}>{products.length} itens</span>
        </h2>
        
        <div className="catalog-grid">
          {products.map(product => {
            const isAdded = addedId === product.id;
            return (
              <div key={product.id} className="product-card">
                <div style={{ position: 'relative' }}>
                   {product.image_url ? (
                     <img 
                       src={product.image_url} 
                       alt={product.name} 
                       className="product-image"
                     />
                   ) : (
                     <div className="product-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f5', color: '#a1a1aa' }}>
                       <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                         <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                         <circle cx="8.5" cy="8.5" r="1.5"></circle>
                         <polyline points="21 15 16 10 5 21"></polyline>
                       </svg>
                     </div>
                   )}
                   {product.category && (
                      <span style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'var(--surface-color)', color: 'var(--text-color)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.6875rem', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {product.category}
                      </span>
                   )}
                </div>
                <div className="product-content">
                  <h3 className="product-title" style={{ fontSize: '1.125rem' }}>{product.name}</h3>
                  <p className="product-desc" style={{ minHeight: '40px' }}>{product.description}</p>
                  <div className="product-price" style={{ marginBottom: '1.25rem', fontSize: '1.125rem' }}>R$ {Number(product.price).toFixed(2).replace('.', ',')}</div>
                  <button 
                    onClick={() => handleAddToCart(product)} 
                    disabled={isAdded}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: isAdded ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: isAdded ? 'var(--success-color)' : 'var(--accent-color)',
                      color: '#fff',
                      transition: 'background-color 0.3s, transform 0.15s',
                      transform: isAdded ? 'scale(0.97)' : 'scale(1)',
                    }}
                  >
                    {isAdded ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Adicionado!
                      </>
                    ) : (
                      'Adicionar ao Carrinho'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Nenhum produto disponível no momento.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
