const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =========================
// REGISTER
// =========================
router.post("/register", async (req, res) => {
    try {
        const { username, name, email, password } = req.body;

        // CHECK EMPTY
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin"
            });
        }

        // CHECK EMAIL EXIST
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "Email đã tồn tại"
            });
        }

        // CHECK USERNAME EXIST
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                message: "Tên đăng nhập đã tồn tại"
            });
        }

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // CREATE USER
        const newUser = new User({
            username,
            name: name || username,
            email,
            password: hashedPassword,
            role: "user"
        });

        await newUser.save();

        // RESPONSE
        res.status(201).json({
            success: true,
            message: "Đăng ký thành công"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
});

// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body);

        // CHECK EMPTY
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập email và mật khẩu"
            });
        }

        // FIND USER
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Email không tồn tại"
            });
        }

        // CHECK LOCKED
        if (user.isLocked) {
            return res.status(403).json({
                success: false,
                message: "Tài khoản đã bị khóa"
            });
        }

        // CHECK PASSWORD
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Sai mật khẩu"
            });
        }

        // CREATE TOKEN
        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "SECRET_KEY",
            {
                expiresIn: "7d"
            }
        );

        // RESPONSE
        res.json({
            success: true,
            message: "Đăng nhập thành công",
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
});

// =========================
// GET PROFILE
// =========================
router.get("/profile", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                message: "Chưa đăng nhập"
            });
        }

        // VERIFY TOKEN
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");

        // FIND USER
        const user = await User.findById(decoded.id).select("-password");

        res.json(user);

    } catch (err) {
        console.log(err);
        res.status(401).json({
            message: "Token không hợp lệ"
        });
    }
});

// =========================
// CHANGE PASSWORD
// =========================
router.post("/change-password", async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy user"
            });
        }

        // CHECK OLD PASSWORD
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Mật khẩu cũ sai"
            });
        }

        // HASH NEW PASSWORD
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        res.json({
            message: "Đổi mật khẩu thành công"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Lỗi server"
        });
    }
});

module.exports = router;
// =========================
// FORGOT PASSWORD - Gửi token
// =========================
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập email" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Trả về thành công để tránh lộ thông tin email có tồn tại không
            return res.json({ success: true, message: "Nếu email tồn tại, mã xác nhận đã được tạo" });
        }

        // Tạo token 6 chữ số
        const crypto = require("crypto");
        const resetToken = crypto.randomInt(100000, 999999).toString();
        const hashedToken = await bcrypt.hash(resetToken, 10);

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
        await user.save();

        // TODO: Gửi email thật với nodemailer
        // Hiện tại trả về token trong response (chỉ dùng khi dev/test)
        // Trong production, xóa dòng resetToken bên dưới và gửi qua email
        console.log(`🔑 Reset token cho ${email}: ${resetToken}`);

        res.json({
            success: true,
            message: "Mã xác nhận đã được tạo (xem console server). Mã có hiệu lực 15 phút.",
            // ⚠️ XÓA DÒNG NÀY TRONG PRODUCTION - chỉ để test:
            devToken: resetToken
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// =========================
// RESET PASSWORD - Đặt mật khẩu mới
// =========================
router.post("/reset-password", async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
        }

        const user = await User.findOne({ email });
        if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
            return res.status(400).json({ success: false, message: "Yêu cầu không hợp lệ hoặc đã hết hạn" });
        }

        // Kiểm tra hết hạn
        if (user.resetPasswordExpires < new Date()) {
            user.resetPasswordToken = null;
            user.resetPasswordExpires = null;
            await user.save();
            return res.status(400).json({ success: false, message: "Mã xác nhận đã hết hạn. Vui lòng thử lại" });
        }

        // Xác minh token
        const isValid = await bcrypt.compare(token, user.resetPasswordToken);
        if (!isValid) {
            return res.status(400).json({ success: false, message: "Mã xác nhận không đúng" });
        }

        // Đặt mật khẩu mới
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ success: true, message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập" });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});
