import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Row, Col, Card, Badge, Tabs, Tab, 
  Form, Button, Alert, Carousel, Spinner
} from 'react-bootstrap';
import { FaStar, FaRegStar, FaComment, FaUser } from 'react-icons/fa';
import '../styles/ClubDetail.css';

const StarRating = ({ rating, setRating, interactive = false }) => {
  const stars = [];
  
  for (let i = 1; i <= 5; i++) {
    if (interactive) {
      stars.push(
        <span 
          key={i} 
          onClick={() => setRating(i)}
          style={{ cursor: 'pointer', color: i <= rating ? '#FFD700' : '#e4e5e9' }}
          className="mx-1"
        >
          {i <= rating ? <FaStar size={24} /> : <FaRegStar size={24} />}
        </span>
      );
    } else {
      stars.push(
        <span 
          key={i} 
          style={{ color: i <= rating ? '#FFD700' : '#e4e5e9' }}
          className="mx-1"
        >
          {i <= rating ? <FaStar size={20} /> : <FaRegStar size={20} />}
        </span>
      );
    }
  }
  
  return <div className="d-flex">{stars}</div>;
};

const ClubDetail = () => {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  
  // Review form state
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  
  // Comment form state
  const [commentContent, setCommentContent] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [commentSuccess, setCommentSuccess] = useState(false);
  
  // User state (in a real app, this would come from auth context)
  const [user] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch club details
        const clubResponse = await axios.get(`/api/clubs/${id}/details`);
        setClub(clubResponse.data);
        
        // Fetch reviews
        const reviewsResponse = await axios.get(`/api/reviews/club/${id}`);
        setReviews(reviewsResponse.data);
        
        // Fetch comments
        const commentsResponse = await axios.get(`/api/reviews/club/${id}/comments`);
        setComments(commentsResponse.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load club details. Please try again later.');
        setLoading(false);
        console.error('Error fetching club details:', err);
      }
    };

    fetchClubDetails();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setReviewError('You must be logged in to leave a review.');
      return;
    }
    
    if (rating === 0) {
      setReviewError('Please select a rating.');
      return;
    }
    
    try {
      setReviewSubmitting(true);
      setReviewError(null);
      
      await axios.post('/api/reviews/', {
        rating,
        comment: reviewComment,
        club_id: parseInt(id)
      });
      
      // Refresh reviews
      const reviewsResponse = await axios.get(`/api/reviews/club/${id}`);
      setReviews(reviewsResponse.data);
      
      // Reset form
      setRating(0);
      setReviewComment('');
      setReviewSuccess(true);
      
      // Refresh club details to update rating
      const clubResponse = await axios.get(`/api/clubs/${id}/details`);
      setClub(clubResponse.data);
      
      setTimeout(() => {
        setReviewSuccess(false);
      }, 3000);
      
      setReviewSubmitting(false);
    } catch (err) {
      setReviewError('Failed to submit review. Please try again.');
      setReviewSubmitting(false);
      console.error('Error submitting review:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setCommentError('You must be logged in to leave a comment.');
      return;
    }
    
    if (!commentContent.trim()) {
      setCommentError('Please enter a comment.');
      return;
    }
    
    try {
      setCommentSubmitting(true);
      setCommentError(null);
      
      await axios.post('/api/reviews/comments', {
        content: commentContent,
        club_id: parseInt(id)
      });
      
      // Refresh comments
      const commentsResponse = await axios.get(`/api/reviews/club/${id}/comments`);
      setComments(commentsResponse.data);
      
      // Reset form
      setCommentContent('');
      setCommentSuccess(true);
      
      setTimeout(() => {
        setCommentSuccess(false);
      }, 3000);
      
      setCommentSubmitting(false);
    } catch (err) {
      setCommentError('Failed to submit comment. Please try again.');
      setCommentSubmitting(false);
      console.error('Error submitting comment:', err);
    }
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading club details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Link to="/clubs" className="btn btn-primary">
          Back to Clubs
        </Link>
      </Container>
    );
  }

  if (!club) {
    return (
      <Container className="my-5">
        <Alert variant="warning">Club not found.</Alert>
        <Link to="/clubs" className="btn btn-primary">
          Back to Clubs
        </Link>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <Link to="/clubs" className="btn btn-outline-secondary mb-4">
        &larr; Back to All Clubs
      </Link>
      
      <Row>
        <Col md={8}>
          <h2>{club.name}</h2>
          <div className="d-flex align-items-center mb-3">
            <StarRating rating={club.average_rating} />
            <span className="ms-2 text-muted">
              ({club.average_rating.toFixed(1)}) · {club.reviews_count} reviews
            </span>
          </div>
          
          <h5>
            <Badge bg="success" className="me-2">€{club.hourly_price}/hr</Badge>
            <Badge bg="info">{club.town}</Badge>
            {club.address && (
              <Badge bg="secondary" className="ms-2">{club.address}</Badge>
            )}
          </h5>
        </Col>
        <Col md={4} className="text-md-end">
          <h5>Contact</h5>
          <p className="mb-1">📞 {club.telephone}</p>
          {club.website && (
            <p className="mb-1">
              🌐 <a href={club.website} target="_blank" rel="noopener noreferrer">
                {club.website}
              </a>
            </p>
          )}
          {club.owner_name && (
            <p className="mb-1">👤 Owner: {club.owner_name}</p>
          )}
        </Col>
      </Row>
      
      {club.pictures && club.pictures.length > 0 && (
        <Row className="my-4">
          <Col>
            <Carousel className="club-carousel">
              {club.pictures.map((picture, idx) => (
                <Carousel.Item key={idx}>
                  <img
                    className="d-block w-100 club-carousel-image"
                    src={picture}
                    alt={`${club.name} - Image ${idx + 1}`}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          </Col>
        </Row>
      )}
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4 mt-4"
      >
        <Tab eventKey="info" title="Information">
          <Card body className="mb-4">
            <h4>About {club.name}</h4>
            <p>{club.description || "No description available."}</p>
          </Card>
        </Tab>
        
        <Tab eventKey="reviews" title={`Reviews (${club.reviews_count})`}>
          <Card body className="mb-4">
            <h4 className="mb-4">Reviews</h4>
            
            {user && (
              <Card className="mb-4">
                <Card.Body>
                  <h5>Leave a Review</h5>
                  <Form onSubmit={handleReviewSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Your Rating</Form.Label>
                      <div>
                        <StarRating 
                          rating={rating} 
                          setRating={setRating} 
                          interactive={true} 
                        />
                      </div>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Your Review (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this club..."
                      />
                    </Form.Group>
                    
                    {reviewError && (
                      <Alert variant="danger">{reviewError}</Alert>
                    )}
                    
                    {reviewSuccess && (
                      <Alert variant="success">
                        Your review has been submitted successfully!
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={reviewSubmitting}
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            )}
            
            {reviews.length === 0 ? (
              <p className="text-muted">No reviews yet. Be the first to review!</p>
            ) : (
              <div>
                {reviews.map((review) => (
                  <Card key={review.id} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <FaUser className="me-2" />
                          <span className="fw-bold">{review.user_name}</span>
                          <Badge bg="secondary" className="ms-2">
                            {review.user_role}
                          </Badge>
                        </div>
                        <small className="text-muted">
                          {new Date(review.created_at).toLocaleDateString()}
                        </small>
                      </div>
                      
                      <div className="my-2">
                        <StarRating rating={review.rating} />
                      </div>
                      
                      {review.comment && (
                        <p className="mb-0">{review.comment}</p>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </Tab>
        
        <Tab eventKey="comments" title={`Comments (${club.comments_count})`}>
          <Card body className="mb-4">
            <h4 className="mb-4">Comments</h4>
            
            {user && (
              <Card className="mb-4">
                <Card.Body>
                  <h5>Leave a Comment</h5>
                  <Form onSubmit={handleCommentSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Share your thoughts about this club..."
                      />
                    </Form.Group>
                    
                    {commentError && (
                      <Alert variant="danger">{commentError}</Alert>
                    )}
                    
                    {commentSuccess && (
                      <Alert variant="success">
                        Your comment has been submitted successfully!
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={commentSubmitting}
                    >
                      {commentSubmitting ? 'Submitting...' : 'Post Comment'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            )}
            
            {comments.length === 0 ? (
              <p className="text-muted">No comments yet. Start the conversation!</p>
            ) : (
              <div>
                {comments.map((comment) => (
                  <Card key={comment.id} className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <FaUser className="me-2" />
                          <span className="fw-bold">{comment.user_name}</span>
                          <Badge bg="secondary" className="ms-2">
                            {comment.user_role}
                          </Badge>
                        </div>
                        <small className="text-muted">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </small>
                      </div>
                      
                      <p className="mt-2 mb-0">{comment.content}</p>
                      
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ps-4 border-start">
                          {comment.replies.map((reply) => (
                            <Card key={reply.id} className="mb-2 reply-card">
                              <Card.Body className="py-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <div className="d-flex align-items-center">
                                    <FaUser className="me-2" size={12} />
                                    <span className="fw-bold small">{reply.user_name}</span>
                                    <Badge bg="secondary" className="ms-2" pill size="sm">
                                      {reply.user_role}
                                    </Badge>
                                  </div>
                                  <small className="text-muted">
                                    {new Date(reply.created_at).toLocaleDateString()}
                                  </small>
                                </div>
                                <p className="mt-1 mb-0 small">{reply.content}</p>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default ClubDetail; 