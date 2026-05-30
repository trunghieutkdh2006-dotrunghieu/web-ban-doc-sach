const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ==================== CẤU HÌNH CLOUDINARY ====================
// Đọc thông tin từ file .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==================== CẤU HÌNH MULTER + CLOUDINARY CHO AVATAR ====================
// Ảnh sẽ được upload thẳng lên Cloudinary, không lưu trên server
const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder: 'avatars',                          // Thư mục trên Cloudinary
            public_id: `avatar_${req.user.id}`,         // Tên file cố định theo userId → tự ghi đè ảnh cũ
            overwrite: true,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }] // Tự crop vuông 300x300
        };
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)'), false);
        }
    }
});

// ==================== CÁC ROUTE CỤ THỂ (ĐẶT TRƯỚC route /:id) ====================

// API lấy thông tin user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }
        res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar || null,
            fullname: user.fullname || '',
            phone: user.phone || '',
            address: user.address || ''
        });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// API upload avatar
// FIX: Lưu URL từ Cloudinary (URL cố định, không bao giờ mất dù restart/redeploy server)
router.post('/avatar', auth, (req, res, next) => {
    // Wrap multer để bắt lỗi (vd: Cloudinary lỗi, file quá lớn, sai định dạng)
    // và trả về JSON thay vì HTML 500
    uploadAvatar.single('avatar')(req, res, (err) => {
        if (err) {
            console.error('Multer/Cloudinary error:', err);
            return res.status(500).json({ success: false, message: err.message || 'Upload thất bại' });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không có file được upload' });
        }

        // Cloudinary trả về URL ảnh đã upload trong req.file.path
        const avatarUrl = req.file.path;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { avatar: avatarUrl },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }

        console.log(`✅ Avatar uploaded for user ${req.user.id}: ${avatarUrl}`);
        res.json({ success: true, avatarUrl });
    } catch (err) {
        console.error('Upload avatar error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST import users
router.post("/import", async (req, res) => {
    try {
        const { users } = req.body;
        if (!Array.isArray(users)) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
        }
        let createdCount = 0;
        const skipped = [];
        for (const userData of users) {
            const { username, email, password, role, isLocked } = userData;
            if (!username || !email) {
                skipped.push({ email, reason: "Thiếu username hoặc email" });
                continue;
            }
            const existing = await User.findOne({ email });
            if (existing) {
                skipped.push({ email, reason: "Email đã tồn tại" });
                continue;
            }
            const hashedPassword = await bcrypt.hash(password || "12345678", 10);
            await User.create({
                username,
                email,
                password: hashedPassword,
                role: role || "user",
                isLocked: isLocked || false
            });
            createdCount++;
        }
        res.json({ message: "Import hoàn tất", createdCount, skipped });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create user
router.post("/", async (req, res) => {
    try {
        const { username, email, password, role, fullName, phone, address } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email đã được sử dụng" });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
        }

        const hashedPassword = await bcrypt.hash(password || "12345678", 10);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: role || "user",
            fullName: fullName || "",
            phone: phone || "",
            address: address || "",
            isLocked: false,
            createdAt: new Date()
        });

        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: "Tạo người dùng thành công",
            user: userResponse
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT update user
router.put("/:id", async (req, res) => {
    try {
        const { username, email, role, fullName, phone, address, password } = req.body;

        const updateData = { username, email, role, fullName, phone, address };

        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        res.json({
            success: true,
            message: "Cập nhật thành công",
            user: updatedUser
        });
    } catch (err) {
        console.error("Lỗi cập nhật user:", err);
        res.status(500).json({ message: err.message });
    }
});

// PATCH change role
router.patch("/:id/role", async (req, res) => {
    try {
        const { role } = req.body;
        if (!["admin", "user"].includes(role)) {
            return res.status(400).json({ message: "Role không hợp lệ" });
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select("-password");
        if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
        res.json({ message: "Cập nhật quyền thành công", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH toggle lock
router.patch("/:id/lock", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
        user.isLocked = !user.isLocked;
        await user.save();
        res.json({ message: user.isLocked ? "Đã khóa" : "Đã mở khóa", isLocked: user.isLocked });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST reset password
router.post("/:id/reset-password", async (req, res) => {
    try {
        const { password } = req.body;
        const hashedPassword = await bcrypt.hash(password || "12345678", 10);
        await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
        res.json({ message: "Đặt lại mật khẩu thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT change password
router.put('/:userId/password', async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword } = req.body;

        console.log('🔐 Đang đổi mật khẩu cho user:', userId);

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu!' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        console.log('✅ Đổi mật khẩu thành công cho user:', userId);
        res.json({ message: 'Đổi mật khẩu thành công!' });

    } catch (err) {
        console.error('❌ Lỗi đổi mật khẩu:', err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE user
router.delete("/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
        res.json({ message: "Xóa thành công" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ==================== ROUTE /:id PHẢI ĐỂ CUỐI CÙNG ====================

// GET single user
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all users
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET avatar của user theo userId
router.get('/:userId/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('avatar username');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }
        res.json({ success: true, avatar: user.avatar || null, username: user.username });
    } catch (err) {
        console.error('Lỗi lấy avatar:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;