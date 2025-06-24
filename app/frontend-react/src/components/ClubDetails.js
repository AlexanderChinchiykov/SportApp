import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReservationModal from './ReservationModal';
import { isAuthenticated, getCurrentUser } from '../utils/auth';
import { clubsAPI, reviewsAPI } from '../utils/api';

function ClubDetails() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // User state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // Review/comment state
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  
  // Reservation state
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  // New comment state
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [commentSuccess, setCommentSuccess] = useState(false);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [replySuccess, setReplySuccess] = useState(false);

  useEffect(() => {
    // Check if user is logged in using auth.js helper
    const authStatus = isAuthenticated();
    setIsLoggedIn(authStatus);
    
    if (authStatus) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUserId(currentUser.id);
      }
    }
    
    fetchClubDetails();
    // We'll also fetch the detailed club information that includes ratings and comments
    fetchClubDetailedInfo();
  }, [id]);

  // Check if the logged-in user is the owner of the club
  useEffect(() => {
    if (club && userId) {
      setIsOwner(club.owner_id === parseInt(userId));
    }
  }, [club, userId]);

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/clubs/${id}`);
      
      if (response.ok) {
        const clubData = await response.json();
        console.log('Club data:', clubData); // Debug log
        
        // Ensure pictures is an array
        if (clubData.pictures === null || clubData.pictures === undefined) {
          clubData.pictures = [];
        } else if (typeof clubData.pictures === 'string') {
          try {
            clubData.pictures = JSON.parse(clubData.pictures);
          } catch (e) {
            console.error('Error parsing pictures JSON:', e);
            clubData.pictures = [];
          }
        }
        
        setClub(clubData);
      } else {
        setError('Could not load club details');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Error fetching club details:', error);
    }
  };
  
  const fetchClubDetailedInfo = async () => {
    try {
      // Get club details
      const detailsResponse = await clubsAPI.getClubById(id);
      
      // Update club with the latest information
      setClub(prev => ({
        ...prev,
        ...detailsResponse
      }));
      
      // Fetch reviews
      try {
        const reviewsData = await reviewsAPI.getClubReviews(id);
        console.log('Reviews data with user info:', reviewsData);
        setReviews(reviewsData || []);
        
        // Get latest rating
        const ratingData = await reviewsAPI.getClubRating(id);
        console.log('Rating data:', ratingData);
        
        // Update club with average rating
        setClub(prev => ({
          ...prev,
          average_rating: ratingData.average_rating || 0,
          reviews_count: reviewsData?.length || 0
        }));
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      }
      
      // Fetch comments
      try {
        const commentsData = await reviewsAPI.getClubComments(id);
        console.log('Comments data with user info:', commentsData);
        setComments(commentsData || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching detailed club info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      alert('Please log in to submit a review');
      return;
    }
    
    // Reset states
    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(false);
    
    try {
      // Prepare review data
      const reviewData = {
        rating: rating,
        comment: reviewText,
        club_id: parseInt(id)
      };
      
      console.log('Submitting review:', reviewData);
      
      // Submit review
      const response = await reviewsAPI.createReview(reviewData);
      console.log('Review submitted successfully:', response);
      
      // Show success message
      setReviewSuccess(true);
      
      // Clear form
      setReviewText('');
      setRating(5);
      
      // Refresh reviews
      fetchClubDetailedInfo();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setReviewSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting review:', error);
      setReviewError(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      alert('Please log in to submit a comment');
      return;
    }
    
    // Reset states
    setCommentSubmitting(true);
    setCommentError(null);
    setCommentSuccess(false);
    
    try {
      // Prepare comment data
      const commentData = {
        content: commentText,
        club_id: parseInt(id)
      };
      
      console.log('Submitting comment:', commentData);
      
      // Submit comment
      const response = await reviewsAPI.createComment(commentData);
      console.log('Comment submitted successfully:', response);
      
      // Show success message
      setCommentSuccess(true);
      
      // Clear form
      setCommentText('');
      
      // Refresh comments
      const commentsData = await reviewsAPI.getClubComments(id);
      setComments(commentsData || []);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setCommentSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting comment:', error);
      setCommentError(error.message || 'Failed to submit comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  };
  
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      alert('Please log in to reply');
      return;
    }
    
    if (!replyingTo) {
      setReplyError('No comment selected to reply to');
      return;
    }
    
    // Reset states
    setReplySubmitting(true);
    setReplyError(null);
    setReplySuccess(false);
    
    try {
      // Prepare reply data (which is just a comment with a parent_id)
      const replyData = {
        content: replyText,
        club_id: parseInt(id),
        parent_id: replyingTo
      };
      
      console.log('Submitting reply:', replyData);
      
      // Submit reply
      const response = await reviewsAPI.createComment(replyData);
      console.log('Reply submitted successfully:', response);
      
      // Show success message
      setReplySuccess(true);
      
      // Clear form and reset replying state
      setReplyText('');
      setReplyingTo(null);
      
      // Refresh comments
      const commentsData = await reviewsAPI.getClubComments(id);
      setComments(commentsData || []);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setReplySuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting reply:', error);
      setReplyError(error.message || 'Failed to submit reply. Please try again.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const nextImage = () => {
    if (club?.pictures?.length > 0) {
      setActiveImageIndex((prevIndex) => 
        prevIndex === club.pictures.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const prevImage = () => {
    if (club?.pictures?.length > 0) {
      setActiveImageIndex((prevIndex) => 
        prevIndex === 0 ? club.pictures.length - 1 : prevIndex - 1
      );
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('picture-upload');
    const file = fileInput.files[0];
    
    if (!file) {
      setUploadError("Please select a file to upload");
      return;
    }
    
    // Clear previous errors
    setUploadError(null);
    setUploading(true);
    
    // Create FormData object
    const formData = new FormData();
    formData.append('file', file);
    formData.append('owner_id', userId);
    
    try {
      const response = await fetch(`/api/v1/clubs/${id}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        // Refresh club data to show the new picture
        fetchClubDetails();
        // Reset file input
        fileInput.value = '';
      } else {
        const errorData = await response.json();
        setUploadError(errorData.detail || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('An error occurred while uploading the image');
    } finally {
      setUploading(false);
    }
  };
  
  const openReservationModal = () => {
    // Re-check authentication before opening modal
    const authStatus = isAuthenticated();
    setIsLoggedIn(authStatus);
    
    if (authStatus) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUserId(currentUser.id);
      }
    }
    
    setIsReservationModalOpen(true);
  };
  
  const closeReservationModal = () => {
    setIsReservationModalOpen(false);
  };
  
  const startReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyText('');
    setReplyError(null);
    
    // Scroll to the reply form
    setTimeout(() => {
      const replyForm = document.getElementById(`reply-form-${commentId}`);
      if (replyForm) {
        replyForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const textarea = replyForm.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }
    }, 100);
  };
  
  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
    setReplyError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="card p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-300">Loading club details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="card p-8 border border-red-600">
          <h2 className="text-red-500 text-xl mb-2">Error</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="card p-8">
          <h2 className="text-xl mb-2">Not Found</h2>
          <p className="text-gray-300">Club not found or has been removed.</p>
        </div>
      </div>
    );
  }

  // Check if picture URLs need to be adjusted to include the base URL
  const getImageUrl = (url) => {
    if (!url) return '';
    
    // If it's already a full URL (starts with http or https), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Otherwise, assume it's a relative path and prepend the API base URL
    return `/uploads/club_pictures/${url.split('/').pop()}`;
  };

  // Custom Image component with fallback
  const ClubImage = ({ src, alt, className, isThumbnail = false }) => {
    const [error, setError] = useState(false);
    const fallbackImage = 'https://via.placeholder.com/800x600?text=No+Image+Available';
    
    // If src is empty or undefined, use fallback image
    if (!src) {
      return <img src={fallbackImage} alt={alt || "Club"} className={className} />;
    }
    
    const imageUrl = getImageUrl(src);
    
    const handleError = () => {
      console.error(`Failed to load image: ${imageUrl}`);
      setError(true);
    };
    
    if (error) {
      return <img src={fallbackImage} alt={alt || "Club"} className={className} />;
    }
    
    return (
      <img 
        src={imageUrl} 
        alt={alt || "Club"} 
        className={className}
        onError={handleError}
      />
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 mb-6 md:mb-0 md:pr-6">
              <div className="relative overflow-hidden rounded-lg bg-gray-800 h-[300px] md:h-[400px] flex items-center justify-center">
                {club.pictures && club.pictures.length > 0 ? (
                  <>
                    <ClubImage 
                      src={club.pictures[activeImageIndex]} 
                      alt={`${club.name} - Image ${activeImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {club.pictures.length > 1 && (
                      <>
                        <button 
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button 
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                    
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
                      {club.pictures.map((_, index) => (
                        <button 
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={`h-2 w-2 rounded-full ${activeImageIndex === index ? 'bg-primary' : 'bg-gray-400'}`}
                        ></button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No pictures available</p>
                  </div>
                )}
              </div>
              
              {club.pictures && club.pictures.length > 1 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {club.pictures.slice(0, 5).map((picture, index) => (
                    <button 
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`overflow-hidden rounded ${activeImageIndex === index ? 'ring-2 ring-primary' : ''}`}
                    >
                      <ClubImage 
                        src={picture} 
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-16 object-cover"
                        isThumbnail={true}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold text-gray-100">{club.name}</h1>
                <div className="flex space-x-2">
                  {isOwner && (
                    <Link to={`/clubs/${club.id}/edit`} className="btn btn-sm btn-secondary">
                      Edit
                    </Link>
                  )}
                  <button
                    onClick={openReservationModal}
                    className="btn btn-sm btn-primary"
                  >
                    Reserve
                  </button>
                </div>
              </div>
              
              <div className="text-sm bg-gray-800 px-2 py-1 rounded text-gray-300 inline-block mb-4">
                {club.town}
              </div>
              
              <div className="space-y-3 text-gray-300">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p>{club.address || "Address not provided"}</p>
                </div>
                
                {club.address && (
                  <div className="ml-7 -mt-1">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${club.address}, ${club.town}`)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      View on Google Maps
                    </a>
                  </div>
                )}
                
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <p>{club.telephone}</p>
                </div>
                
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>${club.hourly_price}/hour</p>
                </div>
                
                {club.website && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-light transition-colors">
                      Website
                    </a>
                  </div>
                )}
                
                {club.owner_name && (
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p>Owner: {club.owner_name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reservation Modal */}
      {club && (
        <ReservationModal
          club={club}
          isOpen={isReservationModalOpen}
          onClose={closeReservationModal}
          isLoggedIn={isLoggedIn}
          userData={isLoggedIn ? { userId } : null}
        />
      )}
      
      {/* Reviews Section */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-100 p-6 pb-2">Reviews</h2>
        
        <div className="flex items-center justify-between p-6 pt-0 mb-4">
          <div className="flex items-center">
            <div className="text-4xl font-bold text-gray-100 mr-3">{club.average_rating ? club.average_rating.toFixed(1) : "0.0"}</div>
            <div>
              <div className="flex text-yellow-400 mb-1">
                {Array(5).fill(null).map((_, i) => (
                  <span key={i} className={i < Math.round(club?.average_rating || 0) ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                ))}
              </div>
              <div className="text-sm text-gray-400">Based on {club.reviews_count || 0} reviews</div>
            </div>
          </div>
          
          {isLoggedIn && (
            <button onClick={() => document.getElementById('review-form').scrollIntoView({ behavior: 'smooth' })}
                    className="btn btn-primary">
              Write a Review
            </button>
          )}
        </div>
        
        {isLoggedIn && (
          <div id="review-form" className="bg-dark-lighter rounded-lg p-4 mx-6 mb-6">
            <h3 className="text-lg font-medium mb-3 text-gray-200">Write a Review</h3>
            {reviewSuccess && (
              <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-3 rounded mb-4">
                Your review has been submitted successfully!
              </div>
            )}
            {reviewError && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded mb-4">
                {reviewError}
              </div>
            )}
            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Rating:</label>
                <div className="flex text-2xl">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <label key={star} className="cursor-pointer px-1">
                      <input 
                        type="radio" 
                        name="rating" 
                        value={star} 
                        checked={rating === star}
                        onChange={() => setRating(star)}
                        className="sr-only"
                      />
                      <span className={`${rating >= star ? 'text-yellow-400' : 'text-gray-600'} hover:text-yellow-300 transition-colors`}>★</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="review" className="label">Your Review:</label>
                <textarea 
                  id="review" 
                  rows="4"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  required
                  className="input"
                  placeholder="Share your experience..."
                  disabled={reviewSubmitting}
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary mt-3"
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}
        
        <div className="p-6 pt-0 space-y-4">
          {reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review.id} className="border-b border-gray-800 pb-4 last:border-none">
                <div className="flex justify-between mb-2">
                  <div className="font-medium text-gray-200">{review.user_name}</div>
                  <div className="text-sm text-gray-400">{new Date(review.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex text-yellow-400 mb-2">
                  {Array(5).fill(null).map((_, i) => (
                    <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                  ))}
                </div>
                <p className="text-gray-300">{review.comment}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p>No reviews yet. Be the first to leave a review!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Comments Section */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-100 p-6 pb-2">Comments</h2>
        
        {isLoggedIn && (
          <div className="bg-dark-lighter rounded-lg p-4 mx-6 mb-6">
            <h3 className="text-lg font-medium mb-3 text-gray-200">Ask a Question</h3>
            {commentSuccess && (
              <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-3 rounded mb-4">
                Your comment has been submitted successfully!
              </div>
            )}
            {commentError && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded mb-4">
                {commentError}
              </div>
            )}
            <form onSubmit={handleCommentSubmit}>
              <div className="form-group">
                <label htmlFor="comment" className="label">Your Question or Comment:</label>
                <textarea 
                  id="comment" 
                  rows="3"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                  className="input"
                  placeholder="Ask a question about this club..."
                  disabled={commentSubmitting}
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary mt-3"
                disabled={commentSubmitting}
              >
                {commentSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          </div>
        )}
        
        <div className="p-6 pt-0 space-y-4">
          {replySuccess && (
            <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-3 rounded mb-4">
              Your reply has been submitted successfully!
            </div>
          )}
          
          {comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="border-b border-gray-800 pb-4 last:border-none">
                <div className="flex justify-between mb-2">
                  <div className="font-medium text-gray-200 flex items-center">
                    {comment.user_name}
                    {comment.user_id && club.owner_id && comment.user_id === club.owner_id && (
                      <span className="ml-2 text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded-full">
                        OWNER
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</div>
                </div>
                <p className="text-gray-300">{comment.content}</p>
                
                {isLoggedIn && (
                  <div className="mt-2">
                    <button 
                      onClick={() => startReply(comment.id)}
                      className="text-blue-400 text-sm hover:text-blue-300 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply
                    </button>
                  </div>
                )}
                
                {/* Reply form */}
                {isLoggedIn && replyingTo === comment.id && (
                  <div id={`reply-form-${comment.id}`} className="mt-3 pl-4 border-l border-gray-700 py-3">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Reply to {comment.user_name}</h4>
                    
                    {replyError && (
                      <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-2 rounded mb-3 text-sm">
                        {replyError}
                      </div>
                    )}
                    
                    <form onSubmit={handleReplySubmit}>
                      <div className="form-group mb-3">
                        <textarea 
                          rows="2"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          required
                          className="input text-sm"
                          placeholder="Write your reply..."
                          disabled={replySubmitting}
                        ></textarea>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          type="submit" 
                          className="btn btn-primary btn-sm"
                          disabled={replySubmitting}
                        >
                          {replySubmitting ? 'Submitting...' : 'Submit Reply'}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={cancelReply}
                          disabled={replySubmitting}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Display replies if any */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 pl-4 border-l border-gray-700 space-y-3">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="pt-3">
                        <div className="flex justify-between mb-1">
                          <div className="font-medium text-gray-200 text-sm flex items-center">
                            {reply.user_name}
                            {reply.user_id && club.owner_id && reply.user_id === club.owner_id && (
                              <span className="ml-2 text-xs bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded-full text-xs">
                                OWNER
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleDateString()}</div>
                        </div>
                        <p className="text-gray-300 text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p>No comments yet. Be the first to leave a comment!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClubDetails; 