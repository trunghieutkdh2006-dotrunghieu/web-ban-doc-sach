const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Book = require('../models/Book');
const ReviewHistory = require('../models/ReviewHistory');
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
        
        // Cập nhật rating cho sách
        const allReviews = await Review.find({ bookId });
        const totalReviews = allReviews.length;
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
        
        await Book.findByIdAndUpdate(bookId, {
            reviewCount: totalReviews,
            avgRating: avgRating
        });
        
        // Populate user data trước khi trả về
        const populatedReview = await Review.findById(review._id).populate('userId', 'username name email');
        
        res.status(201).json({
            success: true,
            message: 'Đánh giá thành công!',
            review: populatedReview
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
                avgRating: reviews.length > 0 
                    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
                    : 0,
                reviewCount: reviews.length
            }
        });
        
    } catch (error) {
        console.error('Lỗi lấy reviews:', error);
        res.status(500).json({ message: error.message });
    }
});

// ==================== CHỈNH SỬA ĐÁNH GIÁ ====================
router.put('/:reviewId', auth, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const reviewId = req.params.reviewId;
        const userId = req.user.id;

        // Kiểm tra dữ liệu đầu vào
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng chọn số sao từ 1 đến 5' 
            });
        }

        if (!comment || comment.trim().length < 5) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nhận xét phải có ít nhất 5 ký tự' 
            });
        }

        // Tìm review cần sửa
        const review = await Review.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy đánh giá' 
            });
        }
        
        // KIỂM TRA QUYỀN SỞ HỮU
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn không có quyền chỉnh sửa đánh giá này' 
            });
        }
        
        // Lưu giá trị cũ để log
        const oldRating = review.rating;
        const oldComment = review.comment;
        
        // Cập nhật review
        review.rating = rating;
        review.comment = comment.trim();
        review.updatedAt = new Date();
        
        await review.save();
        
        // Lưu lịch sử chỉnh sửa
        await ReviewHistory.create({
            reviewId: review._id,
            userId: userId,
            bookId: review.bookId,
            oldRating: oldRating,
            oldComment: oldComment,
            newRating: rating,
            newComment: comment.trim()
        });

        console.log(`✏️ User ${userId} đã sửa review ${reviewId}: ${oldRating}→${rating}`);
        
        // CẬP NHẬT LẠI ĐIỂM TRUNG BÌNH CỦA SÁCH
        const allReviews = await Review.find({ bookId: review.bookId });
        const totalReviews = allReviews.length;
        const avgRating = totalReviews > 0 
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
            : 0;
        
        await Book.findByIdAndUpdate(review.bookId, {
            avgRating: Number(avgRating.toFixed(1)),
            reviewCount: totalReviews
        });
        
        // Populate user data trước khi trả về
        const populatedReview = await Review.findById(review._id).populate('userId', 'username name email');
        
        // Gửi thông báo realtime qua Socket.IO nếu có
        const io = req.app.get('io');
        if (io) {
            io.emit('reviewUpdated', {
                reviewId: review._id,
                bookId: review.bookId,
                rating: rating,
                comment: comment.trim(),
                updatedAt: review.updatedAt
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Đã cập nhật đánh giá thành công',
            review: populatedReview
        });
        
    } catch (error) {
        console.error('Lỗi update review:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi server: ' + error.message 
        });
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

// ==================== LẤY LỊCH SỬ CHỈNH SỬA ====================
router.get('/:reviewId/history', auth, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        // Kiểm tra review tồn tại và thuộc về user
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
        }

        if (review.userId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Không có quyền xem lịch sử này' });
        }

        const history = await ReviewHistory.find({ reviewId })
            .sort({ editedAt: -1 });

        res.json({ success: true, history });

    } catch (error) {
        console.error('Lỗi lấy lịch sử:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== LIKE / UNLIKE REVIEW ====================
router.post('/:reviewId/like', auth, async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.id;
        
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
        }
        
        // Khởi tạo mảng likedBy nếu chưa có
        if (!review.likedBy) review.likedBy = [];
        if (typeof review.likes !== 'number') review.likes = 0;
        
        // Kiểm tra đã like chưa
        const alreadyLiked = review.likedBy.some(id => id.toString() === userId);
        
        if (alreadyLiked) {
            // Unlike: giảm likes và xóa userId khỏi mảng
            review.likes = Math.max(0, review.likes - 1);
            review.likedBy = review.likedBy.filter(id => id.toString() !== userId);
        } else {
            // Like: tăng likes và thêm userId vào mảng
            review.likes += 1;
            review.likedBy.push(userId);
        }
        
        await review.save();
        
        res.json({ 
            success: true, 
            likes: review.likes,
            liked: !alreadyLiked
        });
        
    } catch (error) {
        console.error('Lỗi like review:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== THÊM BÌNH LUẬN VÀO REVIEW ====================
router.post('/:reviewId/comments', auth, async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.id;
        const { text } = req.body;
        
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung bình luận' });
        }
        
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
        }
        
        // Khởi tạo mảng comments nếu chưa có
        if (!review.comments) review.comments = [];
        
        // Lấy thông tin user
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        const newComment = {
            userId: userId,
            userName: user?.username || 'Người dùng',
            text: text.trim(),
            createdAt: new Date()
        };
        
        review.comments.push(newComment);
        await review.save();
        
        res.status(201).json({ 
            success: true, 
            comment: newComment,
            totalComments: review.comments.length
        });
        
    } catch (error) {
        console.error('Lỗi thêm bình luận:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== LẤY DANH SÁCH BÌNH LUẬN ====================
router.get('/:reviewId/comments', async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        
        const review = await Review.findById(reviewId).select('comments');
        if (!review) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
        }
        
        res.json({ 
            success: true, 
            comments: review.comments || [],
            total: review.comments?.length || 0
        });
        
    } catch (error) {
        console.error('Lỗi lấy bình luận:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== XÓA BÌNH LUẬN ====================
router.delete('/:reviewId/comments/:commentIndex', auth, async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const commentIndex = parseInt(req.params.commentIndex);
        const userId = req.user.id;
        
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
        }
        
        if (!review.comments || commentIndex >= review.comments.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
        }
        
        const comment = review.comments[commentIndex];
        
        // Kiểm tra quyền: chỉ chủ comment hoặc admin mới được xóa
        if (comment.userId.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Không có quyền xóa bình luận này' });
        }
        
        review.comments.splice(commentIndex, 1);
        await review.save();
        
        res.json({ 
            success: true, 
            message: 'Đã xóa bình luận',
            totalComments: review.comments.length
        });
        
    } catch (error) {
        console.error('Lỗi xóa bình luận:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;