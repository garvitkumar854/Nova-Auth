const express = require('express');
const authRouter = express.Router();

// Auth Controller
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

authRouter.post('/register', authController.register);

authRouter.post('/login', authController.login);

authRouter.post('/logout', authController.logout);

authRouter.post('/logout-all', authController.logoutAll);

authRouter.post('/verify-email', authController.verifyEmail);

authRouter.post('/refresh-token', authController.refreshToken);

authRouter.get('/me', requireAuth, authController.getMe);

authRouter.patch('/profile/full-name', requireAuth, authController.updateFullName);

authRouter.patch('/profile/username', requireAuth, authController.updateUsername);

authRouter.get('/sessions', requireAuth, authController.getSessions);

authRouter.post('/logout-session', requireAuth, authController.logoutSession);

authRouter.post('/delete-account', requireAuth, authController.deleteAccount);


module.exports = authRouter;
