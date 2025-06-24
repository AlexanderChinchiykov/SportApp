import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { 
  isAuthenticated, 
  logoutUser, 
  getCurrentUser, 
  clearAuthData, 
  saveUserData 
} from './utils/auth';
import { authAPI } from './utils/api';

// Import all components
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import ClubDetails from './components/ClubDetails';
import CreateClub from './components/CreateClub';
import EditClub from './components/EditClub';
import OAuthCallback from './components/OAuthCallback';
import SportsCommunity from './components/SportsCommunity';
import SportsSelectionModal from './components/SportsSelectionModal';

// Development mode flag - set to false to prevent automatic auth clearing
const DEV_AUTO_LOGOUT = false;

// API configuration
const API_CONFIG = {
  baseUrl: 'http://localhost:8000',
  apiPath: '/api/v1'
};

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  const [validated, setValidated] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    const validateAuth = async () => {
      setChecking(true);
      
      // First check using the standard method
      const isLoggedIn = isAuthenticated();
      console.log("Protected route: Initial auth check:", isLoggedIn);
      
      if (!isLoggedIn) {
        console.log("Protected route: Not authenticated, redirecting to login");
        setIsAuth(false);
        setValidated(true);
        setChecking(false);
        return;
      }
      
      // Double-check with the API to make sure our token is valid
      try {
        const { isValid } = await authAPI.validateAuth();
        console.log("Protected route: API validation result:", isValid);
        
        if (!isValid) {
          console.log("Protected route: API validation failed, clearing auth data");
          clearAuthData();
          setIsAuth(false);
        } else {
          console.log("Protected route: Authentication validated successfully");
          setIsAuth(true);
        }
      } catch (error) {
        console.error("Protected route: Error validating auth:", error);
        setIsAuth(false);
      } finally {
        setValidated(true);
        setChecking(false);
      }
    };
    
    validateAuth();
  }, []);
  
  if (checking) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Verifying authentication...</p>
      </div>
    </div>;
  }
  
  if (validated && !isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSportsModal, setShowSportsModal] = useState(false);

  // Check authentication on initial load and whenever auth state might change
  useEffect(() => {
    console.log('App: Checking authentication state on mount');
    
    // For development: clear authentication data if DEV_AUTO_LOGOUT is true
    if (DEV_AUTO_LOGOUT) {
      console.log('[DEV] Auto-clearing authentication data on app start');
      clearAuthData();
    }
    
    // Check auth and update state
    checkAuth();
    
    // Set up an event listener for storage changes (for cross-tab login/logout)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for our custom auth change event
    window.addEventListener('auth-change', checkAuth);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  // Function to handle storage events (for cross-tab login/logout)
  const handleStorageChange = (e) => {
    console.log('App: Storage change detected', e.key);
    if (e.key === 'sports_app_token' || e.key === 'sports_app_user' || 
        e.key === 'token' || e.key === 'userId' || e.key === 'isAuthenticated') {
      checkAuth();
    }
  };

  // Function to check authentication status and set user state
  const checkAuth = () => {
    console.log('App: Checking authentication status');
    setIsLoading(true);
    
    try {
      // Get auth state from localStorage directly to avoid any caching issues
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const isAuthFlag = localStorage.getItem('isAuthenticated');
      
      console.log('App: Direct localStorage check:', {
        hasToken: !!token,
        hasUserId: !!userId,
        isAuthFlag
      });
      
      // Perform the standard authentication check
      const authenticated = isAuthenticated();
      console.log('App: isAuthenticated() returned:', authenticated);
      
      if (authenticated) {
        console.log('App: User is authenticated');
        const userData = getCurrentUser();
        console.log('App: User data retrieved:', userData ? 'present' : 'missing');
        
        if (userData) {
          setUser(userData);
          console.log('App: User state set successfully from stored data');
        } else {
          // If we're authenticated but don't have user data, try to get it from localStorage
          const userId = localStorage.getItem('userId');
          const username = localStorage.getItem('username');
          const isClubOwner = localStorage.getItem('isClubOwner') === 'true';
          const role = localStorage.getItem('role');
          
          if (userId && username) {
            console.log('App: Reconstructed user data from localStorage');
            const reconstructedUser = {
              id: userId,
              username,
              isClubOwner,
              role
            };
            
            // Save the reconstructed user data back to storage
            saveUserData(reconstructedUser);
            
            // Set the user state
            setUser(reconstructedUser);
            console.log('App: User state set from reconstructed data');
          } else {
            console.warn('App: Missing user data despite being authenticated');
            // Don't force logout here, as it might cause a redirect loop
            setUser(null);
          }
        }
      } else {
        console.log('App: Not authenticated, clearing user data');
        setUser(null);
      }
    } catch (error) {
      console.error('App: Error checking authentication:', error);
      setUser(null);
    } finally {
      setAuthChecked(true);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('App: Logging out user');
    logoutUser();
    setUser(null);
    // Create and dispatch a custom event for auth change
    const event = new Event('auth-change');
    window.dispatchEvent(event);
  };

  // If we haven't checked auth yet, show loading
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-gray-900">
        {/* Navigation Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-white">
              Sports<span className="text-blue-500">Community</span>
            </Link>
            <nav className="flex space-x-6">
              <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
                  <Link 
                    to="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowSportsModal(true);
                    }} 
                    className="text-gray-300 hover:text-white"
                  >
                    Community
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="text-gray-300 hover:text-white bg-transparent border-0 font-inherit text-inherit cursor-pointer p-0"
                    style={{ fontFamily: 'inherit', fontSize: 'inherit' }}
                  >
                    Logout
                    {user?.username && <span className="ml-1 text-xs">({user.username})</span>}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
                  <Link to="/register" className="text-gray-300 hover:text-white">Register</Link>
                </>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={
              user ? <Navigate to="/dashboard" replace /> : <LoginPage onLoginSuccess={checkAuth} />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/dashboard" replace /> : <RegisterPage onRegisterSuccess={checkAuth} />
            } />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/clubs/:id" element={<ClubDetails />} />
            <Route path="/create-club" element={
              <ProtectedRoute>
                <CreateClub />
              </ProtectedRoute>
            } />
            <Route path="/clubs/:id/edit" element={
              <ProtectedRoute>
                <EditClub />
              </ProtectedRoute>
            } />
            <Route path="/community" element={
              <ProtectedRoute>
                <SportsCommunity />
              </ProtectedRoute>
            } />
            <Route path="/community/:sportId" element={
              <ProtectedRoute>
                <SportsCommunity />
              </ProtectedRoute>
            } />
            {/* Catch-all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 border-t border-gray-700 py-4 text-center text-gray-400">
          <div className="container mx-auto">
            <p>© {new Date().getFullYear()} Sports Community. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Sports Selection Modal */}
      <SportsSelectionModal 
        isOpen={showSportsModal} 
        onClose={() => setShowSportsModal(false)} 
      />
    </BrowserRouter>
  );
};

export default App; 