const app = require('../Backend/src/app');
const connectDB = require('../Backend/src/config/database');

let isConnected = false;

module.exports = async (req, res) => {
    // Enable CORS for Vercel deployment
    const origin = req.headers.origin || req.headers.referer;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Database connection error:', error);
            return res.status(500).json({ message: 'Database connection failed' });
        }
    }

    const pathname = req.url.split('?')[0];

    if (pathname === '/' || pathname === '/api' || pathname === '/api/') {
        req.url = '/';
    } else if (pathname === '/register' || pathname === '/login' || pathname === '/logout' || pathname === '/logout-all' || pathname === '/verify-email' || pathname === '/refresh-token') {
        req.url = `/api/auth${req.url}`;
    } else if (pathname === '/auth' || pathname.startsWith('/auth/')) {
        req.url = `/api${req.url}`;
    } else if (!pathname.startsWith('/api/')) {
        req.url = `/api${req.url}`;
    }

    console.log(`[API] ${req.method} ${req.url}`);

    return app(req, res);
};
