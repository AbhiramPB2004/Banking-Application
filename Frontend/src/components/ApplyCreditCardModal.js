import React, { useState, useEffect } from 'react';
import { creditCardAPI, accountAPI } from '../api/api';
import './ApplyCreditCardModal.css';

const ApplyCreditCardModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    requested_limit: '',
    source_account_id: ''
  });
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await accountAPI.getMyAccounts();
        if (res.success && res.data.length > 0) {
          setAccounts(res.data);
          setFormData(prev => ({ ...prev, source_account_id: res.data[0].account_id }));
        }
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      }
    };
    fetchAccounts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        requested_limit: Number(formData.requested_limit),
        source_account_id: formData.source_account_id
      };

      const res = await creditCardAPI.applyForCard(payload);
      if (res.success) {
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to apply for credit card');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cc-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Apply for Horizon VISA Premium</h2>
            <p className="modal-subtitle">Get instant credit approval with competitive rates</p>
          </div>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="cc-form-wrapper">
          <div className="cc-form-grid">
            <div className="form-group">
              <label>
                <i className="fas fa-rupee-sign"></i> Requested Credit Limit
              </label>
              <div className="input-with-icon">
                <span className="input-icon">₹</span>
                <input
                  type="number"
                  name="requested_limit"
                  value={formData.requested_limit}
                  onChange={handleChange}
                  placeholder="Enter desired credit limit"
                  required
                  min="10000"
                  step="5000"
                />
              </div>
              <div className="input-hint">
                <i className="fas fa-info-circle"></i>
                Minimum ₹10,000 | Subject to credit score approval
              </div>
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-university"></i> Linked Bank Account
              </label>
              <select name="source_account_id" value={formData.source_account_id} onChange={handleChange} required>
                {accounts.length === 0 && <option value="">No active accounts found</option>}
                {accounts.map(acc => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.account_type.toUpperCase()} - ****{acc.account_number?.slice(-4) || '****'} 
                    (Balance: {formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
              <div className="input-hint">
                <i className="fas fa-link"></i>
                This account will be used for auto-debit payments
              </div>
            </div>
          </div>

          {/* Enhanced Verification Box */}
          <div className="cc-verification-box">
            <div className="verification-header">
              <i className="fas fa-shield-alt"></i>
              <span>Auto-Verification Details</span>
            </div>
            <div className="verification-content">
              <div className="verification-item">
                <i className="fas fa-id-card"></i>
                <div className="verification-info">
                  <span className="verification-label">KYC Status</span>
                  <span className="verification-value">Will be verified automatically</span>
                </div>
                <i className="fas fa-check-circle verification-icon"></i>
              </div>
              <div className="verification-item">
                <i className="fas fa-chart-line"></i>
                <div className="verification-info">
                  <span className="verification-label">Annual Income</span>
                  <span className="verification-value">Auto-fetched from profile</span>
                </div>
                <i className="fas fa-check-circle verification-icon"></i>
              </div>
              <div className="verification-item">
                <i className="fas fa-credit-card"></i>
                <div className="verification-info">
                  <span className="verification-label">Credit Score</span>
                  <span className="verification-value">Real-time verification</span>
                </div>
                <i className="fas fa-clock verification-icon pending"></i>
              </div>
            </div>
            <div className="verification-footer">
              <i className="fas fa-lock"></i>
              Your information is securely encrypted and verified in real-time
            </div>
          </div>

          <div className="cc-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isLoading}>
              <i className="fas fa-times"></i> Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit" 
              disabled={isLoading || accounts.length === 0 || !formData.requested_limit || formData.requested_limit < 10000}
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Analyzing Credit...</>
              ) : (
                <><i className="fas fa-check-circle"></i> Submit Application</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyCreditCardModal;