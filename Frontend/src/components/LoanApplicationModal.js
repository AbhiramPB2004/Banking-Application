import React, { useState, useEffect } from 'react';
import { loanAPI, accountAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './LoanApplicationModal.css';

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LOAN_LIMITS = {
  personal:  '₹50k – ₹20L  |  6 – 60 months',
  home:      '₹5L – ₹2Cr   |  12 – 360 months',
  vehicle:   '₹1L – ₹50L   |  12 – 84 months',
  education: '₹1L – ₹75L   |  12 – 120 months',
};

const LoanApplicationModal = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();

  const hasValidIncome = currentUser && Number(currentUser.annual_income) >= 100000;

  const [formData, setFormData] = useState({
    loan_type: 'personal',
    requested_amount: '',
    tenure_months: '',
    annual_income: hasValidIncome ? currentUser.annual_income : '',
    existing_liabilities: '',   // will be populated from summary
    linked_account_id: '',
  });

  const [accounts, setAccounts]             = useState([]);
  const [activeSummary, setActiveSummary]   = useState(null);  // from /loans/active-summary
  const [isLoading, setIsLoading]           = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError]                   = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch accounts and active-summary in parallel
        const [accRes, summaryRes] = await Promise.all([
          accountAPI.getMyAccounts(),
          loanAPI.getActiveLoansSummary(),
        ]);

        if (accRes.success && accRes.data.length > 0) {
          setAccounts(accRes.data);
          setFormData(prev => ({ ...prev, linked_account_id: accRes.data[0].account_id }));
        }

        if (summaryRes.success) {
          const s = summaryRes.data;
          setActiveSummary(s);
          // Pre-fill existing_liabilities with the sum of active EMIs.
          // The user can still add to this if they have other debts (credit cards, etc.)
          // but they cannot go below the system-calculated floor.
          setFormData(prev => ({
            ...prev,
            existing_liabilities: s.total_monthly_emi > 0 ? s.total_monthly_emi.toString() : '0',
          }));
        }
      } catch (err) {
        console.error('Loan modal init error:', err);
      } finally {
        setSummaryLoading(false);
      }
    };
    init();
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
        requested_amount:    Number(formData.requested_amount),
        tenure_months:       Number(formData.tenure_months),
        annual_income:       Number(formData.annual_income),
        existing_liabilities: Number(formData.existing_liabilities),
      };

      const res = await loanAPI.applyForLoan(payload);
      if (res.success) onSuccess(res.data);
    } catch (err) {
      setError(
        err.data?.errors?.join('\n') ||
        err.data?.message ||
        err.message ||
        'Failed to apply for loan'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Minimum allowed liabilities = sum of existing active EMIs (non-negotiable)
  const minLiabilities = activeSummary?.total_monthly_emi ?? 0;
  const canApply = activeSummary ? activeSummary.can_apply : true;

  return (
    <div className="modal-overlay">
      <div className="lam-modal">
        {/* Header */}
        <div className="lam-header">
          <div className="lam-header-icon">
            <i className="fas fa-hand-holding-usd" />
          </div>
          <div>
            <h2>Apply for a Loan</h2>
            <p className="lam-subtitle">Horizon Bank · Instant Decision</p>
          </div>
          <button className="lam-close" onClick={onClose} disabled={isLoading}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* ── Active Loan Slots Banner ──────────────────────── */}
        {!summaryLoading && activeSummary && (
          <div className={`lam-slots-banner ${!canApply ? 'lam-slots-full' : ''}`}>
            <div className="lam-slots-left">
              <i className={`fas ${canApply ? 'fa-check-circle' : 'fa-ban'}`} />
              <span>
                {canApply
                  ? `${activeSummary.remaining_slots} loan slot${activeSummary.remaining_slots !== 1 ? 's' : ''} available`
                  : `Loan limit reached (${activeSummary.max_active_loans}/${activeSummary.max_active_loans})`
                }
              </span>
            </div>
            <div className="lam-slots-pips">
              {Array.from({ length: activeSummary.max_active_loans }).map((_, i) => (
                <span
                  key={i}
                  className={`lam-slot-pip ${i < activeSummary.active_loan_count ? 'used' : 'free'}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Active Loans as Liabilities ───────────────────── */}
        {activeSummary && activeSummary.active_loan_count > 0 && (
          <div className="lam-liabilities-notice">
            <i className="fas fa-info-circle" />
            <div>
              <strong>Auto-detected liabilities:</strong> Your {activeSummary.active_loan_count} active loan(s)
              contribute <strong>{fmt(activeSummary.total_monthly_emi)}/month</strong> in mandatory EMIs.
              This is automatically included in your DTI calculation.
              {activeSummary.active_loans.map(l => (
                <span key={l.loan_id} className="lam-existing-loan-pill">
                  {l.loan_type.charAt(0).toUpperCase() + l.loan_type.slice(1)}: {fmt(l.monthly_emi)}/mo
                </span>
              ))}
            </div>
          </div>
        )}

        {!canApply && (
          <div className="lam-alert lam-alert-error">
            <i className="fas fa-ban" />
            You have reached the maximum of {activeSummary.max_active_loans} active loans.
            Please close or foreclose an existing loan before applying for a new one.
          </div>
        )}

        {error && (
          <div className="lam-alert lam-alert-error" style={{ whiteSpace: 'pre-line' }}>
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {/* ── Form ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="lam-form">
          <div className="lam-grid">

            {/* Loan Type */}
            <div className="lam-field lam-full">
              <label className="lam-label">Loan Type</label>
              <div className="lam-type-grid">
                {Object.entries(LOAN_LIMITS).map(([type, hint]) => (
                  <label
                    key={type}
                    className={`lam-type-option ${formData.loan_type === type ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="loan_type"
                      value={type}
                      checked={formData.loan_type === type}
                      onChange={handleChange}
                    />
                    <i className={`fas ${
                      type === 'home' ? 'fa-home' :
                      type === 'vehicle' ? 'fa-car' :
                      type === 'education' ? 'fa-user-graduate' : 'fa-hand-holding-usd'
                    }`} />
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    <small>{hint}</small>
                  </label>
                ))}
              </div>
            </div>

            {/* Disbursal Account */}
            <div className="lam-field lam-full">
              <label className="lam-label">Disbursal Account</label>
              <select
                name="linked_account_id"
                value={formData.linked_account_id}
                onChange={handleChange}
                className="lam-select"
                required
              >
                {accounts.length === 0 && <option value="">No active accounts found</option>}
                {accounts.map(acc => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.account_type.toUpperCase()} – ****{acc.account_number.slice(-4)}
                    &nbsp;(Bal: {fmt(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            {/* Requested Amount */}
            <div className="lam-field">
              <label className="lam-label">Requested Amount</label>
              <div className="lam-input-wrap">
                <span className="lam-prefix">₹</span>
                <input
                  type="number"
                  name="requested_amount"
                  value={formData.requested_amount}
                  onChange={handleChange}
                  placeholder="e.g. 500000"
                  required
                  min="0"
                  className="lam-input"
                />
              </div>
            </div>

            {/* Tenure */}
            <div className="lam-field">
              <label className="lam-label">Tenure (Months)</label>
              <div className="lam-input-wrap">
                <span className="lam-prefix lam-prefix-sm">MO</span>
                <input
                  type="number"
                  name="tenure_months"
                  value={formData.tenure_months}
                  onChange={handleChange}
                  placeholder="e.g. 24"
                  required
                  min="1"
                  className="lam-input"
                />
              </div>
            </div>

            {/* Annual Income */}
            <div className="lam-field">
              <label className="lam-label">
                Annual Income
                {hasValidIncome && (
                  <span className="lam-badge-verified">
                    <i className="fas fa-check-circle" /> Verified
                  </span>
                )}
              </label>
              <div className="lam-input-wrap">
                <span className="lam-prefix">₹</span>
                <input
                  type="number"
                  name="annual_income"
                  value={formData.annual_income}
                  onChange={handleChange}
                  disabled={hasValidIncome}
                  className={`lam-input ${hasValidIncome ? 'lam-input-disabled' : ''}`}
                  placeholder="e.g. 1200000"
                  required
                  min="100000"
                />
              </div>
              {!hasValidIncome && (
                <small className="lam-hint">Minimum ₹1,00,000/year</small>
              )}
            </div>

            {/* Existing Liabilities */}
            <div className="lam-field">
              <label className="lam-label">
                Other Monthly Liabilities
                {minLiabilities > 0 && (
                  <span className="lam-badge-info">Auto-filled</span>
                )}
              </label>
              <div className="lam-input-wrap">
                <span className="lam-prefix">₹</span>
                <input
                  type="number"
                  name="existing_liabilities"
                  value={formData.existing_liabilities}
                  onChange={handleChange}
                  placeholder="e.g. 15000"
                  required
                  min={minLiabilities}
                  className="lam-input"
                />
              </div>
              {minLiabilities > 0 ? (
                <small className="lam-hint lam-hint-warn">
                  <i className="fas fa-lock" /> Minimum {fmt(minLiabilities)}/mo from active loans.
                  Add any other debts (credit cards, etc.) on top.
                </small>
              ) : (
                <small className="lam-hint">Include rent, credit card minimums, other EMIs, etc.</small>
              )}
            </div>

          </div>

          {/* Actions */}
          <div className="lam-actions">
            <button type="button" className="lam-btn lam-btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button
              type="submit"
              className="lam-btn lam-btn-primary"
              disabled={isLoading || accounts.length === 0 || !canApply || summaryLoading}
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin" /> Processing…</>
              ) : (
                <>Submit Application <i className="fas fa-arrow-right" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanApplicationModal;
