const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const { requireAuth, requireAdmin } = require('../../middlewares/auth');
const { cacheMiddleware, cache } = require('../../middlewares/cache');

// helper to clear products cache
const clearProductCache = (req, res, next) => {
  const keys = cache.keys();
  const productKeys = keys.filter(k => k.includes('/api/products'));
  cache.del(productKeys);
  next();``
};

// public routes
router.get('/:id', cacheMiddleware(300), productController.getProductById);
router.get('/', cacheMiddleware(300), productController.getAllProducts);

// admin-only routes (clear cache on change)
router.post('/', requireAuth, requireAdmin, clearProductCache, productController.createProduct);
router.put('/:id', requireAuth, requireAdmin, clearProductCache, productController.updateProduct);
router.delete('/:id', requireAuth, requireAdmin, clearProductCache, productController.deleteProduct);

module.exports = router;
