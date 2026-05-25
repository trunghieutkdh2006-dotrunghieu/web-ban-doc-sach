const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Book = require('../models/Book');
const auth = require('../middleware/auth');

// ==================== TẠO REVIEW ====================
router.post('/', auth, async (req, res) => {
    try {
        const { bookId, rating, comment } = req.body;
        const userId = req.user.id;
        
        // Kiểm tra sách tồn tại
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Không tìm thấy sách' });
        }
        
        // Kiểm tra đã review chưa
        const existingReview = await Review.findOne({ bookId, userId });
        if (existingReview) {
            return res.status(400).json({ message: 'Bạn đã đánh giá sách này rồi!' });
        }
        
        // Tạo review mới
        const review = new Review({ bookId, userId, rating, comment });
        await review.save();
        
        // ========== CẬP NHẬT RATING CHO SÁCH (THỦ CÔNG) ==========
        const allReviews = await Review.find({ bookId });
        const totalReviews = allReviews.length;
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
        
        await Book.findByIdAndUpdate(bookId, {
            reviewCount: totalReviews,
            avgRating: avgRating
        });
        // ========================================================
        
        res.status(201).json({
            success: true,
            message: 'Đánh giá thành công!',
            review: review
        });
        
    } catch (error) {
        console.error('Lỗi tạo review:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==================== LẤY REVIEW THEO SÁCH ====================
router.get('/book/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        
        const reviews = await Review.find({ bookId })
            .populate('userId', 'username name email')
            .sort({ createdAt: -1 });
        
        const book = await Book.findById(bookId);
        
        res.json({
            success: true,
            count: reviews.length,
            reviews: reviews,
            bookInfo: {
                avgRating: book?.avgRating || 0,
                reviewCount: book?.reviewCount || 0
            }
        });
        
    } catch (error) {
        console.error('Lỗi lấy reviews:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==================== XÓA REVIEW ====================
router.delete('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
        }
        
        // Kiểm tra quyền
        if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không có quyền xóa' });
        }
        
        const bookId = review.bookId;
        await review.deleteOne();
        
        // Cập nhật lại rating
        const allReviews = await Review.find({ bookId });
        const totalReviews = allReviews.length;
        const avgRating = totalReviews > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
        
        await Book.findByIdAndUpdate(bookId, {
            reviewCount: totalReviews,
            avgRating: avgRating
        });
        
        res.json({ success: true, message: 'Đã xóa đánh giá' });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;