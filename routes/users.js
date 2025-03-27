const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Placeholder for future user-related routes
router.get('/profile', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile route'
  });
});

module.exports = router;
