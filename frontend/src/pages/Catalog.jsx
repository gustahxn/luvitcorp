import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../contexts/CartContext';
import toast from 'react-hot-toast';
import { Check, ShoppingCart, Image as ImageIcon } from 'lucide-react';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    async function fetchProductsAndRole() {
      // fetch products
      const { data: prods, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('active', true);
      
      if (!pErr && prods) {
        setProducts(prods);
      }
      
      // fetch role
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile?.role === 'ADMIN') {
          setIsAdmin(true);
        }
      }
      
      setLoading(false);
    }
    
    fetchProductsAndRole();
  }, []);

  const handleAddToCart = useCallback((product) => {
    if (isAdmin) {
      toast.error('Administradores não podem adicionar itens ao carrinho');
      return;
    }
    addItem(product);
    toast.success(`${product.name} adicionado ao carrinho!`, { id: `cart-${product.id}` });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  }, [addItem, isAdmin]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] flex-col gap-4">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium tracking-wide">Carregando catálogo...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-900 text-white py-20 px-4 text-center transition-colors">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5 tracking-tight">
            Minimalismo Essencial.
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Descubra produtos pensados para o seu dia a dia. Design limpo, materiais premium e usabilidade sem distrações.
          </p>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Coleção Atual
          </h2>
          <span className="px-3 py-1 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full text-xs font-semibold">
            {products.length} itens
          </span>
        </div>
        
        {products.length === 0 ? (
          <div className="col-span-full p-16 text-center bg-zinc-50 rounded-2xl border border-zinc-200">
            <p className="text-zinc-500 font-medium text-lg">Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map(product => {
              const isAdded = addedId === product.id;
              return (
                <div key={product.id} className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative aspect-square overflow-hidden bg-zinc-100 flex items-center justify-center">
                     {product.image_url ? (
                       <img 
                         src={product.image_url} 
                         alt={product.name} 
                         className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                       />
                     ) : (
                       <ImageIcon className="w-12 h-12 text-zinc-400" />
                     )}
                     {product.category && (
                        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-zinc-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-zinc-200">
                          {product.category}
                        </span>
                     )}
                  </div>
                  
                  <div className="p-5 flex flex-col min-h-[180px]">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-zinc-900 mb-2 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-zinc-500 mb-4 line-clamp-2 min-h-[40px] leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-lg font-bold text-zinc-900">
                        R$ {Number(product.price).toFixed(2).replace('.', ',')}
                      </div>
                      <button 
                        onClick={() => handleAddToCart(product)} 
                        disabled={isAdded && !isAdmin}
                        className={`
                          p-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900:ring-offset-zinc-900:ring-white
                          ${isAdded 
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20 scale-95' 
                            : 'bg-zinc-900 text-white hover:bg-zinc-800:bg-zinc-100 shadow-md shadow-zinc-900/10'
                          }
                        `}
                        title={isAdded ? "Adicionado" : "Adicionar ao carrinho"}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-4 h-4" strokeWidth={3} /> <span className="hidden sm:inline">Adicionado</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" /> <span className="hidden sm:inline">Adicionar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
