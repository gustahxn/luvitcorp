const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const { requireAuth, requireAdmin } = require('../../middlewares/auth');

// all order requests need auth
router.use(requireAuth);

router.post('/', orderController.createOrder); // customer & admin
router.get('/', orderController.getOrders);    // customer & admin

// only admin can change status and delete
router.patch('/:id/status', requireAdmin, orderController.updateOrderStatus);
router.delete('/:id', requireAdmin, orderController.deleteOrder);

module.exports = router;
