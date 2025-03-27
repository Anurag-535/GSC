const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['vegetarian', 'non-vegetarian', 'vegan', 'bakery']
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  pickupTime: {
    type: Date,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Donation', DonationSchema);
