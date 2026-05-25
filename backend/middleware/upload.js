const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
    cloud_name: 'dk7s3mjq8',
    api_key: '969525826273365',
    api_secret: 'tT6mgLgGwVKAYzEat9I1vkEdfSE'
});

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Chỉ chấp nhận file ảnh'), false);
};

const pdfFilter = (req, file, cb) => {
    file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Chỉ chấp nhận file PDF'), false);
};

const uploadImage = multer({ storage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPdf = multer({ storage, fileFilter: pdfFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const uploadToCloudinary = (buffer, folder, resourceType = 'image') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: resourceType },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        Readable.from(buffer).pipe(stream);
    });
};

module.exports = { uploadImage, uploadPdf, uploadToCloudinary, cloudinary };
