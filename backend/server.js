const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// =========================
// SOCKET.IO
// =========================
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["ngrok-skip-browser-warning"]
    },
    transports: ["websocket", "polling"],
    allowUpgrades: true
});

// Gắn io vào app để dùng trong routes
app.set("io", io);

io.on("connection", (socket) => {
    console.log("🔌 Client kết nối:", socket.id);
    socket.on("disconnect", () => {
        console.log("❌ Client ngắt kết nối:", socket.id);
    });
});

// MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// =========================
// ROUTES
// =========================
app.use("/api/books", require("./routes/books"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/review"));
app.use("/api/users", require("./routes/user"));

// =========================
// STATIC FILES
// =========================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

// =========================
// FRONTEND ROUTES
// =========================
app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
        return res.status(404).json({
            success: false,
            message: `API endpoint ${req.path} không tồn tại`
        });
    }
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// =========================
// MONGODB
// =========================
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/httvbooks";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB error:", err));

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
    console.log(`🔌 Socket.IO ready`);
});