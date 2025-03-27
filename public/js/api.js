// Base URL for API
const API_BASE_URL = '/api';

// Utility function to handle API requests
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Something went wrong');
    }

    return responseData;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error.message);
    throw error;
  }
}

// Auth API functions
const AuthAPI = {
  register: (userData) => apiRequest('/auth/register', 'POST', userData),
  login: (credentials) => apiRequest('/auth/login', 'POST', credentials),
  getProfile: (token) => apiRequest('/auth/me', 'GET', null, token)
};

// Restaurant API functions
const RestaurantAPI = {
  registerRestaurant: (restaurantData, token) => 
    apiRequest('/restaurants', 'POST', restaurantData, token),
  getRestaurants: () => apiRequest('/restaurants'),
  getNearbyRestaurants: (lat, lng, distance = 10) => 
    apiRequest(`/restaurants/nearby?lat=${lat}&lng=${lng}&distance=${distance}`),
  getRestaurant: (id) => apiRequest(`/restaurants/${id}`)
};

// Donation API functions
const DonationAPI = {
  createDonation: (donationData, token) => 
    apiRequest('/donations', 'POST', donationData, token),
  getDonations: (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(`/donations?${queryParams}`);
  },
  getNearbyDonations: (lat, lng, distance = 10) => 
    apiRequest(`/donations/nearby?lat=${lat}&lng=${lng}&distance=${distance}`),
  getDonationsByRestaurant: (restaurantId) => 
    apiRequest(`/donations/restaurant/${restaurantId}`),
  updateDonation: (id, donationData, token) => 
    apiRequest(`/donations/${id}`, 'PUT', donationData, token),
  deleteDonation: (id, token) => 
    apiRequest(`/donations/${id}`, 'DELETE', null, token)
};
