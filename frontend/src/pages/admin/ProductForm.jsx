import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

export default function ProductForm() {
  const { id } = useParams(); // Se existir, é modo de Edição. Senão é Criação
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
       // Fetch existing product for editing
       api.get(`/products/${id}`).then(res => setProduct(res.data)).catch(console.error);
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

    try {
      if (id) {
        await api.put(`/products/${id}`, product);
      } else {
        await api.post('/products', product);
      }
      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar produto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{maxWidth: '600px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: '700'}}>{id ? 'Editar Produto' : 'Novo Produto'}</h1>
        <button onClick={() => navigate('/admin')} style={{textDecoration: 'underline'}}>Cancelar</button>
      </div>

      <form onSubmit={handleSubmit} style={{background: 'var(--surface-color)', padding: '2rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)'}}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Nome do Produto</label>
          <input id="name" name="name" className="form-input" value={product.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Descrição</label>
          <textarea id="description" name="description" className="form-input" value={product.description} onChange={handleChange} rows="3" />
        </div>

        <div style={{display: 'flex', gap: '1rem'}}>
           <div className="form-group" style={{flex: 1}}>
             <label className="form-label" htmlFor="price">Preço (R$)</label>
             <input id="price" name="price" type="number" step="0.01" className="form-input" value={product.price} onChange={handleChange} required />
           </div>
           
           <div className="form-group" style={{flex: 1}}>
             <label className="form-label" htmlFor="stock">Estoque</label>
             <input id="stock" name="stock" type="number" className="form-input" value={product.stock} onChange={handleChange} required />
           </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="category">Categoria</label>
          <input id="category" name="category" className="form-input" value={product.category} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="image_url">URL da Imagem</label>
          <input id="image_url" name="image_url" type="url" className="form-input" value={product.image_url} onChange={handleChange} placeholder="https://..." />
        </div>

        <div className="form-group" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <input id="active" name="active" type="checkbox" checked={product.active} onChange={handleChange} />
          <label htmlFor="active" style={{fontWeight: '500'}}>Produto Ativo</label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{marginTop: '1rem', justifyContent: 'center'}}>
          {loading ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </form>
    </div>
  );
}
