const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String },
    description: { type: String },
    image: { type: String },         // ảnh bìa (upload từ admin FormData field 'image')
    coverImage: { type: String },    // alias cho image (dùng trong JSON POST)
    galleryImages: { type: [String], default: [] },
    samplePdf: { type: String },
    pdfFile: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Book", BookSchema);