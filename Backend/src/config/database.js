const mongoose = require('mongoose');
const config = require('./config');

async function connectDB() {
    try {
        if (!config.MONGO_URI) {
            throw new Error('MONGO_URI is not configured');
        }

        await mongoose.connect(config.MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

module.exports = connectDB;