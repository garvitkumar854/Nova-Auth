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

// Routes
app.use('/api/auth', authRoutes);


module.exports = app;