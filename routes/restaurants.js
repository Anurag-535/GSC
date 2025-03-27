const express = require('express');
const { 
  registerRestaurant,
  getRestaurants,
  getRestaurant,
  getNearbyRestaurants
} = require('../controllers/restaurants');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getRestaurants)
  .post(protect, authorize('restaurant'), registerRestaurant);

router.get('/nearby', getNearbyRestaurants);
router.get('/:id', getRestaurant);

module.exports = router;
