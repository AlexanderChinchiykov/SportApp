import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { reservationsAPI } from '../utils/api';
import { getToken, isAuthenticated } from '../utils/auth';
import reservationService from '../utils/reservationService';

const ReservationModal = ({ club, isOpen, onClose, isLoggedIn, userData }) => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [duration, setDuration] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState(isLoggedIn ? "cash" : "card");
  const [guestName, setGuestName] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Reset form state when opened
  useEffect(() => {
    if (isOpen) {
      // Clear selections when modal is opened
      setSelectedTimeSlot(null);
      setTimeSlots([]);
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setDuration(1);
      setError("");
      setSuccess("");
      
      // Refresh login status
      const authCheck = isAuthenticated();
      if (isLoggedIn !== authCheck) {
        console.log("Authentication state mismatch, refreshing page");
        window.location.reload();
        return;
      }
      
      // Default payment method
      setPaymentMethod(authCheck ? "cash" : "card");
      
      // Initialize booked slots storage if needed
      try {
        if (!sessionStorage.getItem('bookedTimeSlots')) {
          sessionStorage.setItem('bookedTimeSlots', JSON.stringify([]));
          console.log("Initialized booked time slots session storage");
        }
      } catch (error) {
        console.error("Error initializing session storage:", error);
      }
    }
  }, [isOpen, isLoggedIn]);
  
  // Calculate estimated price whenever duration or club changes
  useEffect(() => {
    if (club && duration) {
      setEstimatedPrice(parseFloat(club.hourly_price) * parseFloat(duration));
    }
    
    // When duration changes, we need to update which slots are available
    if (duration && timeSlots.length > 0) {
      updateAvailableSlotsForDuration();
    }
  }, [club, duration, timeSlots.length]);

  // Refetch time slots when date changes
  useEffect(() => {
    if (isOpen && club && date) {
      // Clear the selected time slot when date changes
      setSelectedTimeSlot(null);
      fetchAvailableTimeSlots();
    }
  }, [date, club, isOpen]);
  
  // Add a function to update available slots based on duration
  const updateAvailableSlotsForDuration = () => {
    if (!timeSlots.length) return;
    
    // Make a copy of the original time slots
    const originalSlots = [...timeSlots];
    const durationHours = parseInt(duration);
    
    // Create a new array with updated availability based on the duration
    const updatedSlots = originalSlots.map((slot, index) => {
      // If already unavailable or permanently booked, keep it that way
      if (!slot.is_available || slot.is_permanently_booked) {
        return slot;
      }
      
      // Check if there are enough consecutive available slots after this one
      let hasEnoughSlots = true;
      // We need to check all slots within our duration (except the current one)
      for (let i = 1; i < durationHours; i++) {
        // If we're at the end of available slots or the next slot isn't available, mark as unavailable
        if (index + i >= originalSlots.length || 
            !originalSlots[index + i].is_available || 
            originalSlots[index + i].is_permanently_booked) {
          hasEnoughSlots = false;
          break;
        }
      }
      
      return {
        ...slot,
        is_available: hasEnoughSlots
      };
    });
    
    console.log(`Updated availability for duration ${durationHours} hours:`, 
      updatedSlots.filter(s => s.is_available).map(s => s.start_time));
    
    setTimeSlots(updatedSlots);
  };
  
  const fetchAvailableTimeSlots = async () => {
    setLoading(true);
    setError("");
    setSelectedTimeSlot(null); // Clear selection when fetching new slots
    
    try {
      console.log(`Fetching available slots for club ${club.id} on date ${date}`);
      const data = await reservationService.getAvailableTimeSlots(club.id, date);
      console.log("Available time slots:", data);
      
      // Make a deep copy to avoid reference issues with the array
      if (Array.isArray(data)) {
        // Sort time slots by time for better UI presentation
        const sortedData = [...data].sort((a, b) => {
          // Convert time strings to comparable values (e.g., '14:00' to 1400)
          const timeA = parseInt(a.start_time.replace(':', ''));
          const timeB = parseInt(b.start_time.replace(':', ''));
          return timeA - timeB;
        });
        
        // Apply any slots booked during this session that might not be
        // reflected in the backend response yet
        let bookedSlots = [];
        try {
          // Try to get previously booked slots from sessionStorage
          const savedBookedSlots = sessionStorage.getItem('bookedTimeSlots');
          if (savedBookedSlots) {
            bookedSlots = JSON.parse(savedBookedSlots);
            console.log("Found previously booked slots in session:", bookedSlots);
            
            // Filter slots relevant to this club and date
            const relevantBookedSlots = bookedSlots.filter(slot => 
              slot.clubId === club.id && slot.date === date
            );
            
            if (relevantBookedSlots.length > 0) {
              console.log("Applying booked slots from session to UI:", relevantBookedSlots);
              
              // Mark booked slots as unavailable
              const updatedWithBookedSlots = sortedData.map(slot => {
                // Find if this slot is in our booked slots
                const matchingBookedSlot = relevantBookedSlots.find(
                  bookedSlot => bookedSlot.time === slot.start_time
                );
                
                if (matchingBookedSlot) {
                  // Mark as unavailable, and if permanent, add the permanent flag
                  return { 
                    ...slot, 
                    is_available: false,
                    is_permanently_booked: matchingBookedSlot.permanent || false
                  };
                }
                return slot;
              });
              
              // Now check duration-based availability
              setTimeSlots(updatedWithBookedSlots);
              
              // Need to delay to ensure the state is updated
              setTimeout(() => {
                updateAvailableSlotsForDuration();
              }, 0);
              
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Error reading booked slots from session:", error);
        }
        
        // If no session booked slots or error, just use the sorted data
        setTimeSlots(sortedData);
        
        // Update availability based on duration after state is updated
        setTimeout(() => {
          updateAvailableSlotsForDuration();
        }, 0);
      } else {
        setTimeSlots([]);
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setError(error.message || "An error occurred while fetching available time slots");
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    
    console.log("Reservation form submitted");
    
    // Validation
    if (!selectedTimeSlot) {
      setError("Please select a time slot");
      setSubmitting(false);
      return;
    }
    
    if (!isLoggedIn && !guestName) {
      setError("Please enter your name for the reservation");
      setSubmitting(false);
      return;
    }
    
    if (!isLoggedIn && paymentMethod === "cash") {
      setError("Non-logged in users can only pay by card");
      setSubmitting(false);
      return;
    }
    
    // Re-check if the time slot is still available
    try {
      // Refresh available slots right before submitting
      const updatedSlots = await reservationService.getAvailableTimeSlots(club.id, date);
      
      // Sort the slots and extract start times
      const sortedSlots = [...updatedSlots].sort((a, b) => {
        return parseInt(a.start_time.replace(':', '')) - parseInt(b.start_time.replace(':', ''));
      });
      
      // Get the selected slot and check if it's still available
      const selectedSlotIndex = sortedSlots.findIndex(
        slot => slot.start_time === selectedTimeSlot.start_time
      );
      
      if (selectedSlotIndex === -1 || !sortedSlots[selectedSlotIndex].is_available) {
        setError("This time slot is no longer available. Please select a different time.");
        setSelectedTimeSlot(null);
        setTimeSlots(sortedSlots);
        updateAvailableSlotsForDuration();
        setSubmitting(false);
        return;
      }
      
      // For multi-hour durations, check that we have enough consecutive slots
      const durationHours = parseInt(duration);
      if (durationHours > 1) {
        let hasEnoughSlots = true;
        for (let i = 1; i < durationHours; i++) {
          if (
            selectedSlotIndex + i >= sortedSlots.length || 
            !sortedSlots[selectedSlotIndex + i].is_available
          ) {
            hasEnoughSlots = false;
            break;
          }
        }
        
        if (!hasEnoughSlots) {
          setError(`Not enough available consecutive slots for ${durationHours} hour duration.`);
          setSubmitting(false);
          return;
        }
      }
      
    } catch (error) {
      console.error("Error checking time slot availability:", error);
      // Continue with reservation attempt
    }
    
    // Authentication validation
    if (isLoggedIn) {
      const token = getToken();
      if (!token) {
        setError("Your session has expired. Please log in again.");
        setSubmitting(false);
        return;
      }
      
      // Verify token is still valid with backend
      try {
        const response = await fetch(`http://localhost:8000/api/v1/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.error("Token validation failed:", response.status);
          setError("Your session is invalid. Please log in again.");
          setSubmitting(false);
          localStorage.removeItem('token');
          localStorage.removeItem('isAuthenticated');
          return;
        }
      } catch (error) {
        console.error("Token validation request failed:", error);
        setError("Could not verify your session. Please try again.");
        setSubmitting(false);
        return;
      }
    }
    
    // Prepare reservation data for the backend
    const reservationData = {
      club_id: club.id,
      reservation_time: selectedTimeSlot.start_time, // Send as "HH:MM" format
      date: date, // Send date separately - backend expects this format
      duration: parseFloat(duration),
      payment_method: paymentMethod
    };
    
    // Add guest name for non-logged in users
    if (!isLoggedIn) {
      reservationData.guest_name = guestName;
    }
    
    console.log("Reservation data:", reservationData);
    
    try {
      const data = await reservationService.createReservation(reservationData);
      console.log("Reservation created successfully:", data);
      
      // Save the successfully booked time slot
      const bookedSlot = selectedTimeSlot.start_time;
      
      // Show success message
      setSuccess(`Reservation created successfully for ${bookedSlot} (${duration} hour${duration > 1 ? 's' : ''})!`);
      
      // Permanently mark the reserved slot(s) as unavailable in the current UI
      const updatedSlots = timeSlots.map(slot => {
        // For multi-hour reservations, check all affected slots
        const slotHour = parseInt(slot.start_time.split(':')[0]);
        const startHour = parseInt(selectedTimeSlot.start_time.split(':')[0]);
        
        // Check if this slot is within the reserved time range
        if (slotHour >= startHour && slotHour < startHour + parseInt(duration)) {
          // Mark as permanently unavailable
          return { ...slot, is_available: false, is_permanently_booked: true };
        }
        return slot;
      });
      
      // Update the UI immediately with permanent changes
      setTimeSlots(updatedSlots);
      
      // Reset form fields
      setSelectedTimeSlot(null);
      setDuration(1);
      setPaymentMethod(isLoggedIn ? "cash" : "card");
      setGuestName("");
      
      // Store the booked time slots in session for other components or page refreshes
      try {
        // Get existing booked slots
        let bookedSlots = [];
        const savedBookedSlots = sessionStorage.getItem('bookedTimeSlots');
        if (savedBookedSlots) {
          bookedSlots = JSON.parse(savedBookedSlots);
        }
        
        // Add new booked slots (for multi-hour reservations)
        const startHour = parseInt(selectedTimeSlot.start_time.split(':')[0]);
        for (let i = 0; i < parseInt(duration); i++) {
          const hourToAdd = startHour + i;
          const timeString = `${hourToAdd.toString().padStart(2, '0')}:00`;
          
          bookedSlots.push({
            clubId: club.id,
            date: date,
            time: timeString,
            permanent: true // Mark as permanently booked
          });
        }
        
        // Save to session storage
        sessionStorage.setItem('bookedTimeSlots', JSON.stringify(bookedSlots));
      } catch (error) {
        console.error("Error saving booked slots to session:", error);
      }
      
      // Don't refresh time slots from server, so permanent changes remain
      // This ensures the UI keeps showing booked slots as unavailable
    } catch (error) {
      console.error("Error creating reservation:", error);
      if (error.status === 401) {
        setError("You must be logged in to make a reservation. Please log in and try again.");
      } else if (error.status === 400 && error.message && error.message.includes("time slot is already booked")) {
        setError("This time slot is no longer available. Please select a different time.");
        // Refresh available slots to show updated availability
        fetchAvailableTimeSlots();
      } else {
        setError(error.message || "An error occurred during reservation creation");
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Function to handle date changes
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    // Clear selected time slot when date changes
    setSelectedTimeSlot(null);
    setTimeSlots([]);
    setDate(newDate);
    
    // Keep all permanently booked times in session storage
    // They will be applied when fetchAvailableTimeSlots runs
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md" style={{ maxHeight: "90vh" }}>
        <div className="flex justify-between items-center pb-3 border-b border-gray-700 mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Reserve {club.name}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded-full hover:bg-gray-800 p-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900/50 text-white p-3 rounded mb-4 border border-red-800">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/50 text-white p-3 rounded mb-4 border border-green-800">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="reservation-date" className="block text-sm font-medium text-gray-300 mb-1">
              Date
            </label>
            <input
              id="reservation-date"
              type="date"
              value={date}
              onChange={handleDateChange}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full p-2.5 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Available Time Slots
            </label>
            {loading ? (
              <div className="flex justify-center py-3">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : timeSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mt-1">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={!slot.is_available}
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`py-1.5 px-2 rounded text-center text-sm transition-colors ${
                      selectedTimeSlot === slot
                        ? 'bg-blue-600 text-white'
                        : slot.is_available
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : slot.is_permanently_booked 
                        ? 'bg-red-900/30 text-gray-500 cursor-not-allowed border border-red-900/50' 
                        : 'bg-gray-900 text-gray-500 cursor-not-allowed border border-gray-800'
                    }`}
                  >
                    {slot.start_time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded p-2 text-center">
                <p className="text-gray-400 text-sm">No time slots available for this date</p>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">
              Duration (hours)
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-2.5 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Payment Method
            </label>
            <div className="flex space-x-4 mt-1">
              {isLoggedIn && (
                <label className="inline-flex items-center rounded p-2 bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="text-blue-600"
                  />
                  <span className="ml-2 text-gray-300">Cash</span>
                </label>
              )}
              <label className="inline-flex items-center rounded p-2 bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer">
                <input
                  type="radio"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  className="text-blue-600"
                />
                <span className="ml-2 text-gray-300">Card</span>
              </label>
            </div>
          </div>
          
          {!isLoggedIn && (
            <div className="form-group">
              <label htmlFor="guest-name" className="block text-sm font-medium text-gray-300 mb-1">
                Your Name
              </label>
              <input
                id="guest-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full p-2.5 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your name"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Required for non-logged in users</p>
            </div>
          )}
          
          <div className="mt-3 mb-4">
            <div className="bg-gray-800/70 p-3 rounded border border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Estimated Price:</span>
                <span className="text-xl font-semibold text-blue-400">${estimatedPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Based on {duration} hour{duration !== 1 ? 's' : ''} at ${club.hourly_price}/hour
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-2 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              disabled={submitting || !selectedTimeSlot || (!isLoggedIn && !guestName)}
            >
              {submitting ? 'Reserving...' : 'Reserve'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationModal; 