const mongoose = require('mongoose');
const config = require('./config');

async function connectDB() {
    try{
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

module.exports = connectDB;