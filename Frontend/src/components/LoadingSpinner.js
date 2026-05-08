import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = '', text = 'Loading...' }) => (
  <div className="loading-container">
    <div className={`loading-spinner ${size}`} />
    {text && <p className="loading-text">{text}</p>}
  </div>
);

export default LoadingSpinner;
