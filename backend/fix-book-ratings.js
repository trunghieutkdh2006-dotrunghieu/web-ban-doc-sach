const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('./models/Book');
const Review = require('./models/Review');

async function fixBookRatings() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        // Lấy tất cả reviews
        const allReviews = await Review.find();
        console.log(`📝 Total reviews: ${allReviews.length}\n`);

        // Gom reviews theo bookId
        const reviewMap = new Map();
        for (const review of allReviews) {
            const bookIdStr = review.bookId.toString();
            if (!reviewMap.has(bookIdStr)) {
                reviewMap.set(bookIdStr, []);
            }
            reviewMap.get(bookIdStr).push(review.rating);
        }

        // Cập nhật từng sách
        for (const [bookIdStr, ratings] of reviewMap) {
            const reviewCount = ratings.length;
            const avgRating = Math.round((ratings.reduce((a, b) => a + b, 0) / reviewCount) * 10) / 10;
            
            const updated = await Book.findByIdAndUpdate(bookIdStr, {
                avgRating: avgRating,
                reviewCount: reviewCount
            }, { new: true });
            
            console.log(`✅ Updated "${updated?.title}": ${reviewCount} reviews, avgRating=${avgRating}`);
        }

        // Kiểm tra sách không có review
        const allBooks = await Book.find();
        for (const book of allBooks) {
            if (!reviewMap.has(book._id.toString())) {
                console.log(`⏭️  Skipped "${book.title}": no reviews`);
            }
        }

        console.log('\n🎉 Done!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixBookRatings();