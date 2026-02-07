import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import API from '../utils/api';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatPhoneNumber = (phone) => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Add country code if not present
    if (!phone.startsWith('+')) {
      // Assuming US/Canada (+1) if no country code
      // You can modify this based on your primary user base
      if (cleaned.length === 10) {
        cleaned = '1' + cleaned;
      }
    }

    return '+' + cleaned;
  };

  const handleSendOTP = async () => {
    if (!formData.phone) {
      toast.error('Please enter phone number');
      return;
    }

    const formattedPhone = formatPhoneNumber(formData.phone);

    setSendingOtp(true);
    try {
      const res = await API.post('/auth/send-otp', { phone: formattedPhone });

      if (res.data.success) {
        toast.success('Verification code sent to your phone!');
        setOtpSent(true);
        setFormData({ ...formData, phone: formattedPhone });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      toast.error('Please enter verification code');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await API.post('/auth/verify-otp', {
        phone: formData.phone,
        code: otpCode
      });

      if (res.data.success) {
        toast.success('Phone number verified!');
        setPhoneVerified(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation - Phone verification is REQUIRED
    if (!phoneVerified) {
      toast.error('Please verify your phone number first');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    registerData.phoneVerified = true; // Must be verified to reach here

    const result = await register(registerData);

    if (result.success) {
      toast.success('Registration successful!');
      navigate('/');
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Sign up to start booking events</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-control"
                required
                disabled={phoneVerified}
                placeholder="+1234567890 (with country code)"
                style={{ flex: 1 }}
              />
              {!phoneVerified && !otpSent && (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="btn btn-secondary"
                  disabled={sendingOtp}
                  style={{ minWidth: '120px' }}
                >
                  {sendingOtp ? 'Sending...' : 'Send OTP'}
                </button>
              )}
              {phoneVerified && (
                <span style={{ color: 'green', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                  ✓ Verified
                </span>
              )}
            </div>
            <small style={{ color: '#666', fontSize: '12px' }}>
              Format: +[country code][phone number] (e.g., +11234567890)
            </small>
          </div>

          {otpSent && !phoneVerified && (
            <div className="form-group" style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px', border: '1px solid #667eea' }}>
              <label htmlFor="otpCode">Verification Code</label>
              <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
                Enter the 6-digit code sent to your phone
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  id="otpCode"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="form-control"
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  className="btn btn-primary"
                  disabled={verifyingOtp}
                  style={{ minWidth: '120px' }}
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSendOTP}
                className="btn btn-link"
                disabled={sendingOtp}
                style={{ padding: '5px 0', fontSize: '14px' }}
              >
                Resend Code
              </button>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              required
              placeholder="Create a password (min 6 characters)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-control"
              required
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;