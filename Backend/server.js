const app = require('./src/app');
const connectDB = require('./src/config/database');
const config = require('./src/config/config');

let isDatabaseConnected = false;

async function ensureDatabaseConnection() {
    if (isDatabaseConnected) {
        return;
    }

    await connectDB();
    isDatabaseConnected = true;
    console.log('Database connected successfully');
}

async function startServer(){
    await ensureDatabaseConnection();
    const port = config.port || 5000;

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

if (process.env.VERCEL) {
    module.exports = async (req, res) => {
        await ensureDatabaseConnection();
        return app(req, res);
    };
} else {
    startServer().catch((error) => {
        console.error('Failed to start server:', error);
    });
}
