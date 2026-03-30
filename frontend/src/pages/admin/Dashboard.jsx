import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';


const STATUS_LABELS = {
  PENDING: { label: 'Pendente', bg: '#fef9c3', color: '#854d0e' },
  CONFIRMED: { label: 'Confirmado', bg: '#dbeafe', color: '#1d4ed8' },
  PREPARING: { label: 'Preparando', bg: '#ede9fe', color: '#6d28d9' },
  DELIVERED: { label: 'Entregue', bg: '#dcfce7', color: '#166534' },
  CANCELLED: { label: 'Cancelado', bg: '#fee2e2', color: '#991b1b' },
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();

      if (profile?.role !== 'ADMIN') { navigate('/'); return; }

      const [{ data: prods }, ordersRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        api.get('/orders'),
      ]);

      if (prods) setProducts(prods);
      if (ordersRes?.data) setOrders(ordersRes.data);
      setLoading(false);
    }
    checkAuthAndFetch();
  }, [navigate]);

  const handleStatusChange = async (orderId, newStatus) => {
    setStatusUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Status atualizado com sucesso!');
    } catch (e) {
      toast.error('Erro ao atualizar status.');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDeleteProduct = (id, name) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ fontWeight: 600, margin: 0, fontSize: '0.875rem' }}>Tem certeza que deseja excluir '{name}'?</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => toast.dismiss(t.id)}
            style={{ padding: '0.375rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem', cursor: 'pointer', background: 'transparent', fontSize: '0.8125rem', fontWeight: 500 }}>
            Cancelar
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const promise = api.delete(`/products/${id}`).then(res => {
                if (res.data.data) {
                  setProducts(prev => prev.map(p => p.id === id ? { ...p, active: false } : p));
                } else {
                  setProducts(prev => prev.filter(p => p.id !== id));
                }
                return res.data.message;
              });
              
              toast.promise(promise, {
                loading: 'Excluindo produto...',
                success: (msg) => msg,
                error: (e) => e.response?.data?.error || 'Erro ao excluir produto.'
              });
            }}
            style={{ padding: '0.375rem 0.75rem', border: 'none', background: 'var(--danger-color)', color: '#fff', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}>
            Excluir
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { minWidth: '320px' } });
  };

  const handleExportOrderCSV = (order) => {
    const headers = ['ID do Pedido', 'Data', 'Cliente', 'Telefone', 'Endereço', 'Status', 'Total (R$)', 'Produto', 'Quantidade', 'Preço Unit. (R$)'];
    const rows = [];
    
    // Tratamento para excel: "=" antes da string escapa comportamento de formulas
    const baseInfo = [
      order.id.slice(0, 8).toUpperCase(),
      new Date(order.created_at).toLocaleString('pt-BR'),
      `"${order.customer_name || '-'}"`,
      `"=""${order.customer_phone || ''}"""`,
      `"${order.customer_address || ''} - ${order.customer_city || ''}"`,
      STATUS_LABELS[order.status]?.label || 'Pendente',
      Number(order.total).toFixed(2).replace('.', ',')
    ];

    if (!order.order_items || order.order_items.length === 0) {
       rows.push([...baseInfo, '-', '-', '-']);
    } else {
       order.order_items.forEach(item => {
         rows.push([
           ...baseInfo,
           `"${item.products?.name || 'Produto'}"`,
           item.quantity,
           Number(item.unit_price).toFixed(2).replace('.', ',')
         ]);
       });
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pedido_luvitcorp_${order.id.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Pedido exportado!');
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid var(--border-color)', borderTopColor: 'var(--text-color)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const tabStyle = (isActive) => ({
    padding: '0.625rem 1.25rem',
    borderRadius: '0.375rem',
    fontWeight: isActive ? '600' : '400',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: isActive ? 'var(--text-color)' : 'transparent',
    color: isActive ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  });

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Painel Admin</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {products.length} produtos · {orders.length} pedidos
          </p>
        </div>
        {activeTab === 'products' && (
          <button onClick={() => navigate('/admin/products/new')} className="btn-primary" style={{ width: 'auto', padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>
            + Novo Produto
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', width: 'fit-content', marginBottom: '1.75rem' }}>
        <button style={tabStyle(activeTab === 'products')} onClick={() => setActiveTab('products')}>Produtos</button>
        <button style={tabStyle(activeTab === 'orders')} onClick={() => setActiveTab('orders')}>
          Pedidos {orders.filter(o => o.status === 'PENDING').length > 0 && (
            <span style={{ marginLeft: '0.375rem', backgroundColor: '#ef4444', color: '#fff', borderRadius: '999px', padding: '0 0.375rem', fontSize: '0.6875rem', fontWeight: '700' }}>
              {orders.filter(o => o.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {/* TAB: PRODUTOS */}
      {activeTab === 'products' && (
        <div style={{ overflowX: 'auto' }}>
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
                  <td style={{ fontWeight: '500' }}>{p.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.category || '-'}</td>
                  <td>R$ {Number(p.price).toFixed(2).replace('.', ',')}</td>
                  <td>{p.stock} un.</td>
                  <td>
                    <span style={{ padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', backgroundColor: p.active ? '#dcfce7' : '#fee2e2', color: p.active ? '#166534' : '#991b1b', fontWeight: '500' }}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => navigate(`/admin/products/${p.id}`)} title="Editar produto"
                      style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dbeafe'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button onClick={() => handleDeleteProduct(p.id, p.name)} title="Excluir produto"
                      style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Nenhum produto cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: PEDIDOS */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
              Nenhum pedido recebido ainda.
            </div>
          )}
          {orders.map(order => {
            const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.PENDING;
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {/* Cabeçalho do Pedido */}
                <div
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '1rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span style={{ padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', backgroundColor: statusInfo.bg, color: statusInfo.color, fontWeight: '600' }}>
                      {statusInfo.label}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {order.customer_name || 'Cliente'} · {order.customer_phone || '—'}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '1rem', whiteSpace: 'nowrap' }}>R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {/* Detalhes Expandidos */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem', display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
                    {/* Dados do Cliente */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-color)' }}>Dados de Entrega</h4>
                        <button onClick={() => handleExportOrderCSV(order)} title="Baixar relatório deste pedido" style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem', background: 'transparent', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                           CSV
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <Row label="Nome" value={order.customer_name} />
                        <Row label="Telefone" value={order.customer_phone} />
                        <Row label="Endereço" value={order.customer_address} />
                        <Row label="Cidade" value={order.customer_city} />
                        {order.customer_note && <Row label="Observação" value={order.customer_note} />}
                      </div>
                    </div>

                    {/* Itens + Status */}
                    <div>
                      <h4 style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-color)' }}>Itens do Pedido</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        {(order.order_items || []).map(item => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                            <span style={{ color: 'var(--text-color)' }}>{item.products?.name || 'Produto'} × {item.quantity}</span>
                            <span style={{ fontWeight: '500' }}>R$ {(Number(item.unit_price) * item.quantity).toFixed(2).replace('.', ',')}</span>
                          </div>
                        ))}
                      </div>

                      <h4 style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.625rem' }}>Atualizar Status</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {Object.entries(STATUS_LABELS).map(([key, val]) => (
                          <button
                            key={key}
                            disabled={order.status === key || statusUpdating === order.id}
                            onClick={() => handleStatusChange(order.id, key)}
                            style={{
                              padding: '0.375rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              border: '1px solid',
                              cursor: order.status === key ? 'default' : 'pointer',
                              backgroundColor: order.status === key ? val.bg : 'transparent',
                              color: order.status === key ? val.color : 'var(--text-secondary)',
                              borderColor: order.status === key ? val.color : 'var(--border-color)',
                              opacity: statusUpdating === order.id ? 0.6 : 1,
                              transition: 'all 0.15s',
                            }}
                          >
                            {val.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8125rem' }}>
      <span style={{ color: 'var(--text-secondary)', minWidth: '72px' }}>{label}:</span>
      <span style={{ fontWeight: '500', color: 'var(--text-color)' }}>{value || '—'}</span>
    </div>
  );
}
