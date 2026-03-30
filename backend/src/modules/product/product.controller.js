const supabaseAdmin = require('../../config/supabase');

const getAllProducts = async (req, res) => {
  // Usuários anonimos ou customers veem apenas ativos (via RLS ou query)
  // Como admin usa a service key, ele burla RLS e ve tudo, então precisamos passar filtro caso não seja admin
  
  const options = req.query;
  let query = supabaseAdmin.from('products').select('*');

  if (options.role !== 'ADMIN') {
     query = query.eq('active', true);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: 'Product not found' });
  res.json(data);
};

// Admin Routes Only
const createProduct = async (req, res) => {
  const productData = req.body;
  const { data, error } = await supabaseAdmin.from('products').insert([productData]).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const productData = req.body;
  const { data, error } = await supabaseAdmin.from('products').update(productData).eq('id', id).select();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  
  // Tenta deletar fisicamente primeiro
  const deleteRes = await supabaseAdmin.from('products').delete().eq('id', id);
  
  if (deleteRes.error) {
    // Se o erro for foreign key violation (23503), inativa ao invés de deletar
    if (deleteRes.error.code === '23503') {
      const { data, error } = await supabaseAdmin.from('products').update({ active: false }).eq('id', id).select();
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ message: 'Produto inativado pois não pode ser excluído devido a pedidos existentes.', data });
    }
    return res.status(400).json({ error: deleteRes.error.message });
  }

  res.json({ message: 'Produto excluído com sucesso.' });
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
