import React from 'react';
import './Toast.css';

const Toast = ({ type, message, onClose }) => {
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-circle',
  };

  return (
    <div className={`toast toast-${type}`}>
      <i className={`fas ${icons[type] || icons.info}`} />
      <span className="toast-message">{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose}>
          <i className="fas fa-times" />
        </button>
      )}
    </div>
  );
};

export default Toast;