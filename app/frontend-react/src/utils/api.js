// api.js - Comprehensive API client for FastAPI backend

import { getToken } from './auth';

// Base API URL - use explicit URL instead of relying on proxy which might not be working
export const API_BASE = 'http://localhost:8000';
export const API_PATH = '/api/v1'; // Keep v1 as it's needed based on the backend

/**
 * Core API request function with automatic token handling
 */
export async function apiRequest(path, { method = 'GET', body, token, headers = {} } = {}) {
  // Get token from auth utility if not provided explicitly
  const authToken = token || getToken();
  
  // Build headers with auth token if available
  const requestHeaders = { 
    'Content-Type': 'application/json',
    ...headers
  };
  
  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  // Build the full URL
  const url = `${API_BASE}${path}`;
  
  try {
    console.log(`Making ${method} request to ${url}`, {
      method,
      headers: { ...requestHeaders, Authorization: authToken ? 'Bearer [HIDDEN]' : undefined },
      bodyPreview: body ? JSON.stringify(body).substring(0, 100) + (JSON.stringify(body).length > 100 ? '...' : '') : undefined
    });
    
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Log response status for debugging
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Get the response text first
    const responseText = await response.text();
    
    // Try to parse it as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log("Response is not JSON:", responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      data = { detail: responseText };
    }
    
    // Log response data for debugging
    console.log("Response data preview:", 
      typeof data === 'object' ? 
        JSON.stringify(data).substring(0, 200) + (JSON.stringify(data).length > 200 ? '...' : '') 
        : data
    );
    
    // Handle API errors
    if (!response.ok) {
      if (response.status === 404) {
        // For 404s, return a standard response instead of throwing
        // This is useful for endpoints that might not exist in development
        if (method === 'GET') {
          console.log("Resource not found but handling gracefully");
          return Array.isArray(data) ? [] : {};
        }
      }
      
      const error = {
        status: response.status,
        data,
        message: data.detail || data.message || `Error ${response.status}: ${response.statusText}`
      };
      
      console.error('API error:', error);
      
      // Special handling for 500 errors to give more details
      if (response.status >= 500) {
        console.error('Server error details:', data);
      }
      
      throw error;
    }
    
    return data;
  } catch (error) {
    // Enhance error with additional info if it's not already our format
    if (!error.status) {
      console.error('API request failed:', error);
      throw {
        status: 0, 
        message: error.message || 'Network error, please check your connection',
        data: {}
      };
    }
    throw error;
  }
}

// Authentication API
export const authAPI = {
  // Direct login implementation using fetch
  login: async (email, password) => {
    console.log(`Attempting login for email: ${email} with direct fetch`);
    try {
      // Show detailed request info for debugging
      const requestData = {
        email,
        password
      };
      
      console.log("Login request data:", { email, passwordLength: password?.length });
      console.log("API endpoint:", `${API_BASE}${API_PATH}/auth/login`);
      
      const response = await fetch(`${API_BASE}${API_PATH}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
      });

      console.log(`Login response status: ${response.status} ${response.statusText}`);
      console.log("Response headers:", 
        Array.from(response.headers.entries())
          .map(([key, value]) => `${key}: ${key.toLowerCase() === 'set-cookie' ? '[COOKIE DATA]' : value}`)
          .join(', ')
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("Error response is not valid JSON:", errorText);
          errorData = { detail: errorText };
        }
        
        console.error("Login error:", errorData);
        throw {
          status: response.status,
          message: errorData.detail || `Error ${response.status}: ${response.statusText}`,
          data: errorData
        };
      }
      
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Response is not valid JSON:", responseText);
        throw {
          status: 500,
          message: "Invalid response format from server",
          data: { detail: responseText }
        };
      }
      
      console.log("Login successful, received data:", { 
        hasToken: !!data.access_token, 
        hasUser: !!data.user,
        userId: data.user?.id,
        username: data.user?.username
      });
      
      return data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },
    
  register: (userData) => 
    apiRequest(`${API_PATH}/auth/register`, {
      method: 'POST',
      body: userData
    }),
    
  getCurrentUser: () => 
    apiRequest(`${API_PATH}/users/me`, {
      method: 'GET'
    }),

  // Method to validate if current authentication is valid
  validateAuth: async () => {
    console.log("Validating current authentication state");
    try {
      // Attempt to get current user info to validate auth
      const userData = await apiRequest(`${API_PATH}/users/me`, { 
        method: 'GET'
      });
      
      console.log("Auth validation successful:", userData);
      return {
        isValid: true,
        userData
      };
    } catch (error) {
      console.error("Auth validation failed:", error);
      return {
        isValid: false,
        error
      };
    }
  },
    
  updateProfile: (userData) => 
    apiRequest(`${API_PATH}/users/me`, {
      method: 'PUT',
      body: userData
    }),
    
  // Google OAuth endpoints
  googleLogin: () => {
    const url = `${API_BASE}${API_PATH}/auth/google/login`;
    console.log(`Redirecting to Google OAuth: ${url}`);
    window.location.href = url;
  },
    
  // This handles the redirect back from Google after authentication
  handleGoogleCallback: async (code) => {
    try {
      console.log('Calling handleGoogleCallback with code:', code);
      const data = await apiRequest(`${API_PATH}/auth/google/token-exchange`, {
        method: 'POST',
        body: { code }
      });
      console.log('Google callback response:', data);
      return data;
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      throw error;
    }
  }
};

// Clubs API
export const clubsAPI = {
  getAllClubs: (filters = {}) => {
    // Convert filters object to URL params
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    return apiRequest(`${API_PATH}/clubs${queryString}`);
  },
  
  getClubById: (clubId) => 
    apiRequest(`${API_PATH}/clubs/${clubId}`),
    
  createClub: (clubData) => {
    console.log("Calling createClub API with data:", clubData);
    // Make sure the URL matches exactly what the backend expects
    return apiRequest(`${API_PATH}/clubs/`, {  // Add trailing slash to match FastAPI endpoint
      method: 'POST',
      body: clubData
    });
  },
    
  updateClub: (clubId, clubData) => {
    console.log(`Updating club ${clubId} with data:`, clubData);
    return apiRequest(`${API_PATH}/clubs/${clubId}`, {
      method: 'PUT',
      body: clubData
    });
  },
    
  deleteClub: (clubId) => 
    apiRequest(`${API_PATH}/clubs/${clubId}`, {
      method: 'DELETE'
    }),
    
  getClubsByOwner: () => 
    apiRequest(`${API_PATH}/clubs/my-clubs`),
  
  removePicture: (clubId, pictureUrl) => 
    apiRequest(`${API_PATH}/clubs/${clubId}/pictures?picture_url=${encodeURIComponent(pictureUrl)}`, {
      method: 'DELETE'
    }),
    
  joinClub: (clubId) => 
    apiRequest(`${API_PATH}/clubs/${clubId}/join`, {
      method: 'POST'
    }),
};

// Reviews and Comments API
export const reviewsAPI = {
  // Get all reviews for a club
  getClubReviews: (clubId) => 
    apiRequest(`${API_PATH}/reviews/club/${clubId}`),
  
  // Create a new review
  createReview: (reviewData) => {
    console.log("Creating review with data:", reviewData);
    return apiRequest(`${API_PATH}/reviews/`, {
      method: 'POST',
      body: reviewData
    });
  },
  
  // Get average rating for a club
  getClubRating: (clubId) =>
    apiRequest(`${API_PATH}/reviews/club/${clubId}/rating`),
  
  // Get all comments for a club
  getClubComments: (clubId) =>
    apiRequest(`${API_PATH}/reviews/club/${clubId}/comments`),
  
  // Create a new comment
  createComment: (commentData) => {
    console.log("Creating comment with data:", commentData);
    return apiRequest(`${API_PATH}/reviews/comments`, {
      method: 'POST',
      body: commentData
    });
  }
};

// Reservations API
export const reservationsAPI = {
  getMyReservations: async () => {
    try {
      return await apiRequest(`${API_PATH}/reservations/my-reservations`);
    } catch (error) {
      console.log('Reservations API might not be implemented yet:', error);
      // Return empty array instead of throwing when endpoint doesn't exist
      if (error.status === 404 || error.status === 405) {
        return [];
      }
      throw error;
    }
  },
    
  createReservation: (reservationData) => {
    console.log("Creating reservation with data:", reservationData);
    return apiRequest(`${API_PATH}/reservations/`, {
      method: 'POST',
      body: reservationData
    });
  },
    
  getAvailableTimeSlots: (clubId, date) => {
    console.log(`Getting available slots for club ${clubId} on date ${date}`);
    return apiRequest(`${API_PATH}/reservations/available-slots/${clubId}?date=${date}`);
  }
};

export default {
  apiRequest,
  auth: authAPI,
  clubs: clubsAPI,
  reservations: reservationsAPI,
  reviews: reviewsAPI
}; 