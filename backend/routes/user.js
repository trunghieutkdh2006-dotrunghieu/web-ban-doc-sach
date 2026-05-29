const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

// GET all users
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

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

// ✅ PUT update user (THÊM ROUTE NÀY)
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
// ==================== ĐỔI MẬT KHẨU ====================
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
        
        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng!' });
        }
        
        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Cập nhật mật khẩu
        user.password = hashedPassword;
        await user.save();
        
        console.log('✅ Đổi mật khẩu thành công cho user:', userId);
        res.json({ message: 'Đổi mật khẩu thành công!' });
        
    } catch (err) {
        console.error('❌ Lỗi đổi mật khẩu:', err);
        res.status(500).json({ message: err.message });
    }
});
// ==================== UPLOAD AVATAR API ====================
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Tạo thư mục uploads/avatars nếu chưa có
const avatarDir = path.join(__dirname, '../uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

// Cấu hình multer cho avatar
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const userId = req.user.id;
        const ext = path.extname(file.originalname);
        cb(null, `avatar_${userId}_${Date.now()}${ext}`);
    }
});

const uploadAvatar = multer({ 
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
        cb(null, allowed.includes(file.mimetype));
    }
});

// API upload avatar
router.post('/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không có file được upload' });
        }
        
        const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
        
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

// API lấy thông tin user (bao gồm avatar)
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

module.exports = router;