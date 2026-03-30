import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../contexts/CartContext';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const isLoginPage = location.pathname === '/login';
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) fetchProfile(currentUser.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Limpar o carrinho sempre que o usuário mudar (evita carrinho compartilhado)
  useEffect(() => {
    clearCart();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  }

  const handleLogout = async () => {
    clearCart(); // Limpa o carrinho ao sair
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (isLoginPage) return null;

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--surface-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.875rem 1.5rem',
        margin: '0 auto',
        maxWidth: '1200px',
      }}>
        
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--text-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          <div>
            <span style={{ fontWeight: '700', fontSize: '1.125rem', letterSpacing: '-0.03em', display: 'block', lineHeight: '1.1' }}>
              LuvitCorp
            </span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '500' }}>
              Minimal Store
            </span>
          </div>
        </Link>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              {/* User Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                backgroundColor: 'var(--bg-color)',
                borderRadius: '2rem',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--text-color)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.625rem',
                  fontWeight: '700',
                }}>
                  {(profile?.name || user.email)[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-color)' }}>
                  {profile?.name || user.email.split('@')[0]}
                </span>
              </div>

              {/* Admin Links */}
              {profile?.role === 'ADMIN' && (
                isAdminPage ? (
                  <button
                    onClick={() => navigate('/')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--text-color)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'opacity 0.15s, transform 0.1s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Loja
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/admin')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--surface-color)',
                      color: 'var(--text-color)',
                      border: '2px solid var(--text-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = 'var(--text-color)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                      e.currentTarget.style.color = 'var(--text-color)';
                    }}
                  >
                    Painel Admin
                  </button>
                )
              )}

              {/* Cart — oculto para Admins */}
              {profile?.role !== 'ADMIN' && (
                <button
                  onClick={() => navigate('/checkout')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--text-color)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    transition: 'opacity 0.15s, transform 0.1s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    position: 'relative',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Carrinho
                  {itemsCount > 0 && (
                    <span style={{
                      backgroundColor: '#fff',
                      color: 'var(--text-color)',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6875rem',
                      fontWeight: '700',
                      marginLeft: '0.125rem',
                    }}>
                      {itemsCount}
                    </span>
                  )}
                </button>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--danger-color)',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fecaca'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
              >
                Sair
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '0.625rem 1.5rem',
                backgroundColor: 'var(--text-color)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.15s, transform 0.1s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={e => e.target.style.opacity = '0.9'}
              onMouseLeave={e => e.target.style.opacity = '1'}
              onMouseDown={e => e.target.style.transform = 'scale(0.96)'}
              onMouseUp={e => e.target.style.transform = 'scale(1)'}
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
