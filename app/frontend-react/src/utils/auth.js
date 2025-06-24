// Authentication utility functions

// Use absolute URLs like in api.js instead of proxy
const API_BASE = 'http://localhost:8000';
const API_URL = `${API_BASE}/api/v1`;
const TOKEN_KEY = 'sports_app_token';
const USER_DATA_KEY = 'sports_app_user';

// Login function
export const loginUser = async (credentials) => {
  try {
    console.log("Attempting login with credentials:", { email: credentials.email, passwordLength: credentials.password?.length });
    
    // We won't clear auth data here to avoid losing the session
    // clearAuthData();
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials),
      credentials: 'include' // Important for cookies
    });
    
    console.log("Login response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Login error response:", errorData);
      throw new Error(typeof errorData.detail === 'string' 
        ? errorData.detail 
        : JSON.stringify(errorData.detail));
    }
    
    const data = await response.json();
    console.log("Login successful, received data:", { 
      userId: data.user.id, 
      username: data.user.username,
      tokenPresent: !!data.access_token
    });
    
    // Store auth data in localStorage
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem('username', data.user.username);
    localStorage.setItem('isClubOwner', data.user.is_club_owner);
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('isAuthenticated', 'true');
    
    // Also save user data
    saveUserData(data.user);
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register function
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(typeof errorData.detail === 'string' 
        ? errorData.detail 
        : JSON.stringify(errorData.detail));
    }
    
    const data = await response.json();
    
    // Store auth data in localStorage
    localStorage.setItem('userId', data.user.id);
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('username', data.user.username);
    localStorage.setItem('isClubOwner', data.user.is_club_owner);
    localStorage.setItem('role', data.user.role);
    localStorage.setItem('isAuthenticated', 'true');
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Logout function
export const logoutUser = () => {
  try {
    console.log('Logout: Starting logout process');
    
    // Instead of using clearAuthData, manually remove each item
    // This helps avoid potential race conditions or event issues
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('username');
    localStorage.removeItem('isClubOwner');
    localStorage.removeItem('role');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem(USER_DATA_KEY);
    
    console.log('Logout: Auth data cleared');
    
    // Add a small delay before redirecting to ensure changes propagate
    setTimeout(() => {
      console.log('Logout: Redirecting to login page');
      // Use window.location.replace instead of href for a cleaner history
      window.location.replace('/login');
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    // If there's an error, still try to redirect
    window.location.replace('/login');
    return false;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  try {
    const token = getToken();
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    
    if (!token || !isAuth) {
      return false;
    }
    
    // Basic token validation (check if it exists)
    if (!token) {
      console.log('No auth token found');
      return false;
    }
    
    // Ideally we would check token expiry here but we'd need to decode the JWT
    // For now, we'll just check if the token exists
    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Get the current user's auth token
export const getToken = () => {
  try {
    // Try to get from TOKEN_KEY first (more reliable)
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return token;
    }
    
    // Fall back to 'token' key if needed
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Get user information
export const getCurrentUser = () => {
  try {
    // Try to get from stored user data
    const userData = localStorage.getItem(USER_DATA_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    
    // Fall back to individual user fields if needed
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    if (userId && username) {
      return {
        id: userId,
        username: username,
        isClubOwner: localStorage.getItem('isClubOwner') === 'true',
        role: localStorage.getItem('role')
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Save user data
export const saveUserData = (userData) => {
  try {
    if (!userData) {
      console.error('Cannot save empty user data');
      return false;
    }
    
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

// Clear all authentication data
export const clearAuthData = () => {
  try {
    // Remove all auth-related items
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('username');
    localStorage.removeItem('isClubOwner');
    localStorage.removeItem('role');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem(USER_DATA_KEY);
    
    // Trigger auth change event
    const event = new Event('auth-change');
    window.dispatchEvent(event);
    
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

// Validate the current authentication token with the server
export const validateAuthToken = async () => {
  try {
    console.log("Validating authentication token with server");
    const token = getToken();
    
    if (!token) {
      console.log("No token to validate");
      return false;
    }
    
    // Make a request to the backend to validate the token
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      console.log("Token validation successful");
      // Update user data with the latest from the server
      const userData = await response.json();
      saveUserData(userData);
      return true;
    } else {
      console.error("Token validation failed:", response.status);
      // Token is invalid, clear auth data
      clearAuthData();
      return false;
    }
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
};

/**
 * Handle authentication response from login/register
 */
export function handleAuthResponse(data) {
  if (!data) {
    console.error('handleAuthResponse: No data provided');
    return false;
  }
  
  console.log('handleAuthResponse: Processing auth data', { 
    hasToken: !!data.access_token, 
    hasUser: !!data.user 
  });
  
  const { access_token, user } = data;
  
  if (!access_token || !user) {
    console.error('handleAuthResponse: Missing token or user data');
    return false;
  }
  
  try {
    console.log('Starting to save authentication data');
    
    // We'll no longer clear existing auth data to maintain session continuity
    // clearAuthData();

    // Save all auth data
    localStorage.setItem('userId', user.id);
    localStorage.setItem('token', access_token);
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem('username', user.username);
    localStorage.setItem('isClubOwner', user.is_club_owner === true ? 'true' : 'false');
    localStorage.setItem('role', user.role || '');
    localStorage.setItem('isAuthenticated', 'true');
    
    // Save the full user data
    saveUserData(user);
    
    console.log('handleAuthResponse: Authentication data successfully saved');
    console.log('Local storage authentication state:', {
      userId: localStorage.getItem('userId'),
      token: localStorage.getItem('token') ? '[PRESENT]' : '[MISSING]',
      tokenKey: localStorage.getItem(TOKEN_KEY) ? '[PRESENT]' : '[MISSING]',
      username: localStorage.getItem('username'),
      isAuthenticated: localStorage.getItem('isAuthenticated')
    });
    
    // Trigger auth change event
    const event = new Event('auth-change');
    window.dispatchEvent(event);
    
    return true;
  } catch (e) {
    console.error('handleAuthResponse: Error saving auth data', e);
    return false;
  }
}

export default {
  loginUser,
  registerUser,
  logoutUser,
  isAuthenticated,
  getToken,
  getCurrentUser,
  saveUserData,
  clearAuthData,
  validateAuthToken,
  handleAuthResponse
}; 