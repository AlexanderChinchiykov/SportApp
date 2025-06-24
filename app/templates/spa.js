// State management
let currentUser = null;
let currentPage = 'home';
let clubDetails = null;
let clubsList = [];
let activeImageIndex = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    setupNavigation();
    setupEventListeners();
    
    // Load initial page based on URL
    const path = window.location.pathname;
    if (path === '/') {
        showPage('home');
        loadFeaturedClubs();
    } else if (path.startsWith('/clubs/') && path.length > 7) {
        const clubId = path.split('/').pop();
        showPage('club-details');
        loadClubDetails(clubId);
    } else if (path === '/clubs') {
        showPage('clubs');
        loadAllClubs();
    } else if (path === '/login') {
        showPage('login');
    } else if (path === '/register') {
        showPage('register');
    } else if (path === '/dashboard') {
        showPage('dashboard');
        loadDashboard();
    } else if (path === '/create-club') {
        showPage('create-club');
    } else {
        showPage('home');
        loadFeaturedClubs();
    }
});

// Authentication
function checkAuthentication() {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    if (userId && token) {
        currentUser = {
            id: userId,
            token: token,
            username: localStorage.getItem('username'),
            isClubOwner: localStorage.getItem('isClubOwner') === 'true',
            role: localStorage.getItem('role')
        };
        
        updateAuthUI(true);
    } else {
        currentUser = null;
        updateAuthUI(false);
    }
}

function updateAuthUI(isLoggedIn) {
    const authLinks = document.querySelectorAll('.auth-link');
    const loggedInLinks = document.querySelectorAll('.logged-in-link');
    
    if (isLoggedIn) {
        authLinks.forEach(link => link.classList.add('hidden'));
        loggedInLinks.forEach(link => link.classList.remove('hidden'));
    } else {
        authLinks.forEach(link => link.classList.remove('hidden'));
        loggedInLinks.forEach(link => link.classList.add('hidden'));
    }
}

function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isClubOwner');
    localStorage.removeItem('role');
    localStorage.removeItem('clubId');
    
    currentUser = null;
    updateAuthUI(false);
    showPage('home');
    loadFeaturedClubs();
}

// Navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('id') !== 'logout-link') {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                navigateTo(link.getAttribute('href'), page);
            }
        });
    });
    
    // Logout link special handling
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Set up browser history navigation
    window.addEventListener('popstate', (e) => {
        const state = e.state;
        if (state && state.page) {
            showPage(state.page);
            if (state.clubId) {
                loadClubDetails(state.clubId);
            }
        } else {
            showPage('home');
        }
    });
}

function navigateTo(url, page, data = {}) {
    window.history.pushState({ page, ...data }, '', url);
    showPage(page);
    
    // Load page-specific content
    if (page === 'home') {
        loadFeaturedClubs();
    } else if (page === 'clubs') {
        loadAllClubs();
    } else if (page === 'dashboard') {
        loadDashboard();
    } else if (page === 'club-details' && data.clubId) {
        loadClubDetails(data.clubId);
    }
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageId;
        
        // Update active nav link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

// Event Listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        
        // Update role when club owner checkbox changes
        const clubOwnerCheckbox = document.getElementById('register-club-owner');
        if (clubOwnerCheckbox) {
            clubOwnerCheckbox.addEventListener('change', (e) => {
                const roleInputs = document.querySelectorAll('input[name="role"]');
                roleInputs.forEach(input => {
                    input.disabled = e.target.checked;
                });
                
                if (e.target.checked) {
                    // Set role to club_owner
                    roleInputs.forEach(input => {
                        input.checked = input.value === 'club_owner';
                    });
                }
            });
        }
    }
    
    // Create club form
    const createClubForm = document.getElementById('create-club-form');
    if (createClubForm) {
        createClubForm.addEventListener('submit', handleCreateClub);
    }
    
    // Club cards in club list
    document.addEventListener('click', function(e) {
        if (e.target.closest('.club-card')) {
            const clubCard = e.target.closest('.club-card');
            const clubId = clubCard.getAttribute('data-id');
            navigateTo(`/clubs/${clubId}`, 'club-details', { clubId });
        }
    });
    
    // Dashboard buttons
    const viewPublicButton = document.getElementById('view-public-button');
    if (viewPublicButton) {
        viewPublicButton.addEventListener('click', () => {
            const clubId = localStorage.getItem('clubId');
            if (clubId) {
                navigateTo(`/clubs/${clubId}`, 'club-details', { clubId });
            }
        });
    }
    
    // Image gallery navigation
    const prevButton = document.getElementById('prev-image');
    const nextButton = document.getElementById('next-image');
    
    if (prevButton) {
        prevButton.addEventListener('click', showPreviousImage);
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', showNextImage);
    }
}

// Form Handlers
async function handleLogin(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorDiv = document.getElementById('login-error');
    const loginButton = document.getElementById('login-button');
    
    // Basic validation
    if (!emailInput.value || !passwordInput.value) {
        errorDiv.textContent = 'Please fill out all fields';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Disable form and show loading state
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
    errorDiv.classList.add('hidden');
    
    try {
        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value
            }),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Store auth data
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('isClubOwner', data.user.is_club_owner);
            localStorage.setItem('role', data.user.role);
            
            // Update UI
            currentUser = {
                id: data.user.id,
                token: data.access_token,
                username: data.user.username,
                isClubOwner: data.user.is_club_owner,
                role: data.user.role
            };
            
            updateAuthUI(true);
            
            // Redirect
            if (data.redirect) {
                navigateTo(data.redirect, data.redirect.substring(1));
            } else {
                navigateTo('/dashboard', 'dashboard');
            }
        } else {
            const errorData = await response.json();
            errorDiv.textContent = errorData.detail || 'Login failed';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.classList.remove('hidden');
        console.error('Login error:', error);
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('register-email');
    const usernameInput = document.getElementById('register-username');
    const passwordInput = document.getElementById('register-password');
    const firstNameInput = document.getElementById('register-first-name');
    const lastNameInput = document.getElementById('register-last-name');
    const clubOwnerCheckbox = document.getElementById('register-club-owner');
    const errorDiv = document.getElementById('register-error');
    const registerButton = document.getElementById('register-button');
    
    // Get selected role
    let role = 'student';
    const roleInputs = document.querySelectorAll('input[name="role"]');
    roleInputs.forEach(input => {
        if (input.checked) {
            role = input.value;
        }
    });
    
    // Basic validation
    if (!emailInput.value || !usernameInput.value || !passwordInput.value || 
        !firstNameInput.value || !lastNameInput.value) {
        errorDiv.textContent = 'Please fill out all required fields';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Check password length
    if (passwordInput.value.length < 8) {
        errorDiv.textContent = 'Password must be at least 8 characters long';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Disable form and show loading state
    registerButton.disabled = true;
    registerButton.textContent = 'Registering...';
    errorDiv.classList.add('hidden');
    
    try {
        const formData = {
            email: emailInput.value,
            username: usernameInput.value,
            password: passwordInput.value,
            first_name: firstNameInput.value,
            last_name: lastNameInput.value,
            role: clubOwnerCheckbox.checked ? 'club_owner' : role,
            is_club_owner: clubOwnerCheckbox.checked
        };
        
        const response = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Store auth data
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('isClubOwner', data.user.is_club_owner);
            localStorage.setItem('role', data.user.role);
            
            // Update UI
            currentUser = {
                id: data.user.id,
                token: data.access_token,
                username: data.user.username,
                isClubOwner: data.user.is_club_owner,
                role: data.user.role
            };
            
            updateAuthUI(true);
            
            // Redirect
            if (data.redirect) {
                navigateTo(data.redirect, data.redirect.substring(1));
            } else {
                navigateTo('/dashboard', 'dashboard');
            }
        } else {
            const errorData = await response.json();
            errorDiv.textContent = typeof errorData.detail === 'string' 
                ? errorData.detail 
                : JSON.stringify(errorData.detail);
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.classList.remove('hidden');
        console.error('Registration error:', error);
    } finally {
        registerButton.disabled = false;
        registerButton.textContent = 'Register';
    }
}

async function handleCreateClub(e) {
    e.preventDefault();
    
    if (!currentUser) {
        navigateTo('/login', 'login');
        return;
    }
    
    const nameInput = document.getElementById('club-name-input');
    const townInput = document.getElementById('club-town');
    const telephoneInput = document.getElementById('club-telephone-input');
    const priceInput = document.getElementById('club-hourly-price');
    const descriptionInput = document.getElementById('club-description-input');
    const addressInput = document.getElementById('club-address-input');
    const websiteInput = document.getElementById('club-website-input');
    const socialMediaInput = document.getElementById('club-social-media');
    const errorDiv = document.getElementById('create-club-error');
    const createButton = document.getElementById('create-club-button');
    
    // Basic validation
    if (!nameInput.value || !townInput.value || !telephoneInput.value || !priceInput.value) {
        errorDiv.textContent = 'Please fill out all required fields';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Validate price is a number
    const price = parseFloat(priceInput.value);
    if (isNaN(price) || price <= 0) {
        errorDiv.textContent = 'Hourly price must be a positive number';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Disable form and show loading state
    createButton.disabled = true;
    createButton.textContent = 'Creating...';
    errorDiv.classList.add('hidden');
    
    try {
        const clubData = {
            name: nameInput.value,
            town: townInput.value,
            telephone: telephoneInput.value,
            hourly_price: price,
            description: descriptionInput.value,
            address: addressInput.value,
            website: websiteInput.value,
            social_media: socialMediaInput.value
        };
        
        const response = await fetch('/api/v1/clubs/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(clubData),
            credentials: 'include'
        });
        
        if (response.ok) {
            const club = await response.json();
            localStorage.setItem('clubId', club.id);
            alert('Club created successfully!');
            navigateTo('/dashboard', 'dashboard');
        } else {
            const errorData = await response.json();
            errorDiv.textContent = typeof errorData.detail === 'string'
                ? errorData.detail
                : JSON.stringify(errorData.detail);
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.classList.remove('hidden');
        console.error('Error creating club:', error);
    } finally {
        createButton.disabled = false;
        createButton.textContent = 'Create Club';
    }
}

// Data Loading Functions
async function loadFeaturedClubs() {
    const featuredClubsContainer = document.getElementById('featured-clubs');
    if (!featuredClubsContainer) return;
    
    featuredClubsContainer.innerHTML = '<div class="loading">Loading featured clubs...</div>';
    
    try {
        const response = await fetch('/api/v1/clubs/');
        
        if (response.ok) {
            const clubs = await response.json();
            clubsList = clubs;
            
            if (clubs.length === 0) {
                featuredClubsContainer.innerHTML = '<p>No clubs available at the moment.</p>';
                return;
            }
            
            // Display featured clubs (up to 3)
            const featuredClubs = clubs.slice(0, 3);
            featuredClubsContainer.innerHTML = '';
            
            featuredClubs.forEach(club => {
                const clubCard = createClubCard(club);
                featuredClubsContainer.appendChild(clubCard);
            });
        } else {
            featuredClubsContainer.innerHTML = '<div class="error-message">Failed to load clubs</div>';
        }
    } catch (error) {
        featuredClubsContainer.innerHTML = '<div class="error-message">An error occurred while loading clubs</div>';
        console.error('Error loading featured clubs:', error);
    }
}

async function loadAllClubs() {
    const clubsContainer = document.getElementById('clubs-list');
    const loadingDiv = document.getElementById('clubs-loading');
    const errorDiv = document.getElementById('clubs-error');
    
    if (!clubsContainer || !loadingDiv || !errorDiv) return;
    
    loadingDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    clubsContainer.innerHTML = '';
    
    try {
        const response = await fetch('/api/v1/clubs/');
        
        if (response.ok) {
            const clubs = await response.json();
            clubsList = clubs;
            
            loadingDiv.classList.add('hidden');
            
            if (clubs.length === 0) {
                clubsContainer.innerHTML = '<p>No clubs available at the moment.</p>';
                return;
            }
            
            clubs.forEach(club => {
                const clubCard = createClubCard(club);
                clubsContainer.appendChild(clubCard);
            });
        } else {
            loadingDiv.classList.add('hidden');
            errorDiv.textContent = 'Failed to load clubs';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        loadingDiv.classList.add('hidden');
        errorDiv.textContent = 'An error occurred while loading clubs';
        errorDiv.classList.remove('hidden');
        console.error('Error loading clubs:', error);
    }
}

async function loadClubDetails(clubId) {
    const loadingDiv = document.getElementById('club-details-loading');
    const errorDiv = document.getElementById('club-details-error');
    const contentDiv = document.getElementById('club-details-content');
    
    if (!loadingDiv || !errorDiv || !contentDiv) return;
    
    loadingDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    contentDiv.classList.add('hidden');
    
    try {
        let club = clubsList.find(c => c.id == clubId);
        
        if (!club) {
            const response = await fetch(`/api/v1/clubs/${clubId}`);
            
            if (response.ok) {
                club = await response.json();
            } else {
                loadingDiv.classList.add('hidden');
                errorDiv.textContent = 'Could not load club details';
                errorDiv.classList.remove('hidden');
                return;
            }
        }
        
        clubDetails = club;
        
        // Update UI with club details
        document.getElementById('detail-club-name').textContent = club.name;
        
        if (club.pictures && club.pictures.length > 0) {
            document.getElementById('detail-club-image').src = club.pictures[0];
            
            // Setup gallery controls if more than one image
            if (club.pictures.length > 1) {
                document.querySelector('.gallery-controls').classList.remove('hidden');
                document.getElementById('image-counter').textContent = `1 / ${club.pictures.length}`;
                activeImageIndex = 0;
            } else {
                document.querySelector('.gallery-controls').classList.add('hidden');
            }
        } else {
            document.getElementById('detail-club-image').src = 'https://via.placeholder.com/800x400?text=No+Images';
            document.querySelector('.gallery-controls').classList.add('hidden');
        }
        
        document.querySelector('#detail-club-location span').textContent = club.town;
        document.querySelector('#detail-club-telephone span').textContent = club.telephone;
        document.querySelector('#detail-club-price span').textContent = club.hourly_price;
        
        // Optional fields
        if (club.address) {
            document.querySelector('#detail-club-address span').textContent = club.address;
            document.getElementById('detail-club-address').classList.remove('hidden');
        } else {
            document.getElementById('detail-club-address').classList.add('hidden');
        }
        
        if (club.website) {
            const websiteLink = document.querySelector('#detail-club-website a');
            websiteLink.href = club.website;
            websiteLink.textContent = club.website;
            document.getElementById('detail-club-website').classList.remove('hidden');
        } else {
            document.getElementById('detail-club-website').classList.add('hidden');
        }
        
        if (club.social_media) {
            document.querySelector('#detail-club-social span').textContent = club.social_media;
            document.getElementById('detail-club-social').classList.remove('hidden');
        } else {
            document.getElementById('detail-club-social').classList.add('hidden');
        }
        
        if (club.owner_name) {
            document.querySelector('#detail-club-owner span').textContent = club.owner_name;
            document.getElementById('detail-club-owner').classList.remove('hidden');
        } else {
            document.getElementById('detail-club-owner').classList.add('hidden');
        }
        
        if (club.description) {
            document.getElementById('detail-club-description').textContent = club.description;
            document.getElementById('detail-club-description-section').classList.remove('hidden');
        } else {
            document.getElementById('detail-club-description-section').classList.add('hidden');
        }
        
        loadingDiv.classList.add('hidden');
        contentDiv.classList.remove('hidden');
    } catch (error) {
        loadingDiv.classList.add('hidden');
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.classList.remove('hidden');
        console.error('Error loading club details:', error);
    }
}

async function loadDashboard() {
    if (!currentUser) {
        navigateTo('/login', 'login');
        return;
    }
    
    const loadingDiv = document.getElementById('dashboard-loading');
    const errorDiv = document.getElementById('dashboard-error');
    const noClubMessage = document.getElementById('no-club-message');
    const clubDashboard = document.getElementById('club-dashboard');
    
    if (!loadingDiv || !errorDiv || !noClubMessage || !clubDashboard) return;
    
    loadingDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    noClubMessage.classList.add('hidden');
    clubDashboard.classList.add('hidden');
    
    try {
        // First check if we have a club ID in localStorage
        const storedClubId = localStorage.getItem('clubId');
        
        if (storedClubId) {
            // Fetch club details
            const response = await fetch(`/api/v1/clubs/${storedClubId}`, {
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const club = await response.json();
                
                // Update UI with club details
                document.getElementById('club-name').textContent = club.name;
                
                if (club.pictures && club.pictures.length > 0) {
                    document.getElementById('club-image').src = club.pictures[0];
                } else {
                    document.getElementById('club-image').src = 'https://via.placeholder.com/400x300?text=No+Image';
                }
                
                document.querySelector('#club-location span').textContent = club.town;
                document.querySelector('#club-telephone span').textContent = club.telephone;
                document.querySelector('#club-price span').textContent = club.hourly_price;
                
                // Optional fields
                if (club.address) {
                    document.querySelector('#club-address span').textContent = club.address;
                    document.getElementById('club-address').classList.remove('hidden');
                } else {
                    document.getElementById('club-address').classList.add('hidden');
                }
                
                if (club.website) {
                    const websiteLink = document.querySelector('#club-website a');
                    websiteLink.href = club.website;
                    websiteLink.textContent = club.website;
                    document.getElementById('club-website').classList.remove('hidden');
                } else {
                    document.getElementById('club-website').classList.add('hidden');
                }
                
                if (club.description) {
                    document.querySelector('#club-description span').textContent = club.description;
                    document.getElementById('club-description').classList.remove('hidden');
                } else {
                    document.getElementById('club-description').classList.add('hidden');
                }
                
                loadingDiv.classList.add('hidden');
                clubDashboard.classList.remove('hidden');
            } else {
                // Club not found or error, show no club message
                loadingDiv.classList.add('hidden');
                noClubMessage.classList.remove('hidden');
            }
        } else {
            // No club ID in localStorage, try to fetch clubs owned by user
            const response = await fetch(`/api/v1/clubs/owner/${currentUser.id}`, {
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                const clubs = await response.json();
                
                if (clubs.length > 0) {
                    // User has clubs, get details for the first one
                    const clubId = clubs[0].id;
                    localStorage.setItem('clubId', clubId);
                    
                    // Reload dashboard with the club ID
                    loadDashboard();
                } else {
                    // User has no clubs
                    loadingDiv.classList.add('hidden');
                    noClubMessage.classList.remove('hidden');
                }
            } else {
                // Error fetching clubs
                loadingDiv.classList.add('hidden');
                errorDiv.textContent = 'Could not load your clubs';
                errorDiv.classList.remove('hidden');
            }
        }
    } catch (error) {
        loadingDiv.classList.add('hidden');
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.classList.remove('hidden');
        console.error('Error loading dashboard:', error);
    }
}

// Helper Functions
function createClubCard(club) {
    const clubCard = document.createElement('div');
    clubCard.className = 'club-card';
    clubCard.setAttribute('data-id', club.id);
    
    let imageUrl = 'https://via.placeholder.com/300x200?text=No+Image';
    if (club.pictures && club.pictures.length > 0) {
        imageUrl = club.pictures[0];
    }
    
    let description = '';
    if (club.description) {
        description = club.description.length > 100
            ? `${club.description.substring(0, 100)}...`
            : club.description;
    }
    
    clubCard.innerHTML = `
        <img src="${imageUrl}" alt="${club.name}">
        <div class="club-card-content">
            <h3>${club.name}</h3>
            <p><strong>Location:</strong> ${club.town}</p>
            <p><strong>Price:</strong> $${club.hourly_price}/hour</p>
            ${description ? `<p>${description}</p>` : ''}
        </div>
    `;
    
    return clubCard;
}

function showNextImage() {
    if (!clubDetails || !clubDetails.pictures || clubDetails.pictures.length <= 1) return;
    
    activeImageIndex = (activeImageIndex + 1) % clubDetails.pictures.length;
    updateGalleryImage();
}

function showPreviousImage() {
    if (!clubDetails || !clubDetails.pictures || clubDetails.pictures.length <= 1) return;
    
    activeImageIndex = (activeImageIndex - 1 + clubDetails.pictures.length) % clubDetails.pictures.length;
    updateGalleryImage();
}

function updateGalleryImage() {
    document.getElementById('detail-club-image').src = clubDetails.pictures[activeImageIndex];
    document.getElementById('image-counter').textContent = `${activeImageIndex + 1} / ${clubDetails.pictures.length}`;
} 