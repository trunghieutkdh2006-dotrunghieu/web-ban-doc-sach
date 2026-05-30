const mongoose = require('mongoose');

const reviewHistorySchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  oldRating: { type: Number, required: true },
  oldComment: { type: String, required: true },
  newRating: { type: Number, required: true },
  newComment: { type: String, required: true },
  editedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReviewHistory', reviewHistorySchema);