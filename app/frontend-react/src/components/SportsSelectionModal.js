import React from 'react';
import { useNavigate } from 'react-router-dom';

// Sports categories with icons
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

const SportsSelectionModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  const handleSportSelect = (sport) => {
    navigate(`/community/${sport.id}`);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Select Sport Community</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {SPORTS_CATEGORIES.map(sport => (
            <button
              key={sport.id}
              onClick={() => handleSportSelect(sport)}
              className="flex flex-col items-center p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <span className="text-4xl mb-2">{sport.icon}</span>
              <span className="text-white">{sport.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SportsSelectionModal; 