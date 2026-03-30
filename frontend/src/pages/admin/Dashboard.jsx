import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuthAndFetch() {
      // 1. Check Auth & Role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'ADMIN') {
        navigate('/'); // redirect se não for admin
        return;
      }

      // 2. Fetch all products (Admins bypassed RLS)
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    }
    
    checkAuthAndFetch();
  }, [navigate]);

  if (loading) {
     return <div className="container" style={{textAlign: 'center', marginTop: '4rem'}}>Carregando painel admin...</div>;
  }

  return (
    <div className="container">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
        <div>
          <h1 style={{fontSize: '2rem', fontWeight: '700'}}>Admin Dashboard</h1>
          <p style={{color: 'var(--text-secondary)'}}>Gerenciamento do catálogo LuvitCorp</p>
        </div>
        <button onClick={() => navigate('/admin/products/new')} className="btn-primary" style={{width: 'auto', padding: '0.75rem 1.5rem'}}>
          + Novo Produto
        </button>
      </div>

      <div style={{overflowX: 'auto'}}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{fontWeight: '500'}}>{p.name}</td>
                <td style={{color: 'var(--text-secondary)'}}>{p.category || '-'}</td>
                <td>R$ {Number(p.price).toFixed(2)}</td>
                <td>{p.stock} un.</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '1rem', 
                    fontSize: '0.75rem', 
                    backgroundColor: p.active ? '#dcfce7' : '#fee2e2',
                    color: p.active ? '#166534' : '#991b1b',
                    fontWeight: '500'
                  }}>
                    {p.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <button onClick={() => navigate(`/admin/products/${p.id}`)} style={{color: '#2563eb', fontWeight: '500', marginRight: '1rem'}}>Editar</button>
                  <button style={{color: 'var(--danger-color)', fontWeight: '500'}}>Excluir</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>
                   Nenhum produto listado no Supabase.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
