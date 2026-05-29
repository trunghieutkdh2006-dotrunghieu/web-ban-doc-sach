const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: null },
    fullname: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    role: { type: String, default: 'user' },
    isLocked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
