import React, { useState, useEffect } from 'react';
import { loanAPI, accountAPI } from '../api/api';
import './LoanPaymentModal.css';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LoanPaymentModal = ({ type, loan, onClose, onSuccess }) => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // EMI payment state
  const [schedule, setSchedule] = useState([]);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Foreclosure state
  const [foreclosurePreview, setForeclosurePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const isForeclosure = type === 'foreclose';

  // Pending installments from schedule
  const pending = schedule.filter(r => r.status === 'upcoming' || r.status === 'overdue');
  const maxInstallments = pending.length;
  const selected = pending.slice(0, installmentCount);

  // ── Payment breakdown ──────────────────────────────────────────────────
  const emiTotal = parseFloat(selected.reduce((s, r) => s + parseFloat(r.emi_amount), 0).toFixed(2));
  const extraPrincipal = parseFloat(
    selected.slice(1).reduce((s, r) => s + parseFloat(r.principal_component), 0).toFixed(2)
  );
  // Prepayment penalty rate comes from the first schedule row's loan context,
  // but we don't have it here — we use a safe fallback of 2% and show an info note.
  // The backend recalculates authoritatively anyway.
  const PREPAYMENT_RATE = loan.prepayment_penalty_rate ?? 2;
  const penaltyAmount = installmentCount > 1
    ? parseFloat(((extraPrincipal * PREPAYMENT_RATE) / 100).toFixed(2))
    : 0;
  const totalDue = parseFloat((emiTotal + penaltyAmount).toFixed(2));

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await accountAPI.getMyAccounts();
        if (res.success && res.data.length > 0) {
          setAccounts(res.data);
          setSelectedAccountId(res.data[0].account_id);
        }
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      }
    };

    const fetchSchedule = async () => {
      if (isForeclosure) return;
      setScheduleLoading(true);
      try {
        const res = await loanAPI.getLoanSchedule(loan.loan_id);
        if (res.success) setSchedule(res.data);
      } catch (err) {
        console.error('Failed to fetch schedule:', err);
      } finally {
        setScheduleLoading(false);
      }
    };

    const fetchForeclosurePreview = async () => {
      if (!isForeclosure) return;
      setPreviewLoading(true);
      try {
        const res = await loanAPI.getForeclosurePreview(loan.loan_id);
        if (res.success) setForeclosurePreview(res.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch foreclosure details.');
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchAccounts();
    fetchSchedule();
    fetchForeclosurePreview();
  }, [isForeclosure, loan.loan_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isForeclosure) {
        const res = await loanAPI.forecloseLoan(loan.loan_id, {
          source_account_id: selectedAccountId,
        });
        if (res.success) onSuccess(res.data);
      } else {
        const res = await loanAPI.makePayment({
          loan_id: loan.loan_id,
          payment_amount: totalDue,
          source_account_id: selectedAccountId,
          installments_to_pay: installmentCount,
        });
        if (res.success) onSuccess(res.data);
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please check your balance.');
    } finally {
      setIsLoading(false);
    }
  };

  const paymentAmount = isForeclosure
    ? (foreclosurePreview?.total_foreclosure_amount ?? parseFloat(loan.outstanding_balance) * 1.04)
    : totalDue;

  return (
    <div className="modal-overlay">
      <div className="lpm-modal">
        {/* Header */}
        <div className="lpm-header">
          <div className="lpm-header-icon">
            <i className={`fas ${isForeclosure ? 'fa-gavel' : 'fa-credit-card'}`} />
          </div>
          <div>
            <h2>{isForeclosure ? 'Foreclose Loan' : 'Pay EMI'}</h2>
            <p className="lpm-subtitle">
              {loan.loan_type?.charAt(0).toUpperCase() + loan.loan_type?.slice(1)} Loan
              &nbsp;·&nbsp;
              Outstanding: {fmt(loan.outstanding_balance)}
            </p>
          </div>
          <button className="lpm-close" onClick={onClose} disabled={isLoading}>
            <i className="fas fa-times" />
          </button>
        </div>

        {error && (
          <div className="lpm-alert lpm-alert-error">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="lpm-body">

          {/* ── EMI Payment Panel ─────────────────────────────── */}
          {!isForeclosure && (
            <>
              {scheduleLoading ? (
                <div className="lpm-loading"><div className="loading-spinner sm" /> Loading schedule…</div>
              ) : maxInstallments === 0 ? (
                <div className="lpm-alert lpm-alert-info">No pending installments found.</div>
              ) : (
                <>
                  {/* Installment count selector */}
                  <div className="lpm-field">
                    <label className="lpm-label">
                      <i className="fas fa-layer-group" /> Number of Installments to Pay
                    </label>
                    <div className="lpm-count-row">
                      <button
                        type="button"
                        className="lpm-count-btn"
                        onClick={() => setInstallmentCount(Math.max(1, installmentCount - 1))}
                        disabled={installmentCount <= 1}
                      >−</button>
                      <span className="lpm-count-val">{installmentCount}</span>
                      <button
                        type="button"
                        className="lpm-count-btn"
                        onClick={() => setInstallmentCount(Math.min(maxInstallments, installmentCount + 1))}
                        disabled={installmentCount >= maxInstallments}
                      >+</button>
                      <span className="lpm-count-hint">of {maxInstallments} remaining</span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="lpm-breakdown">
                    <div className="lpm-breakdown-row">
                      <span>{installmentCount} EMI{installmentCount > 1 ? 's' : ''}</span>
                      <span>{fmt(emiTotal)}</span>
                    </div>

                    {installmentCount > 1 && (
                      <>
                        <div className="lpm-breakdown-row lpm-penalty-row">
                          <span>
                            <i className="fas fa-exclamation-triangle" />
                            &nbsp;Prepayment Penalty ({PREPAYMENT_RATE}% of advance principal)
                          </span>
                          <span className="lpm-penalty-val">+{fmt(penaltyAmount)}</span>
                        </div>
                        <div className="lpm-penalty-note">
                          Penalty is charged on ₹{extraPrincipal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} 
                          of principal paid ahead of schedule.
                        </div>
                      </>
                    )}

                    <div className="lpm-breakdown-row lpm-total-row">
                      <span><strong>Total Due</strong></span>
                      <span className="lpm-total-val"><strong>{fmt(totalDue)}</strong></span>
                    </div>
                  </div>

                  {/* Next installments preview */}
                  {selected.length > 0 && (
                    <div className="lpm-installments-preview">
                      <p className="lpm-label"><i className="fas fa-calendar-check" /> Installments being paid</p>
                      <table className="lpm-mini-table">
                        <thead>
                          <tr><th>#</th><th>Due Date</th><th>EMI</th><th>Principal</th><th>Interest</th></tr>
                        </thead>
                        <tbody>
                          {selected.map((row, i) => (
                            <tr key={row.schedule_id} className={row.status === 'overdue' ? 'lpm-overdue' : ''}>
                              <td>{row.installment_number}</td>
                              <td>{new Date(row.due_date).toLocaleDateString('en-IN')}</td>
                              <td>{fmt(row.emi_amount)}</td>
                              <td>{fmt(row.principal_component)}</td>
                              <td>{fmt(row.interest_component)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Foreclosure Panel ─────────────────────────────── */}
          {isForeclosure && (
            <>
              {previewLoading ? (
                <div className="lpm-loading"><div className="loading-spinner sm" /> Calculating foreclosure amount…</div>
              ) : foreclosurePreview ? (
                <>
                  <div className="lpm-foreclose-warning">
                    <i className="fas fa-exclamation-triangle" />
                    <span>Foreclosure permanently closes this loan. This action cannot be undone.</span>
                  </div>

                  <div className="lpm-breakdown">
                    <div className="lpm-breakdown-row">
                      <span>Outstanding Balance</span>
                      <span>{fmt(foreclosurePreview.outstanding_balance)}</span>
                    </div>
                    <div className="lpm-breakdown-row lpm-penalty-row">
                      <span>
                        <i className="fas fa-exclamation-triangle" />
                        &nbsp;Foreclosure Penalty ({foreclosurePreview.foreclosure_penalty_rate}%)
                      </span>
                      <span className="lpm-penalty-val">+{fmt(foreclosurePreview.penalty_amount)}</span>
                    </div>
                    <div className="lpm-breakdown-row lpm-total-row">
                      <span><strong>Total Payable</strong></span>
                      <span className="lpm-total-val"><strong>{fmt(foreclosurePreview.total_foreclosure_amount)}</strong></span>
                    </div>
                  </div>

                  <div className="lpm-foreclose-meta">
                    <span><i className="fas fa-info-circle" /> {foreclosurePreview.remaining_installments} installments will be closed</span>
                    <span>Product: {foreclosurePreview.product_name}</span>
                  </div>
                </>
              ) : !error && (
                <div className="lpm-alert lpm-alert-info">Could not load foreclosure preview.</div>
              )}
            </>
          )}

          {/* ── Source Account ─────────────────────────────────── */}
          <div className="lpm-field">
            <label className="lpm-label"><i className="fas fa-university" /> Debit Account</label>
            <select
              className="lpm-select"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              required
            >
              {accounts.length === 0 && <option value="">No active accounts found</option>}
              {accounts.map(acc => {
                const bal = parseFloat(acc.balance);
                const insufficient = bal < paymentAmount;
                return (
                  <option key={acc.account_id} value={acc.account_id} disabled={insufficient}>
                    {acc.account_type?.toUpperCase()} ****{acc.account_number?.slice(-4)}
                    &nbsp;(Bal: {fmt(acc.balance)}){insufficient ? ' — INSUFFICIENT' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* ── Actions ────────────────────────────────────────── */}
          <div className="lpm-actions">
            <button type="button" className="lpm-btn lpm-btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button
              type="submit"
              className={`lpm-btn ${isForeclosure ? 'lpm-btn-danger' : 'lpm-btn-primary'}`}
              disabled={
                isLoading ||
                accounts.length === 0 ||
                (isForeclosure && !foreclosurePreview) ||
                (!isForeclosure && maxInstallments === 0)
              }
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin" /> Processing…</>
              ) : isForeclosure ? (
                <><i className="fas fa-gavel" /> Confirm Foreclosure ({fmt(paymentAmount)})</>
              ) : (
                <><i className="fas fa-check-circle" /> Pay {fmt(totalDue)}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanPaymentModal;
