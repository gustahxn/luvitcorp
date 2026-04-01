const supabaseAdmin = require('../../config/supabase');

// create order (authenticated)
const createOrder = async (req, res) => {
  try {
    const { items, total, customer_name, customer_phone, customer_address, customer_city, customer_note } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }
    if (!customer_name || !customer_phone || !customer_address || !customer_city) {
      return res.status(400).json({ error: 'Dados de entrega incompletos' });
    }

    // 1. create parent order with customer data
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{ 
        user_id: userId, 
        total, 
        status: 'PENDING',
        customer_name,
        customer_phone,
        customer_address,
        customer_city,
        customer_note: customer_note || null
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Inserir Order Items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    res.status(201).json({ message: 'Pedido criado com sucesso!', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Histórico de pedidos (Usuário ou Admin)
const getOrders = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  let query = supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(name, image_url, price))');

  if (role !== 'ADMIN') {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};

// Atualização de Status (Módulo Admin)
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // PENDING, CONFIRMED, DELIVERED...

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus
};
