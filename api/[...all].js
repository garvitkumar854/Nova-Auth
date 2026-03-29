const app = require('../Backend/src/app');
const connectDB = require('../Backend/src/config/database');

let isConnected = false;

module.exports = async (req, res) => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
        console.log('Database connected successfully');
    }

    const [pathname, search = ''] = req.url.split('?');
    const authEndpoints = new Set([
        '/register',
        '/login',
        '/logout',
        '/logout-all',
        '/verify-email',
        '/refresh-token',
    ]);

    if (pathname === '/' || pathname === '/api' || pathname === '/api/') {
        req.url = '/';
    } else if (authEndpoints.has(pathname)) {
        req.url = `/api/auth${pathname}${search ? `?${search}` : ''}`;
    } else if (pathname === '/auth' || pathname.startsWith('/auth/')) {
        req.url = `/api${pathname}${search ? `?${search}` : ''}`;
    } else if (!pathname.startsWith('/api/')) {
        req.url = `/api${pathname}${search ? `?${search}` : ''}`;
    }

    console.log(`[API] ${req.method} ${req.url}`);

    return app(req, res);
};
