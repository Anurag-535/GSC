// Mock Database Simulation
const mockDatabase = {
    users: [],
    restaurants: [],
    donations: []
};

// Application State Management
const AppState = {
    currentUser: null,
    currentPage: 'home'
};

// Navigation Handler
document.addEventListener('DOMContentLoaded', () => {
    // Page Navigation
    const navLinks = document.querySelectorAll('nav a, .cta-buttons .btn, .footer-section a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = e.target.getAttribute('data-page');
            navigateToPage(targetPage);
        });
    });

    // Form Submissions
    setupFormHandlers();

    // Initial Map Initialization
    initializeFoodMap();
});

function navigateToPage(pageName) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // Show selected page
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        AppState.currentPage = pageName;
    }
}

function setupFormHandlers() {
    // Restaurant Registration
    const restaurantRegForm = document.getElementById('restaurant-registration-form');
    restaurantRegForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const restaurantData = {
            name: formData.get('restaurant-name'),
            email: formData.get('contact-email'),
            address: formData.get('address'),
            phone: formData.get('contact-number')
        };
        
        mockDatabase.restaurants.push(restaurantData);
        alert('Restaurant registered successfully!');
        e.target.reset();
    });

    // Food Donation Form
    const foodDonationForm = document.getElementById('food-donation-form');
    foodDonationForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const donationData = {
            category: formData.get('food-category'),
            description: formData.get('food-description'),
            quantity: formData.get('quantity'),
            pickupTime: formData.get('pickup-time')
        };
        
        mockDatabase.donations.push(donationData);
        alert('Food donation posted successfully!');
        updateFoodListings();
        e.target.reset();
    });

    // Login Form
    const loginForm = document.getElementById('login-form');
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };
        
        // Simple mock login (would be more complex in real app)
        const user = mockDatabase.users.find(u => u.email === loginData.email);
        if (user) {
            AppState.currentUser = user;
            alert('Login successful!');
            navigateToPage('home');
        } else {
            alert('Invalid login credentials');
        }
    });

    // Registration Form
    const registerForm = document.getElementById('register-form');
    registerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('full-name'),
            email: formData.get('email'),
            password: formData.get('password'),
            userType: formData.get('user-type')
        };
        
        mockDatabase.users.push(userData);
        alert('Registration successful! Please login.');
        navigateToPage('login');
    });
}

function initializeFoodMap() {
    const mapElement = document.getElementById('food-map');
    if (!mapElement) return;

    const map = L.map('food-map').setView([0, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add mock donation locations
    const mockLocations = [
        { lat: 40.7128, lng: -74.0060, name: 'New York Diner', food: 'Pasta' },
        { lat: 34.0522, lng: -118.2437, name: 'LA Bistro', food: 'Salad' },
        { lat: 41.8781, lng: -87.6298, name: 'Chicago Cafe', food: 'Sandwiches' }
    ];

    mockLocations.forEach(location => {
        const marker = L.marker([location.lat, location.lng]).addTo(map);
        marker.bindPopup(`
            <b>${location.name}</b><br>
            Available Food: ${location.food}
        `);
    });
}

function updateFoodListings() {
    const foodListings = document.getElementById('food-listings');
    if (!foodListings) return;

    foodListings.innerHTML = ''; // Clear existing listings

    mockDatabase.donations.forEach(donation => {
        const listingCard = document.createElement('div');
        listingCard.classList.add('food-card');
        listingCard.innerHTML = `
            <h3>${donation.category} Food</h3>
            <p>${donation.description}</p>
            <p>Quantity: ${donation.quantity} servings</p>
            <p>Pickup Time: ${donation.pickupTime}</p>
        `;
        foodListings.appendChild(listingCard);
    });
}

// Search Food Functionality
document.getElementById('search-food-btn')?.addEventListener('click', () => {
    const location = document.getElementById('location-search').value;
    const foodType = document.getElementById('food-type-filter').value;

    // In a real application, this would filter based on actual location and food type
    updateFoodListings();
});

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    // Populate some mock data
    mockDatabase.donations.push(
        {
            category: 'Vegetarian',
            description: 'Fresh vegetable pasta',
            quantity: 20,
            pickupTime: '2025-03-27T18:00'
        },
        {
            category: 'Non-Vegetarian',
            description: 'Grilled chicken',
            quantity: 15,
            pickupTime: '2025-03-27T19:30'
        }
    );

    // Initial food listings update
    updateFoodListings();
});
