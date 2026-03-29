const app = require('../Backend/src/app');
const connectDB = require('../Backend/src/config/database');

let isConnected = false;

module.exports = async (req, res) => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
        console.log('Database connected successfully');
    }

    // Vercel can pass stripped paths (e.g. /auth/register). Normalize to app's API prefix.
    if (!req.url.startsWith('/api/')) {
        req.url = `/api${req.url}`;
    }

    console.log(`[API] ${req.method} ${req.url}`);

    return app(req, res);
};
