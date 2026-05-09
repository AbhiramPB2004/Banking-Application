import React, { useState, useEffect } from 'react';
import { fdAPI, accountAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './CreateFDModal.css';

const CreateFDModal = ({ onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    account_id: '',
    amount: '',
    tenure_months: '',
    interest_rate: ''
  });
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculatedReturns, setCalculatedReturns] = useState(null);
  const [selectedTenureLabel, setSelectedTenureLabel] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    calculateReturns();
  }, [formData.amount, formData.tenure_months, formData.interest_rate]);

  const fetchAccounts = async () => {
    try {
      const res = await accountAPI.getMyAccounts();
      if (res.success && res.data.length > 0) {
        setAccounts(res.data);
        setFormData(prev => ({ ...prev, account_id: res.data[0].account_id }));
      }
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    }
  };

  const calculateReturns = () => {
    const amount = Number(formData.amount);
    const rate = Number(formData.interest_rate);
    const tenureMonths = Number(formData.tenure_months);

    if (amount && rate && tenureMonths && amount > 0 && rate > 0 && tenureMonths > 0) {
      const ratePerAnnum = rate / 100;
      const maturityAmount = amount * Math.pow(1 + ratePerAnnum, tenureMonths / 12);
      const interestEarned = maturityAmount - amount;
      
      setCalculatedReturns({
        maturityAmount: Math.round(maturityAmount),
        interestEarned: Math.round(interestEarned),
        roi: ((interestEarned / amount) * 100).toFixed(2)
      });
    } else {
      setCalculatedReturns(null);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

const getInterestRate = (tenureMonths) => {
  const months = Number(tenureMonths);

  if (months === 3) return 4.5;

  if (months === 6) return 5.5;

  if (months === 12) return 7;

  if (months >= 24 && months <= 60) return 8.5;

  if (months >= 61 && months <= 71) return 9;

  if (months >= 72 && months <= 84) return 10;

  if (months > 84 && months <= 108) return 12;

  if (months > 108 && months <= 120) return 15;

  return 0;
};

const getTenureLabel = (months) => {
  const monthsNum = Number(months);

  if (monthsNum === 3) return 'Short Term Investment';

  if (monthsNum === 6) return 'Medium Term Investment';

  if (monthsNum === 12) return 'Long Term Investment';

  if (monthsNum >= 24 && monthsNum <= 60) {
    return 'Extended Term Investment';
  }

  if (monthsNum >= 61 && monthsNum <= 84) {
    return 'Premium Long Term Investment';
  }

  if (monthsNum > 84 && monthsNum <= 108) {
    return 'Wealth Growth Investment';
  }

  if (monthsNum > 108 && monthsNum <= 120) {
    return 'Maximum Yield Investment';
  }

  return 'Invalid Tenure';
};

  const handleTenureChange = (e) => {
    const months = e.target.value;
    const rate = getInterestRate(months);
    const label = getTenureLabel(months);
    setSelectedTenureLabel(label);
    setFormData({ 
      ...formData, 
      tenure_months: months,
      interest_rate: rate
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        account_id: formData.account_id,
        amount: Number(formData.amount),
        tenure_months: Number(formData.tenure_months),
        interest_rate: Number(formData.interest_rate)
      };

      console.log('Submitting FD payload:', payload);
      const res = await fdAPI.createFD(payload);
      console.log('FD creation response:', res);
      
      if (res.success) {
        onSuccess(res.data);
      } else {
        onSuccess(res);
      }
    } catch (err) {
      console.error('FD creation error:', err);
      if (err.data && err.data.errors) {
        setError(err.data.errors.join('\n'));
      } else if (err.data && err.data.message) {
        setError(err.data.message);
      } else {
        setError(err.message || 'Failed to create fixed deposit');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Create Fixed Deposit</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Lock your money for guaranteed returns
            </p>
          </div>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '0.5rem' }}></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="fd-form-grid">
            <div className="form-group">
              <label>
                <i className="fas fa-university"></i> Select Account
              </label>
              <select 
                name="account_id" 
                value={formData.account_id} 
                onChange={handleChange} 
                required
              >
                {accounts.length === 0 && <option value="">No active accounts found</option>}
                {accounts.map(acc => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.account_type.toUpperCase()} - ****{acc.account_number?.slice(-4) || '****'} 
                    (Bal: {formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-rupee-sign"></i> Deposit Amount
              </label>
              <div className="input-with-icon">
                <span className="input-icon">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  required
                  min="1000"
                  step="1000"
                />
              </div>
              <div className="input-hint">
                <i className="fas fa-info-circle"></i>
                Minimum ₹1,000 required
              </div>
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-clock"></i> Tenure Period
              </label>
              <select
  name="tenure_months"
  value={formData.tenure_months}
  onChange={handleTenureChange}
  required
>
  <option value="" disabled>Select tenure period</option>

  <optgroup label="Short Term">
    <option value="3">3 months (4.5% p.a.)</option>
    <option value="6">6 months (5.5% p.a.)</option>
  </optgroup>

  <optgroup label="Medium Term">
    <option value="12">12 months (7% p.a.) - 1 year</option>
  </optgroup>

  <optgroup label="Long Term">
    <option value="24">24 months (8.5% p.a.) - 2 years</option>
    <option value="36">36 months (8.5% p.a.) - 3 years</option>
    <option value="48">48 months (8.5% p.a.) - 4 years</option>
    <option value="60">60 months (8.5% p.a.) - 5 years</option>
  </optgroup>

  <optgroup label="Premium Long Term">
    <option value="61">61 months (9% p.a.)</option>
    <option value="66">66 months (9% p.a.)</option>
    <option value="71">71 months (9% p.a.)</option>
  </optgroup>

  <optgroup label="High Growth">
    <option value="72">72 months (10% p.a.) - 6 years</option>
    <option value="84">84 months (10% p.a.) - 7 years</option>
  </optgroup>

  <optgroup label="Wealth Growth">
    <option value="96">96 months (12% p.a.) - 8 years</option>
    <option value="108">108 months (12% p.a.) - 9 years</option>
  </optgroup>

  <optgroup label="Maximum Yield">
    <option value="120">120 months (15% p.a.) - 10 years</option>
  </optgroup>
</select>
              {selectedTenureLabel && (
                <div className="input-hint">
                  <i className="fas fa-tag"></i>
                  {selectedTenureLabel}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-percent"></i> Interest Rate
              </label>
              <div className="input-with-icon">
                <span className="input-icon">%</span>
                <input
                  type="number"
                  name="interest_rate"
                  value={formData.interest_rate}
                  onChange={handleChange}
                  readOnly
                  className="input-disabled"
                  step="0.1"
                  placeholder="Auto-calculated"
                />
              </div>
              <div className="input-hint">
                <i className="fas fa-calculator"></i>
                Auto-calculated based on tenure
              </div>
            </div>

            {calculatedReturns && (
              <div className="fd-calculator-box">
                <h4>
                  <i className="fas fa-chart-line"></i> 
                  Investment Summary
                </h4>
                <div className="calculator-row">
                  <span>Deposit Amount:</span>
                  <strong>{formatCurrency(formData.amount)}</strong>
                </div>
                <div className="calculator-row">
                  <span>Interest Rate:</span>
                  <strong>{formData.interest_rate}% p.a.</strong>
                </div>
                <div className="calculator-row">
                  <span>Tenure:</span>
                  <strong>{formData.tenure_months} months ({Math.floor(formData.tenure_months / 12)}Y {formData.tenure_months % 12}M)</strong>
                </div>
                <div className="calculator-row success">
                  <span>Total Interest Earned:</span>
                  <strong>{formatCurrency(calculatedReturns.interestEarned)}</strong>
                </div>
                <div className="calculator-row highlight">
                  <span>Final Maturity Amount:</span>
                  <strong>{formatCurrency(calculatedReturns.maturityAmount)}</strong>
                </div>
                <div className="calculator-row">
                  <span>Return on Investment:</span>
                  <strong>{calculatedReturns.roi}%</strong>
                </div>
              </div>
            )}
          </div>

          <div className="fd-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isLoading}>
              <i className="fas fa-times"></i> Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit" 
              disabled={isLoading || accounts.length === 0 || !formData.amount || formData.amount < 1000 || !formData.tenure_months}
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin"></i> Creating FD...</>
              ) : (
                <><i className="fas fa-certificate"></i> Create Fixed Deposit</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFDModal;