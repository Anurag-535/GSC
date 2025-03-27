const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const NodeGeocoder = require('node-geocoder');

// Setup geocoder
const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

// @desc    Register restaurant
// @route   POST /api/restaurants
// @access  Private (restaurant users only)
exports.registerRestaurant = async (req, res) => {
  try {
    const { name, email, address, phone } = req.body;

    // Geocode address
    const [location] = await geocoder.geocode(address);
    
    // Create restaurant
    const restaurant = await Restaurant.create({
      name,
      email,
      address,
      phone,
      user: req.user._id,
      location: {
        type: 'Point',
        coordinates: [location?.longitude || 0, location?.latitude || 0]
      }
    });

    res.status(201).json({
      success: true,
      restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get nearby restaurants
// @route   GET /api/restaurants/nearby
// @access  Public
exports.getNearbyRestaurants = async (req, res) => {
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
    });

    res.status(200).json({
      success: true,
      count: restaurants.length,
      restaurants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.status(200).json({
      success: true,
      restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
