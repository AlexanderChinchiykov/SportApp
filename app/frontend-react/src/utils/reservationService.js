// Reservation service utility functions
import { getToken } from './auth';

// Base API URL - use explicit URLs 
const API_BASE = 'http://localhost:8000';
const API_PATH = `${API_BASE}/api/v1`;

/**
 * Get all reservations for the current user
 * @returns {Promise<Array>} Array of reservation objects
 */
const getMyReservations = async () => {
  try {
    const token = getToken();
    if (!token) {
      console.error('No authentication token available');
      return [];
    }

    const response = await fetch(`${API_PATH}/reservations/my-reservations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      // Remove credentials:include to avoid CORS issues
    });

    if (!response.ok) {
      if (response.status === 404) {
        // API endpoint might not exist yet
        console.log('Reservations endpoint not available');
        return [];
      }
      const errorData = await response.json();
      throw {
        status: response.status,
        message: errorData.detail || `Error ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    console.log('Received reservation data:', data);
    
    // Data should already be formatted correctly from the backend
    // Just return it directly, no need for additional formatting
    return data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
};

/**
 * Get available time slots for a specific club on a specific date
 * @param {number} clubId - Club ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of time slot objects
 */
const getAvailableTimeSlots = async (clubId, date) => {
  try {
    console.log(`Fetching available slots for club ${clubId} on date ${date}`);
    const response = await fetch(`${API_PATH}/reservations/available-slots/${clubId}?date=${date}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
      // Remove credentials:include to avoid CORS issues
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        message: errorData.detail || `Error ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    throw error;
  }
};

/**
 * Create a new reservation
 * @param {Object} reservationData - Reservation data
 * @returns {Promise<Object>} Created reservation object
 */
const createReservation = async (reservationData) => {
  try {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make a copy of the data to send to the server
    // The backend now expects reservation_time as a string (HH:MM) plus a separate date field
    // No need to convert to ISO format - the backend will handle that
    const processedData = { ...reservationData };
    
    console.log("Sending reservation data to server:", processedData);
    
    const response = await fetch(`${API_PATH}/reservations/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(processedData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        message: errorData.detail || `Error ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

/**
 * Cancel an existing reservation
 * @param {number} reservationId - Reservation ID
 * @returns {Promise<Object>} Cancelled reservation details
 */
const cancelReservation = async (reservationId) => {
  try {
    const token = getToken();
    if (!token) {
      throw {
        status: 401,
        message: 'Authentication required to cancel a reservation'
      };
    }

    const response = await fetch(`${API_PATH}/reservations/${reservationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
      // Remove credentials:include to avoid CORS issues
    });

    // Handle both success with content (200) and no content (204) responses
    if (response.status === 204) {
      return { id: reservationId, status: 'cancelled', message: 'Reservation cancelled successfully' };
    } else if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        message: errorData.detail || `Error ${response.status}: ${response.statusText}`
      };
    }

    // Parse the response data if available
    const data = await response.json().catch(() => ({}));
    
    // Remove the cancelled reservation from session storage if it exists
    try {
      const savedBookedSlots = sessionStorage.getItem('bookedTimeSlots');
      if (savedBookedSlots) {
        const bookedSlots = JSON.parse(savedBookedSlots);
        
        // If we have date, club_id, and time information from the response, remove matching slots
        if (data.club_id && data.date && data.start_time) {
          const updatedSlots = bookedSlots.filter(slot => 
            !(slot.clubId === data.club_id && 
              slot.date === data.date && 
              slot.time === data.start_time)
          );
          
          // Update session storage with filtered slots
          sessionStorage.setItem('bookedTimeSlots', JSON.stringify(updatedSlots));
          console.log("Removed cancelled reservation from session storage");
        }
      }
    } catch (error) {
      console.error("Error updating session storage after cancellation:", error);
    }

    return data;
  } catch (error) {
    console.error('Error canceling reservation:', error);
    throw error;
  }
};

// Export default object with all functions
const reservationService = {
  getMyReservations,
  getAvailableTimeSlots,
  createReservation,
  cancelReservation
};

export default reservationService; 