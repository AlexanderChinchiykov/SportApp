// Clubs API
export const clubsAPI = {
  // ... existing methods ...
  
  // Add a method to remove a picture
  removePicture: (clubId, pictureUrl) => 
    apiRequest(`${API_PATH}/clubs/${clubId}/pictures`, {
      method: 'DELETE',
      body: { picture_url: pictureUrl }
    }),
    
  // Add the join club functionality
  joinClub: (clubId) => 
    apiRequest(`${API_PATH}/clubs/${clubId}/join`, {
      method: 'POST'
    }),
    
  // Add the leave club functionality
  leaveClub: (clubId) => 
    apiRequest(`${API_PATH}/clubs/${clubId}/leave`, {
      method: 'POST'
    })
};

// Reviews API
export const reviewsAPI = {
  // Get reviews for a club
  getClubReviews: (clubId) => 
    apiRequest(`${API_PATH}/reviews/club/${clubId}`),
    
  // Create a new review
  createReview: (reviewData) => 
    apiRequest(`${API_PATH}/reviews/`, {
      method: 'POST',
      body: reviewData
    }),
    
  // Get club comments
  getClubComments: (clubId) => 
    apiRequest(`${API_PATH}/reviews/club/${clubId}/comments`),
    
  // Create a comment
  createComment: (commentData) => 
    apiRequest(`${API_PATH}/reviews/comments`, {
      method: 'POST',
      body: commentData
    })
};

export default {
  apiRequest,
  auth: authAPI,
  clubs: clubsAPI,
  reservations: reservationsAPI,
  reviews: reviewsAPI
}; 