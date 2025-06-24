import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include' // Important: Include cookies with the request
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Store auth data in localStorage
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('isClubOwner', data.user.is_club_owner);
        localStorage.setItem('role', data.user.role);
        
        // Call the login handler to update app state
        onLogin(data.user.id);
        
        // Redirect based on the redirect field or default to dashboard
        if (data.redirect) {
          navigate(data.redirect);
        } else {
          navigate('/dashboard');
        }
      } else {
        const errorData = await response.json();
        setError(typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail));
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Login to Your Account</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email}
            onChange={handleChange}
            required 
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            value={formData.password}
            onChange={handleChange}
            required 
            disabled={loading}
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="form-footer">
        <p>Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}

export default Login; 