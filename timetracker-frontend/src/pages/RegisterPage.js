// src/pages/RegisterPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './css/RegisterPage.css';
import API_BASE_URL from "../config/BackendApiConfig";
import { FaLock, FaLockOpen } from "react-icons/fa";

const RegisterPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'error' or 'success'
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const restrictAction = (e) => { e.preventDefault(); setMessage({
     text: "Copy, paste and cut operations are not allowed in confirm password.",
     type: "error"
   });
  };
  const handleKeyDownRestriction = (e) => {
   if (
     (e.ctrlKey || e.metaKey) &&
     ["c", "x", "v"].includes(e.key.toLowerCase())
   ) {
     e.preventDefault();

     setMessage({
       text: "Copy, paste and cut operations are not allowed in confirm password.",
       type: "error"
     });
    }
  };


  // Auto-hide message after 7 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setMessage({ text: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    try {
      console.log('Registering:', { firstName, lastName, email, password, roles: [role] });

      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        firstName,
        lastName,
        email,
        password,
        roles: [role],
      });

      // Success
      setMessage({ text: 'User created successfully! Please log in.', type: 'success' });

      // Optional: Navigate to login after a short delay
      setTimeout(() => {
        navigate('/login', { state: { successMessage: 'User created successfully! Please log in.' } });
      }, 1500);

    } catch (error) {
      console.error('Registration failed:', error);

      if (error.response?.status === 409) {
        setMessage({ text: 'User already exists with this email.', type: 'error' });
      } else {
        setMessage({ text: 'Failed to create user. Please try again.', type: 'error' });
      }
    }
  };

  return (
    <div className="register-container">
      <h2>Create New User</h2>

      {/* Inline message below heading */}
      {message.text && (
        <div className={`inline-message ${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleRegister} className="register-form">
        <div className="form-group">
          <label>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
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
             title={showPassword ? "Hide password" : "Show password"}
           >
             {showPassword ? <FaLockOpen /> : <FaLock />}
           </span>
         )}
       </div>
     </div>

       <div className="form-group">
          <label>Confirm Password:</label>
         <input
           type="password"
           value={confirmPassword}
           onChange={(e) => setConfirmPassword(e.target.value)}
           onPaste={restrictAction}
           onCopy={restrictAction}
           onCut={restrictAction}
           onKeyDown={handleKeyDownRestriction}
           required
         />
        </div>

        <div className="form-group">
          <label>Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="USER">User</option>
          </select>
        </div>

        <button type="submit" className="register-button">
          Register
        </button>
      </form>
     </div>
  );
};

export default RegisterPage;
