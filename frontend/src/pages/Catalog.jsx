import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../contexts/CartContext';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { itemsCount, addItem } = useCartStore();

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

  if (loading) {
    return <div className="container" style={{textAlign: 'center', marginTop: '4rem'}}>Carregando catálogo...</div>;
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo">LuvitCorp</div>
          <div>
             <button onClick={() => navigate('/checkout')} className="btn-primary" style={{padding: '0.5rem 1rem'}}>
               Carrinho ({itemsCount})
             </button>
          </div>
        </div>
      </header>
      
      <main className="container">
        <h1 style={{fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem'}}>Coleção Luvit</h1>
        <p style={{color: 'var(--text-secondary)'}}>Minimalismo e usabilidade no seu dia a dia.</p>
        
        <div className="catalog-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <img 
                src={product.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'} 
                alt={product.name} 
                className="product-image"
              />
              <div className="product-content">
                <h3 className="product-title">{product.name}</h3>
                <p className="product-desc">{product.description}</p>
                <div className="product-price">R$ {Number(product.price).toFixed(2).replace('.', ',')}</div>
                <button onClick={() => addItem(product)} className="btn-primary">
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div style={{gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)'}}>
              Nenhum produto cadastrado ainda.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
