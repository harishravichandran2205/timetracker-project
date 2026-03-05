import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopHeader from "../components/TopHeader";
import SideNav from "../components/SideNavigation";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/MyAccountPage.css";
import { FaLock, FaLockOpen } from "react-icons/fa";
import CommonLoader from "../components/CommonLoader";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [loadingOtpRequest, setLoadingOtpRequest] = useState(false);

  const getNetworkAwareError = (err, fallbackMessage) => {
    if (axios.isAxiosError(err) && err.code === "ERR_NETWORK") {
      return "Cannot reach server. Please try again Later.";
    }
    return fallbackMessage;
  };

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

  const handleStartEditProfile = () => {
    setProfileMessage("");
    setProfileError("");
    setOtpSent(false);
    setOtpInput("");
    setNewPassword("");
    setConfirmPassword("");
    setOtpMessage("");
    setEditFirstName(userData?.firstName || "");
    setEditLastName(userData?.lastName || "");
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setProfileMessage("");
    setProfileError("");
    setIsEditingProfile(false);
    setEditFirstName(userData?.firstName || "");
    setEditLastName(userData?.lastName || "");
  };

  const handleSaveProfile = async () => {
    setProfileMessage("");
    setProfileError("");

    if (!editFirstName.trim() || !editLastName.trim()) {
      setProfileError("First name and last name are required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const firstName = editFirstName.trim();
      const lastName = editLastName.trim();
      await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        { firstName, lastName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem("firstName", firstName);
      localStorage.setItem("lastName", lastName);
      localStorage.setItem("username", `${firstName} ${lastName}`.trim());

      setUserData((prev) => ({
        ...prev,
        firstName,
        lastName,
      }));
      setProfileMessage("Profile updated successfully.");
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      setProfileError(getNetworkAwareError(err, "Failed to update profile. Try again later."));
    }
  };

  // ===== Request OTP =====
  const handleRequestOtp = async () => {
    setOtpMessage("");
    setSuccessMessage("");
    setIsEditingProfile(false);
    setProfileMessage("");
    setProfileError("");
    setLoadingOtpRequest(true);
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
      setOtpMessage(getNetworkAwareError(err, "Error sending OTP. Try again later."));
    } finally {
      setLoadingOtpRequest(false);
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
    if (!newPassword || !confirmPassword) {
      setOtpMessage("Please enter new password and confirm password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setOtpMessage("New password and confirm password must match.");
      return;
    }
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
        setConfirmPassword("");
      } else {
        setOtpMessage(response.data.data.message || "OTP incorrect or expired.");
      }
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.error?.message || err.response?.data?.message || err.response?.data?.data?.message;
      setOtpMessage(backendMessage || getNetworkAwareError(err, "Error changing password. Try again later."));
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
            <CommonLoader size="sm" />
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
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                  />
                ) : (
                  <span>{userData?.firstName}</span>
                )}
              </div>
              <div className="account-row">
                <label>Last Name:</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                  />
                ) : (
                  <span>{userData?.lastName}</span>
                )}
              </div>

              {!isEditingProfile && !otpSent ? (
                <div className="account-action-row">
                  <button className="btn edit-profile-btn" onClick={handleStartEditProfile}>
                    Edit Profile
                  </button>
                  <button
                    className="btn change-password-btn"
                    onClick={handleRequestOtp}
                    disabled={loadingOtpRequest}
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                isEditingProfile && (
                  <div className="profile-action-row">
                    <button className="btn save-profile-btn" onClick={handleSaveProfile}>
                      Save
                    </button>
                    <button className="btn cancel-profile-btn" onClick={handleCancelEditProfile}>
                      Cancel
                    </button>
                  </div>
                )
              )}

              {profileMessage && <div className="success-message">{profileMessage}</div>}
              {profileError && <div className="error-message">{profileError}</div>}

              {/* Change Password Section */}

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
                  <div className="input-with-icon">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {newPassword && (
                      <span
                        className={`input-icon ${showNewPassword ? "active" : ""}`}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <FaLockOpen /> : <FaLock />}
                      </span>
                    )}
                  </div>
                  <label>Confirm Password:</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loadingOtpRequest && (
            <CommonLoader overlay size="sm" />
          )}
        </main>
      </div>
    </div>
  );
};

export default MyAccountPage;
