import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopHeader from "../components/TopHeader";
import SideNav from "../components/SideNavigation";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/MyAccountPage.css";
import PasswordPolicyHint from "../components/PasswordPolicyHint";
import { validatePasswordPolicy } from "../utils/passwordPolicy";

const MyAccountPage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/getuser/${email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch user details.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [navigate]);

  const storedUsername = localStorage.getItem("username");

  // ===== Request OTP =====
  const handleRequestOtp = async () => {
    setOtpMessage("");
    setSuccessMessage("");
    try {
      const token = localStorage.getItem("token");
      const email = userData?.email;
      const response = await axios.post(
        `${API_BASE_URL}/api/users/requestotp`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(response);
      if (response.data.data.success) {
      console.log("insideIf");
        setOtpSent(true);
        setOtpMessage(`OTP sent to ${email}. Please check your inbox.`);
      } else {
        setOtpMessage("Failed to send OTP. Try again.");
      }
    } catch (err) {
      console.error(err);
      setOtpMessage("Error sending OTP. Try again later.");
    }
  };

  // ===== Verify OTP and Change Password =====
  const handleChangePassword = async () => {
    setOtpMessage("");
    setSuccessMessage("");
    const passwordValidationMessage = validatePasswordPolicy({
      password: newPassword,
      firstName: userData?.firstName,
      lastName: userData?.lastName,
      email: userData?.email
    });
    if (passwordValidationMessage) {
      setOtpMessage(passwordValidationMessage);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const email = userData?.email;
      const response = await axios.post(
        `${API_BASE_URL}/api/users/change-password`,
        { email, otp: otpInput, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.data.success) {
        setSuccessMessage("Password changed successfully!");
        setOtpSent(false);
        setOtpInput("");
        setNewPassword("");
      } else {
        setOtpMessage(response.data.data.message || "OTP incorrect or expired.");
      }
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.error?.message || err.response?.data?.message || err.response?.data?.data?.message;
      setOtpMessage(backendMessage || "Error changing password. Try again later.");
    }
  };

  return (
    <div className="layout-container">
      <TopHeader username={storedUsername || "User"} />
      <div className="main-section">
        <SideNav onNavClick={(path) => navigate(path)} />
        <main className="page-content">
          <h2 className="page-title">My Account</h2>

          {loading ? (
            <p>Loading your account details...</p>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="account-card">
              <div className="account-row">
                <label>Email ID:</label>
                <span>{userData?.email}</span>
              </div>
              <div className="account-row">
                <label>First Name:</label>
                <span>{userData?.firstName}</span>
              </div>
              <div className="account-row">
                <label>Last Name:</label>
                <span>{userData?.lastName}</span>
              </div>

              {/* Change Password Section */}
              {!otpSent && (
                <button className="btn change-password-btn" onClick={handleRequestOtp}>
                  Change Password
                </button>
              )}

              {otpSent && (
                <div className="otp-section">
                  <p>{otpMessage}</p>
                  <label>Enter OTP:</label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                  />
                  <label>New Password:</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <PasswordPolicyHint />
                  <button className="btn save-password-btn" onClick={handleChangePassword}>
                    Save New Password
                  </button>
                </div>
              )}

              {successMessage && <div className="success-message">{successMessage}</div>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyAccountPage;
