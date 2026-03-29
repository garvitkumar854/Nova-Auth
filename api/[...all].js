const app = require('../Backend/src/app');
const connectDB = require('../Backend/src/config/database');

let isConnected = false;

module.exports = async (req, res) => {
    if (!isConnected) {
        await connectDB();
        isConnected = true;
    }

    return app(req, res);
};
