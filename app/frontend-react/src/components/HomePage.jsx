import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

// Club Card Component
const ClubCard = ({ club }) => {
  // Calculate the rating display
  const renderRating = () => {
    if (!club.average_rating && club.average_rating !== 0) {
      return <span className="text-gray-400">Not rated yet</span>;
    }
    
    const rating = Math.round(club.average_rating || 0);
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-600"}>★</span>
        ))}
        <span className="ml-1 text-gray-300">
          ({club.average_rating?.toFixed(1) || "0.0"})
        </span>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-xl border border-gray-700">
      <div className="p-4 bg-gradient-to-r from-orange-600 to-orange-700">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">{club.name}</h3>
        </div>
      </div>
      <div className="p-4">
        {renderRating()}
        <div className="mt-4 space-y-3">
          <div className="flex items-center text-gray-300">
            <svg className="w-5 h-5 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
            </svg>
            <span>{club.town || 'Unknown location'}</span>
          </div>
          <div className="flex items-center text-gray-300">
            <svg className="w-5 h-5 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
            </svg>
            <span>{typeof club.hourly_price === 'number' ? `€${club.hourly_price}/hour` : 'Price not available'}</span>
          </div>
          <div className="flex items-center text-gray-300">
            <svg className="w-5 h-5 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
            </svg>
            <span>{club.telephone || 'No phone number'}</span>
          </div>
        </div>
        <Link to={`/clubs/${club.id}`} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded mt-4 transition-colors block text-center">
          View Details
        </Link>
      </div>
    </div>
  );
};

// Price Filter Modal Component
const PriceFilterModal = ({ isOpen, onClose, priceRange, setPriceRange, onApply }) => {
  const [localRange, setLocalRange] = useState(priceRange);
  
  useEffect(() => {
    setLocalRange(priceRange);
  }, [priceRange]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = parseInt(value) || 0;
    
    // Ensure min doesn't exceed max and max isn't less than min
    if (name === 'min') {
      const newMin = Math.min(newValue, localRange.max);
      setLocalRange(prev => ({
        ...prev,
        min: newMin
      }));
    } else if (name === 'max') {
      const newMax = Math.max(newValue, localRange.min);
      setLocalRange(prev => ({
        ...prev,
        max: newMax
      }));
    }
  };
  
  const handleApply = () => {
    setPriceRange(localRange);
    onApply(localRange);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Set Price Range</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-300">Minimum Price:</label>
            <div className="flex items-center">
              <span className="text-gray-300 mr-1">€</span>
              <input
                type="number"
                name="min"
                min="0"
                max={localRange.max}
                value={localRange.min}
                onChange={(e) => {
                  const newMin = Math.min(parseInt(e.target.value) || 0, localRange.max);
                  setLocalRange(prev => ({ ...prev, min: newMin }));
                }}
                className="w-16 p-1 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
          </div>
          <input 
            type="range" 
            name="min" 
            min="0" 
            max="200" 
            step="1"
            value={localRange.min} 
            onChange={handleChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-300">Maximum Price:</label>
            <div className="flex items-center">
              <span className="text-gray-300 mr-1">€</span>
              <input
                type="number"
                name="max"
                min={localRange.min}
                max="300"
                value={localRange.max}
                onChange={(e) => {
                  const newMax = Math.max(parseInt(e.target.value) || 0, localRange.min);
                  setLocalRange(prev => ({ ...prev, max: newMax }));
                }}
                className="w-16 p-1 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
          </div>
          <input 
            type="range" 
            name="max" 
            min="0" 
            max="300" 
            step="1"
            value={localRange.max} 
            onChange={handleChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        <div className="flex justify-between mt-4">
          <div className="bg-gray-700 rounded-lg p-3 text-white">
            <div className="text-gray-400 text-sm">Price Range</div>
            <div className="font-bold">€{localRange.min} - €{localRange.max}</div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setLocalRange({ min: 0, max: 200 })}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  // State for clubs data
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // State for dynamic filter options derived from clubs data
  const [availableCities, setAvailableCities] = useState([]);
  
  // State for search filters
  const [filters, setFilters] = useState({
    name: '',
    city: '',
    minPrice: '',
    maxPrice: ''
  });
  
  // State for price range modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 200
  });
  
  // Fixed facilities options (these aren't derived from backend data)
  const facilities = ['All Facilities', 'Indoor', 'Outdoor', 'With Lighting', 'With Showers'];
  
  // Fetch clubs on component mount
  useEffect(() => {
    fetchClubs();
  }, []);
  
  // Auto-search when filters change (with debounce)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchClubs(filters);
    }, 500);
    
    return () => {
      clearTimeout(handler);
    };
  }, [filters]);
  
  // Update filter options when clubs data changes
  useEffect(() => {
    if (clubs && clubs.length > 0) {
      // Extract unique cities from clubs data
      const cities = [...new Set(clubs.map(club => club.town).filter(Boolean))];
      setAvailableCities(cities);
    }
  }, [clubs]);

  // Function to fetch clubs data with optional filters
  const fetchClubs = async (filterParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert UI filter values to API filter parameters
      const apiFilters = {};
      if (filterParams.name) apiFilters.name = filterParams.name;
      if (filterParams.city) apiFilters.town = filterParams.city;
      if (filterParams.minPrice) apiFilters.min_price = filterParams.minPrice;
      if (filterParams.maxPrice) apiFilters.max_price = filterParams.maxPrice;
      
      console.log("Fetching clubs with filters:", apiFilters);
      
      // Build query string
      const params = new URLSearchParams();
      Object.entries(apiFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      // Use the API_PATH constant from api.js
      const API_PATH = '/api/v1';
      
      // Make direct API request with proper trailing slash
      const response = await fetch(`${API_PATH}/clubs/${queryString}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Club listing response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        // If we get a 404, try a fallback to mocked data
        if (response.status === 404) {
          console.log("API endpoint not found, using mock data");
          const mockClubs = [
            { 
              id: 1, 
              name: 'TK Team Kunchev', 
              town: 'Sofia', 
              telephone: '+359 888 123 456', 
              hourly_price: 25,
              average_rating: 4.5
            },
            { 
              id: 2, 
              name: 'Tennis club Tangra 95', 
              town: 'Targovishte', 
              telephone: '+359 888 234 567', 
              hourly_price: 20,
              average_rating: 3.8
            },
            { 
              id: 3, 
              name: 'Komak Sport', 
              town: 'Sofia', 
              telephone: '+359 888 345 678', 
              hourly_price: 30,
              average_rating: 4.2
            },
            { 
              id: 4, 
              name: 'Sea Point Aralia', 
              town: 'Varna', 
              telephone: '+359 888 456 789', 
              hourly_price: 15,
              average_rating: 4.7
            },
            { 
              id: 5, 
              name: 'Tennis club DIM Team', 
              town: 'Plovdiv', 
              telephone: '+359 888 567 890', 
              hourly_price: 22,
              average_rating: 3.5
            },
          ];
          
          // Apply client-side filtering for mock data
          let filteredClubs = [...mockClubs];
          
          if (filterParams.name) {
            const nameFilter = filterParams.name.toLowerCase();
            filteredClubs = filteredClubs.filter(club => 
              club.name.toLowerCase().includes(nameFilter)
            );
          }
          
          if (filterParams.city) {
            const cityFilter = filterParams.city.toLowerCase();
            filteredClubs = filteredClubs.filter(club => 
              club.town && club.town.toLowerCase().includes(cityFilter)
            );
          }
          
          if (filterParams.minPrice && filterParams.maxPrice) {
            const minPrice = parseFloat(filterParams.minPrice);
            const maxPrice = parseFloat(filterParams.maxPrice);
            filteredClubs = filteredClubs.filter(club => 
              club.hourly_price >= minPrice && club.hourly_price <= maxPrice
            );
          } else if (filterParams.minPrice) {
            const minPrice = parseFloat(filterParams.minPrice);
            filteredClubs = filteredClubs.filter(club => 
              club.hourly_price >= minPrice
            );
          } else if (filterParams.maxPrice) {
            const maxPrice = parseFloat(filterParams.maxPrice);
            filteredClubs = filteredClubs.filter(club => 
              club.hourly_price <= maxPrice
            );
          }
          
          setClubs(filteredClubs);
          setLoading(false);
          return;
        }
        
        throw new Error(`Failed to fetch clubs: ${response.statusText}`);
      }
      
      let clubsData = await response.json();
      console.log("Raw clubs data:", clubsData);
      
      if (!Array.isArray(clubsData)) {
        console.warn("Server did not return an array for clubs:", clubsData);
        clubsData = []; // Ensure we have an array even if server sends wrong format
      }
      
      // Process club data to handle pictures correctly
      const processedClubs = clubsData.map(club => {
        // Ensure pictures is an array
        if (typeof club.pictures === 'string') {
          try {
            club.pictures = JSON.parse(club.pictures);
          } catch (e) {
            console.warn(`Failed to parse pictures for club ${club.id}:`, e);
            club.pictures = [];
          }
        } else if (!Array.isArray(club.pictures)) {
          club.pictures = [];
        }
        
        return club;
      });
      
      console.log("Processed clubs data:", processedClubs);
      
      // Fetch ratings for each club
      try {
        const clubsWithRatings = await Promise.all(
          processedClubs.map(async (club) => {
            try {
              const ratingResponse = await fetch(`${API_PATH}/reviews/club/${club.id}/rating`);
              if (ratingResponse.ok) {
                const ratingData = await ratingResponse.json();
                console.log(`Rating for club ${club.id}:`, ratingData);
                return {
                  ...club,
                  average_rating: ratingData.average_rating || 0
                };
              } else {
                console.warn(`Failed to fetch rating for club ${club.id}`);
                return club;
              }
            } catch (err) {
              console.error(`Error fetching rating for club ${club.id}:`, err);
              return club;
            }
          })
        );
        
        setClubs(clubsWithRatings);
      } catch (err) {
        console.error("Error fetching club ratings:", err);
        setClubs(processedClubs); // Use clubs without ratings if rating fetch fails
      }
      
    } catch (err) {
      console.error("Error fetching clubs:", err);
      
      // Fallback to mock data
      console.log("Error occurred, using mock data as fallback");
      const mockClubs = [
        { 
          id: 1, 
          name: 'TK Team Kunchev', 
          town: 'Sofia', 
          telephone: '+359 888 123 456', 
          hourly_price: 25,
          average_rating: 4.5
        },
        { 
          id: 2, 
          name: 'Tennis club Tangra 95', 
          town: 'Targovishte', 
          telephone: '+359 888 234 567', 
          hourly_price: 20,
          average_rating: 3.8
        },
        { 
          id: 3, 
          name: 'Komak Sport', 
          town: 'Sofia', 
          telephone: '+359 888 345 678', 
          hourly_price: 30,
          average_rating: 4.2
        },
        { 
          id: 4, 
          name: 'Sea Point Aralia', 
          town: 'Varna', 
          telephone: '+359 888 456 789', 
          hourly_price: 15,
          average_rating: 4.7
        },
        { 
          id: 5, 
          name: 'Tennis club DIM Team', 
          town: 'Plovdiv', 
          telephone: '+359 888 567 890', 
          hourly_price: 22,
          average_rating: 3.5
        },
      ];
      
      // Apply client-side filtering for mock data
      let filteredClubs = [...mockClubs];
      
      if (filterParams.name) {
        const nameFilter = filterParams.name.toLowerCase();
        filteredClubs = filteredClubs.filter(club => 
          club.name.toLowerCase().includes(nameFilter)
        );
      }
      
      if (filterParams.city) {
        const cityFilter = filterParams.city.toLowerCase();
        filteredClubs = filteredClubs.filter(club => 
          club.town && club.town.toLowerCase().includes(cityFilter)
        );
      }
      
      if (filterParams.minPrice && filterParams.maxPrice) {
        const minPrice = parseFloat(filterParams.minPrice);
        const maxPrice = parseFloat(filterParams.maxPrice);
        filteredClubs = filteredClubs.filter(club => 
          club.hourly_price >= minPrice && club.hourly_price <= maxPrice
        );
      } else if (filterParams.minPrice) {
        const minPrice = parseFloat(filterParams.minPrice);
        filteredClubs = filteredClubs.filter(club => 
          club.hourly_price >= minPrice
        );
      } else if (filterParams.maxPrice) {
        const maxPrice = parseFloat(filterParams.maxPrice);
        filteredClubs = filteredClubs.filter(club => 
          club.hourly_price <= maxPrice
        );
      }
      
      setClubs(filteredClubs);
      setError(null); // Don't show error since we're using mock data
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
  };
  
  // Handle search button click
  const handleSearch = () => {
    fetchClubs(filters);
  };

  const resetFilters = () => {
    setFilters({ name: '', city: '', minPrice: '', maxPrice: '' });
    fetchClubs({});
  };

  return (
    <div className="flex flex-col">
      {/* Hero Image and Search Section */}
      <div 
        className="relative flex items-center justify-center h-64 bg-cover bg-center"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1545809074-59472b3f5ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80")' 
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-white mb-6">Find and Book Sports Facilities</h1>
            
            {/* Search Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  placeholder="Club Name"
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                />
                {filters.name && (
                  <button
                    type="button"
                    onClick={() => {
                      const newFilters = { ...filters, name: '' };
                      setFilters(newFilters);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-700 hover:text-gray-900"
                    aria-label="Clear name filter"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="relative">
                <select 
                  name="city"
                  value={filters.city}
                  onChange={handleFilterChange}
                  className="appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                >
                  <option value="">All Cities</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              
              {/* Price Range Filter - Minimum */}
              <div className="relative">
                <button
                  onClick={() => setShowPriceModal(true)}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 flex justify-between items-center"
                >
                  <span>
                    {filters.minPrice || filters.maxPrice ? 
                      `€${filters.minPrice || '0'} - €${filters.maxPrice || '∞'}` : 
                      'Price Range'}
                  </span>
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>
              
              {/* Price Range Modal */}
              <PriceFilterModal 
                isOpen={showPriceModal} 
                onClose={() => setShowPriceModal(false)}
                priceRange={{
                  min: parseInt(filters.minPrice) || 0,
                  max: parseInt(filters.maxPrice) || 200
                }}
                setPriceRange={setPriceRange}
                onApply={(range) => {
                  // Make sure min doesn't exceed max
                  const validRange = {
                    min: Math.min(range.min, range.max),
                    max: Math.max(range.min, range.max)
                  };
                  
                  setFilters(prev => ({
                    ...prev,
                    minPrice: validRange.min > 0 ? validRange.min.toString() : '',
                    maxPrice: validRange.max < 300 ? validRange.max.toString() : ''
                  }));
                }}
              />
              
              <div className="relative">
                <button 
                  onClick={resetFilters}
                  className="bg-gray-600 hover:bg-gray-700 text-white w-full font-bold py-3 px-4 rounded transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Clubs Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {Object.values(filters).some(f => f !== '') ? 'Search Results' : 'Featured Clubs'}
          </h2>
          {Object.values(filters).some(f => f !== '') && (
            <button 
              onClick={resetFilters}
              className="text-gray-400 hover:text-white"
            >
              Reset Filters
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading clubs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 mb-4">No clubs found matching your criteria.</p>
            <button 
              onClick={resetFilters}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {clubs.map(club => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
      </div>
      
      {/* Call to Action */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to join?</h2>
          <p className="text-white mb-6 max-w-2xl mx-auto">Create an account to book sports facilities, join clubs, and participate in tournaments.</p>
          {!isAuthenticated() && (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register" className="bg-white text-orange-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-full transition-colors">
                Register Now
              </Link>
              <Link to="/login" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-orange-600 font-bold py-3 px-6 rounded-full transition-colors">
                Log In
              </Link>
            </div>
          )}
          {isAuthenticated() && (
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-white text-orange-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-full transition-colors"
            >
              Go to Your Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage; 