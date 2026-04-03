import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../contexts/CartContext';
import { Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const isLoginPage = location.pathname === '/login';
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => {
    // Cart clears optionally handled locally or persisting via Zustand
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (isLoginPage) return null;

  const glassStyle = {
    backgroundColor: scrolled 
      ? 'rgba(255, 255, 255, 0.8)'
      : 'transparent',
    backdropFilter: scrolled ? 'blur(12px)' : 'none',
    borderBottom: scrolled 
      ? '1px solid rgba(0, 0, 0, 0.05)'
      : '1px solid transparent',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const navItemStyle = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    transition: 'color 0.2s',
    cursor: 'pointer',
    textDecoration: 'none',
  };

  const activeNavItemStyle = {
    ...navItemStyle,
    color: 'var(--text-primary)',
    fontWeight: '600',
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      ...glassStyle
    }}>
      {isAdminPage && (
        <div style={{
          backgroundColor: '#09090b',
          color: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '0.75rem',
          fontWeight: '600',
          padding: '0.375rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Ambiente de Administração
        </div>
      )}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: scrolled ? '0.75rem 2rem' : '1.25rem 2rem',
        margin: '0 auto',
        maxWidth: '1400px',
        transition: 'padding 0.3s ease',
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--text-primary)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span style={{ 
              fontWeight: '700', 
              fontSize: '1.25rem', 
              letterSpacing: '-0.04em', 
              color: 'var(--text-primary)',
              fontFamily: 'Inter, sans-serif'
            }}>
              LuvitCorp
            </span>
          </Link>

          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link to="/" style={location.pathname === '/' ? activeNavItemStyle : navItemStyle}>
              Catálogo
            </Link>
            {profile?.role === 'ADMIN' && (
              <Link to="/admin" style={isAdminPage ? activeNavItemStyle : navItemStyle}>
                Administração
              </Link>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              
              {profile?.role !== 'ADMIN' && (
                <Link to="/checkout" style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-full)',
                  transition: 'background 0.2s',
                  color: 'var(--text-primary)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  {itemsCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      background: 'var(--accent-color)',
                      color: 'white',
                      fontSize: '0.625rem',
                      fontWeight: '700',
                      minWidth: '16px',
                      height: '16px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      border: '2px solid white'
                    }}>
                      {itemsCount}
                    </span>
                  )}
                </Link>
              )}

              <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.1' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Olá, {profile?.name || user.email.split('@')[0]}
                  </span>
                  {profile?.role === 'ADMIN' && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'lowercase' }}>
                      {profile?.role}
                    </span>
                  )}
                </div>
                
                <button 
                  onClick={handleLogout}
                  title="Sair da conta"
                  style={{
                    padding: '0.5rem',
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '0.25rem'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--danger-color)';
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" style={{
              padding: '0.625rem 1.75rem',
              background: 'var(--text-primary)',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600',
              borderRadius: 'var(--radius-full)',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              textDecoration: 'none'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            >
              Começar agora
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

