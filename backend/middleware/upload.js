const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bookstore/images',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        public_id: (req, file) => 'img-' + Date.now() + '-' + Math.round(Math.random() * 1e6),
    },
});
const pdfStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'bookstore/pdfs',
        allowed_formats: ['pdf'],
        resource_type: 'raw',
        public_id: (req, file) => 'pdf-' + Date.now() + '-' + Math.round(Math.random() * 1e6),
    },
});
const imageFilter = (req, file, cb) => {
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    ok.includes(file.mimetype) ? cb(null, true) : cb(new Error('Chỉ chấp nhận file ảnh'), false);
};

const pdfFilter = (req, file, cb) => {
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Chỉ chấp nhận file PDF'), false);
};
const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadPdf = multer({
    storage: pdfStorage,
    fileFilter: pdfFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
});
module.exports = { uploadImage, uploadPdf, cloudinary };