const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
    bookId: { type: String },
    title: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number, required: true },
    image: { type: String }
});

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    address: { type: String, default: "" },
    shippingAddress: { type: String, default: "" },
    userId: { type: String },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: "cod" },
    status: { 
        type: String, 
        enum: ["pending", "shipped", "delivered", "Đã hủy"],
        default: "pending" 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", OrderSchema);