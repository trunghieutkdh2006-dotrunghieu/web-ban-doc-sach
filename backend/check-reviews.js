const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Book = require('./models/Book');
const Review = require('./models/Review');
const User = require('./models/User');

async function checkAndFixReviews() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        // 1. Kiểm tra sách
        const books = await Book.find();
        console.log(`📚 Total books: ${books.length}`);
        
        // 2. Kiểm tra reviews
        const allReviews = await Review.find();
        console.log(`⭐ Total reviews in DB: ${allReviews.length}\n`);

        // 3. Hiển thị chi tiết từng review
        if (allReviews.length > 0) {
            console.log('📝 DETAILED REVIEWS:');
            for (const review of allReviews) {
                const book = await Book.findById(review.bookId);
                const user = await User.findById(review.userId);
                console.log(`   - Book: ${book?.title || 'Unknown'}`);
                console.log(`     User: ${user?.username || user?.email || 'Unknown'}`);
                console.log(`     Rating: ${review.rating}/5`);
                console.log(`     Comment: ${review.comment?.substring(0, 50)}...`);
                console.log(`     Created: ${review.createdAt}\n`);
            }
        } else {
            console.log('⚠️ NO REVIEWS FOUND IN DATABASE!');
            console.log('\n👉 You need to create a review first from the frontend.');
        }

        // 4. Kiểm tra Book stats
        console.log('\n📊 BOOK RATING STATS:');
        for (const book of books) {
            const reviewCount = await Review.countDocuments({ bookId: book._id });
            console.log(`   - "${book.title}": ${reviewCount} reviews, avgRating=${book.avgRating || 0}`);
        }

        // 5. Nếu không có review, tạo review mẫu (tùy chọn)
        const adminUser = await User.findOne({ role: 'admin' });
        const anyBook = books[0];
        
        if (allReviews.length === 0 && adminUser && anyBook) {
            console.log('\n🔧 Creating sample review for testing...');
            
            const sampleReview = new Review({
                bookId: anyBook._id,
                userId: adminUser._id,
                rating: 5,
                comment: 'Đây là review mẫu từ admin! Sách rất hay.'
            });
            
            await sampleReview.save();
            await Review.updateBookRating(anyBook._id);
            
            console.log('✅ Sample review created!');
            console.log(`   Book: ${anyBook.title}`);
            console.log(`   User: ${adminUser.username || adminUser.email}`);
            
            // Kiểm tra lại
            const updatedBook = await Book.findById(anyBook._id);
            console.log(`   Updated book: ${updatedBook.reviewCount} reviews, rating=${updatedBook.avgRating}`);
        }

        console.log('\n🎉 Done!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAndFixReviews();