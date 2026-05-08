import React from 'react';
import './HeroSection.css';

const HeroSection = ({ onRegisterClick, onLoginClick }) => {
  return (
    <div className="hero">
      <div className="hero-bg-grid" />
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fas fa-shield-alt" />
            <span>Trusted by 50,000+ customers</span>
          </div>
          <h1 className="hero-title">
            Banking that <span className="gradient-text">grows</span> with you
          </h1>
          <p className="hero-subtitle">
            Experience seamless digital banking with high-yield savings,
            instant transfers, and enterprise-grade security — all in one platform.
          </p>
          <div className="hero-buttons">
            <button className="hero-btn-primary" onClick={onRegisterClick}>
              <i className="fas fa-rocket" /> Open Account Free
            </button>
            <button className="hero-btn-secondary" onClick={onLoginClick}>
              <i className="fas fa-sign-in-alt" /> Login to Account
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">4.5%</span>
              <span className="hero-stat-label">APY Savings</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">₹0</span>
              <span className="hero-stat-label">Account Fees</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">24/7</span>
              <span className="hero-stat-label">Support</span>
            </div>
          </div>
        </div>

        <div className="hero-card">
          <div className="amex-card">
            <div className="card-bg-pattern" />
            <div className="card-content">
              <div className="card-header">
                <div className="card-chip">
                  <i className="fas fa-microchip" />
                </div>
                <div className="card-contactless">
                  <i className="fas fa-wifi" />
                </div>
              </div>
              <div className="card-number">
                <span>••••</span>
                <span>••••</span>
                <span>••••</span>
                <span>1005</span>
              </div>
              <div className="card-details">
                <div>
                  <div className="card-label">CARD HOLDER</div>
                  <div className="card-value">JOHN M. DOE</div>
                </div>
                <div>
                  <div className="card-label">VALID THRU</div>
                  <div className="card-value">12/28</div>
                </div>
              </div>
              <div className="card-footer">
                <span className="card-brand">HORIZON</span>
                <div className="card-type">
                  <i className="fas fa-gem" />
                  <span>PLATINUM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">
            <i className="fas fa-mobile-alt" />
          </div>
          <h3>Free Debit Card</h3>
          <p>Get a free virtual debit card instantly with ₹1 lakh daily transaction limit</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <i className="fas fa-hand-holding-usd" />
          </div>
          <h3>Flexible Loan Options</h3>
          <p>Pre-approved personal loans starting from just 10.99% interest rate</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <i className="fas fa-rupee-sign" />
          </div>
          <h3>Daily Interest Credits</h3>
          <p>Get interest credited daily to your account with up to 7% per annum on savings</p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;