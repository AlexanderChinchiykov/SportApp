import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllClubs();
  }, []);

  const fetchAllClubs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/clubs/');
      
      if (response.ok) {
        const data = await response.json();
        setClubs(data);
      } else {
        setError('Failed to fetch clubs');
      }
    } catch (error) {
      setError('An error occurred while fetching clubs');
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClubClick = (clubId) => {
    navigate(`/clubs/${clubId}`);
  };

  if (loading) {
    return <div className="card">Loading clubs...</div>;
  }

  if (error) {
    return <div className="card error">{error}</div>;
  }

  return (
    <div>
      <h2>Browse Clubs</h2>
      {clubs.length === 0 ? (
        <p>No clubs available at the moment.</p>
      ) : (
        <div className="club-list">
          {clubs.map(club => (
            <div 
              key={club.id} 
              className="club-card" 
              onClick={() => handleClubClick(club.id)}
            >
              <img 
                src={club.pictures && club.pictures.length > 0 
                  ? club.pictures[0] 
                  : 'https://via.placeholder.com/300x200?text=No+Image'
                } 
                alt={club.name} 
              />
              <div className="club-card-content">
                <h3>{club.name}</h3>
                <p><strong>Location:</strong> {club.town}</p>
                <p><strong>Price:</strong> ${club.hourly_price}/hour</p>
                {club.description && (
                  <p>{club.description.length > 100 
                    ? `${club.description.substring(0, 100)}...` 
                    : club.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home; 