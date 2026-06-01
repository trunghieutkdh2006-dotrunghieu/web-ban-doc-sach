const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String },
    description: { type: String },
    image: { type: String },
    coverImage: { type: String },
    galleryImages: { type: [String], default: [] },
    samplePdf: { type: String },
    pdfFile: { type: String },
    reviewCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Book", BookSchema);