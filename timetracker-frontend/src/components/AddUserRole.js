import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/AddClient.css";

const AddUserRole = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("User email is required");
      return;
    }

    if (!role.trim()) {
      setError("Role is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API_BASE_URL}/api/admin-panel/user-role`,
        { email, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data?.message || "Role added successfully");
      setEmail("");
      setRole("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add role");
    }
  };

  return (
    <div className="client-card">
      <h3>User Role Management</h3>

      <input
        type="email"
        placeholder="User Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="text"
        placeholder="Role (ADMIN / USER / MANAGER)"
        value={role}
        onChange={(e) => setRole(e.target.value.toUpperCase())}
      />

      <button className="btn primary-btn" onClick={handleSubmit}>
        SAVE
      </button>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
    </div>
  );
};

export default AddUserRole;
