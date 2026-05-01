import React, { useState, useEffect } from 'react';
import { loanAPI, accountAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './LoanApplicationModal.css';

const LoanApplicationModal = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  
  const hasValidIncome = currentUser && Number(currentUser.annual_income) >= 100000;
  
  const [formData, setFormData] = useState({
    loan_type: 'personal',
    requested_amount: '',
    tenure_months: '',
    annual_income: hasValidIncome ? currentUser.annual_income : '',
    existing_liabilities: '0',
    linked_account_id: ''
  });

  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch active accounts for disbursal dropdown
    const fetchAccounts = async () => {
      try {
        const res = await accountAPI.getMyAccounts();
        if (res.success && res.data.length > 0) {
          setAccounts(res.data);
          setFormData(prev => ({ ...prev, linked_account_id: res.data[0].account_id }));
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
        ...formData,
        requested_amount: Number(formData.requested_amount),
        tenure_months: Number(formData.tenure_months),
        annual_income: Number(formData.annual_income),
        existing_liabilities: Number(formData.existing_liabilities)
      };

      const res = await loanAPI.applyForLoan(payload);
      if (res.success) {
        onSuccess(res.data);
      }
    } catch (err) {
      if (err.data && err.data.errors) {
        setError(err.data.errors.join('\n'));
      } else {
        setError(err.message || 'Failed to apply for loan');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getProductHints = () => {
    switch (formData.loan_type) {
      case 'personal': return '₹50k - ₹20L | 6 - 60 Months';
      case 'home': return '₹5L - ₹2Cr | 12 - 360 Months';
      case 'vehicle': return '₹1L - ₹50L | 12 - 84 Months';
      case 'education': return '₹1L - ₹75L | 12 - 120 Months';
      default: return '';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Apply for a Loan</h2>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="loan-form-grid">
            <div className="form-group">
              <label>Loan Type</label>
              <select name="loan_type" value={formData.loan_type} onChange={handleChange} required>
                <option value="personal">Personal Loan</option>
                <option value="home">Home Loan</option>
                <option value="vehicle">Vehicle Loan</option>
                <option value="education">Education Loan</option>
              </select>
            </div>

            <div className="form-group">
              <label>Linked Account (For Disbursal)</label>
              <select name="linked_account_id" value={formData.linked_account_id} onChange={handleChange} required>
                {accounts.length === 0 && <option value="">No active accounts found</option>}
                {accounts.map(acc => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.account_type.toUpperCase()} - ****{acc.account_number.slice(-4)} (Bal: ₹{parseFloat(acc.balance).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div className="loan-info-box">
              <p>Limits for {formData.loan_type} loan: <span className="highlight">{getProductHints()}</span></p>
            </div>

            <div className="form-group">
              <label>Requested Amount</label>
              <div className="input-with-icon">
                <span className="input-icon">₹</span>
                <input
                  type="number"
                  name="requested_amount"
                  value={formData.requested_amount}
                  onChange={handleChange}
                  placeholder="e.g. 500000"
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tenure</label>
              <div className="input-with-icon">
                <span className="input-icon" style={{fontSize: '0.8rem'}}>MO</span>
                <input
                  type="number"
                  name="tenure_months"
                  value={formData.tenure_months}
                  onChange={handleChange}
                  placeholder="e.g. 24 months"
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Annual Income
                {hasValidIncome && (
                  <span className="badge-verified" title="Verified from Profile">
                    <i className="fas fa-check-circle"></i> Verified
                  </span>
                )}
              </label>
              <div className="input-with-icon">
                <span className="input-icon">₹</span>
                <input
                  type="number"
                  name="annual_income"
                  value={formData.annual_income}
                  onChange={handleChange}
                  disabled={hasValidIncome}
                  className={hasValidIncome ? "input-disabled" : ""}
                  placeholder="e.g. 1200000"
                  required
                  min="100000"
                />
              </div>
              {!hasValidIncome && <small style={{color:'var(--text-secondary)', fontSize:'0.75rem'}}>Minimum ₹1,00,000</small>}
            </div>

            <div className="form-group">
              <label>Existing Monthly Liabilities</label>
              <div className="input-with-icon">
                <span className="input-icon">₹</span>
                <input
                  type="number"
                  name="existing_liabilities"
                  value={formData.existing_liabilities}
                  onChange={handleChange}
                  placeholder="e.g. 15000"
                  required
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="loan-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={isLoading || accounts.length === 0}>
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Processing...</>
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

export default LoanApplicationModal;
