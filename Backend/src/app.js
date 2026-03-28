const express = require('express');

const authRoutes = require('./routes/auth.routes');

const cookieParser = require('cookie-parser');

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);


module.exports = app;