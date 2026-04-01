const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // Default 5 minutes

const cacheMiddleware = (duration) => (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const key = req.originalUrl || req.url;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    console.log(`Cache Hit: ${key}`);
    return res.json(cachedResponse);
  } else {
    console.log(`Cache Miss: ${key}`);
    res.originalJson = res.json;
    res.json = (body) => {
      res.originalJson(body);
      cache.set(key, body, duration);
    };
    next();
  }
};

module.exports = { cacheMiddleware, cache };
