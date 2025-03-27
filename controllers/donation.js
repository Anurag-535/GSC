const Donation = require('../models/Donation');
const Restaurant = require('../models/Restaurant');

// @desc    Create donation
// @route   POST /api/donations
// @access  Private (restaurant users only)
exports.createDonation = async (req, res) => {
  try {
    const { category, description, quantity, pickupTime } = req.body;

    // Find restaurant linked to user
    const restaurant = await Restaurant.findOne({ user: req.user._id });
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found. Please register a restaurant first.'
      });
    }

    // Create donation
    const donation = await Donation.create({
      category,
      description,
      quantity,
      pickupTime,
      restaurant: restaurant._id
    });

    res.status(201).json({
      success: true,
      donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all donations
// @route   GET /api/donations
// @access  Public
exports.getDonations = async (req, res) => {
  try {
    // Add filtering options
    const filter = {};
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.isAvailable) {
      filter.isAvailable = req.query.isAvailable === 'true';
    }

    const donations = await Donation.find(filter)
      .populate('restaurant', 'name address location')
      .sort({ createdAt: -1 });
      
    res.status(200).json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get donations by restaurant ID
// @route   GET /api/donations/restaurant/:id
// @access  Public
exports.getDonationsByRestaurant = async (req, res) => {
  try {
    const donations = await Donation.find({ 
      restaurant: req.params.id,
      isAvailable: true 
    }).sort({ pickupTime: 1 });
    
    res.status(200).json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get donations near location
// @route   GET /api/donations/nearby
// @access  Public
exports.getNearbyDonations = async (req, res) => {
  try {
    const { lat, lng, distance = 10 } = req.query; // Distance in kilometers

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    // Find restaurants within radius
    const restaurants = await Restaurant.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: distance * 1000 // Convert to meters
        }
      }
    }).select('_id');

    // Get restaurant IDs
    const restaurantIds = restaurants.map(restaurant => restaurant._id);

    // Find available donations from nearby restaurants
    const donations = await Donation.find({
      restaurant: { $in: restaurantIds },
      isAvailable: true,
      pickupTime: { $gte: new Date() }
    }).populate('restaurant', 'name address location').sort({ pickupTime: 1 });
    
    res.status(200).json({
      success: true,
      count: donations.length,
      donations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update donation
// @route   PUT /api/donations/:id
// @access  Private (restaurant owners only)
exports.updateDonation = async (req, res) => {
  try {
    let donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Get restaurant linked to this donation
    const restaurant = await Restaurant.findById(donation.restaurant);
    
    // Check if user owns the restaurant
    if (restaurant.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this donation'
      });
    }

    // Update donation
    donation = await Donation.findByIdAndUpdate(
      req.params.id, 
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      donation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete donation
// @route   DELETE /api/donations/:id
// @access  Private (restaurant owners only)
exports.deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Get restaurant linked to this donation
    const restaurant = await Restaurant.findById(donation.restaurant);
    
    // Check if user owns the restaurant
    if (restaurant.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this donation'
      });
    }

    await donation.remove();

    res.status(200).json({
      success: true,
      message: 'Donation removed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
