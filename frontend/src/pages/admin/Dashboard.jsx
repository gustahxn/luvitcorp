import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Edit2, Trash2, Download, ChevronDown, Plus, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

const STATUS_LABELS = {
  PENDING: { label: 'Pendente', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  CONFIRMED: { label: 'Confirmado', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  PREPARING: { label: 'Preparando', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  DELIVERED: { label: 'Entregue', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  CANCELLED: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
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
        api.get('/products?role=ADMIN').catch(() => ({ data: [] })),
        api.get('/orders').catch(() => ({ data: [] })),
      ]);

      if (prods) setProducts(prods);
      if (ordersRes?.data) setOrders(ordersRes.data);
      setLoading(false);
    }
    checkAuthAndFetch();
  }, [navigate]);

  const handleStatusChange = async (orderId, newStatus) => {
    setStatusUpdating(`${orderId}-${newStatus}`);
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

  const handleDeleteOrder = (orderId) => {
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px]">
        <p className="font-semibold text-sm m-0 text-zinc-900">
          Tem certeza que deseja excluir o pedido #{orderId.slice(0, 8).toUpperCase()}?
        </p>
        <div className="flex gap-2 justify-end">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 border border-zinc-200 rounded-md bg-transparent text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const promise = api.delete(`/orders/${orderId}`).then(res => {
                setOrders(prev => prev.filter(o => o.id !== orderId));
                return res.data.message;
              });
              
              toast.promise(promise, {
                loading: 'Excluindo pedido...',
                success: (msg) => msg,
                error: (e) => e.response?.data?.error || 'Erro ao excluir pedido.'
              });
            }}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleDeleteProduct = (id, name) => {
    toast((t) => (
      <div className="flex flex-col gap-4 min-w-[320px]">
        <p className="font-semibold text-sm m-0 text-zinc-900">
          Tem certeza que deseja excluir '{name}'?
        </p>
        <div className="flex gap-2 justify-end">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 border border-zinc-200 rounded-md bg-transparent text-sm font-medium text-zinc-700 hover:bg-zinc-50:bg-zinc-800 transition-colors"
          >
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
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleExportOrderExcel = (order) => {
    const itemsString = (order.order_items || []).map(item => 
      `${item.quantity}x ${item.products?.name || 'Produto'} (R$ ${Number(item.unit_price).toFixed(2).replace('.', ',')} un.)`
    ).join('\n');

    const data = [{
      'ID do Pedido': order.id.slice(0, 8).toUpperCase(),
      'Data': new Date(order.created_at).toLocaleString('pt-BR'),
      'Cliente': order.customer_name || '-',
      'Telefone': order.customer_phone || '-',
      'Endereço': `${order.customer_address || ''} - ${order.customer_city || ''}`,
      'Status': STATUS_LABELS[order.status]?.label || 'Pendente',
      'Total (R$)': Number(order.total).toFixed(2).replace('.', ','),
      'Itens do Pedido': itemsString || '-'
    }];

    const applyStylesToWorksheet = (ws, rowsHeights) => {
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          ws[cellAddress].s = {
            alignment: { vertical: 'top', wrapText: true },
            font: R === 0 ? { bold: true } : {}
          };
        }
      }
      ws['!rows'] = rowsHeights;
    };

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 16 }, 
      { wch: 50 }, { wch: 15 }, { wch: 15 }, { wch: 60 }
    ];
    
    const linesCount = Math.max(1, order.order_items?.length || 1);
    const rowsHeights = [{ hpt: 20 }, { hpt: linesCount * 16 }];
    applyStylesToWorksheet(worksheet, rowsHeights);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Pedido ${order.id.slice(0, 8).toUpperCase()}`);
    XLSX.writeFile(workbook, `pedido_luvitcorp_${order.id.slice(0, 8).toUpperCase()}.xlsx`);
    toast.success('Pedido exportado em Excel!');
  };

  const handleExportAllExcel = () => {
    const data = orders.map(order => {
      const itemsString = (order.order_items || []).map(item => 
        `${item.quantity}x ${item.products?.name || 'Produto'} (R$ ${Number(item.unit_price).toFixed(2).replace('.', ',')} un.)`
      ).join('\n');

      return {
        'ID do Pedido': order.id.slice(0, 8).toUpperCase(),
        'Data': new Date(order.created_at).toLocaleString('pt-BR'),
        'Cliente': order.customer_name || '-',
        'Telefone': order.customer_phone || '-',
        'Endereço': `${order.customer_address || ''} - ${order.customer_city || ''}`,
        'Status': STATUS_LABELS[order.status]?.label || 'Pendente',
        'Total (R$)': Number(order.total).toFixed(2).replace('.', ','),
        'Itens do Pedido': itemsString || '-'
      };
    });

    const applyStylesToWorksheet = (ws, rowsHeights) => {
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          ws[cellAddress].s = {
            alignment: { vertical: 'top', wrapText: true },
            font: R === 0 ? { bold: true } : {}
          };
        }
      }
      ws['!rows'] = rowsHeights;
    };

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    worksheet['!cols'] = [
      { wch: 15 }, // id
      { wch: 20 }, // date
      { wch: 25 }, // customer
      { wch: 16 }, // phone
      { wch: 50 }, // address
      { wch: 15 }, // status
      { wch: 15 }, // total
      { wch: 60 }  // items
    ];
    
    const rowsHeights = [{ hpt: 20 }]; // header
    orders.forEach(order => {
      const linesCount = Math.max(1, order.order_items?.length || 1);
      rowsHeights.push({ hpt: linesCount * 16 });
    });
    applyStylesToWorksheet(worksheet, rowsHeights);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Todos os Pedidos");
    XLSX.writeFile(workbook, "luvitcorp_todos_pedidos.xlsx");
    toast.success('Todos os pedidos exportados em Excel!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] flex-col gap-4">
        <Loader2 className="w-8 h-8 text-zinc-900 animate-spin" />
        <p className="text-zinc-500 font-medium tracking-wide">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Administração</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {products.length} produtos · {orders.length} pedidos
          </p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'orders' && (
            <button 
              onClick={() => handleExportAllExcel()} 
              className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-zinc-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
            >
              <Download size={18} /> Exportar Todos (.xlsx)
            </button>
          )}
          {activeTab === 'products' && (
            <button 
              onClick={() => navigate('/admin/products/new')} 
              className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-zinc-800 transition-all shadow-sm"
            >
              <Plus size={18} /> Novo Produto
            </button>
          )}
        </div>
      </div>

      <div className="flex bg-zinc-100 p-1 rounded-xl w-fit mb-8 border border-zinc-200">
        <button 
          className={`px-6 py-2 rounded-lg text-sm transition-all focus:outline-none ${
            activeTab === 'products' 
              ? 'bg-white text-zinc-900 font-semibold shadow-sm ring-1 ring-zinc-900/5' 
              : 'text-zinc-500 hover:text-zinc-700:text-zinc-200 font-medium'
          }`}
          onClick={() => setActiveTab('products')}
        >
          Produtos
        </button>
        <button 
          className={`relative px-6 py-2 rounded-lg text-sm transition-all flex items-center gap-2 focus:outline-none ${
            activeTab === 'orders' 
              ? 'bg-white text-zinc-900 font-semibold shadow-sm ring-1 ring-zinc-900/5' 
              : 'text-zinc-500 hover:text-zinc-700:text-zinc-200 font-medium'
          }`}
          onClick={() => setActiveTab('orders')}
        >
          Pedidos
          {orders.filter(o => o.status === 'PENDING').length > 0 && (
            <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-[10px] font-bold">
              {orders.filter(o => o.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4 px-6">Produto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Preço</th>
                <th className="p-4">Estoque</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {products.map(p => (
                <tr key={p.id} className={`transition-colors ${!p.active ? 'opacity-50 grayscale bg-zinc-50/50' : 'hover:bg-zinc-50'}`}>
                  <td className="p-4 px-6 font-medium text-zinc-900">{p.name}</td>
                  <td className="p-4 text-zinc-500">{p.category || '-'}</td>
                  <td className="p-4 text-zinc-900">R$ {Number(p.price).toFixed(2).replace('.', ',')}</td>
                  <td className="p-4 text-zinc-900">{p.stock} un.</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      p.active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2 items-center">
                    <button 
                      onClick={() => navigate(`/admin/products/${p.id}`)} 
                      title="Editar produto"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100:bg-blue-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(p.id, p.name)} 
                      title="Excluir produto"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100:bg-red-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-zinc-500">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4">
          {orders.length === 0 && (
            <div className="text-center p-12 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-500">
              Nenhum pedido recebido ainda.
            </div>
          )}
          {orders.map(order => {
            const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.PENDING;
            const isExpanded = expandedOrders.has(order.id);

            return (
              <div key={order.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                <div
                  onClick={() => {
                    const newExpanded = new Set(expandedOrders);
                    if (isExpanded) {
                      newExpanded.delete(order.id);
                    } else {
                      newExpanded.add(order.id);
                    }
                    setExpandedOrders(newExpanded);
                  }}
                  className="p-5 flex flex-wrap sm:flex-nowrap justify-between items-center cursor-pointer gap-4 hover:bg-zinc-50:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex-1 flex flex-wrap items-center gap-4">
                    <span className="font-bold text-sm text-zinc-900 px-2 py-1 bg-zinc-100 rounded-lg border border-zinc-200">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {order.customer_name || 'Cliente'} · {order.customer_phone || '—'}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-zinc-900 whitespace-nowrap">
                      R$ {Number(order.total).toFixed(2).replace('.', ',')}
                    </span>
                    <ChevronDown 
                      size={20} 
                      className={`text-zinc-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-zinc-50">
                    
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-sm text-zinc-900 uppercase tracking-wider">Dados de Entrega</h4>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleExportOrderExcel(order)} 
                            title="Baixar planilha deste pedido" 
                            className="flex items-center gap-2 px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500/30"
                          >
                             <Download size={14} /> .xlsx
                          </button>
                          <button 
                            onClick={() => handleDeleteOrder(order.id)} 
                            title="Excluir pedido" 
                            className="flex items-center gap-2 px-3 py-1.5 border border-red-200 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30"
                          >
                             <Trash2 size={14} /> Excluir
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <Row label="Nome" value={order.customer_name} />
                        <Row label="Telefone" value={order.customer_phone} />
                        <Row label="Endereço" value={order.customer_address} />
                        <Row label="Cidade" value={order.customer_city} />
                        {order.customer_note && <Row label="Observação" value={order.customer_note} />}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-zinc-900 uppercase tracking-wider mb-4">Itens do Pedido</h4>
                      <div className="flex flex-col gap-2 mb-8 bg-white p-4 rounded-xl border border-zinc-200">
                        {(order.order_items || []).map(item => (
                          <div key={item.id} className="flex justify-between text-sm items-center">
                            <span className="text-zinc-600">{item.products?.name || 'Produto'} <span className="text-zinc-400 px-1">×</span> <span className="font-medium text-zinc-900">{item.quantity}</span></span>
                            <span className="font-semibold text-zinc-900">R$ {(Number(item.unit_price) * item.quantity).toFixed(2).replace('.', ',')}</span>
                          </div>
                        ))}
                      </div>

                      <h4 className="font-semibold text-sm text-zinc-900 uppercase tracking-wider mb-4">Atualizar Status</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(STATUS_LABELS).map(([key, val]) => {
                          const isUpdatingThis = statusUpdating === `${order.id}-${key}`;
                          const isCurrent = order.status === key;
                          const anyUpdating = statusUpdating !== null;
                          return (
                            <button
                              key={key}
                              disabled={isCurrent || anyUpdating}
                              onClick={() => handleStatusChange(order.id, key)}
                              className={`
                                flex items-center justify-center min-w-[100px] px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${val.bg} ${val.text} ${val.border}
                                ${isCurrent 
                                  ? `cursor-default ring-1 ring-inset ring-black/10 shadow-sm opacity-100` 
                                  : `opacity-40 hover:opacity-100 hover:shadow-sm`
                                }
                                ${anyUpdating && !isUpdatingThis ? 'opacity-25' : ''}
                              `}
                            >
                              {isUpdatingThis ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                val.label
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2 text-sm items-start">
      <span className="text-zinc-500 min-w-[80px] font-medium">{label}</span>
      <span className="font-medium text-zinc-900 break-words flex-1">{value || '—'}</span>
    </div>
  );
}
