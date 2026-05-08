import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = ({ onLoginClick, onRegisterClick }) => {
  const { isLoggedIn, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={isLoggedIn ? '/dashboard' : '/'} className="nav-logo">
          <div className="logo-icon">
            <i className="fas fa-landmark" />
          </div>
          <span>Horizon<span className="logo-highlight">Bank</span></span>
        </Link>

        <div className="nav-menu">
          {!isLoggedIn ? (
            <>
              <button className="nav-btn-outline" onClick={onLoginClick}>
                <i className="fas fa-sign-in-alt" /> Login
              </button>
              <button className="nav-btn-primary" onClick={onRegisterClick}>
                <i className="fas fa-user-plus" /> Open Account
              </button>
            </>
          ) : (
            <div className="user-menu">
              <div className="user-greeting">
                <span className="greeting-text">Hello,</span>
                <span className="greeting-name">{currentUser?.full_name?.split(' ')[0]}</span>
              </div>
              <button className="nav-btn-logout" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;