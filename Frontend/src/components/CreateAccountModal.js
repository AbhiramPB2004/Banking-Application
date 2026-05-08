import React, { useState } from 'react';
import { accountAPI } from '../api/api';
import './CreateAccountModal.css';

const CreateAccountModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    account_type: 'savings',
    initial_deposit: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        account_type: formData.account_type,
        initial_deposit: Number(formData.initial_deposit)
      };

      const res = await accountAPI.createAccount(payload);
      if (res.success) {
        onSuccess(res.data);
      }
    } catch (err) {
      if (err.data && err.data.errors) {
        setError(err.data.errors.join('\n'));
      } else {
        setError(err.message || 'Failed to create account');
      }
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
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Open New Account</h2>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <form className="create-account-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              <i className="fas fa-university"></i> Account Type
            </label>
            <select name="account_type" value={formData.account_type} onChange={handleChange} required>
              <option value="savings">Savings Account</option>
              <option value="current">Current Account</option>
              <option value="salary">Salary Account</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-rupee-sign"></i> Initial Deposit
            </label>
            <div className="ca-input-with-icon">
              <span className="ca-input-icon">₹</span>
              <input
                type="number"
                name="initial_deposit"
                value={formData.initial_deposit}
                onChange={handleChange}
                placeholder="Enter initial deposit amount"
                required
                min="1000"
                step="1000"
              />
            </div>
            <small>
              <i className="fas fa-info-circle"></i> Minimum ₹1,000 required to open an account
            </small>
          </div>

          <div className="ca-modal-actions">
            <button type="button" className="ca-btn-cancel" onClick={onClose} disabled={isLoading}>
              <i className="fas fa-times"></i> Cancel
            </button>
            <button type="submit" className="ca-btn-submit" disabled={isLoading}>
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Processing...</>
              ) : (
                <><i className="fas fa-plus-circle"></i> Open Account</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountModal;