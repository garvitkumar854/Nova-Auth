const mongoose = require('mongoose');
const config = require('./config');

async function connectDB() {
    try {
        const mongoUri = config.mongoUri || config.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MONGO_URI is not configured');
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

module.exports = connectDB;