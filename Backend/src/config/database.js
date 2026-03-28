const mongoose = require('mongoose');
const config = require('./config');

async function connectDB() {
    try{
        if (!config.mongoUri) {
            throw new Error('MONGO_URI is not configured');
        }

        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

module.exports = connectDB;