import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import api from '../services/api';

export default function Checkout() {
  const { items, cartTotal, clearCart, removeItem, updateQuantity } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setLoading(true);
    
    // Verificar auth via supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
       navigate('/login');
       return;
    }

    try {
      // Chama o backend Node para persistir a Ordem e Order Items com segurança
      await api.post('/orders', {
        total: cartTotal,
        items: items
      });

      setSuccess(true);
      clearCart();
      setTimeout(() => navigate('/'), 3000);
    } catch (error) {
      console.error(error);
      alert('Erro ao processar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{textAlign: 'center', marginTop: '10vh'}}>
        <h1 style={{color: 'var(--success-color)', fontSize: '2rem', marginBottom: '1rem'}}>Pedido Confirmado!</h1>
        <p>Seu pedido foi processado na LuvitCorp.</p>
        <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2rem'}}>Redirecionando para as compras...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{maxWidth: '800px', margin: '0 auto'}}>
       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
          <h1 style={{fontSize: '2rem', fontWeight: '700'}}>Checkout</h1>
          <button onClick={() => navigate('/')} style={{textDecoration: 'underline'}}>Voltar as compras</button>
       </div>

       {items.length === 0 ? (
         <div style={{textAlign: 'center', padding: '3rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)'}}>
            Seu carrinho está vazio.
         </div>
       ) : (
         <div style={{display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(300px, 2fr) 1fr'}}>
            {/* Lista de itens */}
            <div style={{background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)'}}>
               {items.map(item => (
                 <div key={item.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                       <img src={item.image_url || 'https://via.placeholder.com/60'} alt={item.name} style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-md)'}} />
                       <div>
                         <div style={{fontWeight: '500'}}>{item.name}</div>
                         <div style={{color: 'var(--text-secondary)', fontSize: '0.875rem'}}>R$ {Number(item.price).toFixed(2)} unit.</div>
                       </div>
                    </div>
                    
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                       <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{padding: '0.25rem 0.5rem', background: 'var(--bg-color)', borderRadius: '4px'}}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{padding: '0.25rem 0.5rem', background: 'var(--bg-color)', borderRadius: '4px'}}>+</button>
                       </div>
                       <div style={{fontWeight: '600', minWidth: '80px', textAlign: 'right'}}>
                          R$ {(Number(item.price) * item.quantity).toFixed(2)}
                       </div>
                       <button onClick={() => removeItem(item.id)} style={{color: 'var(--danger-color)', fontSize: '0.875rem'}}>x</button>
                    </div>
                 </div>
               ))}
            </div>

            {/* Resumo Financeiro */}
            <div style={{background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', height: 'fit-content'}}>
               <h3 style={{marginBottom: '1rem'}}>Resumo</h3>
               <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)'}}>
                  <span>Subtotal</span>
                  <span>R$ {cartTotal.toFixed(2)}</span>
               </div>
               <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', color: 'var(--text-secondary)'}}>
                  <span>Frete Expresso</span>
                  <span>Grátis</span>
               </div>
               <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem'}}>
                  <span style={{fontWeight: '600'}}>Total</span>
                  <span style={{fontSize: '1.25rem', fontWeight: '700'}}>R$ {cartTotal.toFixed(2)}</span>
               </div>
               <button onClick={handleCheckout} disabled={loading} className="btn-primary" style={{width: '100%', justifyContent: 'center'}}>
                  {loading ? 'Processando...' : 'Finalizar Pedido'}
               </button>
            </div>
         </div>
       )}
    </div>
  );
}
