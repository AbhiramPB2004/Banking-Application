/**
 * /shared/middleware/authMiddleware.js
 * Centralized JWT verification for all microservices.
 */
const jwt = require('jsonwebtoken');
const responseFormatter = require('../utils/responseFormatter');

const authenticate = (req, res, next) => {
    // 1. Get token from header (Format: Bearer <token>)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json(
            responseFormatter.error("Access denied. No token provided.")
        );
    }

    try {
        // 2. Verify token using your secret key from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key');
        
        // 3. Inject user data into the request object
        // This makes req.user.user_id available in your controllers
        req.user = decoded; 
        
        next(); // Move to the next function (the controller)
    } catch (error) {
        return res.status(403).json(
            responseFormatter.error("Invalid or expired token.")
        );
    }
};

module.exports = authenticate;