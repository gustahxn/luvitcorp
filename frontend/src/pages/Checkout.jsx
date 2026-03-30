import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import api from '../services/api';

const inputStyle = {
  width: '100%',
  padding: '0.6875rem 0.875rem',
  border: '1px solid var(--border-color)',
  borderRadius: '0.5rem',
  outline: 'none',
  fontSize: '0.875rem',
  backgroundColor: 'var(--bg-color)',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const focusHandlers = {
  onFocus: (e) => { e.target.style.borderColor = 'var(--text-color)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'; },
  onBlur: (e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; },
};

export default function Checkout() {
  const { items, clearCart, removeItem, updateQuantity } = useCartStore();
  const cartTotal = items.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
  const [step, setStep] = useState(1); // 1: Carrinho, 2: Dados
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    note: '',
  });

  const handlePhoneMask = (val) => {
    let v = val.replace(/\D/g, '');
    if (v.length <= 10) {
      v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
      v = v.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
      v = v.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return v.substring(0, 15);
  };

  const handleCustomerChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone') value = handlePhoneMask(value);
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
    setError('');
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim() || !customer.city.trim()) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login'); return; }

    try {
      await api.post('/orders', {
        total: cartTotal,
        items,
        customer_name: customer.name.trim(),
        customer_phone: customer.phone.trim(),
        customer_address: customer.address.trim(),
        customer_city: customer.city.trim(),
        customer_note: customer.note.trim() || null,
      });
      setSuccess(true);
      clearCart();
      setTimeout(() => navigate('/'), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao processar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '12vh', maxWidth: '480px', margin: '12vh auto 0' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.75rem' }}>Pedido Confirmado!</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Seu pedido foi recebido com sucesso. Nossa equipe entrará em contato em breve.
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2rem' }}>Redirecionando para a loja...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Checkout</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Etapa {step} de 2 — {step === 1 ? 'Revise seu carrinho' : 'Dados de entrega'}
          </p>
        </div>
        <button onClick={() => step === 2 ? setStep(1) : navigate('/')} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          {step === 2 ? 'Voltar ao carrinho' : 'Continuar comprando'}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', backgroundColor: 'var(--border-color)', borderRadius: '2px', marginBottom: '2.5rem' }}>
        <div style={{ height: '100%', width: step === 1 ? '50%' : '100%', backgroundColor: 'var(--text-color)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--surface-color)' }}>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Seu carrinho está vazio.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '1rem', textDecoration: 'underline', color: 'var(--text-color)', fontSize: '0.875rem' }}>Voltar à loja</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(0, 2fr) minmax(240px, 1fr)' }}>

          {/* Coluna Esquerda */}
          <div>
            {/* STEP 1: Lista de Itens */}
            {step === 1 && (
              <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Itens no Carrinho</h2>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <img src={item.image_url || 'https://via.placeholder.com/56'} alt={item.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{item.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>R$ {Number(item.price).toFixed(2).replace('.', ',')} un.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '0.375rem', overflow: 'hidden' }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '0.25rem 0.625rem', background: 'var(--bg-color)', fontSize: '1rem', lineHeight: '1', color: 'var(--text-color)' }}>-</button>
                        <span style={{ padding: '0 0.375rem', fontSize: '0.875rem', fontWeight: '500' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '0.25rem 0.625rem', background: 'var(--bg-color)', fontSize: '1rem', lineHeight: '1', color: 'var(--text-color)' }}>+</button>
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem', minWidth: '72px', textAlign: 'right' }}>
                        R$ {(Number(item.price) * item.quantity).toFixed(2).replace('.', ',')}
                      </div>
                      <button onClick={() => removeItem(item.id)} title="Remover" style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', lineHeight: '1', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.target.style.color = 'var(--danger-color)'}
                        onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                      >×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 2: Formulário de Dados */}
            {step === 2 && (
              <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>Dados de Entrega</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Campos com <span style={{ color: 'var(--danger-color)' }}>*</span> são obrigatórios.
                </p>

                {error && (
                  <div style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', borderRadius: '0.5rem', fontSize: '0.8125rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontWeight: '500' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', marginBottom: '0.375rem' }}>
                      Nome completo <span style={{ color: 'var(--danger-color)' }}>*</span>
                    </label>
                    <input name="name" value={customer.name} onChange={handleCustomerChange} placeholder="Seu nome" style={inputStyle} {...focusHandlers} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', marginBottom: '0.375rem' }}>
                      Telefone / WhatsApp <span style={{ color: 'var(--danger-color)' }}>*</span>
                    </label>
                    <input name="phone" value={customer.phone} onChange={handleCustomerChange} placeholder="(00) 00000-0000" style={inputStyle} {...focusHandlers} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', marginBottom: '0.375rem' }}>
                      Cidade <span style={{ color: 'var(--danger-color)' }}>*</span>
                    </label>
                    <input name="city" value={customer.city} onChange={handleCustomerChange} placeholder="Sua cidade" style={inputStyle} {...focusHandlers} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', marginBottom: '0.375rem' }}>
                      Endereço completo <span style={{ color: 'var(--danger-color)' }}>*</span>
                    </label>
                    <input name="address" value={customer.address} onChange={handleCustomerChange} placeholder="Rua, número, bairro, complemento" style={inputStyle} {...focusHandlers} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', marginBottom: '0.375rem' }}>Observações</label>
                    <textarea name="note" value={customer.note} onChange={handleCustomerChange} rows="2" placeholder="Alguma instrução especial para entrega?" style={{ ...inputStyle, resize: 'vertical' }} {...focusHandlers} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita: Resumo */}
          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', height: 'fit-content' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Resumo</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
              <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <span>Frete</span>
              <span style={{ color: 'var(--success-color)', fontWeight: '500' }}>Grátis</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: '600' }}>Total</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
            </div>

            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                style={{ width: '100%', backgroundColor: 'var(--text-color)', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.875rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                Continuar para Entrega
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={loading}
                style={{ width: '100%', backgroundColor: loading ? 'var(--accent-hover)' : 'var(--text-color)', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '0.875rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading && <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}
                {loading ? 'Finalizando...' : 'Confirmar Pedido'}
              </button>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
