import React from 'react';
import './CreditCardStatementModal.css';

const CreditCardStatementModal = ({
  data,
  onClose
}) => {

  if (!data) return null;

  return (
    <div className="modal-overlay">

      <div
        className="modal-content statement-modal"
        style={{ maxWidth: '700px' }}
      >

        {/* HEADER */}
        <div className="modal-header">

          <div>
            <h2>Credit Card Statement</h2>
            <p style={{ marginTop: '4px', opacity: 0.7 }}>
              {data.statement_date}
            </p>
          </div>

          <button
            className="btn-close"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>

        </div>

        {/* CARD INFO */}
        <div className="statement-card">

          <div className="statement-row">
            <span>
              <i className="fas fa-hashtag" style={{ marginRight: '8px', opacity: 0.7 }}></i>
              Card Number
            </span>
            <strong>{data.card_number}</strong>
          </div>

          <div className="statement-row">
            <span>
              <i className="fas fa-shield-alt" style={{ marginRight: '8px', opacity: 0.7 }}></i>
              Card Status
            </span>
            <strong
              className={data.status === 'active' ? 'statement-success' : 'statement-danger'}
            >
              {data.status?.toUpperCase()}
            </strong>
          </div>

          <div className="statement-row">
            <span>
              <i className="fas fa-coins" style={{ marginRight: '8px', opacity: 0.7 }}></i>
              Available Limit
            </span>
            <strong className="statement-highlight">
              ₹{Number(data.available_limit).toLocaleString('en-IN')}
            </strong>
          </div>

          <div className="statement-row">
            <span>
              <i className="fas fa-exclamation-circle" style={{ marginRight: '8px', opacity: 0.7 }}></i>
              Outstanding Balance
            </span>
            <strong className={Number(data.outstanding_balance) > 0 ? 'statement-danger' : ''}>
              ₹{Number(data.outstanding_balance).toLocaleString('en-IN')}
            </strong>
          </div>

          <div className="statement-row">
            <span>
              <i className="fas fa-hourglass-half" style={{ marginRight: '8px', opacity: 0.7 }}></i>
              Minimum Due
            </span>
            <strong className="statement-warning">
              ₹{Number(data.minimum_due).toLocaleString('en-IN')}
            </strong>
          </div>

          <div className="statement-row">
            <span>
              <i className="fas fa-calendar-alt" style={{ marginRight: '8px', opacity: 0.7 }}></i>
              Due Date
            </span>
            <strong>{data.due_date}</strong>
          </div>

          <div className="statement-row">
            <span>
              <i className="fas fa-redo-alt" style={{ marginRight: '8px', opacity: 0.7 }}></i>
              Billing Cycle Date
            </span>
            <strong>
              Every month on day {data.billing_cycle_date}
            </strong>
          </div>

        </div>

        {/* MESSAGE */}
        <div className="statement-message">
          <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
          {data.message}
        </div>

        {/* FOOTER */}
        <div className="statement-footer">
          <button
            className="statement-close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>

      </div>

    </div>
  );
};

export default CreditCardStatementModal;