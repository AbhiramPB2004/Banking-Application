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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

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

        setError(
          err.data.errors
            .map((e) => e.message)
            .join('\n')
        );

      } else {

        setError(
          err.message || 'Failed to create account'
        );
      }

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">

      <div
        className="modal-content"
        style={{ maxWidth: '500px' }}
      >

        <div className="modal-header">
          <h2>Open New Account</h2>

          <button
            className="btn-close"
            onClick={onClose}
            disabled={isLoading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div
            className="alert alert-danger"
            style={{
              whiteSpace: 'pre-line',
              marginBottom: '1.5rem'
            }}
          >
            {error}
          </div>
        )}

        <form
          className="create-account-form"
          onSubmit={handleSubmit}
        >

          {/* Account Type */}

          <div className="form-group">

            <label>Account Type</label>

            <select
              name="account_type"
              value={formData.account_type}
              onChange={handleChange}
              required
            >
              <option value="savings">
                Savings Account
              </option>

              <option value="current">
                Current Account
              </option>

              <option value="salary">
                Salary Account
              </option>
            </select>

          </div>

          {/* Initial Deposit */}

          <div className="form-group">

            <label>Initial Deposit</label>

            <div className="ca-input-with-icon">

              <span className="ca-input-icon">
                ₹
              </span>

              <input
                type="number"
                name="initial_deposit"
                value={formData.initial_deposit}
                onChange={handleChange}

                placeholder={
                  formData.account_type === "salary"
                    ? "e.g. 0"
                    : formData.account_type === "current"
                    ? "e.g. 5000"
                    : "e.g. 1000"
                }

                required

                min={
                  formData.account_type === "salary"
                    ? "0"
                    : formData.account_type === "current"
                    ? "5000"
                    : "1000"
                }
              />

            </div>

            <small
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.75rem'
              }}
            >
              {
                formData.account_type === "salary"
                  ? "Zero balance salary account allowed"
                  : formData.account_type === "current"
                  ? "Minimum ₹5,000 required for current account"
                  : "Minimum ₹1,000 required for savings account"
              }
            </small>

          </div>

          {/* Buttons */}

          <div className="ca-modal-actions">

            <button
              type="button"
              className="ca-btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ca-btn-submit"
              disabled={isLoading}
            >

              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  {' '}
                  Processing...
                </>
              ) : (
                <>
                  Open Account
                  {' '}
                  <i className="fas fa-plus-circle"></i>
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default CreateAccountModal;