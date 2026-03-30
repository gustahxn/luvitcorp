import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    stock: 0,
    active: true
  });

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/products/${id}`)
        .then(res => {
          setProduct(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setMessage({ type: 'error', text: 'Produto não encontrado.' });
          setLoading(false);
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validacoes
    if (!product.name.trim()) {
      setMessage({ type: 'error', text: 'O nome do produto é obrigatório.' });
      setLoading(false);
      return;
    }
    if (!product.price || Number(product.price) <= 0) {
      setMessage({ type: 'error', text: 'Informe um preço válido maior que zero.' });
      setLoading(false);
      return;
    }

    const priceStr = String(product.price).replace(',', '.');
    // Preparar payload com tipos corretos para o Supabase
    const payload = {
      name: product.name.trim(),
      description: product.description?.trim() || null,
      price: parseFloat(priceStr),
      image_url: product.image_url?.trim() || null,
      category: product.category?.trim() || null,
      stock: parseInt(product.stock) || 0,
      active: product.active,
    };

    try {
      if (id) {
        await api.put(`/products/${id}`, payload);
        setMessage({ type: 'success', text: 'Produto atualizado com sucesso!' });
      } else {
        await api.post('/products', payload);
        setMessage({ type: 'success', text: 'Produto criado com sucesso!' });
      }
      setTimeout(() => navigate('/admin'), 1200);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erro ao salvar produto. Verifique os campos.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: '500',
    marginBottom: '0.375rem',
    color: 'var(--text-color)',
  };

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

  if (id && loading && !product.name) {
    return (
      <div className="container" style={{ maxWidth: '580px', margin: '0 auto', textAlign: 'center', padding: '4rem 0' }}>
         <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid var(--border-color)', borderTopColor: 'var(--text-color)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', marginBottom: '1rem' }} />
         <p style={{ color: 'var(--text-secondary)' }}>Buscando dados do produto...</p>
         <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '580px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
            {id ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            Campos marcados com <span style={{ color: 'var(--danger-color)' }}>*</span> são obrigatórios.
          </p>
        </div>
        <button onClick={() => navigate('/admin')} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          Voltar
        </button>
      </div>

      {/* Mensagem de Feedback */}
      {message.text && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          borderRadius: '0.5rem',
          fontSize: '0.8125rem',
          fontWeight: '500',
          backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: message.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
        }}>
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--surface-color)',
          padding: '2rem',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {/* Nome */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="name" style={labelStyle}>
            Nome do Produto <span style={{ color: 'var(--danger-color)' }}>*</span>
          </label>
          <input id="name" name="name" style={inputStyle} value={product.name} onChange={handleChange} required placeholder="Ex: Camiseta Essencial" {...focusHandlers} />
        </div>

        {/* Descricao */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="description" style={labelStyle}>Descricao</label>
          <textarea id="description" name="description" style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} value={product.description || ''} onChange={handleChange} rows="3" placeholder="Descreva brevemente o produto..." {...focusHandlers} />
        </div>

        {/* Preco + Estoque lado a lado */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="price" style={labelStyle}>
              Preco (R$) <span style={{ color: 'var(--danger-color)' }}>*</span>
            </label>
            <input id="price" name="price" type="number" step="0.01" min="0.01" style={inputStyle} value={product.price} onChange={handleChange} required placeholder="0,00" {...focusHandlers} />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="stock" style={labelStyle}>
              Estoque <span style={{ color: 'var(--danger-color)' }}>*</span>
            </label>
            <input id="stock" name="stock" type="number" min="0" style={inputStyle} value={product.stock} onChange={handleChange} required placeholder="0" {...focusHandlers} />
          </div>
        </div>

        {/* Categoria */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="category" style={labelStyle}>Categoria</label>
          <input id="category" name="category" style={inputStyle} value={product.category || ''} onChange={handleChange} placeholder="Ex: Vestuário, Acessórios..." {...focusHandlers} />
        </div>

        {/* URL da imagem */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="image_url" style={labelStyle}>URL da Imagem</label>
          <input id="image_url" name="image_url" type="url" style={inputStyle} value={product.image_url || ''} onChange={handleChange} placeholder="https://..." {...focusHandlers} />
          {product.image_url && (
            <div style={{ marginTop: '0.5rem' }}>
              <img src={product.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        {/* Ativo */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input id="active" name="active" type="checkbox" checked={product.active} onChange={handleChange}
            style={{ width: '16px', height: '16px', accentColor: 'var(--text-color)', cursor: 'pointer' }}
          />
          <label htmlFor="active" style={{ fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>Produto ativo no catálogo</label>
        </div>

        {/* Botao */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: loading ? 'var(--accent-hover)' : 'var(--text-color)',
            color: '#fff',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            fontSize: '0.875rem',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'background-color 0.2s',
          }}
        >
          {loading && (
            <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          )}
          {loading ? 'Salvando...' : (id ? 'Salvar Alteracoes' : 'Criar Produto')}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
