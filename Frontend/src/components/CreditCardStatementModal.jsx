import React, { useState, useEffect } from 'react';
import './CreditCardStatementModal.css';

const CreditCardStatementModal = ({
  data,
  onClose
}) => {
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Lock/Unlock Body Scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // 2. Keyboard Support (ESC)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!data) return null;

  const transactions = data.transactions || [];

  const filteredTransactions = transactions.filter(txn => {
    // 1. Type Filter (Case-insensitive safety)
    const matchesType = filterType === 'ALL' ||
      (txn.transaction_type?.toUpperCase() === filterType);

    // 2. Search Filter (Safe null handling)
    const sTerm = searchTerm.toLowerCase();
    const matchesSearch =
      (txn.merchant_name || '').toLowerCase().includes(sTerm) ||
      (txn.reference_id || '').toLowerCase().includes(sTerm) ||
      (txn.description || '').toLowerCase().includes(sTerm);

    return matchesType && matchesSearch;
  });

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content statement-modal"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="modal-header">
          <div className="modal-header-info">
            <h2>Credit Card Statement</h2>
            <p className="modal-subtitle">
              Statement as of {new Date(data.statement_date).toLocaleDateString()}
            </p>
          </div>
          <button className="btn-close" onClick={onClose} title="Close (Esc)">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* SUMMARY SECTION */}
        <div className="statement-header-summary">
          <div className="summary-item">
            <label>Card Number</label>
            <span>{data.card_number}</span>
          </div>
          <div className="summary-item">
            <label>Available Credit</label>
            <span className="accent">₹{Number(data.available_limit).toLocaleString('en-IN')}</span>
          </div>
          <div className="summary-item">
            <label>Outstanding</label>
            <span className={Number(data.outstanding_balance) > 0 ? 'danger' : ''}>
              ₹{Number(data.outstanding_balance).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="summary-item">
            <label>Due Date</label>
            <span>{data.due_date || 'N/A'}</span>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="statement-controls">
          <div className="statement-filters">
            <div className="filter-group">
              <i className="fas fa-filter" />
              <select
                className="filter-input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="PURCHASE">Purchases</option>
                <option value="PAYMENT">Payments</option>
                <option value="REFUND">Refunds</option>
              </select>
            </div>
            <div className="filter-group search-group">
              <i className="fas fa-search" />
              <input
                type="text"
                className="filter-input"
                placeholder="Search merchant or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* TRANSACTION LIST */}
        <div className="statement-body">
          {filteredTransactions.length > 0 ? (
            <div className="table-responsive">
              <table className="statement-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Merchant / Details</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Ref ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.payment_tracking_id}>
                      <td>{formatDate(txn.created_at)}</td>
                      <td>
                        <div className="txn-merchant">
                          <span className="merchant-name">{txn.merchant_name || 'N/A'}</span>
                          <span className="category">{txn.category || 'General'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`txn-type-badge type-${(txn.transaction_type || 'PAYMENT').toLowerCase()}`}>
                          {txn.transaction_type}
                        </span>
                      </td>
                      <td>
                        <div className="txn-status-dot">
                          <span className={`status-dot ${txn.status?.toLowerCase()}`}></span>
                          <span className="status-text">{txn.status}</span>
                        </div>
                      </td>
                      <td className="txn-amount">
                        <span className={txn.transaction_type === 'PURCHASE' ? 'amount-debit' : 'amount-credit'}>
                          {txn.transaction_type === 'PURCHASE' ? '-' : '+'} ₹{Number(txn.amount).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="txn-ref-id">
                        {txn.reference_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-statement">
              <div className="empty-icon">
                <i className="fas fa-history"></i>
              </div>
              <p>No transactions found for the selected period.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="statement-footer">
          <div className="footer-info">
            <i className="fas fa-info-circle"></i>
            <span>Billing cycle resets every month on day <strong>{data.billing_cycle_date}</strong></span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Statement
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreditCardStatementModal;