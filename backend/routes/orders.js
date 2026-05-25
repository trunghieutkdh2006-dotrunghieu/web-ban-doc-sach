const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// TẠO ĐƠN HÀNG
router.post("/", async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ success: true, message: "Đặt hàng thành công", order: newOrder });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// LẤY TẤT CẢ ĐƠN HÀNG
router.get("/", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ success: true, orders: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// LẤY 1 ĐƠN HÀNG
router.get("/:id", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        res.json({ success: true, order: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// CẬP NHẬT TRẠNG THÁI
router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const validStatus = ["pending", "shipped", "delivered"];
        
        if (!validStatus.includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
        }
        
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status, updatedAt: new Date() }, 
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        }
        
        // ⭐ THÊM ĐOẠN NÀY VÀO ĐÂY ⭐
        const io = req.app.get('socketio');
        if (io) {
            io.emit('orderStatusUpdated', {
                orderId: order._id,
                status: order.status
            });
            console.log(`📡 Đã gửi thông báo realtime cho đơn hàng ${order._id}`);
        }
        
        res.json({ success: true, message: "Cập nhật thành công", order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// CẬP NHẬT ĐƠN HÀNG
router.patch("/:id", async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

        res.json({ success: true, message: "Cập nhật thành công", order: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// XÓA ĐƠN HÀNG
router.delete("/:id", async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
        res.json({ success: true, message: "Đã xóa đơn hàng" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// ==================== LẤY ĐƠN HÀNG THEO EMAIL ====================
router.get("/email/:email", async (req, res) => {
    try {
        const email = req.params.email;
        const orders = await Order.find({ 
            customerEmail: email 
        }).sort({ createdAt: -1 });
        
        res.json({ 
            success: true, 
            orders: orders 
        });
    } catch (err) {
        console.error("Lỗi lấy đơn hàng theo email:", err);
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
});

module.exports = router;