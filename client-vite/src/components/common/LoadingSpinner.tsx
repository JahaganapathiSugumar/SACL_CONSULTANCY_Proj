import React from 'react';
import GearSpinner from './GearSpinner';
import './LoadingSpinner.css';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-spinner">
      <div style={{ transform: 'scale(2)', marginBottom: '1rem', color: '#667eea' }}>
        <GearSpinner />
      </div>
      <p>Loading...</p>
    </div>
  );
};

export default LoadingSpinner;