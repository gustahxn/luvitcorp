/**
 * Script para criar o usuario ADMIN inicial da LuvitCorp.
 * Executar UMA VEZ: node seed-admin.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ADMIN_EMAIL = 'admin@luvitcorp.com';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_NAME = 'Administrador LuvitCorp';

async function seedAdmin() {
  console.log('Criando usuario admin...');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Senha: ${ADMIN_PASSWORD}`);
  console.log('---');

  // 1. Criar o usuario no Supabase Auth (via Admin API)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true, // Marca como confirmado automaticamente
    user_metadata: {
      name: ADMIN_NAME,
      role: 'ADMIN'
    }
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('O usuario admin ja existe. Atualizando role para ADMIN...');
      
      // Buscar o user existente e atualizar o profile
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users?.users?.find(u => u.email === ADMIN_EMAIL);
      
      if (existingUser) {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ role: 'ADMIN', name: ADMIN_NAME })
          .eq('id', existingUser.id);
        
        if (updateError) {
          console.error('Erro ao atualizar profile:', updateError.message);
        } else {
          console.log('Profile atualizado para ADMIN com sucesso!');
        }
      }
      return;
    }
    console.error('Erro ao criar usuario:', authError.message);
    return;
  }

  console.log('Usuario criado no Auth! ID:', authData.user.id);

  // 2. O trigger do banco (handle_new_user) ja insere em profiles,
  //    mas vamos garantir que a role seja ADMIN
  //    Aguardar um momento para o trigger executar
  await new Promise(r => setTimeout(r, 1500));

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'ADMIN' })
    .eq('id', authData.user.id);

  if (profileError) {
    console.error('Erro ao atualizar role:', profileError.message);
  } else {
    console.log('Role ADMIN atribuida com sucesso!');
  }

  console.log('');
  console.log('=== ADMIN CRIADO ===');
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Senha: ${ADMIN_PASSWORD}`);
  console.log('====================');
}

seedAdmin().catch(console.error);
