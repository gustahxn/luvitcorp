const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Usar ANON key apenas para verificar o token JWT do usuário
const supabaseAnon = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// Usar SERVICE ROLE key para buscar dados internos (profiles) sem limite de RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // 1. Verificar o JWT via Supabase Auth (anon key é suficiente para isso)
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // 2. Buscar profile usando SERVICE ROLE para ignorar RLS
    // (a anon key não consegue ler profiles de outros usuários)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('[AUTH] Erro ao buscar profile:', profileError.message);
    }

    req.user = {
      ...user,
      role: profile?.role || 'CUSTOMER',
      name: profile?.name || user.email,
    };

    next();
  } catch (err) {
    console.error('[AUTH] Erro interno:', err.message);
    return res.status(500).json({ error: 'Internal Server Error (Auth)' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Requires ADMIN role' });
  }
  next();
};

module.exports = { requireAuth, requireAdmin };
