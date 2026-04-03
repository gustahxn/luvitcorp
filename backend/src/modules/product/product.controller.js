const supabaseAdmin = require('../../config/supabase');

const getAllProducts = async (req, res) => {
  // anon or customers only see active products (via rls or query)
  // since admin uses service key, it bypasses rls, so we need to filter if not admin
  
  const options = req.query;
  let query = supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });

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

// admin routes only
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
  
  // try physical delete first
  const deleteRes = await supabaseAdmin.from('products').delete().eq('id', id);
  
  if (deleteRes.error) {
    // if foreign key violation (23503), deactivate instead of deleting
    if (deleteRes.error.code === '23503') {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('order_id, orders(status)')
        .eq('product_id', id);

      const hasActiveOrders = items && items.some(item => item.orders?.status !== 'CANCELLED');

      if (hasActiveOrders) {
        const { data, error } = await supabaseAdmin.from('products').update({ active: false }).eq('id', id).select();
        if (error) return res.status(400).json({ error: error.message });
        return res.json({ message: 'Produto inativado pois possui pedidos não cancelados.', data });
      } else {
        // all orders are cancelled, safe to delete order_items and then product
        await supabaseAdmin.from('order_items').delete().eq('product_id', id);
        const { error: finalDelError } = await supabaseAdmin.from('products').delete().eq('id', id);
        if (finalDelError) return res.status(400).json({ error: finalDelError.message });
        return res.json({ message: 'Produto excluído com sucesso.' });
      }
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
