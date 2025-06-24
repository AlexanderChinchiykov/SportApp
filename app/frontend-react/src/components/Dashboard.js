import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, clubsAPI, reservationsAPI } from '../utils/api';
import { isAuthenticated, getCurrentUser, logoutUser } from '../utils/auth';
import reservationService from '../utils/reservationService';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: ''
  });
  const [profileError, setProfileError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated()) {
      console.log("Dashboard: User not authenticated, redirecting to login");
      navigate('/login', { replace: true });
      return;
    }

    // Try to get cached user data first
    const cachedUser = getCurrentUser();
    if (cachedUser) {
      setUser(cachedUser);
      setProfileData({
        first_name: cachedUser.first_name || '',
        last_name: cachedUser.last_name || '',
        email: cachedUser.email || '',
        username: cachedUser.username || ''
      });
    }

    // Fetch fresh data
    fetchUserData();
  }, [navigate]);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user data
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      setProfileData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        username: userData.username || ''
      });
      
      // Fetch user's clubs (if any)
      try {
        const clubsData = await clubsAPI.getClubsByOwner();
        setClubs(clubsData || []);
      } catch (clubErr) {
        console.error('Error fetching clubs:', clubErr);
        setClubs([]);
      }
      
      // Fetch user's reservations (if any)
      try {
        console.log('Fetching user reservations...');
        const reservationsData = await reservationService.getMyReservations();
        console.log('Reservations data received:', reservationsData);
        setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      } catch (resErr) {
        console.error('Error fetching reservations:', resErr);
        // Don't show an error for missing features, just set empty array
        setReservations([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your profile. Please try again.');
      setLoading(false);
      
      // If unauthorized, redirect to login
      if (err.status === 401) {
        logoutUser();
      }
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleCancelReservation = async (reservationId) => {
    if (!reservationId) return;
    
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        // Show loading state
        setLoading(true);
        
        // Cancel the reservation and get the details
        const cancelled = await reservationService.cancelReservation(reservationId);
        console.log("Reservation cancelled:", cancelled);
        
        // Update the UI immediately without waiting for refetch
        setReservations(prevReservations => 
          prevReservations.filter(res => res.id !== reservationId)
        );
        
        // Show success notification
        setError(null);
        
        // Fetch updated reservations in the background
        fetchUserData();
      } catch (error) {
        console.error('Error canceling reservation:', error);
        setError('Failed to cancel reservation. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateClub = () => {
    console.log("Navigate to create club page");
    try {
      // Check if user is authenticated and is a club owner
      if (!isAuthenticated()) {
        console.error("User is not authenticated");
        navigate('/login');
        return;
      }
      
      if (!user?.is_club_owner) {
        console.error("User is not a club owner");
        // Still navigate, the CreateClub component will handle this case
      }
      
      navigate('/create-club');
    } catch (error) {
      console.error("Error navigating to create club:", error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileLoading(true);
    
    try {
      const updatedUser = await authAPI.updateProfile(profileData);
      setUser(updatedUser);
      setEditMode(false);
      
      // Update the local storage with new user data
      const userData = getCurrentUser();
      if (userData) {
        const updatedUserData = {
          ...userData,
          ...profileData
        };
        localStorage.setItem('sports_app_user', JSON.stringify(updatedUserData));
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-4xl mx-auto bg-red-900/30 border border-red-800 text-red-300 p-4 rounded">
          <p>{error}</p>
          <button 
            onClick={() => fetchUserData()} 
            className="mt-4 bg-red-800 hover:bg-red-700 px-4 py-2 rounded text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        {/* User Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          {editMode ? (
            <form onSubmit={handleProfileSubmit}>
              {profileError && (
                <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded mb-4">
                  {profileError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="first_name" className="block text-gray-300 mb-2">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleProfileChange}
                    className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    disabled={profileLoading}
                  />
                </div>
                
          <div>
                  <label htmlFor="last_name" className="block text-gray-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleProfileChange}
                    className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    disabled={profileLoading}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={true} // Email shouldn't be editable
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="username" className="block text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={true} // Username shouldn't be editable
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                  onClick={() => setEditMode(false)}
                  disabled={profileLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-3xl font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <p className="text-lg font-medium">{user?.username || 'User'}</p>
                <p className="text-gray-400">{user?.email || 'user@example.com'}</p>
                {user?.first_name && user?.last_name && (
                  <p className="text-gray-300">{user.first_name} {user.last_name}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Your Clubs */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Clubs</h2>
            {user?.is_club_owner && (
              <button 
                onClick={handleCreateClub}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
              >
                Create Club
              </button>
            )}
          </div>
          
          {clubs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                {user?.is_club_owner 
                  ? "You haven't created any clubs yet." 
                  : "You haven't joined any clubs yet."}
              </p>
              {user?.is_club_owner ? (
                <button 
                  onClick={handleCreateClub}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
                >
                  Create Your First Club
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/')}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
                >
                  Find Clubs
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-700 text-gray-300">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Club Name</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Your Role</th>
                    <th className="p-3 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map((club) => (
                    <tr key={club.id} className="border-b border-gray-700">
                      <td className="p-3 font-medium">{club.name}</td>
                      <td className="p-3">{club.town || 'N/A'}</td>
                      <td className="p-3">Owner</td>
                      <td className="p-3 flex gap-2">
                        <a 
                          onClick={() => navigate(`/clubs/${club.id}`)} 
                          className="text-blue-400 hover:underline cursor-pointer"
                        >
                          View
                        </a>
                        <a 
                          onClick={() => navigate(`/edit-club/${club.id}`)} 
                          className="text-blue-400 hover:underline ml-3 cursor-pointer"
                        >
                          Edit
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          )}
        </div>
        
        {/* Upcoming Reservations */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Upcoming Reservations</h2>
          
          {reservations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">You don't have any upcoming reservations.</p>
              <button 
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
              >
                Find Courts to Book
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-700 text-gray-300">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Club</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="border-b border-gray-700">
                      <td className="p-3 font-medium">{reservation.club_name}</td>
                      <td className="p-3">{reservation.date}</td>
                      <td className="p-3">{reservation.start_time} - {reservation.end_time}</td>
                      <td className="p-3">{reservation.user_name || user?.username || 'N/A'}</td>
                      <td className="p-3">
                        <span 
                          className={`px-2 py-1 rounded text-xs ${
                            reservation.status === 'confirmed' ? 'bg-green-900/50 text-green-300' : 
                            reservation.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                            reservation.status === 'completed' ? 'bg-blue-900/50 text-blue-300' :
                            'bg-red-900/50 text-red-300'
                          }`}
                        >
                          {reservation.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {reservation.status === 'confirmed' && (
                          <button 
                            onClick={() => handleCancelReservation(reservation.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 