import React, { useState, useEffect } from 'react';
import { creditCardAPI, accountAPI } from '../api/api';

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

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>Apply for Horizon VISA Premium</h2>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="cc-form-wrapper">
          <div className="loan-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            
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
              <small style={{color:'var(--text-secondary)', fontSize:'0.75rem'}}>Subject to credit score approval.</small>
            </div>

            <div className="form-group">
              <label>Linked Bank Account</label>
              <select name="source_account_id" value={formData.source_account_id} onChange={handleChange} required>
                {accounts.length === 0 && <option value="">No active accounts found</option>}
                {accounts.map(acc => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.account_type.toUpperCase()} - ****{acc.account_number.slice(-4)} (Bal: ₹{parseFloat(acc.balance).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div className="loan-info-box" style={{marginTop: '0.5rem'}}>
              <p>Your <b>KYC status</b> and <b>Annual Income</b> will be automatically verified from your user profile.</p>
            </div>
            
          </div>

          <div className="loan-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={isLoading || accounts.length === 0}>
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Analyzing Credit...</>
              ) : (
                <>Submit Application <i className="fas fa-arrow-right"></i></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyCreditCardModal;
