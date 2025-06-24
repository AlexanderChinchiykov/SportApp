import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { isAuthenticated, handleAuthResponse } from '../utils/auth';

const RegisterPage = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    is_club_owner: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      // Remove confirmPassword field as it's not needed for the API
      const { confirmPassword, ...apiData } = formData;
      
      const data = await authAPI.register(apiData);
      
      if (handleAuthResponse(data)) {
        // Call the onRegisterSuccess callback if provided
        if (onRegisterSuccess) {
          onRegisterSuccess();
        }
        
        if (formData.is_club_owner) {
          setSuccess('Registration successful! Redirecting to create your club...');
          setTimeout(() => navigate('/create-club'), 1500);
        } else {
          setSuccess('Registration successful! Redirecting to dashboard...');
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      } else {
        setError('Invalid response from server');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Register error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-blue-500 mb-8">Sports Community Platform</h1>
        <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>
        
        {error && <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-3 rounded mb-4">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">First Name</label>
              <input
                type="text"
                name="first_name"
                className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                value={formData.first_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                value={formData.last_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Email*</label>
            <input
              type="email"
              name="email"
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Username*</label>
            <input
              type="text"
              name="username"
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Password*</label>
            <input
              type="password"
              name="password"
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              minLength="8"
            />
            <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Confirm Password*</label>
            <input
              type="password"
              name="confirmPassword"
              className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              name="is_club_owner"
              id="is_club_owner"
              className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
              checked={formData.is_club_owner}
              onChange={handleChange}
              disabled={loading}
            />
            <label htmlFor="is_club_owner" className="ml-2 text-gray-300">
              Register as a club owner
            </label>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <a href="/login" className="text-blue-400 hover:underline">
                Login
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage; 