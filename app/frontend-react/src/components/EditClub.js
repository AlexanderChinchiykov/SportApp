import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../utils/auth';
import { clubsAPI } from '../utils/api';

function EditClub() {
  const { id } = useParams();
  console.log("EditClub component rendering for club ID:", id);
  
  // Form state matches exactly the Club model fields
  const [formData, setFormData] = useState({
    name: '',
    town: '',
    telephone: '',
    hourly_price: '',
    description: null,
    address: null,
    website: null,
    social_media: null
  });
  
  // UI state
  const [pictures, setPictures] = useState([]);
  const [pictureUrls, setPictureUrls] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("EditClub component mounted");
    
    // Redirect to login if not logged in
    if (!isAuthenticated()) {
      console.error("User is not authenticated, redirecting to login");
      navigate('/login');
      return;
    }
    
    fetchClubData();
  }, [id, navigate]);

  const fetchClubData = async () => {
    try {
      setLoading(true);
      const clubData = await clubsAPI.getClubById(id);
      console.log("Club data loaded:", clubData);
      
      // Format data for the form
      setFormData({
        name: clubData.name || '',
        town: clubData.town || '',
        telephone: clubData.telephone || '',
        hourly_price: clubData.hourly_price ? clubData.hourly_price.toString() : '',
        description: clubData.description || null,
        address: clubData.address || null,
        website: clubData.website || null,
        social_media: clubData.social_media || null
      });
      
      // Handle pictures
      if (clubData.pictures && Array.isArray(clubData.pictures) && clubData.pictures.length > 0) {
        setPictureUrls(clubData.pictures);
      }
      
    } catch (err) {
      console.error("Error fetching club data:", err);
      setError("Failed to load club data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
  };

  const handleSocialMediaChange = (e) => {
    const { name, value } = e.target;
    
    // Initialize social_media object if it's null
    const currentSocialMedia = formData.social_media || {};
    
    // Create updated social media object
    const updatedSocialMedia = {
      ...currentSocialMedia,
      [name]: value
    };
    
    // Only set to null if all fields are empty
    const hasValues = Object.values(updatedSocialMedia).some(val => val && val.trim() !== '');
    
    setFormData(prev => ({
      ...prev,
      social_media: hasValues ? updatedSocialMedia : null
    }));
  };

  const handlePictureChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Limit to 5 files
      const files = Array.from(e.target.files).slice(0, 5);
      setPictures(files);
      
      // Create preview URLs
      const previewUrls = files.map(file => URL.createObjectURL(file));
      
      // Add new pictures to existing ones
      setPictureUrls(prev => [...prev, ...previewUrls]);
    }
  };

  const handleRemovePicture = async (index) => {
    try {
      // If it's an existing picture from the server, call the API to remove it
      if (index < pictureUrls.length) {
        const pictureUrl = pictureUrls[index];
        
        // Check if it's a URL that comes from the server
        if (pictureUrl.startsWith('/uploads/') || pictureUrl.startsWith('http')) {
          await clubsAPI.removePicture(id, pictureUrl);
        }
        
        // Update the UI
        setPictureUrls(prev => prev.filter((_, i) => i !== index));
      }
    } catch (err) {
      console.error("Error removing picture:", err);
      setError("Failed to remove picture. Please try again.");
    }
  };

  const validateForm = () => {
    // Required fields
    if (!formData.name || formData.name.trim() === '') {
      setError('Club name is required');
      return false;
    }
    
    if (!formData.town || formData.town.trim() === '') {
      setError('Town/City is required');
      return false;
    }
    
    if (!formData.telephone || formData.telephone.trim() === '') {
      setError('Telephone number is required');
      return false;
    }
    
    // Validate hourly_price is a number and positive
    const price = parseFloat(formData.hourly_price);
    if (isNaN(price) || price <= 0) {
      setError('Hourly price must be a positive number');
      return false;
    }
    
    return true;
  };

  const updateClub = async () => {
    // Create a clean version of the data
    const clubData = {
      ...formData,
      hourly_price: parseFloat(formData.hourly_price)
    };
    
    // Make sure social_media is properly formatted
    if (clubData.social_media && typeof clubData.social_media === 'object') {
      // Filter out empty values
      const filtered = {};
      Object.entries(clubData.social_media).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          filtered[key] = value;
        }
      });
      
      // Only set if there are values
      if (Object.keys(filtered).length > 0) {
        clubData.social_media = filtered;
      } else {
        clubData.social_media = null;
      }
    }
    
    console.log("Submitting club update data:", clubData);
    
    try {
      // Use the clubsAPI utility instead of direct fetch
      return await clubsAPI.updateClub(id, clubData);
    } catch (err) {
      console.error("Error updating club:", err);
      throw err;
    }
  };

  const uploadPicture = async (clubId, ownerId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`/api/v1/clubs/${clubId}/upload?owner_id=${ownerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        console.error(`Failed to upload picture: ${response.status} ${response.statusText}`);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error uploading picture:", err);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    
    try {
      // Validate form
      if (!validateForm()) {
        setSaving(false);
        return;
      }
      
      // Step 1: Update the club
      const club = await updateClub();
      
      if (!club || !club.id) {
        throw new Error("Club updated but returned invalid data");
      }
      
      console.log("Club updated successfully:", club);
      
      // Step 2: Upload new pictures (if any)
      if (pictures.length > 0) {
        setUploadStatus('Uploading pictures...');
        
        let successCount = 0;
        for (const picture of pictures) {
          const success = await uploadPicture(club.id, club.owner_id, picture);
          if (success) successCount++;
        }
        
        if (successCount === pictures.length) {
          setUploadStatus('All pictures uploaded successfully!');
        } else {
          setUploadStatus(`Uploaded ${successCount} of ${pictures.length} pictures`);
        }
      }
      
      setSaving(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error in form submission:', err);
      setError(err.message || 'Failed to update club. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8 text-white text-center">
          <p>Loading club data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Edit Club: {formData.name}</h2>
        
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {uploadStatus && (
          <div className="bg-blue-900/30 border border-blue-800 text-blue-300 px-4 py-3 rounded mb-6">
            {uploadStatus}
          </div>
        )}
      
        <form onSubmit={handleSubmit}>
          {/* Required fields section */}
          <div className="mb-6">
            <h3 className="text-xl text-white font-medium mb-3">Required Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-gray-300 mb-2">Club Name *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={formData.name || ''}
                  onChange={handleChange}
                  required 
                  disabled={saving}
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="town" className="block text-gray-300 mb-2">Town/City *</label>
                <input 
                  type="text" 
                  id="town" 
                  name="town" 
                  value={formData.town || ''}
                  onChange={handleChange}
                  required 
                  disabled={saving}
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="telephone" className="block text-gray-300 mb-2">Telephone *</label>
                <input 
                  type="tel" 
                  id="telephone" 
                  name="telephone" 
                  value={formData.telephone || ''}
                  onChange={handleChange}
                  required 
                  disabled={saving}
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="hourly_price" className="block text-gray-300 mb-2">Hourly Price *</label>
                <input 
                  type="number" 
                  id="hourly_price" 
                  name="hourly_price" 
                  value={formData.hourly_price || ''}
                  onChange={handleChange}
                  required 
                  step="0.01"
                  min="0"
                  disabled={saving}
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* Additional fields section */}
          <div className="mb-6">
            <h3 className="text-xl text-white font-medium mb-3">Additional Information</h3>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-gray-300 mb-2">Description</label>
              <textarea 
                id="description" 
                name="description" 
                rows="5"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Describe your club, facilities, and any unique features"
                disabled={saving}
                className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="address" className="block text-gray-300 mb-2">Address</label>
                <input 
                  type="text" 
                  id="address" 
                  name="address" 
                  value={formData.address || ''}
                  onChange={handleChange}
                  placeholder="Street address"
                  disabled={saving}
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="website" className="block text-gray-300 mb-2">Website</label>
                <input 
                  type="url" 
                  id="website" 
                  name="website" 
                  value={formData.website || ''}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  disabled={saving}
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* Social media section */}
          <div className="mb-6">
            <h3 className="text-xl text-white font-medium mb-3">Social Media</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="facebook" className="block text-gray-300 mb-2">Facebook</label>
                <input 
                  type="text" 
                  id="facebook" 
                  name="facebook" 
                  value={(formData.social_media && formData.social_media.facebook) || ''}
                  onChange={handleSocialMediaChange}
                  placeholder="Facebook page URL"
                  disabled={saving}
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="instagram" className="block text-gray-300 mb-2">Instagram</label>
                <input 
                  type="text" 
                  id="instagram" 
                  name="instagram" 
                  value={(formData.social_media && formData.social_media.instagram) || ''}
                  onChange={handleSocialMediaChange}
                  placeholder="Instagram handle"
                  disabled={saving}
                  className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
          
          {/* Pictures section */}
          <div className="mb-6">
            <h3 className="text-xl text-white font-medium mb-3">Club Pictures</h3>
            
            {/* Existing pictures */}
            {pictureUrls.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-300 mb-2">Current Pictures:</p>
                <div className="flex flex-wrap gap-3">
                  {pictureUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Club ${index + 1}`} 
                        className="w-24 h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePicture(index)}
                        className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="pictures" className="block text-gray-300 mb-2">Add New Pictures (Max 5)</label>
              <input
                type="file"
                id="pictures"
                name="pictures"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handlePictureChange}
                disabled={saving}
                className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-2 text-sm text-gray-400">
                Upload images of your club to attract more customers. Supported formats: JPEG, PNG, GIF, WebP
              </p>
            </div>
          </div>
          
          {/* Submit button */}
          <div className="flex justify-between">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              disabled={saving}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded transition-colors"
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditClub; 