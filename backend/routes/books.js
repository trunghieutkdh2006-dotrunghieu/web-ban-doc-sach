const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let destDir = uploadDir;
        if (file.fieldname === "image" || file.fieldname === "images") {
            destDir = path.join(uploadDir, "images");
        } else if (file.fieldname === "samplePdf") {
            destDir = path.join(uploadDir, "pdf");
        }
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        cb(null, destDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const prefix = file.fieldname === "samplePdf" ? "pdf-" : "img-";
        cb(null, prefix + Date.now() + "-" + Math.round(Math.random() * 1e6) + ext);
    }
});

const upload = multer({ storage });

// ==================== PUBLIC ROUTES ====================

// GET ALL
router.get("/", async (req, res) => {
    try {
        const filter = {};
        if (req.query.category) filter.category = String(req.query.category).trim();
        const books = await Book.find(filter);
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET ONE
router.get("/:id", async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Không tìm thấy sách" });
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== ADMIN ROUTES (yêu cầu đăng nhập + quyền admin) ====================

// ADD BOOK (multipart/form-data hoặc JSON)
router.post(
    "/",
    auth, admin,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "samplePdf", maxCount: 1 },
        { name: "images", maxCount: 10 }
    ]),
    async (req, res) => {
        try {
            const { title, author, price, description, category, coverImage, galleryImages, samplePdf, pdfFile } = req.body;

            if (!title || !author || !price) {
                return res.status(400).json({ message: "Thiếu thông tin bắt buộc (title, author, price)" });
            }

            const imageFile = req.files?.image?.[0];
            const sampleFile = req.files?.samplePdf?.[0];
            const imageFiles = req.files?.images || [];

            // Ưu tiên file upload, fallback sang JSON field
            const imageUrl = imageFile ? `/uploads/images/${imageFile.filename}` : (coverImage || "");
            const samplePdfUrl = sampleFile ? `/uploads/pdf/${sampleFile.filename}` : (samplePdf || "");
            const galleryUrls = imageFiles.length > 0
                ? imageFiles.map(f => `/uploads/images/${f.filename}`)
                : (Array.isArray(galleryImages) ? galleryImages : []);

            const newBook = new Book({
                title,
                author,
                price: Number(price),
                description: description || "",
                category: category ? String(category).trim() : "Khác",
                image: imageUrl,
                samplePdf: samplePdfUrl,
                pdfFile: pdfFile || "",
                galleryImages: galleryUrls,
                reviewCount: 0,
                avgRating: 0
            });

            await newBook.save();

            const io = req.app.get("io");
            if (io) io.emit("bookAdded", newBook);

            res.status(201).json({ message: "Thêm sách thành công", book: newBook });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
);

// UPDATE BOOK - ĐÃ SỬA ĐỂ CẬP NHẬT reviewCount VÀ avgRating
router.put(
    "/:id",
    auth, admin,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "samplePdf", maxCount: 1 },
        { name: "images", maxCount: 10 }
    ]),
    async (req, res) => {
        try {
            const updates = {};
            const { title, author, price, description, category, reviewCount, avgRating } = req.body;

            // Cập nhật các trường cơ bản
            if (title !== undefined) updates.title = title;
            if (author !== undefined) updates.author = author;
            if (price !== undefined && price !== "") updates.price = Number(price);
            if (description !== undefined) updates.description = description;
            if (category !== undefined) updates.category = String(category).trim() || "Khác";
            
            // ========== QUAN TRỌNG: THÊM 2 DÒNG NÀY ĐỂ CẬP NHẬT reviewCount VÀ avgRating ==========
            if (reviewCount !== undefined && reviewCount !== "") updates.reviewCount = Number(reviewCount);
            if (avgRating !== undefined && avgRating !== "") updates.avgRating = Number(avgRating);
            // ====================================================================================

            const imageFile = req.files?.image?.[0];
            const sampleFile = req.files?.samplePdf?.[0];
            const imageFiles = req.files?.images || [];

            if (imageFile) {
                updates.image = `/uploads/images/${imageFile.filename}`;
            }
            if (sampleFile) {
                updates.samplePdf = `/uploads/pdf/${sampleFile.filename}`;
            }
            
            // Merge ảnh cũ giữ lại + ảnh mới upload
            const newImageUrls = imageFiles.map(f => `/uploads/images/${f.filename}`);
            let keptImages = [];
            if (req.body.existingGalleryImages !== undefined) {
                try {
                    keptImages = JSON.parse(req.body.existingGalleryImages);
                    if (!Array.isArray(keptImages)) keptImages = [];
                } catch (e) { keptImages = []; }
                updates.galleryImages = [...keptImages, ...newImageUrls];
            } else if (newImageUrls.length > 0) {
                const existingBook = await Book.findById(req.params.id).select("galleryImages");
                const existingImgs = existingBook?.galleryImages || [];
                updates.galleryImages = [...existingImgs, ...newImageUrls];
            }

            const updated = await Book.findByIdAndUpdate(req.params.id, updates, { new: true });
            if (!updated) return res.status(404).json({ message: "Không tìm thấy sách" });
            
            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
);

// DELETE BOOK
router.delete("/:id", auth, admin, async (req, res) => {
    try {
        const deletedBook = await Book.findByIdAndDelete(req.params.id);
        if (!deletedBook) return res.status(404).json({ message: "Không tìm thấy sách" });
        res.json({ message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE ONE GALLERY IMAGE
router.delete("/:id/images", auth, admin, async (req, res) => {
    try {
        const image = req.query.image;
        if (!image) return res.status(400).json({ message: "Thiếu đường dẫn ảnh" });

        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Không tìm thấy sách" });

        book.galleryImages = (book.galleryImages || []).filter(img => img !== image);
        await book.save();

        const filePath = path.join(__dirname, "..", image.replace(/^\/+/, ""));
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.json({ message: "Xóa ảnh thành công", galleryImages: book.galleryImages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPLOAD PDF riêng
router.post("/:id/upload-pdf", auth, admin, upload.single("samplePdf"), async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Không tìm thấy sách" });
        if (!req.file) return res.status(400).json({ message: "Chưa có file PDF" });
        book.samplePdf = `/uploads/pdf/${req.file.filename}`;
        await book.save();
        res.json({ message: "Upload PDF thành công!", samplePdf: book.samplePdf });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== READ BOOK (user đã mua) ====================
router.get("/:id/read", auth, async (req, res) => {
    try {
        const Order = require("../models/Order");
        const bookId = req.params.id;
        const userId = req.user.id;
        const userEmail = req.user.email;

        // Kiểm tra user đã mua sách này chưa
        const order = await Order.findOne({
            $or: [{ userId: userId }, { customerEmail: userEmail }],
            "items.bookId": bookId,
            status: { $in: ["pending", "shipped", "delivered"] }
        });

        if (!order) {
            return res.status(403).json({
                success: false,
                message: "Bạn chưa mua sách này. Vui lòng mua để đọc."
            });
        }

        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: "Không tìm thấy sách" });

        if (!book.pdfFile && !book.samplePdf) {
            return res.status(404).json({ message: "Sách này chưa có file đọc online" });
        }

        res.json({
            success: true,
            pdfUrl: book.pdfFile || book.samplePdf,
            title: book.title,
            author: book.author
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;