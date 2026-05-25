const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token đã hết hạn, vui lòng đăng nhập lại' });
        }
        res.status(401).json({ message: 'Xác thực thất bại' });
    }
};