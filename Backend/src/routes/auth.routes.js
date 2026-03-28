const express = require('express');
const authRouter = express.Router();

// Auth Controller
const authController = require('../controllers/auth.controller');

authRouter.post('/register', authController.register);

authRouter.post('/login', authController.login);

authRouter.post('/logout', authController.logout);

authRouter.post('/logout-all', authController.logoutAll);

authRouter.get('/refresh-token', authController.refreshToken);


module.exports = authRouter;