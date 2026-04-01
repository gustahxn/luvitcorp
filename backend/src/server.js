require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const productRoutes = require('./modules/product/product.routes');
const orderRoutes = require('./modules/order/order.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 LuvitCorp Backend running on http://localhost:${PORT}`);
});
