const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth.routes');
const config = require('./config/config');
const { getEmailTransportStatus, getEmailLastError } = require('./services/email.service');

const cookieParser = require('cookie-parser');

const app = express();

const allowedOrigins = [
	config.CLIENT_URL,
	'http://localhost:5173',
	'http://127.0.0.1:5173',
].filter(Boolean);

// Middlewares
app.use(cors({
	origin: allowedOrigins,
	credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
	return res.status(200).json({
		message: 'Nova Auth API is running',
		status: {
			server: 'running',
			databaseConnected: mongoose.connection.readyState === 1,
			emailTransportReady: getEmailTransportStatus(),
			emailLastError: getEmailLastError(),
		},
	});
});

app.get('/api/health', (req, res) => {
	return res.status(200).json({ status: 'ok' });
});

app.get('/health', (req, res) => {
	return res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);

app.use((req, res) => {
	return res.status(404).json({
		message: 'Route not found',
	});
});


module.exports = app;