const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const config = require('./config/config');

const cookieParser = require('cookie-parser');

const app = express();

// Middlewares
app.use(cors({
	origin: config.CLIENT_URL,
	credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
	return res.status(200).json({ message: 'Nova Auth API is running' });
});

app.get('/api/health', (req, res) => {
	return res.status(200).json({ status: 'ok' });
});

app.get('/health', (req, res) => {
	return res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);


module.exports = app;