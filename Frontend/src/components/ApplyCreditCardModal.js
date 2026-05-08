import React, { useState, useEffect } from 'react';
import { creditCardAPI, accountAPI } from '../api/api';

const ApplyCreditCardModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    requested_limit: '',
    source_account_id: '',
    card_tier: 'entry'
  });

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [estimatedLimit, setEstimatedLimit] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await accountAPI.getMyAccounts();
        if (res.success && res.data.length > 0) {
          setAccounts(res.data);
          setFormData(prev => ({
            ...prev,
            source_account_id: res.data[0].account_id
          }));
          setSelectedAccount(res.data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      }
    };

    fetchAccounts();
  }, []);

  // 🔥 Update selected account
  useEffect(() => {
    const acc = accounts.find(a => a.account_id === formData.source_account_id);
    setSelectedAccount(acc || null);
  }, [formData.source_account_id, accounts]);

  // 🔥 Estimate limit (frontend preview)
  useEffect(() => {
    if (!selectedAccount) return;

    const balance = parseFloat(selectedAccount.balance);

    const estimated = balance * 0.5; // same logic as backend cap
    setEstimatedLimit(Math.floor(estimated));
  }, [selectedAccount]);

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
        source_account_id: formData.source_account_id,
        card_tier: formData.card_tier
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

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        
        {/* Header */}
        <div className="modal-header">
          <h2>Apply for Horizon VISA</h2>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger" style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="cc-form-wrapper">

          <div className="loan-form-grid" style={{ gridTemplateColumns: '1fr' }}>

            {/* Account Selection */}
            <div className="form-group">
              <label>Linked Bank Account</label>
              <select
                name="source_account_id"
                value={formData.source_account_id}
                onChange={handleChange}
                required
              >
                {accounts.map(acc => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.account_type.toUpperCase()} - ****{acc.account_number.slice(-4)} 
                    (₹{parseFloat(acc.balance).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {/* Card Tier */}
            <div className="form-group">
              <label>Card Type</label>
              <select
                name="card_tier"
                value={formData.card_tier}
                onChange={handleChange}
              >
                <option value="entry">Entry</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            {/* Requested Limit */}
            <div className="form-group">
              <label>Requested Credit Limit</label>
              <div className="input-with-icon">
                <span className="input-icon">₹</span>
                <input
                  type="number"
                  name="requested_limit"
                  value={formData.requested_limit}
                  onChange={handleChange}
                  placeholder="e.g. 200000"
                  required
                  min="10000"
                />
              </div>
            </div>

            {/* 🔥 Limit Preview */}
            {estimatedLimit && (
              <div className="loan-info-box">
                <p>
                  Estimated Eligible Limit: <b>₹{estimatedLimit.toLocaleString('en-IN')}</b>
                </p>
                <small style={{ color: 'var(--text-secondary)' }}>
                  Final approval depends on income, liabilities & risk score.
                </small>
              </div>
            )}

            {/* Info */}
            <div className="loan-info-box">
              <p>
                Your <b>KYC</b>, <b>income</b>, and <b>credit profile</b> will be verified automatically.
              </p>
            </div>

          </div>

          {/* Actions */}
          <div className="loan-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>

            <button type="submit" className="btn-submit" disabled={isLoading || accounts.length === 0}>
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Evaluating...</>
              ) : (
                <>Apply Now <i className="fas fa-arrow-right"></i></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyCreditCardModal;