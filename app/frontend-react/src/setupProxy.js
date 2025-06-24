const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy API requests to the backend server
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // Don't rewrite the path
      },
      // Log proxy activity
      onProxyReq: (proxyReq, req) => {
        console.log(`Proxying request to: ${req.method} ${proxyReq.path}`);
      }
    })
  );
}; 