const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Tạo thư mục con
const imagesDir = 'uploads/images/';
const pdfDir = 'uploads/pdf/';
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

// Cấu hình cho ảnh
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'img-' + uniqueSuffix + ext);
    }
});

// Cấu hình cho PDF
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pdfDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'pdf-' + uniqueSuffix + ext);
    }
});

// Filter cho ảnh
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)'), false);
    }
};

// Filter cho PDF
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file PDF'), false);
    }
};

// Tạo các middleware
const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB cho ảnh
});

const uploadPdf = multer({
    storage: pdfStorage,
    fileFilter: pdfFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB cho PDF
});

module.exports = { uploadImage, uploadPdf };