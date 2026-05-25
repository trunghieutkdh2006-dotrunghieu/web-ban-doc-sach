const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    try {
        console.log('MongoDB URI:', process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore');
        
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore');
        console.log('✅ Connected to MongoDB');
        
        // Kiểm tra collection users
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
        
        // Đếm users
        const usersCount = await db.collection('users').countDocuments();
        console.log('Users count in DB:', usersCount);
        
        const users = await db.collection('users').find().toArray();
        console.log('Users:', users.map(u => ({ username: u.username, email: u.email })));
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testConnection();