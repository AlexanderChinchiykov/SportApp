import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../utils/auth';

// Mock data for sports categories
const SPORTS_CATEGORIES = [
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'badminton', name: 'Badminton', icon: '🏸' },
  { id: 'swimming', name: 'Swimming', icon: '🏊' },
  { id: 'running', name: 'Running', icon: '🏃' },
  { id: 'cycling', name: 'Cycling', icon: '🚴' },
  { id: 'martialarts', name: 'Martial Arts', icon: '🥋' },
];

// Mock chat messages
const MOCK_MESSAGES = {
  tennis: [
    { id: 1, username: 'JohnDoe', message: 'Anyone up for a tennis match this weekend?', timestamp: '2023-06-10T14:30:00' },
    { id: 2, username: 'TennisLover', message: "I'm free on Saturday afternoon.", timestamp: '2023-06-10T15:45:00' },
    { id: 3, username: 'RacketMaster', message: 'Which court do you usually play at?', timestamp: '2023-06-10T16:20:00' },
  ],
  football: [
    { id: 1, username: 'SoccerFan', message: 'Looking for players for our 5-a-side game on Sunday', timestamp: '2023-06-11T10:15:00' },
    { id: 2, username: 'GoalKeeper', message: 'What time are you playing?', timestamp: '2023-06-11T11:30:00' },
  ],
  basketball: [
    { id: 1, username: 'BballPro', message: 'New court opened near downtown, anyone tried it?', timestamp: '2023-06-09T09:45:00' },
  ],
  volleyball: [],
  badminton: [],
  swimming: [],
  running: [],
  cycling: [],
  martialarts: [
    { id: 1, username: 'KarateKid', message: 'Looking for a sparring partner this weekend', timestamp: '2023-06-10T14:30:00' },
    { id: 2, username: 'JudoMaster', message: 'Which dojo do you train at?', timestamp: '2023-06-10T15:45:00' },
  ],
};

// Mock news data
const MOCK_NEWS = {
  tennis: [
    { id: 1, title: 'Local Tennis Tournament', content: 'Annual city tournament starts next week. Registration open until Friday.', date: '2023-06-08' },
    { id: 2, title: 'New Tennis Coach at Central Club', content: 'Former pro player Mark Johnson joins Central Tennis Club as head coach.', date: '2023-06-05' },
  ],
  football: [
    { id: 1, title: 'Youth Football League', content: 'Registration for the summer youth league is now open.', date: '2023-06-10' },
  ],
  basketball: [
    { id: 1, title: 'Street Basketball Competition', content: '3x3 tournament in the city center this weekend.', date: '2023-06-07' },
    { id: 2, title: 'Basketball Court Renovations', content: 'The main city court will be closed for renovations next month.', date: '2023-06-01' },
  ],
  volleyball: [
    { id: 1, title: 'Beach Volleyball Season', content: 'Beach volleyball courts now open for the summer.', date: '2023-06-03' },
  ],
  badminton: [
    { id: 1, title: 'Badminton Club Membership', content: 'Special discount for new members this month.', date: '2023-06-02' },
  ],
  swimming: [
    { id: 1, title: 'Swimming Pool Schedule', content: 'Updated summer schedule for all city pools.', date: '2023-06-04' },
  ],
  running: [
    { id: 1, title: 'Marathon Training', content: 'Group training for the fall marathon starts next week.', date: '2023-06-09' },
  ],
  cycling: [
    { id: 1, title: 'Cycling Routes Guide', content: 'New guide with the best cycling routes in the region.', date: '2023-06-06' },
  ],
  martialarts: [
    { id: 1, title: 'Karate Championship', content: 'Regional karate championship registrations now open.', date: '2023-06-08' },
    { id: 2, title: 'New MMA Gym', content: 'Mixed martial arts gym opening next month with free trial classes.', date: '2023-06-05' },
  ],
};

const SportsCommunity = () => {
  const { sportId = 'tennis' } = useParams(); // Default to tennis if no sport specified
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [news, setNews] = useState([]);
  
  // Check authentication and load user data
  useEffect(() => {
    const authStatus = isAuthenticated();
    if (!authStatus) {
      navigate('/login');
      return;
    }
    
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, [navigate]);
  
  // Load messages and news for the selected sport
  useEffect(() => {
    if (sportId) {
      // Load mock messages for the selected sport
      setMessages(MOCK_MESSAGES[sportId] || []);
      
      // Load mock news for the selected sport
      setNews(MOCK_NEWS[sportId] || []);
    }
  }, [sportId]);
  
  // Handle sport selection
  const handleSportSelect = (sport) => {
    navigate(`/community/${sport.id}`);
  };
  
  // Handle message submission
  const handleSubmitMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Create a new message object
    const newMessage = {
      id: messages.length + 1,
      username: user?.username || 'Anonymous',
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };
    
    // Add message to the current sport's messages
    setMessages(prev => [...prev, newMessage]);
    
    // Clear input
    setMessage('');
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format timestamp for chat messages
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get current sport object
  const currentSport = SPORTS_CATEGORIES.find(sport => sport.id === sportId) || SPORTS_CATEGORIES[0];
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-white mb-6">Sports Community</h1>
      
      {/* Sports Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SPORTS_CATEGORIES.map(sport => (
          <button
            key={sport.id}
            onClick={() => handleSportSelect(sport)}
            className={`flex items-center px-4 py-2 rounded-full ${
              sport.id === sportId 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            <span className="mr-2 text-xl">{sport.icon}</span>
            <span>{sport.name}</span>
          </button>
        ))}
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Chat Section - Left side */}
        <div className="w-full md:w-2/3">
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-700 border-b border-gray-600 flex items-center">
              <span className="text-2xl mr-2">{currentSport.icon}</span>
              <h2 className="text-xl font-semibold text-white">{currentSport.name} Community Chat</h2>
            </div>
            
            {/* Chat Messages */}
            <div className="p-4 h-[400px] overflow-y-auto flex flex-col space-y-4 bg-gray-800">
              {messages.length > 0 ? (
                messages.map(msg => (
                  <div key={msg.id} className="flex flex-col">
                    <div className="flex items-baseline">
                      <span className="font-bold text-blue-400">{msg.username}</span>
                      <span className="ml-2 text-xs text-gray-400">{formatTimestamp(msg.timestamp)}</span>
                    </div>
                    <p className="text-gray-200 mt-1">{msg.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <p>No messages yet. Be the first to start the conversation!</p>
                </div>
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-4 bg-gray-700 border-t border-gray-600">
              <form onSubmit={handleSubmitMessage} className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
        
        {/* News Section - Right side */}
        <div className="w-full md:w-1/3">
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-700 border-b border-gray-600">
              <h2 className="text-xl font-semibold text-white">{currentSport.name} News</h2>
            </div>
            
            <div className="p-4 h-[465px] overflow-y-auto">
              {news.length > 0 ? (
                news.map(item => (
                  <div key={item.id} className="mb-4 pb-4 border-b border-gray-700 last:border-0">
                    <h3 className="text-lg font-medium text-white">{item.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{formatDate(item.date)}</p>
                    <p className="text-gray-300">{item.content}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <p>No news available for this sport.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportsCommunity; 