const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const multer = require("multer");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { uploadToCloudinary, cloudinary } = require("../middleware/upload");

const upload = multer({ storage: multer.memoryStorage() });

// Helper: lấy public_id từ Cloudinary URL
function getCloudinaryPublicId(url) {
    if (!url || !url.includes('cloudinary.com')) return null;
    // URL dạng: https://res.cloudinary.com/<cloud>/image/upload/v123456/books/gallery/img-xxx.jpg
    const match = url.match(/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
}



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

// ADD BOOK
router.post("/", auth, admin,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "samplePdf", maxCount: 1 },
        { name: "images", maxCount: 10 }
    ]),
    async (req, res) => {
        try {
            const { title, author, price, description, category, coverImage, galleryImages, samplePdf, pdfFile } = req.body;
            if (!title || !author || !price) {
                return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
            }
            const imageFile = req.files?.image?.[0];
            const sampleFile = req.files?.samplePdf?.[0];
            const imageFiles = req.files?.images || [];

            let imageUrl = coverImage || "";
            if (imageFile) {
                const result = await uploadToCloudinary(imageFile.buffer, 'books');
                imageUrl = result.secure_url;
            }

            let samplePdfUrl = samplePdf || "";
            if (sampleFile) {
                const result = await uploadToCloudinary(sampleFile.buffer, 'books/pdf', 'raw');
                samplePdfUrl = result.secure_url;
            }

            let galleryUrls = Array.isArray(galleryImages) ? galleryImages : [];
            if (imageFiles.length > 0) {
                const uploaded = await Promise.all(
                    imageFiles.map(f => uploadToCloudinary(f.buffer, 'books/gallery'))
                );
                galleryUrls = uploaded.map(r => r.secure_url);
            }

            const newBook = new Book({
                title, author,
                price: Number(price),
                description: description || "",
                category: category ? String(category).trim() : "Khác",
                image: imageUrl,
                samplePdf: samplePdfUrl,
                pdfFile: pdfFile || "",
                galleryImages: galleryUrls
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
router.put("/:id", auth, admin,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "samplePdf", maxCount: 1 },
        { name: "images", maxCount: 10 }
    ]),
    async (req, res) => {
        try {
            const updates = {};
            const { title, author, price, description, category } = req.body;
            if (title !== undefined) updates.title = title;
            if (author !== undefined) updates.author = author;
            if (price !== undefined && price !== "") updates.price = Number(price);
            if (description !== undefined) updates.description = description;
            if (category !== undefined) updates.category = String(category).trim() || "Khác";

            const imageFile = req.files?.image?.[0];
            const sampleFile = req.files?.samplePdf?.[0];
            const imageFiles = req.files?.images || [];

            if (imageFile) {
                // Xóa ảnh bìa cũ khỏi Cloudinary trước khi upload mới
                const existingForImg = await Book.findById(req.params.id).select("image");
                if (existingForImg?.image) {
                    const oldId = getCloudinaryPublicId(existingForImg.image);
                    if (oldId) { try { await cloudinary.uploader.destroy(oldId); } catch(e) {} }
                }
                const result = await uploadToCloudinary(imageFile.buffer, 'books');
                updates.image = result.secure_url;
            }
            if (sampleFile) {
                const result = await uploadToCloudinary(sampleFile.buffer, 'books/pdf', 'raw');
                updates.samplePdf = result.secure_url;
            }

            const newImageUrls = await Promise.all(
                imageFiles.map(f => uploadToCloudinary(f.buffer, 'books/gallery').then(r => r.secure_url))
            );

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

        // Xóa ảnh bìa, gallery, pdf khỏi Cloudinary
        const toDelete = [
            deletedBook.image,
            ...(deletedBook.galleryImages || []),
            deletedBook.samplePdf,
            deletedBook.pdfFile
        ].filter(Boolean);

        await Promise.allSettled(
            toDelete.map(url => {
                const publicId = getCloudinaryPublicId(url);
                if (!publicId) return Promise.resolve();
                const resType = url.includes('/pdf/') ? 'raw' : 'image';
                return cloudinary.uploader.destroy(publicId, { resource_type: resType });
            })
        );

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

        // Xóa ảnh khỏi Cloudinary
        const publicId = getCloudinaryPublicId(image);
        if (publicId) {
            try { await cloudinary.uploader.destroy(publicId); } catch (e) { console.warn("Cloudinary delete warn:", e.message); }
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
        const result = await uploadToCloudinary(req.file.buffer, 'books/pdf', 'raw');
        book.samplePdf = result.secure_url;
        await book.save();
        res.json({ message: "Upload PDF thành công!", samplePdf: book.samplePdf });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// READ BOOK
router.get("/:id/read", auth, async (req, res) => {
    try {
        const Order = require("../models/Order");
        const bookId = req.params.id;
        const userId = req.user.id;
        const userEmail = req.user.email;
        const order = await Order.findOne({
            $or: [{ userId: userId }, { customerEmail: userEmail }],
            "items.bookId": bookId,
            status: { $in: ["pending", "shipped", "delivered"] }
        });
        if (!order) {
            return res.status(403).json({ success: false, message: "Bạn chưa mua sách này." });
        }
        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: "Không tìm thấy sách" });
        if (!book.pdfFile && !book.samplePdf) {
            return res.status(404).json({ message: "Sách này chưa có file đọc online" });
        }
        res.json({ success: true, pdfUrl: book.pdfFile || book.samplePdf, title: book.title, author: book.author });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;