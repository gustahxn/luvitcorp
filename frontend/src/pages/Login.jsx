import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const showError = (text) => setMessage({ type: 'error', text });
  const showSuccess = (text) => setMessage({ type: 'success', text });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validacoes basicas
    if (!email.includes('@')) {
      showError('Informe um email válido.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      showError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }
    if (!isLogin && name.trim().length < 2) {
      showError('Informe seu nome completo.');
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          showError('Email ou senha incorretos.');
        } else if (authError.message.includes('Email not confirmed')) {
          showError('Email ainda não confirmado. Verifique sua caixa de entrada.');
        } else {
          showError(authError.message);
        }
        setLoading(false);
        return;
      }
      await redirectByRole(data.user.id);

    } else {
      const { data, error: registerError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            role: 'CUSTOMER'
          }
        }
      });

      if (registerError) {
        if (registerError.message.includes('already registered')) {
          showError('Este email já possui uma conta. Tente fazer login.');
        } else if (registerError.message.includes('rate limit')) {
          showError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
        } else {
          showError(registerError.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        showSuccess('Conta criada com sucesso! Redirecionando...');
        setTimeout(async () => {
          await redirectByRole(data.user.id);
        }, 1200);
      } else {
        showError('Erro inesperado. Tente novamente.');
        setLoading(false);
      }
    }
  };

  const redirectByRole = async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    setLoading(false);
    if (profile?.role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setMessage({ type: '', text: '' });
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: 'var(--bg-color)',
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        padding: '2.5rem',
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
      }}>

        {/* Logo e Titulo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}>
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--text-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '700', marginBottom: '0.375rem', letterSpacing: '-0.02em' }}>
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isLogin ? 'Entre para acessar o catálogo LuvitCorp.' : 'Cadastre-se para começar a comprar.'}
          </p>
        </div>

        {/* Abas */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1.75rem',
          padding: '0.25rem',
          background: 'var(--bg-color)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-color)',
        }}>
          <button
            type="button"
            onClick={() => switchMode()}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: isLogin ? 'var(--surface-color)' : 'transparent',
              fontWeight: isLogin ? '600' : '400',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              color: isLogin ? 'var(--text-color)' : 'var(--text-secondary)',
              boxShadow: isLogin ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
            disabled={isLogin}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchMode()}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              background: !isLogin ? 'var(--surface-color)' : 'transparent',
              fontWeight: !isLogin ? '600' : '400',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              color: !isLogin ? 'var(--text-color)' : 'var(--text-secondary)',
              boxShadow: !isLogin ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
            disabled={!isLogin}
          >
            Criar Conta
          </button>
        </div>

        {/* Mensagens de Feedback */}
        {message.text && (
          <div style={{
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: '0.5rem',
            fontSize: '0.8125rem',
            fontWeight: '500',
            lineHeight: '1.4',
            backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: message.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          }}>
            {message.text}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>

          {/* Campo Nome (apenas no Cadastro) */}
          {!isLogin && (
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="name" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', marginBottom: '0.375rem', color: 'var(--text-color)' }}>
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Seu nome"
                style={{
                  width: '100%',
                  padding: '0.6875rem 0.875rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  backgroundColor: 'var(--bg-color)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--text-color)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          )}

          {/* Campo Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', marginBottom: '0.375rem', color: 'var(--text-color)' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="voce@email.com"
              style={{
                width: '100%',
                padding: '0.6875rem 0.875rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                outline: 'none',
                fontSize: '0.875rem',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                backgroundColor: 'var(--bg-color)',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--text-color)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Campo Senha com Toggle */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '500', marginBottom: '0.375rem', color: 'var(--text-color)' }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="minimo 6 caracteres"
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.6875rem 2.75rem 0.6875rem 0.875rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  backgroundColor: 'var(--bg-color)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--text-color)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.06)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                style={{
                  position: 'absolute',
                  right: '0.625rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.25rem',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-color)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {showPassword ? (
                  // Olho fechado (senha visivel -> clicar para ocultar)
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Olho aberto (senha oculta -> clicar para ver)
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {!isLogin && password.length > 0 && password.length < 6 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--danger-color)', marginTop: '0.375rem' }}>
                A senha precisa ter pelo menos 6 caracteres.
              </p>
            )}
          </div>

          {/* Botao Submit */}
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
              transition: 'background-color 0.2s, transform 0.1s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {loading && (
              <span style={{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }} />
            )}
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar minha conta')}
          </button>
        </form>

        {/* Footer hint */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {isLogin ? 'Ainda não tem conta? ' : 'Já possui conta? '}
          <button
            type="button"
            onClick={switchMode}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-color)',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              fontSize: '0.8125rem',
            }}
          >
            {isLogin ? 'Cadastre-se' : 'Fazer login'}
          </button>
        </p>
      </div>

      {/* Spinner CSS animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
