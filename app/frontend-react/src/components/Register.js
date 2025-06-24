import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student',
    is_club_owner: false
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    // If club owner checkbox is checked, disable role selection
    if (e.target.name === 'is_club_owner' && value === true) {
      setFormData({
        ...formData,
        [e.target.name]: value,
        role: 'club_owner'
      });
    } else if (e.target.name === 'role' && formData.is_club_owner) {
      // If selecting a role while club owner is checked, uncheck club owner
      setFormData({
        ...formData,
        [e.target.name]: value,
        is_club_owner: false
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include' // Include cookies with the request
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
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create an Account</h2>
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
          <label htmlFor="username">Username</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            value={formData.username}
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
            minLength="8"
            required 
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="first_name">First Name</label>
          <input 
            type="text" 
            id="first_name" 
            name="first_name" 
            value={formData.first_name}
            onChange={handleChange}
            required 
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="last_name">Last Name</label>
          <input 
            type="text" 
            id="last_name" 
            name="last_name" 
            value={formData.last_name}
            onChange={handleChange}
            required 
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label>Role</label>
          <div className="radio-group">
            <label className="radio-label">
              <input 
                type="radio" 
                name="role" 
                value="student" 
                checked={formData.role === 'student'} 
                onChange={handleChange} 
                disabled={formData.is_club_owner || loading}
              /> 
              Student
            </label>
            <label className="radio-label">
              <input 
                type="radio" 
                name="role" 
                value="coach" 
                checked={formData.role === 'coach'} 
                onChange={handleChange} 
                disabled={formData.is_club_owner || loading}
              /> 
              Coach
            </label>
          </div>
        </div>
        
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              name="is_club_owner" 
              checked={formData.is_club_owner} 
              onChange={handleChange} 
              disabled={loading}
            /> 
            I am a club owner
          </label>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <div className="form-footer">
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

export default Register; 