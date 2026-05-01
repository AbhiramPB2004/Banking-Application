import React, { useState, useEffect } from 'react';
import { loanAPI, accountAPI } from '../api/api';
import './LoanPaymentModal.css';

const LoanPaymentModal = ({ type, loan, onClose, onSuccess }) => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Calculate approximate foreclosure if needed
  // Note: Backend does accurate calculation, this is for UI estimate.
  const [foreclosureEstimate, setForeclosureEstimate] = useState(null);

  const isForeclosure = type === 'foreclose';
  const paymentAmount = isForeclosure 
    ? (foreclosureEstimate || loan.outstanding_balance) 
    : loan.monthly_emi;

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await accountAPI.getMyAccounts();
        if (res.success && res.data.length > 0) {
          setAccounts(res.data);
          setSelectedAccountId(res.data[0].account_id);
        }
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      }
    };
    fetchAccounts();

    // If foreclosure, calculate 4% penalty estimate
    if (isForeclosure) {
      const balance = parseFloat(loan.outstanding_balance);
      const estimate = balance + (balance * 0.04);
      setForeclosureEstimate(estimate);
    }
  }, [isForeclosure, loan.outstanding_balance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isForeclosure) {
        const res = await loanAPI.forecloseLoan(loan.loan_id, {
          source_account_id: selectedAccountId
        });
        if (res.success) onSuccess(res.data);
      } else {
        const res = await loanAPI.makePayment({
          loan_id: loan.loan_id,
          payment_amount: Number(paymentAmount),
          source_account_id: selectedAccountId
        });
        if (res.success) onSuccess(res.data);
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please check your balance.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>{isForeclosure ? 'Foreclose Loan' : 'Pay EMI'}</h2>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <div className="payment-summary">
          <div className="label">{isForeclosure ? 'Estimated Foreclosure Amount' : 'EMI Amount Due'}</div>
          <div className={`amount ${isForeclosure ? 'foreclose' : ''}`}>
            ₹{parseFloat(paymentAmount).toLocaleString('en-IN')}
          </div>
          {isForeclosure && (
            <small style={{ color: 'var(--text-secondary)' }}>Includes approx. penalty charges.</small>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Source Account</label>
            <select 
              value={selectedAccountId} 
              onChange={(e) => setSelectedAccountId(e.target.value)} 
              required
            >
              {accounts.length === 0 && <option value="">No active accounts found</option>}
              {accounts.map(acc => {
                const bal = parseFloat(acc.balance);
                const isInsufficient = bal < paymentAmount;
                return (
                  <option key={acc.account_id} value={acc.account_id} disabled={isInsufficient}>
                    {acc.account_type.toUpperCase()} - ****{acc.account_number.slice(-4)} 
                    (Bal: ₹{bal.toLocaleString('en-IN')}) {isInsufficient ? ' - INSUFFICIENT' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="modal-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={isForeclosure ? 'btn-danger' : 'btn-primary'} 
              style={isForeclosure ? { background: '#ef4444', color: 'white', border: 'none' } : {}}
              disabled={isLoading || accounts.length === 0}
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Processing...</>
              ) : (
                isForeclosure ? 'Confirm Foreclosure' : 'Pay Now'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanPaymentModal;
