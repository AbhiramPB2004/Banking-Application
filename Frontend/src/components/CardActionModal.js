import React, { useState } from 'react';
import { creditCardAPI } from '../api/api';

const CardActionModal = ({ type, card, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isPurchase = type === 'purchase';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let res;
      if (isPurchase) {
        res = await creditCardAPI.processPurchase({
          card_id: card.card_id,
          amount: Number(amount)
        });
      } else {
        res = await creditCardAPI.makePayment({
          card_id: card.card_id,
          payment_amount: Number(amount)
        });
      }

      if (res.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.data?.message || err.message || 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2>{isPurchase ? 'Simulate Purchase' : 'Pay Credit Card Bill'}</h2>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              {isPurchase ? 'Purchase Amount' : 'Payment Amount'}
            </label>
            <div className="input-with-icon">
              <span className="input-icon">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                placeholder="e.g. 5000"
                required
                min="1"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary)',
                  padding: '0.8rem 1rem 0.8rem 2.5rem',
                  borderRadius: '12px',
                  fontSize: '1rem'
                }}
              />
            </div>
            {isPurchase ? (
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                Available Limit: ₹{card.available_limit.toLocaleString('en-IN')}
              </small>
            ) : (
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                Outstanding Balance: ₹{card.outstanding_balance.toLocaleString('en-IN')}
              </small>
            )}
          </div>

          <div className="loan-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Processing...</>
              ) : (
                <>{isPurchase ? 'Approve Transaction' : 'Confirm Payment'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardActionModal;
