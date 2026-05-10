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
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');

  const {
    register,
    verifyEmail,
    resendVerificationOtp
  } = useAuth();
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
    const weakPins = ["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "123456"];
    if (weakPins.includes(transaction_pin)) {
      setError('PIN is too weak. Please choose a more secure PIN.'); return false;
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
    if (u.full_name.trim().length > 50) {
      setError('Full name cannot exceed 50 characters'); return false;
    }
    if (!/^[A-Za-z\s]+$/.test(u.full_name)) {
      setError('Full name must contain only alphabets'); return false;
    }

    if (u.address.trim().length < 10) {
      setError('Address must be at least 10 characters long'); return false;
    }
    if (u.address.trim().length > 250) {
      setError('Address cannot exceed 250 characters'); return false;
    }

    if (u.occupation.trim().length < 2) {
      setError('Occupation must be at least 2 characters'); return false;
    }
    if (u.occupation.trim().length > 50) {
      setError('Occupation cannot exceed 50 characters'); return false;
    }
    if (!/^[A-Za-z\s]+$/.test(u.occupation)) {
      setError('Occupation must contain only alphabets'); return false;
    }
    const age = new Date().getFullYear() - new Date(u.dob).getFullYear();
    if (age < 18) { setError('You must be at least 18 years old'); return false; }
    const aadhaar = u.aadhaar_number.replace(/\D/g, '');
    if (aadhaar.length !== 12) { setError('Enter valid 12-digit Aadhaar number'); return false; }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(u.pan_number.toUpperCase())) {
      setError('Enter valid PAN (e.g., ABCDE1234F)'); return false;
    }
    const income = Number(u.annual_income);
    if (isNaN(income) || income < 10000) {
      setError('Annual income cannot be below 10,000'); return false;
    }
    return true;
  };



  const handleNext = async () => {

    if (
      step === 1 &&
      validateStep1()
    ) {
      setStep(2);
      setError('');
    }

    else if (
      step === 2 &&
      validateStep2()
    ) {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {



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
        }
      };
      const res = await register(payload);

      setVerificationEmail(
        res.user?.email ||
        payload.auth.email
      );

      setStep(3);

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

  const handleVerifyEmail =
    async () => {

      if (!otp) {
        setError(
          'Enter OTP'
        );

        return;
      }

      setLoading(true);

      setError('');

      try {

        await verifyEmail(
          verificationEmail,
          otp
        );

        onClose();

        navigate('/dashboard');

      } catch (err) {

        setError(
          err.data?.message ||
          err.message ||
          'Verification failed'
        );

      } finally {
        setLoading(false);
      }
    };

  const handleResendOtp =
    async () => {

      if (!verificationEmail)
        return;

      try {

        await resendVerificationOtp(
          verificationEmail
        );

      } catch (err) {

        setError(
          err.data?.message ||
          err.message
        );
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
          <p>Join Horizon Bank in 3 easy steps</p>
          <button className="close-btn" onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        {/* Progress */}
        <div className="progress-indicator">
          {[
            { n: 1, label: 'Credentials', icon: 'fa-key' },
            { n: 2, label: 'KYC Details', icon: 'fa-id-card' },
            { n: 3, label: 'Verify', icon: 'fa-envelope-open-text' }
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

        <form>
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
          {/* Step 3 — Verify OTP */}
          {step === 3 && (
            <div className="form-step animate-fade">

              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '24px'
                }}
              >
                <i
                  className="fas fa-envelope-open-text"
                  style={{
                    fontSize: '3rem',
                    color: 'var(--primary)',
                    marginBottom: '16px'
                  }}
                />

                <h3>Email Verification</h3>

                <p>
                  Enter the OTP sent to:
                </p>

                <strong>
                  {verificationEmail}
                </strong>
              </div>

              <div className="input-group">
                <label>
                  <i className="fas fa-key" />
                  Verification OTP
                </label>

                <input
                  className="input-field"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                />
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

            {step > 1 && step < 3 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setStep(step - 1);
                  setError('');
                }}
              >
                <i className="fas fa-arrow-left" />
                Back
              </button>
            )}

            {step < 2 ? (

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
              >
                Continue
                <i className="fas fa-arrow-right" />
              </button>

            ) : step === 2 ? (

              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner sm" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle" />
                    Submit KYC
                  </>
                )}
              </button>

            ) : (

              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResendOtp}
                >
                  Resend OTP
                </button>

                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleVerifyEmail}
                  disabled={
                    loading || otp.length !== 6
                  }
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner sm" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle" />
                      Verify & Activate
                    </>
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