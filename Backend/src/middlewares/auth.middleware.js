const jwt = require('jsonwebtoken');
const config = require('../config/config');

function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const [, token] = authHeader.split(' ');

        if (!token) {
            return res.status(401).json({ message: 'Access token is required' });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role,
            sessionId: decoded.sessionId,
        };

        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired access token' });
    }
}

module.exports = { requireAuth };
