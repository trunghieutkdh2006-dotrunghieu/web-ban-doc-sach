const express = require("express");
const router = express.Router(); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
router.post("/register", async (req, res) => { // Đăng ký người dùng mới
    try {
        const { username, name, email, password } = req.body; // Lấy thông tin từ request body

        if (!username || !email || !password) { // Kiểm tra nếu thiếu thông tin bắt buộc
            return res.status(400).json({ // Trả về lỗi nếu thiếu thông tin
                success: false,
                message: "Vui lòng nhập đầy đủ thông tin" // Trả về lỗi nếu thiếu thông tin
            });
        }
        const existingUser = await User.findOne({ email }); // Kiểm tra nếu email đã tồn tại
        if (existingUser) { // Nếu email đã tồn tại, trả về lỗi
            return res.status(400).json({
                success: false, // Trả về lỗi nếu email đã tồn tại
                message: "Email đã tồn tại"
            });
        }
        const existingUsername = await User.findOne({ username }); // Kiểm tra nếu tên đăng nhập đã tồn tại
        if (existingUsername) { 
            return res.status(400).json({
                success: false,
                message: "Tên đăng nhập đã tồn tại" // Trả về lỗi nếu tên đăng nhập đã tồn tại
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10); // Mã hóa mật khẩu trước khi lưu vào database
        const newUser = new User({
            username, // Sử dụng username làm tên hiển thị nếu name không được cung cấp
            name: name || username, // Nếu name không được cung cấp, sử dụng username làm tên hiển thị
            email, // Lưu email của người dùng
            password: hashedPassword, // Lưu mật khẩu đã được mã hóa
            role: "user" // Mặc định role là "user", có thể thay đổi nếu cần thiết
        });

        await newUser.save(); // Lưu người dùng mới vào database
        res.status(201).json({
            success: true,
            message: "Đăng ký thành công"
        });

    } catch (err) { // Xử lý lỗi server
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
});
router.post("/login", async (req, res) => { // Đăng nhập người dùng
    try {
        const { email, password } = req.body; // Lấy thông tin email và mật khẩu từ request body
        console.log(req.body); // Debug: In ra thông tin đăng nhập nhận được từ client
        if (!email || !password) { // Kiểm tra nếu thiếu email hoặc mật khẩu
            return res.status(400).json({ // Trả về lỗi nếu thiếu email hoặc mật khẩu
                success: false,
                message: "Vui lòng nhập email và mật khẩu"
            });
        }
        const user = await User.findOne({ email }); // Tìm người dùng theo email
        if (!user) {
            return res.status(400).json({ // Trả về lỗi nếu email không tồn tại
                success: false,
                message: "Email không tồn tại"
            });
        }
        if (user.isLocked) { // Kiểm tra nếu tài khoản bị khóa
            return res.status(403).json({ // Trả về lỗi nếu tài khoản bị khóa
                success: false,
                message: "Tài khoản đã bị khóa"
            });
        }
        const isMatch = await bcrypt.compare(password, user.password); // So sánh mật khẩu nhập vào với mật khẩu đã lưu trong database
        if (!isMatch) { // Nếu mật khẩu không khớp, trả về lỗi
            return res.status(400).json({ // Trả về lỗi nếu mật khẩu không đúng
                success: false,
                message: "Sai mật khẩu"
            });
        }
        const token = jwt.sign( // Tạo token JWT để xác thực người dùng trong các yêu cầu tiếp theo
            {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "SECRET_KEY", // Sử dụng biến môi trường để lưu trữ secret key, nếu không có thì dùng "SECRET_KEY" mặc định
            {
                expiresIn: "7d"
            }
        );
        res.json({ // Trả về token và thông tin người dùng khi đăng nhập thành công
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

    } catch (err) { // Xử lý lỗi server
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
});
router.get("/profile", async (req, res) => { // Lấy thông tin người dùng dựa trên token JWT
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                message: "Chưa đăng nhập"
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
        const user = await User.findById(decoded.id).select("-password");

        res.json(user);

    } catch (err) {
        console.log(err);
        res.status(401).json({
            message: "Token không hợp lệ"
        });
    }
});
router.post("/change-password", async (req, res) => { // Đổi mật khẩu cho người dùng đã đăng nhập
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
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Vui lòng nhập email" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: true, message: "Nếu email tồn tại, mã xác nhận đã được tạo" });
        }
        const crypto = require("crypto");
        const resetToken = crypto.randomInt(100000, 999999).toString();
        const hashedToken = await bcrypt.hash(resetToken, 10);

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
        await user.save();
        console.log(`🔑 Reset token cho ${email}: ${resetToken}`);

        res.json({
            success: true,
            message: "Mã xác nhận đã được tạo (xem console server). Mã có hiệu lực 15 phút.",
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
