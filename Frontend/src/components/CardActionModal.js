import React, { useState } from 'react';
import { creditCardAPI } from '../api/api';

const CardActionModal = ({
  type,
  card,
  onClose,
  onSuccess
}) => {

  const [formData, setFormData] = useState({
    amount: '',
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
        onSuccess();
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

      <div
        className="modal-content"
        style={{ maxWidth: '500px' }}
      >

        {/* HEADER */}
        <div className="modal-header">

          <h2>
            {isPurchase
              ? 'Simulate Purchase'
              : 'Make Payment'}
          </h2>

          <button
            className="btn-close"
            onClick={onClose}
            disabled={isLoading}
          >
            <i className="fas fa-times"></i>
          </button>

        </div>

        {/* ERROR */}
        {error && (
          <div
            className="alert alert-danger"
            style={{
              marginBottom: '1rem',
              whiteSpace: 'pre-line'
            }}
          >
            {error}
          </div>
        )}

        {/* CARD INFO */}
        <div
          className="loan-info-box"
          style={{ marginBottom: '1rem' }}
        >

          <p>
            <b>Card:</b> ****
            {card.card_number?.slice(-4)}
          </p>

          <p>
            <b>Available Limit:</b> ₹
            {Number(card.available_limit).toLocaleString('en-IN')}
          </p>

        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>

          {/* PURCHASE */}
          {isPurchase && (
            <>

              {/* AMOUNT */}
              <div className="form-group">

                <label>Purchase Amount</label>

                <div className="input-with-icon">

                  <span className="input-icon">
                    ₹
                  </span>

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

              {/* MERCHANT */}
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

          {/* PAYMENT */}
          {isPayment && (
            <>

              <div className="form-group">

                <label>Payment Amount</label>

                <div className="input-with-icon">

                  <span className="input-icon">
                    ₹
                  </span>

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



            </>
          )}

          {/* ACTIONS */}
          <div className="loan-modal-actions">

            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading}
            >

              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Processing...
                </>
              ) : (
                <>
                  {isPurchase
                    ? 'Complete Purchase'
                    : 'Make Payment'}
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default CardActionModal;