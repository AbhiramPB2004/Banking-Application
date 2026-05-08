import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RegisterModal.css';

const RegisterModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    auth: { email: '', phone: '', password: '', confirmPassword: '', transaction_pin: '' },
    user: {
      full_name: '', dob: '', gender: '', address: '',
      aadhaar_number: '', pan_number: '', occupation: '', annual_income: ''
    },
    account: { account_type: 'savings', initial_deposit: '' }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');

  const { register, verifyEmail, resendVerificationOtp } = useAuth();
  const navigate = useNavigate();

  const update = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
    setError('');
  };

  // ─── Validators ────────────────────────────

  const validateStep1 = () => {
    const { email, phone, password, confirmPassword, transaction_pin } = formData.auth;
    if (!email || !phone || !password || !confirmPassword || !transaction_pin) {
      setError('All fields are required'); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email'); return false;
    }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      setError('Enter a valid 10-digit phone number'); return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      setError('Password: 8+ chars with uppercase, lowercase, number & special character'); return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match'); return false;
    }
    if (!/^\d{4,6}$/.test(transaction_pin)) {
      setError('Transaction PIN must be 4-6 digits'); return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const u = formData.user;
    if (!u.full_name || !u.dob || !u.gender || !u.address ||
        !u.aadhaar_number || !u.pan_number || !u.occupation || !u.annual_income) {
      setError('All fields are required'); return false;
    }
    if (u.full_name.trim().length < 3) {
      setError('Full name must be at least 3 characters'); return false;
    }
    const age = new Date().getFullYear() - new Date(u.dob).getFullYear();
    if (age < 18) { setError('You must be at least 18 years old'); return false; }
    const aadhaar = u.aadhaar_number.replace(/\D/g, '');
    if (aadhaar.length !== 12) { setError('Enter valid 12-digit Aadhaar number'); return false; }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(u.pan_number.toUpperCase())) {
      setError('Enter valid PAN (e.g., ABCDE1234F)'); return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.account.initial_deposit || parseFloat(formData.account.initial_deposit) < 1000) {
      setError('Minimum initial deposit is ₹1,000'); return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) { setStep(2); setError(''); }
    else if (step === 2 && validateStep2()) { setStep(3); setError(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        auth: {
          email: formData.auth.email,
          phone: formData.auth.phone.replace(/\D/g, ''),
          password: formData.auth.password,
          transaction_pin: formData.auth.transaction_pin,
        },
        user: {
          full_name: formData.user.full_name,
          dob: formData.user.dob,
          gender: formData.user.gender.toLowerCase(),
          address: formData.user.address,
          aadhaar_number: formData.user.aadhaar_number.replace(/\D/g, ''),
          pan_number: formData.user.pan_number.toUpperCase(),
          occupation: formData.user.occupation,
          annual_income: parseFloat(formData.user.annual_income),
        },
        account: {
          account_type: formData.account.account_type.toLowerCase(),
          initial_deposit: parseFloat(formData.account.initial_deposit),
        },
      };

      const res = await register(payload);
      setVerificationEmail(res.user?.email || payload.auth.email);
      setStep(4);
      setOtp('');
      setError('');
    } catch (err) {
      const errors = err.data?.errors;
      if (errors && Array.isArray(errors)) {
        setError(errors.join('. '));
      } else {
        setError(err.data?.message || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationEmail || !otp) {
      setError('Enter the OTP sent to your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyEmail(verificationEmail, otp);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      const errors = err.data?.errors;
      if (errors && Array.isArray(errors)) {
        setError(errors.join('. '));
      } else {
        setError(err.data?.message || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verificationEmail) return;

    setLoading(true);
    setError('');

    try {
      await resendVerificationOtp(verificationEmail);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatAadhaar = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 12);
    if (d.length <= 4) return d;
    if (d.length <= 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
    return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="register-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-icon"><i className="fas fa-university" /></div>
          <h2>Open New Account</h2>
          <p>Join Horizon Bank in 4 secure steps</p>
          <button className="close-btn" onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        {/* Progress */}
        <div className="progress-indicator">
          {[
            { n: 1, label: 'Credentials', icon: 'fa-key' },
            { n: 2, label: 'KYC Details', icon: 'fa-id-card' },
            { n: 3, label: 'Account', icon: 'fa-university' },
            { n: 4, label: 'Verify', icon: 'fa-envelope-open-text' }
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              {i > 0 && <div className={`progress-line ${step >= s.n ? 'active' : ''}`} />}
              <div className={`progress-step ${step >= s.n ? 'active' : ''} ${step > s.n ? 'done' : ''}`}>
                <div className="step-circle">
                  {step > s.n ? <i className="fas fa-check" /> : <span>{s.n}</span>}
                </div>
                <span className="step-label">{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1 — Credentials */}
          {step === 1 && (
            <div className="form-step animate-fade">
              <div className="input-group">
                <label><i className="fas fa-envelope" /> Email Address</label>
                <input className="input-field" type="email" value={formData.auth.email}
                  onChange={(e) => update('auth', 'email', e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="input-group">
                <label><i className="fas fa-phone-alt" /> Phone Number</label>
                <input className="input-field" type="tel" value={formData.auth.phone}
                  onChange={(e) => update('auth', 'phone', e.target.value)} placeholder="9876543210" maxLength="10" required />
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label><i className="fas fa-lock" /> Password</label>
                  <div className="password-wrapper">
                    <input className="input-field" type={showPassword ? 'text' : 'password'}
                      value={formData.auth.password}
                      onChange={(e) => update('auth', 'password', e.target.value)}
                      placeholder="Min 8 chars, mixed" required />
                    <button type="button" className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}>
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label><i className="fas fa-check-circle" /> Confirm Password</label>
                  <input className="input-field" type="password" value={formData.auth.confirmPassword}
                    onChange={(e) => update('auth', 'confirmPassword', e.target.value)}
                    placeholder="Re-enter password" required />
                </div>
              </div>
              <div className="input-group">
                <label><i className="fas fa-th" /> Transaction PIN</label>
                <input className="input-field" type="password" value={formData.auth.transaction_pin}
                  onChange={(e) => update('auth', 'transaction_pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="4-6 digit numeric PIN" maxLength="6" required />
                <div className="input-hint"><i className="fas fa-info-circle" /> Used for fund transfers and payments</div>
              </div>
            </div>
          )}

          {/* Step 2 — KYC */}
          {step === 2 && (
            <div className="form-step animate-fade">
              <div className="input-group">
                <label><i className="fas fa-user" /> Full Name (as per Aadhaar)</label>
                <input className="input-field" value={formData.user.full_name}
                  onChange={(e) => update('user', 'full_name', e.target.value)} placeholder="John Michael Doe" required />
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label><i className="fas fa-calendar-alt" /> Date of Birth</label>
                  <input className="input-field" type="date" value={formData.user.dob}
                    onChange={(e) => update('user', 'dob', e.target.value)} required />
                </div>
                <div className="input-group">
                  <label><i className="fas fa-venus-mars" /> Gender</label>
                  <select className="input-field" value={formData.user.gender}
                    onChange={(e) => update('user', 'gender', e.target.value)} required>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label><i className="fas fa-map-marker-alt" /> Address</label>
                <textarea className="input-field" value={formData.user.address}
                  onChange={(e) => update('user', 'address', e.target.value)}
                  placeholder="House No, Street, City, State — PIN" rows="2" required />
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label><i className="fas fa-id-card" /> Aadhaar Number</label>
                  <input className="input-field" value={formData.user.aadhaar_number}
                    onChange={(e) => update('user', 'aadhaar_number', formatAadhaar(e.target.value))}
                    placeholder="1234-5678-9012" maxLength="14" required />
                </div>
                <div className="input-group">
                  <label><i className="fas fa-file-invoice" /> PAN Number</label>
                  <input className="input-field" value={formData.user.pan_number}
                    onChange={(e) => update('user', 'pan_number', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                    placeholder="ABCDE1234F" maxLength="10" required />
                </div>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label><i className="fas fa-briefcase" /> Occupation</label>
                  <input className="input-field" value={formData.user.occupation}
                    onChange={(e) => update('user', 'occupation', e.target.value)}
                    placeholder="Software Engineer" required />
                </div>
                <div className="input-group">
                  <label><i className="fas fa-rupee-sign" /> Annual Income (₹)</label>
                  <input className="input-field" type="number" value={formData.user.annual_income}
                    onChange={(e) => update('user', 'annual_income', e.target.value)}
                    placeholder="500000" required />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Account Setup */}
          {step === 3 && (
            <div className="form-step animate-fade">
              <div className="input-group">
                <label><i className="fas fa-piggy-bank" /> Account Type</label>
                <div className="account-types">
                  {[
                    { v: 'savings', icon: 'fa-coins', label: 'Savings', desc: '4% interest' },
                    { v: 'current', icon: 'fa-chart-line', label: 'Current', desc: 'For business' },
                    { v: 'salary', icon: 'fa-wallet', label: 'Salary', desc: 'Zero balance' }
                  ].map(t => (
                    <label key={t.v} className={`account-option ${formData.account.account_type === t.v ? 'selected' : ''}`}>
                      <input type="radio" name="account_type" value={t.v}
                        checked={formData.account.account_type === t.v}
                        onChange={(e) => update('account', 'account_type', e.target.value)} />
                      <div className="option-content">
                        <i className={`fas ${t.icon}`} />
                        <span>{t.label}</span>
                        <small>{t.desc}</small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label><i className="fas fa-money-bill-wave" /> Initial Deposit (₹)</label>
                <div className="amount-input">
                  <span className="currency-symbol">₹</span>
                  <input className="input-field" type="number" value={formData.account.initial_deposit}
                    onChange={(e) => update('account', 'initial_deposit', e.target.value)}
                    placeholder="1000" min="1000" step="500" required
                    style={{ paddingLeft: '36px' }} />
                </div>
                <div className="input-hint"><i className="fas fa-info-circle" /> Minimum: ₹1,000</div>
              </div>

              {/* Summary */}
              <div className="summary-card">
                <h4><i className="fas fa-clipboard-list" /> Application Summary</h4>
                <div className="summary-grid">
                  <div><span>Name</span><strong>{formData.user.full_name || '—'}</strong></div>
                  <div><span>Email</span><strong>{formData.auth.email || '—'}</strong></div>
                  <div><span>Phone</span><strong>{formData.auth.phone || '—'}</strong></div>
                  <div><span>Account</span><strong className="capitalize">{formData.account.account_type}</strong></div>
                  <div><span>Deposit</span><strong>₹{parseFloat(formData.account.initial_deposit || 0).toLocaleString()}</strong></div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-step animate-fade">
              <div className="verification-panel">
                <div className="verification-icon">
                  <i className="fas fa-envelope-open-text" />
                </div>
                <h3>Verify your email</h3>
                <p>
                  We sent a 6-digit OTP to <strong>{verificationEmail}</strong>.
                  Enter it below to activate your account.
                </p>
              </div>

              <div className="input-group">
                <label><i className="fas fa-key" /> Email OTP</label>
                <input
                  className="input-field otp-input"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="000000"
                  maxLength="6"
                  required
                />
                <div className="input-hint"><i className="fas fa-clock" /> OTP expires in 10 minutes</div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-alert" style={{ margin: '0 var(--space-lg) var(--space-md)' }}>
              <i className="fas fa-exclamation-triangle" />
              <span>{error}</span>
            </div>
          )}

          <div className="modal-actions">
            {step > 1 && step < 4 && (
              <button type="button" className="btn btn-secondary" onClick={() => { setStep(step - 1); setError(''); }}>
                <i className="fas fa-arrow-left" /> Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Continue <i className="fas fa-arrow-right" />
              </button>
            ) : step === 3 ? (
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? (
                  <><div className="loading-spinner sm" /> Creating Account...</>
                ) : (
                  <><i className="fas fa-check-circle" /> Open Account</>
                )}
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-secondary" onClick={handleResendOtp} disabled={loading}>
                  Resend OTP
                </button>
                <button type="button" className="btn btn-primary btn-lg" onClick={handleVerifyEmail} disabled={loading || otp.length !== 6}>
                  {loading ? (
                    <><div className="loading-spinner sm" /> Verifying...</>
                  ) : (
                    <><i className="fas fa-check-circle" /> Verify & Activate</>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
