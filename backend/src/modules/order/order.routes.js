const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const { requireAuth, requireAdmin } = require('../../middlewares/auth');

// Todas requisições de Order precisam de Auth
router.use(requireAuth);

router.post('/', orderController.createOrder); // Customer & Admin
router.get('/', orderController.getOrders);    // Customer & Admin

// Apenas Admin pode mudar status
router.patch('/:id/status', requireAdmin, orderController.updateOrderStatus);

module.exports = router;
