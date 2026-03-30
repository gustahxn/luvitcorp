const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const { requireAuth, requireAdmin } = require('../../middlewares/auth');

// Public routes (Auth handled by Supabase or query param filtering internally)
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin-only routes
router.post('/', requireAuth, requireAdmin, productController.createProduct);
router.put('/:id', requireAuth, requireAdmin, productController.updateProduct);
router.delete('/:id', requireAuth, requireAdmin, productController.deleteProduct);

module.exports = router;
