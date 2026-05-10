import React, { useState } from 'react';
import { creditCardAPI } from '../api/api';
import './CardActionModal.css';

const CardActionModal = ({
  type,
  card,
  onClose,
  onSuccess
}) => {

  const [formData, setFormData] = useState({
    amount: type === 'payment' ? card.outstanding_balance : '',
    merchant: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isPurchase = type === 'purchase';
  const isPayment = type === 'payment';

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

      let res;

      /**
       * PURCHASE FLOW
       */
      if (isPurchase) {

        const payload = {
          card_id: card.card_id,
          amount: Number(formData.amount),
          merchant: formData.merchant
        };

        res = await creditCardAPI.processPurchase(payload);
      }

      /**
       * PAYMENT FLOW
       */
      if (isPayment) {

        const payload = {
          card_id: card.card_id,
          payment_amount: Number(formData.amount)
        };

        res = await creditCardAPI.makePayment(payload);
      }

      if (res.success) {
        onSuccess(card.card_id);
        onClose();
      }

    } catch (err) {

      setError(
        err.data?.message ||
        err.message ||
        'Transaction failed'
      );

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>{isPurchase ? 'Make Purchase' : 'Pay Balance'}</h2>
            <button className="btn-close" onClick={onClose} disabled={isLoading} type="button">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-circle" />
                <span>{error}</span>
              </div>
            )}

            <div className="modal-info-box">
              <p><b>Card:</b> ****{card.card_number?.slice(-4)}</p>
              {isPayment ? (
                <>
                  <p><b>Outstanding Balance:</b> <span className="text-danger">₹{Number(card.outstanding_balance).toLocaleString('en-IN')}</span></p>
                  <p><b>Due Date:</b> {card.due_date ? new Date(card.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                </>
              ) : (
                <p><b>Available Limit:</b> ₹{Number(card.available_limit).toLocaleString('en-IN')}</p>
              )}
            </div>

            {isPurchase && (
              <>
                <div className="form-group">
                  <label>Purchase Amount</label>
                  <div className="input-with-icon">
                    <span className="input-icon">₹</span>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="Enter amount"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Merchant Name</label>
                  <input
                    type="text"
                    name="merchant"
                    value={formData.merchant}
                    onChange={handleChange}
                    placeholder="e.g. Amazon, Swiggy"
                    required
                  />
                </div>
              </>
            )}

            {isPayment && (
              <div className="form-group">
                <label>Payment Amount</label>
                <div className="input-with-icon">
                  <span className="input-icon">₹</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter payment amount"
                    required
                    min="1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Processing...</>
              ) : (
                <>{isPurchase ? 'Make Purchase' : 'Pay Balance'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardActionModal;