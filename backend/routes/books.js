const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// ============================================================
// CẤU HÌNH CLOUDINARY
// ============================================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============================================================
// STORAGE: ẢNH → Cloudinary folder bookstore/images
// ============================================================
const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
        folder: "bookstore/images",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [{ quality: "auto", fetch_format: "auto" }],
        public_id: "img-" + Date.now() + "-" + Math.round(Math.random() * 1e6),
    }),
});

// ============================================================
// STORAGE: PDF → Cloudinary folder bookstore/pdfs (resource_type: raw)
// ============================================================
const pdfStorage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
        folder: "bookstore/pdfs",
        resource_type: "raw",
        public_id: "pdf-" + Date.now() + "-" + Math.round(Math.random() * 1e6),
        format: "pdf",
    }),
});

// ============================================================
// MULTER: xác định storage theo fieldname
// ============================================================
const mixedStorage = multer.diskStorage({}); // placeholder — không dùng

function getStorage(fieldname) {
    if (fieldname === "samplePdf") return pdfStorage;
    return imageStorage; // image, images
}

// Custom multer với storage động theo fieldname
const upload = multer({
    storage: {
        _handleFile(req, file, cb) {
            const storage = getStorage(file.fieldname);
            storage._handleFile(req, file, cb);
        },
        _removeFile(req, file, cb) {
            const storage = getStorage(file.fieldname);
            storage._removeFile(req, file, cb);
        },
    },
    limits: { fileSize: 50 * 1024 * 1024 },
});

// ============================================================
// HELPER: lấy URL từ file sau khi multer-storage-cloudinary xử lý
// ============================================================
function getUrl(file) {
    // multer-storage-cloudinary đặt URL vào file.path hoặc file.secure_url hoặc file.url
    return file.secure_url || file.path || file.url || "";
}

// ============================================================
// PUBLIC ROUTES
// ============================================================

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

// ============================================================
// ADMIN ROUTES
// ============================================================

// ADD BOOK
router.post(
    "/",
    auth, admin,
    upload.fields([
        { name: "image",     maxCount: 1  },
        { name: "samplePdf", maxCount: 1  },
        { name: "images",    maxCount: 10 },
    ]),
    async (req, res) => {
        try {
            const { title, author, price, description, category, coverImage, galleryImages, samplePdf, pdfFile } = req.body;

            if (!title || !author || !price) {
                return res.status(400).json({ message: "Thiếu thông tin bắt buộc (title, author, price)" });
            }

            const imageFile  = req.files?.image?.[0];
            const sampleFile = req.files?.samplePdf?.[0];
            const imageFiles = req.files?.images || [];

            const imageUrl   = imageFile  ? getUrl(imageFile)  : (coverImage || "");
            const samplePdfUrl = sampleFile ? getUrl(sampleFile) : (samplePdf || "");
            const galleryUrls  = imageFiles.length > 0
                ? imageFiles.map(f => getUrl(f))
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
                avgRating: 0,
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

// UPDATE BOOK
router.put(
    "/:id",
    auth, admin,
    upload.fields([
        { name: "image",     maxCount: 1  },
        { name: "samplePdf", maxCount: 1  },
        { name: "images",    maxCount: 10 },
    ]),
    async (req, res) => {
        try {
            const updates = {};
            const { title, author, price, description, category, reviewCount, avgRating } = req.body;

            if (title       !== undefined) updates.title       = title;
            if (author      !== undefined) updates.author      = author;
            if (price       !== undefined && price !== "")       updates.price       = Number(price);
            if (description !== undefined) updates.description = description;
            if (category    !== undefined) updates.category    = String(category).trim() || "Khác";
            if (reviewCount !== undefined && reviewCount !== "") updates.reviewCount = Number(reviewCount);
            if (avgRating   !== undefined && avgRating   !== "") updates.avgRating   = Number(avgRating);

            const imageFile  = req.files?.image?.[0];
            const sampleFile = req.files?.samplePdf?.[0];
            const imageFiles = req.files?.images || [];

            if (imageFile)  updates.image     = getUrl(imageFile);
            if (sampleFile) updates.samplePdf = getUrl(sampleFile);

            // Xử lý gallery
            const newImageUrls = imageFiles.map(f => getUrl(f));
            let keptImages = [];

            if (req.body.existingImages !== undefined) {
                try {
                    keptImages = JSON.parse(req.body.existingImages);
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

        // Xóa trên Cloudinary nếu là URL Cloudinary
        if (image.includes("cloudinary.com")) {
            try {
                // Lấy public_id từ URL
                const parts = image.split("/");
                const filenameWithExt = parts[parts.length - 1];
                const filename = filenameWithExt.split(".")[0];
                const folderIndex = parts.indexOf("bookstore");
                const publicId = folderIndex >= 0
                    ? "bookstore/" + parts[folderIndex + 1] + "/" + filename
                    : filename;
                await cloudinary.uploader.destroy(publicId);
            } catch (e) {
                console.error("Lỗi xóa Cloudinary:", e.message);
            }
        }

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
        book.samplePdf = getUrl(req.file);
        await book.save();
        res.json({ message: "Upload PDF thành công!", samplePdf: book.samplePdf });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// READ BOOK (user đã mua)
router.get("/:id/read", auth, async (req, res) => {
    try {
        const Order = require("../models/Order");
        const bookId    = req.params.id;
        const userId    = req.user.id;
        const userEmail = req.user.email;

        const order = await Order.findOne({
            $or: [{ userId }, { customerEmail: userEmail }],
            "items.bookId": bookId,
            status: { $in: ["pending", "shipped", "delivered"] },
        });

        if (!order) {
            return res.status(403).json({
                success: false,
                message: "Bạn chưa mua sách này. Vui lòng mua để đọc.",
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
            title:  book.title,
            author: book.author,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;