const dotenv = require('dotenv');

dotenv.config();

const config = {
	JWT_SECRET: process.env.JWT_SECRET,
	mongoUri: process.env.MONGO_URI,
};

module.exports = config;
