// Import necessary modules (assuming these are in separate files)
import * as AuthAPI from './auth-api.js';
import * as RestaurantAPI from './restaurant-api.js';
import * as DonationAPI from './donation-api.js';
import * as L from 'leaflet'; // Import Leaflet library

// Get references to DOM elements
const appState = {
  currentUser: null,
  currentPage: 'home',
  token: localStorage.getItem('token')
};

// Check for existing session
document.addEventListener('DOMContentLoaded', async () => {
  // Setup navigation
  setupNavigation();
  
  // Setup form handlers
  setupForms();
  
  // Initialize map
  initializeMap();
  
  // Load food listings
  loadFoodListings();
  
  // Check if user is already logged in
  if (appState.token) {
    try {
      const { user } = await AuthAPI.getProfile(appState.token);
      appState.currentUser = user;
      updateUIForLoggedInUser();
    } catch (error) {
      // Token expired or invalid, clear it
      localStorage.removeItem('token');
      appState.token = null;
    }
  }
});

function setupNavigation() {
  // Page Navigation
  const navLinks = document.querySelectorAll('nav a, .cta-buttons .btn, .footer-section a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = e.target.getAttribute('data-page');
      navigateToPage(targetPage);
    });
  });
}

function navigateToPage(pageName) {
  // Hide all pages
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));

  // Show selected page
  const targetPage = document.getElementById(`${pageName}-page`);
  if (targetPage) {
    targetPage.classList.add('active');
    appState.currentPage = pageName;
    
    // Special handling for certain pages
    if (pageName === 'map') {
      refreshMap();
    } else if (pageName === 'recipients') {
      loadFoodListings();
    }
  }
}

function setupForms() {
  // Restaurant Registration
  const restaurantRegForm = document.getElementById('restaurant-registration-form');
  restaurantRegForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!appState.token) {
      alert('Please login first');
      navigateToPage('login');
      return;
    }
    
    try {
      const formData = new FormData(e.target);
      const restaurantData = {
        name: formData.get('restaurant-name'),
        email: formData.get('contact-email'),
        address: formData.get('address'),
        phone: formData.get('contact-number')
      };
      
      await RestaurantAPI.registerRestaurant(restaurantData, appState.token);
      alert('Restaurant registered successfully!');
      e.target.reset();
    } catch (error) {
      alert(`Registration failed: ${error.message}`);
    }
  });

  // Food Donation Form
  const foodDonationForm = document.getElementById('food-donation-form');
  foodDonationForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!appState.token) {
      alert('Please login first');
      navigateToPage('login');
      return;
    }
    
    try {
      const formData = new FormData(e.target);
      const donationData = {
        category: formData.get('food-category'),
        description: formData.get('food-description'),
        quantity: formData.get('quantity'),
        pickupTime: formData.get('pickup-time')
      };
      
      await DonationAPI.createDonation(donationData, appState.token);
      alert('Food donation posted successfully!');
      e.target.reset();
    } catch (error) {
      alert(`Donation submission failed: ${error.message}`);
    }
  });

  // Login Form
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData(e.target);
      const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
      };
      
      const { token, user } = await AuthAPI.login(loginData);
      
      // Save token and user info
      localStorage.setItem('token', token);
      appState.token = token;
      appState.currentUser = user;
      
      alert('Login successful!');
      updateUIForLoggedInUser();
      navigateToPage('home');
    } catch (error) {
      alert(`Login failed: ${error.message}`);
    }
  });

  // Registration Form
  const registerForm = document.getElementById('register-form');
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData(e.target);
      const userData = {
        name: formData.get('full-name'),
        email: formData.get('email'),
        password: formData.get('password'),
        userType: formData.get('user-type')
      };
      
      await AuthAPI.register(userData);
      alert('Registration successful! Please login.');
      navigateToPage('login');
    } catch (error) {
      alert(`Registration failed: ${error.message}`);
    }
  });

  // Search Food Form
  const searchBtn = document.getElementById('search-food-btn');
  searchBtn?.addEventListener('click', async () => {
    const location = document.getElementById('location-search').value;
    const foodType = document.getElementById('food-type-filter').value;
    
    // Search for nearby donations if location provided
    if (location) {
      try {
        // Use browser geolocation or geocoding service to get coordinates
        getLocationCoordinates(location)
          .then(coords => {
            loadNearbyDonations(coords.lat, coords.lng, foodType);
          })
          .catch(error => {
            console.error('Error getting coordinates:', error);
            // Fallback to regular search
            loadFoodListings(foodType);
          });
      } catch (error) {
        console.error('Location search error:', error);
        loadFoodListings(foodType);
      }
    } else {
      // Just filter by food type
      loadFoodListings(foodType);
    }
  });
}

async function loadFoodListings(foodType = '') {
  const foodListings = document.getElementById('food-listings');
  if (!foodListings) return;
  
  foodListings.innerHTML = '<p>Loading available food donations...</p>';
  
  try {
    const filters = {};
    if (foodType) {
      filters.category = foodType;
    }
    
    // Always show available food only
    filters.isAvailable = true;
    
    const { donations } = await DonationAPI.getDonations(filters);
    
    if (donations.length === 0) {
      foodListings.innerHTML = '<p>No food donations available. Please check back later.</p>';
      return;
    }
    
    foodListings.innerHTML = '';
    
    donations.forEach(donation => {
      const listingCard = document.createElement('div');
      listingCard.classList.add('food-card');
      listingCard.innerHTML = `
        <h3>${donation.category} Food</h3>
        <p>${donation.description}</p>
        <p>Quantity: ${donation.quantity} servings</p>
        <p>Pickup Time: ${new Date(donation.pickupTime).toLocaleString()}</p>
        <p>Location: ${donation.restaurant.address}</p>
      `;
      foodListings.appendChild(listingCard);
    });
  } catch (error) {
    console.error('Error loading food listings:', error);
    foodListings.innerHTML = '<p>Error loading donations. Please try again.</p>';
  }
}

async function loadNearbyDonations(lat, lng, foodType = '') {
  const foodListings = document.getElementById('food-listings');
  if (!foodListings) return;
  
  foodListings.innerHTML = '<p>Searching for nearby donations...</p>';
  
  try {
    const { donations } = await DonationAPI.getNearbyDonations(lat, lng, 10);
    
    if (donations.length === 0) {
      foodListings.innerHTML = '<p>No nearby donations found within 10km.</p>';
      return;
    }
    
    // Filter by food type if specified
    const filteredDonations = foodType 
      ? donations.filter(d => d.category === foodType)
      : donations;
    
    if (filteredDonations.length === 0) {
      foodListings.innerHTML = `<p>No ${foodType} food donations found nearby.</p>`;
      return;
    }
    
    foodListings.innerHTML = '';
    
    filteredDonations.forEach(donation => {
      const listingCard = document.createElement('div');
      listingCard.classList.add('food-card');
      listingCard.innerHTML = `
        <h3>${donation.category} Food</h3>
        <p>${donation.description}</p>
        <p>Quantity: ${donation.quantity} servings</p>
        <p>Pickup Time: ${new Date(donation.pickupTime).toLocaleString()}</p>
        <p>Location: ${donation.restaurant.address}</p>
      `;
      foodListings.appendChild(listingCard);
    });
  } catch (error) {
    console.error('Error loading nearby donations:', error);
    foodListings.innerHTML = '<p>Error searching for nearby donations.</p>';
  }
}

// Helper function to get coordinates from location string
async function getLocationCoordinates(locationString) {
  // This would typically use a geocoding service like Google Maps Geocoding API
  // For this example, we'll use a mock function
  return new Promise((resolve, reject) => {
    // Mock coordinates (this would be replaced with actual geocoding)
    setTimeout(() => {
      // NYC coordinates as example
      resolve({ lat: 40.7128, lng: -74.0060 });
    }, 500);
  });
}

function initializeMap() {
  const mapElement = document.getElementById('food-map');
  if (!mapElement) return;
  
  // Initialize the map
  const map = L.map('food-map').setView([0, 0], 2);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  // Store map reference for later use
  window.foodMap = map;
  
  // Load initial donation locations
  refreshMap();
  
  // Try to get user's location to center the map
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 13);
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Default view if geolocation fails
        map.setView([0, 0], 2);
      }
    );
  }
}

async function refreshMap() {
  if (!window.foodMap) return;
  
  try {
    // Clear existing markers
    window.foodMap.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        window.foodMap.removeLayer(layer);
      }
    });
    
    // Base tile layer should remain
    if (!window.foodMap.hasLayer(L.tileLayer)) {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(window.foodMap);
    }
    
    // Get all available donations
    const { donations } = await DonationAPI.getDonations({ isAvailable: true });
    
    // Add markers for each donation location
    donations.forEach(donation => {
      if (donation.restaurant && donation.restaurant.location) {
        const { coordinates } = donation.restaurant.location;
        if (coordinates && coordinates.length === 2) {
          const marker = L.marker([coordinates[1], coordinates[0]]).addTo(window.foodMap);
          marker.bindPopup(`
            <b>${donation.restaurant.name}</b><br>
            Food: ${donation.category} - ${donation.description}<br>
            Quantity: ${donation.quantity} servings<br>
            Pickup: ${new Date(donation.pickupTime).toLocaleString()}
          `);
        }
      }
    });
  } catch (error) {
    console.error('Error refreshing map:', error);
  }
}

function updateUIForLoggedInUser() {
  // Update navigation based on user type
  const userType = appState.currentUser.userType;
  
  // Show/hide appropriate elements based on user type
  if (userType === 'restaurant') {
    // Show restaurant-specific elements
    const restaurantElements = document.querySelectorAll('.restaurant-only');
    restaurantElements.forEach(el => el.style.display = 'block');
    
    // Hide recipient-specific elements
    const recipientElements = document.querySelectorAll('.recipient-only');
    recipientElements.forEach(el => el.style.display = 'none');
  } else {
    // Hide restaurant-specific elements
    const restaurantElements = document.querySelectorAll('.restaurant-only');
    restaurantElements.forEach(el => el.style.display = 'none');
    
    // Show recipient-specific elements
    const recipientElements = document.querySelectorAll('.recipient-only');
    recipientElements.forEach(el => el.style.display = 'block');
  }
  
  // Update login/logout button
  const loginLink = document.querySelector('nav a[data-page="login"]');
  if (loginLink) {
    loginLink.textContent = 'Logout';
    loginLink.setAttribute('data-page', 'logout');
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    }, { once: true });
  }
}

function logout() {
  // Clear token and user data
  localStorage.removeItem('token');
  appState.token = null;
  appState.currentUser = null;
  
  // Reset UI
  const loginLink = document.querySelector('nav a[data-page="logout"]');
  if (loginLink) {
    loginLink.textContent = 'Login/Register';
    loginLink.setAttribute('data-page', 'login');
  }
  
  alert('You have been logged out');
  navigateToPage('home');
}
