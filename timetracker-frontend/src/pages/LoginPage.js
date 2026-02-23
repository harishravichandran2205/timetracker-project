import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from "../config/BackendApiConfig";
import './css/LoginPage.css';
import logo from "../assets/images/company-logo.png";
import { FaLock, FaLockOpen } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  // Get success message from registration
  useEffect(() => {
    const message = location.state?.successMessage || '';
    const sessionMsg =
      location.state?.warningMessage ||
      sessionStorage.getItem("warningMessage") ||
      "";
    setSuccessMessage(message);
    if (sessionMsg) {
        setWarningMessage(sessionMsg);
        sessionStorage.removeItem("warningMessage");
      }

    if (message || sessionMsg) {
      const timer = setTimeout(() => {
            setSuccessMessage('');
            setWarningMessage('');
          }, 5000); // hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const { login } = useAuth();
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      console.log('Full response:', response);

      const { accessToken, username ,roles } = response.data.data;
      localStorage.setItem('token', accessToken);
      localStorage.setItem('username', username);
      localStorage.setItem('email', email);
      localStorage.setItem('roles', JSON.stringify(roles));
      console.log(roles);

      login(response.data.data);
      navigate('/dashboard');
    } catch (err) {
      if (err.response) {
        const errorMessage = err.response.data?.error?.message || 'Unknown error';
        if (err.response.status === 500 || err.response.status === 400) {
          setError(errorMessage);
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else if (err.request) {
        setError('No response from server');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
     <img src={logo} alt="Logo" className="login-company-logo" />
      <h2>Login</h2>

      {/* Success message under heading */}
      {successMessage && <h3 className="success-message">{successMessage}</h3>}

      <form onSubmit={handleLogin} className="login-form">
       <div className="form-group">
         <label>Email:</label>
         <div className="input-with-icon">
           <input
             type="email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
           />
         </div>
       </div>

    <div className="form-group">
      <label>Password:</label>
       <div className="input-with-icon">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {password && (
          <span
            className={`input-icon ${showPassword ? "active" : ""}`}
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Hide password" : "Show password"} >
            {showPassword ? <FaLockOpen /> : <FaLock />}
          </span>
        )}
      </div>
    </div>


      {error && <p className="error-message">{error}</p>}
         <p className="forgot-password" onClick={() => navigate('/forgot-password')}>
                  Forgot Password?
                </p>

        <button type="submit" className="login-button">Login</button>
      </form>

      <p className="register-link">
        Don’t have an account?{' '}
        <button
          className="create-button"
          onClick={() => navigate('/register')}
        >
          Create New User
        </button>
      </p>
    </div>
  );
};

export default LoginPage;
