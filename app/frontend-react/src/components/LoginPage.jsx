import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { handleAuthResponse, isAuthenticated, clearAuthData } from '../utils/auth';

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();

  // Check if already authenticated and redirect if needed
  useEffect(() => {
    console.log('LoginPage: Checking if already authenticated');
    
    // Clear any error state when page loads
    setError('');
    
    // If already authenticated, redirect to dashboard
    if (isAuthenticated()) {
      console.log('LoginPage: Already authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Basic form validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }
    
    console.log(`LoginPage: Attempting login for email: ${email}`);
    
    try {
      // Remove any potential conflicting auth tokens
      localStorage.removeItem('token');
      localStorage.removeItem('sports_app_token');
      
      // Use the direct fetch implementation for login
      const data = await authAPI.login(email, password);
      console.log('LoginPage: Login API call successful:', data ? 'Data received' : 'No data');
      
      if (!data) {
        setError('No response from server');
        setLoading(false);
        return;
      }
      
      if (data.access_token && data.user) {
        console.log('LoginPage: Successfully received auth token and user data');
        
        // Directly handle the authentication (skip handleAuthResponse)
        try {
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('sports_app_token', data.access_token);
          localStorage.setItem('username', data.user.username);
          localStorage.setItem('isClubOwner', data.user.is_club_owner === true ? 'true' : 'false');
          localStorage.setItem('role', data.user.role || '');
          localStorage.setItem('isAuthenticated', 'true');
          
          // Save the full user data
          localStorage.setItem('sports_app_user', JSON.stringify(data.user));
          
          console.log('LoginPage: Authentication data directly saved');
          setLoginSuccess(true);
          
          // Call the onLoginSuccess callback if provided
          if (onLoginSuccess) {
            console.log('LoginPage: Calling onLoginSuccess callback');
            onLoginSuccess();
          }
          
          // Verify authentication data is saved before redirecting
          console.log('LoginPage: Auth verification before redirect:', { 
            token: localStorage.getItem('token'),
            isAuthenticated: localStorage.getItem('isAuthenticated')
          });
          
          // Add a small delay before redirecting
          setTimeout(() => {
            console.log('LoginPage: Redirecting to dashboard');
            window.location.replace('/dashboard');
          }, 100);
          
        } catch (saveError) {
          console.error('LoginPage: Error saving auth data', saveError);
          setError('Failed to save authentication data');
        }
      } else {
        console.error('LoginPage: Invalid response from server - missing token or user data');
        console.error('Response data:', data);
        setError('Invalid response from server: missing authentication data');
      }
    } catch (error) {
      console.error('LoginPage: Login failed', error);
      
      if (error.status === 401) {
        setError('Invalid email or password');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('LoginPage: Starting Google OAuth login flow');
    
    // Clear any previous errors and show loading state
    setError('');
    setLoading(true);
    
    try {
      // Direct and simple approach - just redirect to the backend Google login endpoint
      authAPI.googleLogin();
    } catch (err) {
      console.error('LoginPage: Failed to redirect to Google login:', err);
      setError('Could not start Google login process');
      setLoading(false);
    }
  };

  // For demo convenience, set admin credentials
  const fillAdminCredentials = () => {
    setEmail('admin@example.com');
    setPassword('admin123!');
  };

  // If login was successful but navigation hasn't happened yet, show a loading state
  if (loginSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center">
          <h2 className="text-xl font-semibold text-white mb-4">Login Successful!</h2>
          <p className="text-gray-300 mb-4">Redirecting to dashboard...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-blue-500 mb-8">Sports Community Platform</h1>
        <h2 className="text-2xl font-bold text-white mb-6">Login to Your Account</h2>
        
        {error && <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded mb-4">{error}</div>}
        
        <div className="bg-blue-900/30 border border-blue-800 text-blue-300 px-4 py-3 rounded mb-4">
          <p>For testing, you can use the admin account:</p>
          <p>Email: admin@example.com</p>
          <p>Password: admin123!</p>
          <button 
            onClick={fillAdminCredentials}
            className="mt-2 px-3 py-1 bg-blue-700 text-white rounded text-sm"
          >
            Fill Admin Credentials
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full mt-4 flex items-center justify-center bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded transition-colors"
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M12.024 5.747c1.7 0 2.829.729 3.474 1.343l2.662-2.662c-1.564-1.457-3.597-2.351-6.136-2.351-3.802 0-7.043 2.162-8.636 5.324l3.108 2.411c.732-2.187 2.775-3.765 5.528-3.765z"
              ></path>
              <path
                fill="#34A853"
                d="M19.402 12c0-.786-.069-1.292-.216-1.857H12v3.519h4.14c-.089.73-.474 1.839-1.368 2.588l2.976 2.305C18.913 17.205 19.402 14.8 19.402 12z"
              ></path>
              <path
                fill="#FBBC05"
                d="M5.402 14.346c-.173-.52-.272-1.072-.272-1.643 0-.572.099-1.123.272-1.643L2.294 8.649c-.477.945-.75 2.008-.75 3.111 0 1.104.273 2.167.75 3.111l3.108-2.525z"
              ></path>
              <path
                fill="#EA4335"
                d="M12.024 19.43c2.539 0 4.664-.838 6.213-2.286l-2.976-2.305c-.807.544-1.873.951-3.237.951-2.753 0-4.796-1.578-5.528-3.765L3.388 14.43c1.593 3.162 4.834 5 8.636 5z"
              ></path>
            </svg>
            Sign in with Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <a href="/register" className="text-blue-400 hover:underline">
                Register
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 