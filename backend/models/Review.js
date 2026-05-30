const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// ========== THÊM PHƯƠNG THỨC NÀY ==========
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
// ==========================================
// PUT /api/reviews/:reviewId - Chỉnh sửa đánh giá (có lưu lịch sử)
router.put('/:reviewId', auth, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const reviewId = req.params.reviewId;
        const userId = req.user.id;

        // Kiểm tra dữ liệu
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn số sao từ 1 đến 5' });
        }

        if (!comment || comment.trim().length < 5) {
            return res.status(400).json({ success: false, message: 'Nhận xét phải có ít nhất 5 ký tự' });
        }

        const review = await Review.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
        }
        
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa' });
        }
        
        // ========== LƯU LỊCH SỬ CHỈNH SỬA ==========
        const ReviewHistory = require('../models/ReviewHistory');
        const history = new ReviewHistory({
            reviewId: review._id,
            userId: userId,
            bookId: review.bookId,
            oldRating: review.rating,
            oldComment: review.comment,
            newRating: rating,
            newComment: comment.trim()
        });
        await history.save();
        
        // Cập nhật review
        review.rating = rating;
        review.comment = comment.trim();
        review.updatedAt = new Date();
        await review.save();
        
        // Cập nhật rating trung bình của sách
        const allReviews = await Review.find({ bookId: review.bookId });
        const totalReviews = allReviews.length;
        const avgRating = totalReviews > 0 
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
            : 0;
        
        await Book.findByIdAndUpdate(review.bookId, {
            avgRating: Number(avgRating.toFixed(1)),
            reviewCount: totalReviews
        });
        
        res.json({ success: true, message: 'Đã cập nhật đánh giá thành công' });
        
    } catch (error) {
        console.error('Lỗi update review:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
module.exports = mongoose.model('Review', ReviewSchema);