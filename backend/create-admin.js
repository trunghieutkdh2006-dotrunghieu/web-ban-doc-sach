const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Chỉ import User model, không import Review
const User = require('./models/User');

async function createAdmin() {
    try {
        // Kết nối MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore');
        console.log('✅ Connected to MongoDB');
        
        // Kiểm tra admin đã tồn tại chưa
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            console.log('⚠️ Admin already exists!');
            console.log('📧 Email: admin@example.com');
            console.log('🔐 Password: admin123');
            await mongoose.disconnect();
            process.exit(0);
        }
        
        // Tạo admin mới
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const admin = new User({
            username: 'admin',
            name: 'Administrator',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin',
            isLocked: false
        });
        
        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@example.com');
        console.log('🔐 Password: admin123');
        
        // Kiểm tra lại
        const checkAdmin = await User.findOne({ email: 'admin@example.com' });
        console.log('📋 Verification:', {
            id: checkAdmin._id,
            username: checkAdmin.username,
            email: checkAdmin.email,
            role: checkAdmin.role
        });
        
        await mongoose.disconnect();
        console.log('✅ Done! You can now login with admin account.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.message.includes('Review')) {
            console.log('\n⚠️ This error is coming from Review model, but we are creating User only.');
            console.log('The User might have been created successfully anyway.');
            console.log('Try logging in with: admin@example.com / admin123');
        }
        await mongoose.disconnect();
        process.exit(1);
    }
}

createAdmin();