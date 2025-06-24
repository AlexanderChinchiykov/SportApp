import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, Row, Col, Container, Image, Badge } from 'react-bootstrap';
import { FaStar } from 'react-icons/fa';
import '../styles/ClubsList.css';

const ClubsList = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/clubs');
        setClubs(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load clubs. Please try again later.');
        setLoading(false);
        console.error('Error fetching clubs:', err);
      }
    };

    fetchClubs();
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Loading clubs...</div>;
  }

  if (error) {
    return <div className="text-center mt-5 text-danger">{error}</div>;
  }

  return (
    <Container className="my-4">
      <h2 className="mb-4 text-center">Explore Sports Clubs</h2>
      {clubs.length === 0 ? (
        <p className="text-center">No clubs available at the moment.</p>
      ) : (
        <Row>
          {clubs.map((club) => (
            <Col key={club.id} md={12} className="mb-4">
              <Card className="club-card">
                <Row className="no-gutters">
                  <Col md={4} className="club-image-container">
                    {club.pictures && club.pictures.length > 0 ? (
                      <Image 
                        src={club.pictures[0]} 
                        alt={club.name} 
                        className="club-image" 
                      />
                    ) : (
                      <div className="no-image-placeholder">
                        No Image Available
                      </div>
                    )}
                  </Col>
                  <Col md={8}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <Card.Title>{club.name}</Card.Title>
                        <h5>
                          <Badge bg="success">€{club.hourly_price}/hr</Badge>
                        </h5>
                      </div>
                      <Card.Subtitle className="mb-2 text-muted">
                        {club.town}
                      </Card.Subtitle>
                      <Card.Text className="club-description">
                        {club.description || "No description available"}
                      </Card.Text>
                      <div className="d-flex mt-3 justify-content-between">
                        <div>
                          <Badge bg="info">Phone: {club.telephone}</Badge>
                          {club.address && (
                            <Badge bg="secondary" className="ms-2">
                              {club.address}
                            </Badge>
                          )}
                        </div>
                        <Link 
                          to={`/clubs/${club.id}`} 
                          className="btn btn-primary btn-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </Card.Body>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ClubsList; 