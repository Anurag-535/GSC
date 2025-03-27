const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Donation = require('./models/Donation');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Sample data
const users = [
  {
    name: 'Restaurant Owner',
    email: 'restaurant@example.com',
    password: 'password123',
    userType: 'restaurant'
  },
  {
    name: 'NGO Representative',
    email: 'ngo@example.com',
    password: 'password123',
    userType: 'ngo'
  },
  {
    name: 'Individual User',
    email: 'user@example.com',
    password: 'password123',
    userType: 'individual'
  }
];

const restaurants = [
  {
    name: 'Green Kitchen',
    email: 'contact@greenkitchen.com',
    address: '123 Main St, New York, NY',
    phone: '555-123-4567',
    location: {
      type: 'Point',
      coordinates: [-74.0060, 40.7128] // lng, lat for NYC
    }
  },
  {
    name: 'Fresh Bites',
    email: 'info@freshbites.com',
    address: '456 Oak Ave, Los Angeles, CA',
    phone: '555-987-6543',
    location: {
      type: 'Point',
      coordinates: [-118.2437, 34.0522] // lng, lat for LA
    }
  },
  {
    name: 'Urban Plate',
    email: 'hello@urbanplate.com',
    address: '789 Pine St, Chicago, IL',
    phone: '555-456-7890',
    location: {
      type: 'Point',
      coordinates: [-87.6298, 41.8781] // lng, lat for Chicago
    }
  }
];

const donations = [
  {
    category: 'vegetarian',
    description: 'Fresh vegetable pasta',
    quantity: 20,
    pickupTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    isAvailable: true
  },
  {
    category: 'non-vegetarian',
    description: 'Grilled chicken',
    quantity: 15,
    pickupTime: new Date(Date.now() + 36 * 60 * 60 * 1000), // Day after tomorrow
    isAvailable: true
  },
  {
    category: 'bakery',
    description: 'Assorted bread and pastries',
    quantity: 30,
    pickupTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    isAvailable: true
  }
];

// Seed function
async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Donation.deleteMany({});
    
    console.log('Previous data cleared');
    
    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      
      createdUsers.push(user);
    }
    
    console.log(`${createdUsers.length} users created`);
    
    // Create restaurants linked to the restaurant user
    const restaurantOwner = createdUsers.find(user => user.userType === 'restaurant');
    
    const createdRestaurants = [];
    for (const restaurantData of restaurants) {
      const restaurant = await Restaurant.create({
        ...restaurantData,
        user: restaurantOwner._id
      });
      
      createdRestaurants.push(restaurant);
    }
    
    console.log(`${createdRestaurants.length} restaurants created`);
    
    // Create donations linked to restaurants
    const createdDonations = [];
    for (let i = 0; i < donations.length; i++) {
      const restaurant = createdRestaurants[i % createdRestaurants.length];
      
      const donation = await Donation.create({
        ...donations[i],
        restaurant: restaurant._id
      });
      
      createdDonations.push(donation);
    }
    
    console.log(`${createdDonations.length} donations created`);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase();
