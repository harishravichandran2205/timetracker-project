// src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from "../config/BackendApiConfig";
import './css/ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: enter email, 2: otp & new password
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);

  // ===== Step 1: Check if email exists =====
  const handleCheckEmail = async () => {
    setError('');
    setMessage('');
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    try {
      setLoadingOtp(true);
      const response = await axios.post(`${API_BASE_URL}/api/users/checkemail`, { email });
      if (response.data.data.exists) {
        setMessage("Email verified. You can request OTP.");
        setStep(2);
      } else {
        setError("Email not found.");
      }
    } catch (err) {
      setError("Error checking email. Try again later.");
      console.error(err);
    } finally {
      setLoadingOtp(false);
    }
  };

  // ===== Step 2: Send OTP =====
  const handleSendOtp = async () => {
    setError('');
    setMessage('');
    setLoadingOtp(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/requestotp`, { email });
      if (response.data.data.success) {
        setOtpSent(true);
        setMessage(`OTP sent to ${email}. Check your inbox.`);
      } else {
        setError("Failed to send OTP. Try again.");
      }
    } catch (err) {
      setError("Error sending OTP. Try again later.");
      console.error(err);
    } finally {
      setLoadingOtp(false);
    }
  };

  // ===== Step 3: Verify OTP & change password =====
  const handleChangePassword = async () => {
    setError('');
    setMessage('');

    // Validations
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}$/;
    if (!otpInput) {
      setError("Please enter OTP.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError("Please enter new password and confirm it.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!passwordRegex.test(newPassword)) {
      setError("Password must be at least 8 characters, include uppercase, number and special character.");
      return;
    }

    setLoadingOtp(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/change-password`, {
        email,
        otp: otpInput,
        newPassword
      });
      if (response.data.data.success) {
        setMessage("Password changed successfully! Redirecting to login...");
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(response.data.message || "OTP incorrect or expired.");
      }
    } catch (err) {
      setError("Error changing password. Try again later.");
      console.error(err);
    } finally {
      setLoadingOtp(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Step 1: Enter Email */}
      {step === 1 && (
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn" onClick={handleCheckEmail}>Next</button>
        </div>
      )}

      {/* Step 2: OTP & Password */}
      {step === 2 && (
        <div className="otp-section">
          {!otpSent && (
            <button className="btn" onClick={handleSendOtp}>
              Send OTP
            </button>
          )}

          {otpSent && (
            <>
              <div className="form-group">
                <label>Enter OTP:</label>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>New Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Confirm Password:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button className="btn" onClick={handleChangePassword}>
                Change Password
              </button>
            </>
          )}
        </div>
      )}

      {/* Loading Spinner */}
      {loadingOtp && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
