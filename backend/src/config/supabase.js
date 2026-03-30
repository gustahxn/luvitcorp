const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env do backend.');
}

// Cliente com Service Role Key para ignorar RLS e realizar ações privilegiadas (ex: CRUD Admin)
const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '');

module.exports = supabaseAdmin;
