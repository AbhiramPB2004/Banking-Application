import React, { useState, useEffect } from 'react';
import { creditCardAPI, accountAPI, userAPI } from '../api/api';
import { calculateCreditScore } from '../utils/creditScoreCalculator';

const ApplyCreditCardModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    requested_limit: '',
    source_account_id: '',
    card_tier: 'entry'
  });

  const [accounts, setAccounts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [estimatedLimit, setEstimatedLimit] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Initial Load: Accounts & User Profile
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, userRes] = await Promise.all([
          accountAPI.getMyAccounts(),
          userAPI.getProfile()
        ]);

        if (accRes.success && accRes.data.length > 0) {
          setAccounts(accRes.data);
          setFormData(prev => ({ ...prev, source_account_id: accRes.data[0].account_id }));
          setSelectedAccount(accRes.data[0]);
        }
        if (userRes.success) {
          setUserProfile(userRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };
    fetchData();
  }, []);

  // 2. Track Selected Account for Eligibility Logic
  useEffect(() => {
    const acc = accounts.find(a => a.account_id === formData.source_account_id);
    setSelectedAccount(acc || null);
    if (acc) {
      setEstimatedLimit(Math.floor(parseFloat(acc.balance) * 0.5));
    }
  }, [formData.source_account_id, accounts]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleNext = () => {
    if (step === 1 && !formData.requested_limit) {
      setError('Please enter a requested credit limit');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        requested_limit: Number(formData.requested_limit),
        source_account_id: formData.source_account_id,
        card_tier: formData.card_tier
      };

      const res = await creditCardAPI.applyForCard(payload);
      if (res.success) onSuccess(res.data);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to apply for credit card');
      setStep(1); // Return to form on error
    } finally {
      setIsLoading(false);
    }
  };

  // 3. FULL ELIGIBILITY EVALUATION (Using Shared Utility)
  const evaluateEligibility = () => {
    if (!userProfile || !selectedAccount) return { eligible: false, reason: 'Profile or account data missing' };

    const { annual_income, dob, occupation, kyc_status } = userProfile;
    const requestedAmount = Number(formData.requested_limit) || 0;
    const balance = parseFloat(selectedAccount.balance) || 0;

    // A. Age Check
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    if (age < 18 || age > 65) return { eligible: false, reason: "Applicant age must be between 18 and 65" };

    // B. KYC Check
    if (kyc_status !== 'verified') return { eligible: false, reason: "KYC verification required. Please complete KYC in Profile." };

    // C. Income Tier Check
    const INCOME_THRESHOLDS = { entry: 300000, premium: 1000000 };
    const requiredIncome = INCOME_THRESHOLDS[formData.card_tier];
    if (annual_income < requiredIncome) {
      return { eligible: false, reason: `Minimum annual income for ${formData.card_tier} card is ₹${(requiredIncome / 100000).toFixed(0)} Lakhs` };
    }

    // D. Score Calculation
    const score = calculateCreditScore({
      annual_income: parseFloat(annual_income),
      existing_liabilities: 0, // Simplified for now
      occupation: occupation
    });

    if (score < 500) return { eligible: false, reason: "Credit profile does not meet minimum risk standards" };

    // E. Limit Calculation (Income driven + Balance Cap)
    let systemLimit = parseFloat(annual_income) * 0.2;
    if (score >= 750) systemLimit *= 1.5;
    else if (score >= 650) systemLimit *= 1.2;

    const finalLimit = Math.min(systemLimit, balance * 0.5);

    if (finalLimit < 10000) return { eligible: false, reason: "Eligible limit is below the minimum threshold of ₹10,000" };

    if (requestedAmount > finalLimit) {
      return {
        eligible: false,
        reason: `Requested amount exceeds your maximum eligible limit of ₹${Math.floor(finalLimit).toLocaleString('en-IN')}`,
        maxLimit: finalLimit
      };
    }

    return { eligible: true, maxLimit: finalLimit, score };
  };

  const evalResult = evaluateEligibility();
  const isEligible = evalResult.eligible;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px', padding: '0', overflow: 'hidden' }}>

        {/* PROGRESS BAR */}
        <div className="step-progress-bar">
          <div className={`step-segment ${step >= 1 ? 'active' : ''}`}></div>
          <div className={`step-segment ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step-segment ${step >= 3 ? 'active' : ''}`}></div>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Header */}
          <div className="modal-header" style={{ padding: '0 0 1.5rem', border: 'none', background: 'none' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
                {step === 1 && "New Application"}
                {step === 2 && "Eligibility Check"}
                {step === 3 && "Verification"}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Step {step} of 3
              </p>
            </div>
            <button className="btn-close" onClick={onClose} disabled={isLoading}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
              <i className="fas fa-exclamation-triangle" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: FORM */}
          {step === 1 && (
            <div className="cc-step-container">
              <div className="form-group">
                <label>Linked Bank Account</label>
                <select name="source_account_id" value={formData.source_account_id} onChange={handleChange}>
                  {accounts.map(acc => (
                    <option key={acc.account_id} value={acc.account_id}>
                      {acc.account_type.toUpperCase()} - ****{acc.account_number.slice(-4)} (₹{parseFloat(acc.balance).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Card Type</label>
                <select name="card_tier" value={formData.card_tier} onChange={handleChange}>
                  <option value="entry">Entry (Classic)</option>
                  <option value="premium">Premium (Privilege)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Requested Credit Limit</label>
                <div className="input-with-icon">
                  <span className="input-icon">₹</span>
                  <input
                    type="number"
                    name="requested_limit"
                    value={formData.requested_limit}
                    onChange={handleChange}
                    placeholder="e.g. 50000"
                    min="10000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ELIGIBILITY */}
          {step === 2 && (
            <div className="cc-step-container">
              <div className={`eligibility-card ${isEligible ? 'success' : 'warning'}`}>
                <div className="eligibility-icon">
                  <i className={`fas ${isEligible ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                </div>
                <h3>{isEligible ? 'Eligible' : 'Action Required'}</h3>

                {isEligible && evalResult.score && (
                  <div className="score-badge">
                    Credit Score: <strong>{evalResult.score}</strong>
                  </div>
                )}

                <p style={{ marginTop: '1rem' }}>
                  Requested: <strong>₹{Number(formData.requested_limit).toLocaleString('en-IN')}</strong><br />
                  Max Eligible: <strong>₹{evalResult.maxLimit?.toLocaleString('en-IN') || '0'}</strong>
                </p>

                {!isEligible && (
                  <p className="eligibility-reason">
                    <strong>Reason:</strong> {evalResult.reason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: KYC VERIFICATION */}
          {step === 3 && (
            <div className="cc-step-container">
              <div className="verification-item">
                <div className="v-label">Identity Verification (KYC)</div>
                <div className={`v-status ${userProfile?.kyc_status}`}>
                  <i className={`fas ${userProfile?.kyc_status === 'verified' ? 'fa-check' : 'fa-clock'}`}></i>
                  {userProfile?.kyc_status?.toUpperCase()}
                </div>
              </div>
              <div className="verification-item">
                <div className="v-label">Income Proof</div>
                <div className="v-status verified">
                  <i className="fas fa-check"></i> AUTO-VERIFIED
                </div>
              </div>
              <div className="modal-info-box" style={{ marginTop: '1.5rem' }}>
                <p><small>By clicking "Submit", you agree to the credit card terms and conditions.</small></p>
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="modal-footer" style={{ padding: '1.5rem 0 0', border: 'none', background: 'none' }}>
            {step > 1 ? (
              <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={isLoading}>
                Back
              </button>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!isEligible && step === 2}
              >
                Continue <i className="fas fa-arrow-right"></i>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={isLoading || userProfile?.kyc_status !== 'verified'}
              >
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .step-progress-bar { display: flex; height: 6px; background: rgba(255,255,255,0.05); }
        .step-segment { flex: 1; transition: background 0.4s ease; }
        .step-segment.active { background: var(--primary); box-shadow: 0 0 10px var(--primary-glow); }
        .cc-step-container { min-height: 220px; animation: fadeIn 0.3s ease; }
        .eligibility-card { padding: 1.5rem; border-radius: 16px; text-align: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); }
        .eligibility-card.success { border-color: var(--success); }
        .eligibility-card.warning { border-color: var(--warning); }
        .eligibility-icon { font-size: 3rem; margin-bottom: 1rem; }
        .eligibility-card.success .eligibility-icon { color: var(--success); }
        .eligibility-card.warning .eligibility-icon { color: var(--warning); }
        .eligibility-reason { font-size: 0.8rem; color: var(--text-secondary); margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .verification-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; margin-bottom: 0.75rem; border: 1px solid rgba(255,255,255,0.04); }
        .v-label { font-weight: 600; font-size: 0.9rem; }
        .v-status { font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .v-status.verified { color: var(--success); }
        .v-status.pending { color: var(--warning); }
        .v-status.rejected { color: var(--danger); }
        .score-badge { display: inline-block; padding: 4px 12px; background: var(--primary-glow); color: var(--primary-light); border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid var(--primary); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ApplyCreditCardModal;
