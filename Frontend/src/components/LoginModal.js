import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginModal.css';

const LoginModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('login');
  const [resetOtp, setResetOtp] = useState('');
  const [verificationOtp, setVerificationOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const { login, forgotPassword, resetPassword, verifyEmail, resendVerificationOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      if (err.data?.requires_email_verification) {
        setMode('verify');
        setVerificationOtp('');
        setError('Enter the OTP sent to your email, or resend it below.');
        return;
      }

      setError(err.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPendingEmail = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !verificationOtp) {
      setError('Enter your email and verification OTP');
      return;
    }

    setLoading(true);

    try {
      await verifyEmail(email, verificationOtp);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(err.data?.message || err.message || 'Email verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationOtp = async () => {
    setError('');

    if (!email) {
      setError('Enter your registered email');
      return;
    }

    setLoading(true);

    try {
      await resendVerificationOtp(email);
    } catch (err) {
      setError(err.data?.message || err.message || 'Failed to resend verification OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Enter your registered email');
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(email);
      setMode('reset');
    } catch (err) {
      setError(err.data?.message || err.message || 'Unable to send reset OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !resetOtp || !newPassword || !confirmNewPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email, resetOtp, newPassword);
      setPassword('');
      setResetOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setMode('login');
    } catch (err) {
      setError(err.data?.message || err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-header">
          <button className="login-close" onClick={onClose}>
            <i className="fas fa-times" />
          </button>
          <div className="login-logo">
            <i className="fas fa-landmark" />
          </div>
          <h2>
            {mode === 'login'
              ? 'Welcome Back'
              : mode === 'forgot'
                ? 'Reset Password'
                : mode === 'verify'
                  ? 'Verify Email'
                  : 'Enter Reset OTP'}
          </h2>
          <p>
            {mode === 'login'
              ? 'Sign in to your Horizon Bank account'
              : mode === 'forgot'
                ? 'We will send an OTP to your registered email'
                : mode === 'verify'
                  ? 'Activate your pending account with your email OTP'
                  : 'Use the OTP from your email and choose a new password'}
          </p>
        </div>

        <form onSubmit={mode === 'login' ? handleSubmit : mode === 'forgot' ? handleForgotPassword : mode === 'verify' ? handleVerifyPendingEmail : handleResetPassword}>
          <div className="login-form">
            <div className="input-group">
              <label>
                <i className="fas fa-envelope" />
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
              />
            </div>

            {mode === 'login' && (
            <div className="input-group">
              <label>
                <i className="fas fa-lock" />
                Password
              </label>
              <div className="login-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>
            )}

            {mode === 'verify' && (
              <div className="input-group">
                <label>
                  <i className="fas fa-key" />
                  Verification OTP
                </label>
                <input
                  type="text"
                  className="input-field login-otp-input"
                  value={verificationOtp}
                  onChange={(e) => setVerificationOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  required
                />
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div className="input-group">
                  <label>
                    <i className="fas fa-key" />
                    Reset OTP
                  </label>
                  <input
                    type="text"
                    className="input-field login-otp-input"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength="6"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    <i className="fas fa-lock" />
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New secure password"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>
                    <i className="fas fa-check-circle" />
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </>
            )}

            {error && (
              <div className="error-alert">
                <i className="fas fa-exclamation-circle" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner sm" />
                  {mode === 'login' ? 'Signing in...' : 'Processing...'}
                </>
              ) : (
                <>
                  <i className={`fas ${mode === 'login' ? 'fa-sign-in-alt' : mode === 'forgot' ? 'fa-paper-plane' : 'fa-check-circle'}`} />
                  {mode === 'login'
                    ? 'Secure Login'
                    : mode === 'forgot'
                      ? 'Send Reset OTP'
                      : mode === 'verify'
                        ? 'Verify & Activate'
                        : 'Reset Password'}
                </>
              )}
            </button>

            <div className="login-secondary-actions">
              {mode === 'login' ? (
                <button type="button" onClick={() => { setMode('forgot'); setError(''); }}>
                  Forgot password?
                </button>
              ) : (
                <button type="button" onClick={() => { setMode('login'); setError(''); }}>
                  Back to login
                </button>
              )}

              {mode === 'verify' && (
                <button type="button" onClick={handleResendVerificationOtp} disabled={loading}>
                  Resend verification OTP
                </button>
              )}

              {mode === 'reset' && (
                <button type="button" onClick={handleForgotPassword} disabled={loading}>
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
