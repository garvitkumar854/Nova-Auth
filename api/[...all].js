const app = require('../Backend/src/app');
const connectDB = require('../Backend/src/config/database');

let isConnected = false;

module.exports = async (req, res) => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
        console.log('Database connected successfully');
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
