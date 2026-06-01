const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: { type: String },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
});
ReviewSchema.statics.updateBookRating = async function(bookId) {
    const result = await this.aggregate([
        { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
        { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    
    const avgRating = result.length > 0 ? result[0].avgRating : 0;
    const reviewCount = result.length > 0 ? result[0].count : 0;
    
    await mongoose.model('Book').findByIdAndUpdate(bookId, {
        avgRating: avgRating,
        reviewCount: reviewCount
    });
};

module.exports = mongoose.model('Review', ReviewSchema);