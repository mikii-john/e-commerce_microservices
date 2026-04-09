const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config();

const app = express();
app.use(cors());

// Microservice URLs (hardcoded for local dev)
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';

// Request Logger
app.use((req, res, next) => {
    console.log(`[GATEWAY] ${req.method} ${req.path}`);
    next();
});

// Proxy Config Factory
const createProxy = (target, pathFilter) => createProxyMiddleware({
    target,
    changeOrigin: true,
    pathFilter,
    on: {
        proxyReq: (proxyReq, req, res) => {
            console.log(`[GATEWAY] Proxying ${req.method} ${req.path} -> ${target}${req.path}`);
        },
        error: (err, req, res) => {
            console.error(`[GATEWAY] Proxy Error for ${req.path}:`, err.message);
            res.status(502).json({ message: 'Gateway error: Service unreachable', error: err.message });
        }
    }
});

// Proxies
app.use(createProxy(USER_SERVICE_URL, (path) => path.startsWith('/api/auth')));
app.use(createProxy(USER_SERVICE_URL, (path) => path.startsWith('/api/admin')));
app.use(createProxy(USER_SERVICE_URL, (path) => path.startsWith('/api/staff')));
app.use(createProxy(PRODUCT_SERVICE_URL, (path) => path.startsWith('/api/products')));
app.use(createProxy(ORDER_SERVICE_URL, (path) => path.startsWith('/api/orders')));
app.use(createProxy(ORDER_SERVICE_URL, (path) => path.startsWith('/api/disputes')));
app.use(createProxy(PAYMENT_SERVICE_URL, (path) => path.startsWith('/api/payments')));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'API Gateway is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`API Gateway listening on port ${PORT}`);
});
