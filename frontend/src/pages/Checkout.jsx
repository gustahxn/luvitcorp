import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import api from '../services/api';
import { Loader2, CheckCircle2, ChevronRight, Minus, Plus, X } from 'lucide-react';

export default function Checkout() {
  const { items, clearCart, removeItem, updateQuantity } = useCartStore();
  const cartTotal = items.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
  const [step, setStep] = useState(1); // 1: cart, 2: details
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
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

  const handleCEP = async (e) => {
    let value = e.target.value;
    let v = value.replace(/\D/g, '');
    let formatted = v;
    if (v.length > 5) formatted = v.replace(/^(\d{5})(\d)/, '$1-$2');
    setCustomer(prev => ({ ...prev, cep: formatted.substring(0, 9) }));

    if (v.length === 8) {
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${v}/json/`);
        const data = await resp.json();
        if (!data.erro) {
          setCustomer(prev => ({
            ...prev,
            address: `${data.logradouro}${data.bairro ? ` - ${data.bairro}` : ''}`,
            city: `${data.localidade} - ${data.uf}`
          }));
          setError('');
        } else {
          setError('CEP não encontrado ou inválido.');
        }
      } catch (e) {
        console.error("Erro ao buscar CEP", e);
        setError('Erro ao buscar CEP. Verifique a conexão.');
      }
    }
  };

  const handleCheckout = async () => {
    setError('');
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim() || !customer.city.trim() || !customer.cep.trim() || !customer.number.trim()) {
      setError('Preencha todos os campos obrigatórios (incluindo o CEP e Número).');
      return;
    }

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/login'); return; }

    try {
      const fullAddress = `${customer.address.trim()}, Nº ${customer.number.trim()}${customer.complement.trim() ? ` (${customer.complement.trim()})` : ''} - CEP: ${customer.cep}`;
      await api.post('/orders', {
        total: cartTotal,
        items,
        customer_name: customer.name.trim(),
        customer_phone: customer.phone.trim(),
        customer_address: fullAddress,
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
      <div className="flex flex-col items-center text-center mt-32 max-w-lg mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-green-600" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-bold mb-3 text-zinc-900 tracking-tight">Pedido Confirmado!</h1>
        <p className="text-zinc-500 leading-relaxed mb-8">
          Seu pedido foi recebido com sucesso. Nossa equipe entrará em contato em breve para confirmar os detalhes do envio.
        </p>
        <p className="text-sm text-zinc-400 animate-pulse">
          Redirecionando para a loja...
        </p>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-zinc-900:ring-white focus:border-transparent transition-all text-sm text-zinc-900 placeholder:text-zinc-400";
  const labelClass = "block text-sm font-medium text-zinc-700 mb-1.5";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Checkout</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Etapa {step} de 2 — {step === 1 ? 'Revise seu carrinho' : 'Dados de entrega'}
          </p>
        </div>
        <button
          onClick={() => step === 2 ? setStep(1) : navigate('/')}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900:text-white underline decoration-zinc-300 underline-offset-4 transition-colors"
        >
          {step === 2 ? 'Voltar ao carrinho' : 'Continuar comprando'}
        </button>
      </div>

      <div className="h-1 bg-zinc-100 rounded-full mb-10 overflow-hidden">
        <div
          className="h-full bg-zinc-900 rounded-full transition-all duration-500 ease-out"
          style={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>

      {items.length === 0 ? (
        <div className="text-center p-16 border border-zinc-200 rounded-2xl bg-zinc-50">
          <p className="text-zinc-500 font-medium text-lg mb-4">Seu carrinho está vazio.</p>
          <button
            onClick={() => navigate('/')}
            className="text-zinc-900 font-semibold hover:underline underline-offset-4"
          >
            Voltar à loja
          </button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3 items-start">

          <div className="lg:col-span-2 space-y-6">

            {step === 1 && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm">
                <h2 className="text-xl font-bold mb-6 text-zinc-900">Itens no Carrinho</h2>
                <div className="space-y-6">
                  {items.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-zinc-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                          <img
                            src={item.image_url || 'https://via.placeholder.com/80'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900 text-base">{item.name}</h3>
                          <div className="text-zinc-500 text-sm mt-1">
                            R$ {Number(item.price).toFixed(2).replace('.', ',')} un.
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 sm:gap-8">
                        <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-1 border border-zinc-200">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900:text-white hover:bg-white:bg-zinc-700 rounded-md transition-colors"
                          >
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-zinc-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-900:text-white hover:bg-white:bg-zinc-700 rounded-md transition-colors"
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>

                        <div className="font-bold text-base text-zinc-900 min-w-[90px] text-right">
                          R$ {(Number(item.price) * item.quantity).toFixed(2).replace('.', ',')}
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          title="Remover produto"
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold mb-2 text-zinc-900">Dados de Entrega</h2>
                <p className="text-sm text-zinc-500 mb-8">
                  Campos com <span className="text-red-500">*</span> são obrigatórios. O endereço preenche automaticamente pelo CEP.
                </p>

                {error && (
                  <div className="p-4 mb-6 rounded-xl text-sm font-medium bg-red-50 text-red-800 border border-red-200 flex items-center gap-3">
                    <X size={18} className="shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Nome completo <span className="text-red-500">*</span>
                    </label>
                    <input name="name" value={customer.name} onChange={handleCustomerChange} placeholder="Ex: Gabriel Silva" className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Telefone / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input name="phone" value={customer.phone} onChange={handleCustomerChange} placeholder="(00) 00000-0000" className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      CEP <span className="text-red-500">*</span>
                    </label>
                    <input name="cep" value={customer.cep} onChange={handleCEP} placeholder="00000-000" className={inputClass} maxLength={9} />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Endereço (Rua, Bairro) <span className="text-red-500">*</span>
                    </label>
                    <input name="address" value={customer.address} onChange={handleCustomerChange} placeholder="Rua de Exemplo, Centro" className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Número <span className="text-red-500">*</span>
                    </label>
                    <input name="number" value={customer.number} onChange={handleCustomerChange} placeholder="123" className={inputClass} />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Complemento
                    </label>
                    <input name="complement" value={customer.complement} onChange={handleCustomerChange} placeholder="Apto 42, Bloco B" className={inputClass} />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Cidade e Estado <span className="text-red-500">*</span>
                    </label>
                    <input name="city" value={customer.city} onChange={handleCustomerChange} placeholder="São Paulo - SP" className={inputClass} />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>Observações (Opcional)</label>
                    <textarea
                      name="note"
                      value={customer.note}
                      onChange={handleCustomerChange}
                      rows="3"
                      placeholder="Deixar na portaria, campainha quebrada..."
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-zinc-200 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold mb-6 text-zinc-900">Resumo do Pedido</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-zinc-500 text-sm">
                <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                <span className="font-medium text-zinc-900">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-zinc-500 text-sm">
                <span>Frete Especial</span>
                <span className="text-green-600 font-bold">Grátis</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-100 pt-6 mb-8">
              <span className="font-bold text-zinc-900">Total</span>
              <span className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                R$ {cartTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg group"
              >
                Continuar para Entrega
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md
                  ${loading ? 'opacity-80 cursor-not-allowed' : 'hover:shadow-lg'}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Confirmar Pedido
                    <CheckCircle2 size={18} />
                  </>
                )}
              </button>
            )}

            <p className="text-center mt-6 text-xs text-zinc-500 font-medium flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Pagamento 100% Garantido
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
