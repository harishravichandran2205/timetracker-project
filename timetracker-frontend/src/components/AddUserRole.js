import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";

const AddUserRole = () => {
  const [roleName, setRoleName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!roleName.trim()) {
      setMessage("Role name is required");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/admin/user-role`, {
        roleName
      });
      setMessage("User role added successfully");
      setRoleName("");
    } catch (err) {
      setMessage("Failed to add role");
    }
  };

  return (
    <div className="admin-card">
      <h3>Add User Role</h3>

      <input
        type="text"
        placeholder="Enter role name"
        value={roleName}
        onChange={(e) => setRoleName(e.target.value)}
      />

      <button onClick={handleSubmit}>Add Role</button>

      {message && <p>{message}</p>}
    </div>
  );
};

export default AddUserRole;
