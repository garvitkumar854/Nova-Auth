const dotenv = require('dotenv');

dotenv.config();

const config = {
	JWT_SECRET: process.env.JWT_SECRET,
	NODE_ENV: process.env.NODE_ENV || 'development',
	port: Number.parseInt(process.env.PORT || '5000', 10),
	CLIENT_URL: process.env.CLIENT_URL || 'https://nova-auth-lyart.vercel.app',
	mongoUri: process.env.MONGO_URI,
	GOOGLE_USER: process.env.GOOGLE_USER,
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
};

module.exports = config;
