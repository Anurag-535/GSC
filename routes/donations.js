const express = require('express');
const { 
  createDonation,
  getDonations,
  getDonationsByRestaurant,
  getNearbyDonations,
  updateDonation,
  deleteDonation
} = require('../controllers/donations');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getDonations)
  .post(protect, authorize('restaurant'), createDonation);

router.get('/nearby', getNearbyDonations);
router.get('/restaurant/:id', getDonationsByRestaurant);

router.route('/:id')
  .put(protect, authorize('restaurant'), updateDonation)
  .delete(protect, authorize('restaurant'), deleteDonation);

module.exports = router;
