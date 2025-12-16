import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/AddClient.css";

const AddClient = () => {
  const [action, setAction] = useState("add");

  const [clientCodes, setClientCodes] = useState([]);

  const [addClientCode, setAddClientCode] = useState("");
  const [addClientName, setAddClientName] = useState("");

  const [oldClientCode, setOldClientCode] = useState("");
  const [oldClientName, setOldClientName] = useState("");

  const [newClientCode, setNewClientCode] = useState("");
  const [newClientName, setNewClientName] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /* ================= FETCH CLIENT CODES ================= */
  const fetchClientCodes = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_BASE_URL}/api/admin-panel/client-codes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setClientCodes(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to fetch client codes", err);
      setClientCodes([]);
    }
  };

  /* ================= PAGE LOAD ================= */
  useEffect(() => {
    fetchClientCodes();
  }, []);

  /* ================= AUTO FILL CLIENT NAME ================= */
  useEffect(() => {
    if (!oldClientCode || action === "add") {
      setOldClientName("");
      return;
    }

    const fetchClientName = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${API_BASE_URL}/api/admin-panel/client/${oldClientCode}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setOldClientName(res.data?.data?.clientName || "");
      } catch {
        setOldClientName("");
      }
    };

    fetchClientName();
  }, [oldClientCode, action]);

  /* ================= VALIDATION ================= */
  const validate = () => {
    setError("");
    setMessage("");

    if (action === "add") {
      if (!addClientCode || !addClientName) {
        setError("Client Code and Client Name are required");
        return false;
      }
    }

    if (action === "modify") {
      if (!oldClientCode) {
        setError("Old Client Code is required");
        return false;
      }
      if (!newClientCode && !newClientName) {
        setError("Enter New Client Code or New Client Name");
        return false;
      }
    }

    if (action === "delete") {
      if (!oldClientCode) {
        setError("Client Code is required");
        return false;
      }
    }

    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!validate()) return;

    const token = localStorage.getItem("token");
    let url = "";
    let payload = {};

    if (action === "add") {
      url = "/api/admin-panel/add";
      payload = {
        clientCd: addClientCode.toUpperCase(),
        clientName: addClientName,
      };
    }

    if (action === "modify") {
      url = "/api/admin-panel/modify";
      payload = {
        oldClientCd: oldClientCode,
        newClientCd: newClientCode || null,
        newClientName: newClientName || null,
      };
    }

    if (action === "delete") {
      url = "/api/admin-panel/delete";
      payload = { clientCd: oldClientCode };
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}${url}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data?.data?.message || "Success");
      setError("");

      // 🔥 REFRESH DROPDOWN AFTER CHANGE
      await fetchClientCodes();

      // reset fields
      setAddClientCode("");
      setAddClientName("");
      setOldClientCode("");
      setOldClientName("");
      setNewClientCode("");
      setNewClientName("");
    } catch (err) {
      setError(err.response?.data?.data?.message || "Operation failed");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="client-card">
      <h3>Client Management</h3>

      {/* ACTION */}
      <div className="radio-group">
        {["add", "modify", "delete"].map((a) => (
          <label key={a}>
            <input
              type="radio"
              checked={action === a}
              onChange={() => {
                setAction(a);
                setError("");
                setMessage("");
                setAddClientCode("");
                setAddClientName("");
                setOldClientCode("");
                setOldClientName("");
                setNewClientCode("");
                setNewClientName("");
              }}
            />
            {a.toUpperCase()}
          </label>
        ))}
      </div>

      {/* ADD */}
      {action === "add" && (
        <>
          <input
            placeholder="Client Code"
            value={addClientCode}
            onChange={(e) => setAddClientCode(e.target.value.toUpperCase())}
          />
          <input
            placeholder="Client Name"
            value={addClientName}
            onChange={(e) => setAddClientName(e.target.value)}
          />
        </>
      )}

      {/* MODIFY / DELETE */}
      {(action === "modify" || action === "delete") && (
        <>
          <select
            value={oldClientCode}
            onChange={(e) => setOldClientCode(e.target.value)}
          >
            <option value="">Select Client Code</option>
            {clientCodes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            placeholder="Client Name"
            value={oldClientName}
            disabled
          />
        </>
      )}

      {/* MODIFY NEW FIELDS */}
      {action === "modify" && (
        <>
          <input
            placeholder="New Client Code (optional)"
            value={newClientCode}
            onChange={(e) => setNewClientCode(e.target.value.toUpperCase())}
          />
          <input
            placeholder="New Client Name (optional)"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
          />
        </>
      )}

      <button className="btn primary-btn" onClick={handleSubmit}>
        {action.toUpperCase()}
      </button>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
    </div>
  );
};

export default AddClient;
