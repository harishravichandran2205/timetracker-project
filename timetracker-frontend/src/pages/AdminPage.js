import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/AdminPage.css";

const AdminPage = () => {
  const [mode, setMode] = useState("email");   // default email mode
  const [query, setQuery] = useState("");       // email or client
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setErrorMsg] = useState("");       // must be string
  const [infoMsg, setInfoMsg] = useState("");

  const handleModeChange = (m) => {
    setMode(m);
    setQuery("");
    setResults([]);
    setErrorMsg("");
    setInfoMsg("");
  };

  const handleSearch = async () => {
    setErrorMsg(""); setInfoMsg(""); setResults([]);

    if (!query.trim()) {
      setErrorMsg(mode === "email" ? "Please enter Email" : "Please enter Client");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return setErrorMsg("You are not logged in");

    setLoading(true);

    try {
      let url = "", params = {};

      if (mode === "email") {
        url = `${API_BASE_URL}/api/admin/summary/by-user`;  // ✅ not by-email
        params = { email: query.trim() };                  // ✅ controller expects "email"
      } else {
        url = `${API_BASE_URL}/api/admin/summary/by-client`;
        params = { client: query.trim() };
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      // because controller returns { data: [...] }
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setResults(data);

      if (data.length === 0) setInfoMsg("No effort records found for this input");
      else if (res.data.message) setInfoMsg(res.data.message);

    } catch (err) {
        console.error("Admin summary error:", err);

        const data = err.response?.data;
        let msg = "Failed to fetch summary.";

        // Case 1: backend returns plain string
        if (typeof data === "string") {
          msg = data;
        }
        // Case 2: backend returns {status, message, subErrors}
        else if (data && typeof data === "object") {
          if (typeof data.message === "string") {
            msg = data.message;
          } else if (Array.isArray(data.subErrors) && data.subErrors.length > 0) {
            msg = data.subErrors[0]; // or JSON.stringify(data.subErrors)
          }
        }
        // fallback
        else if (err.message) {
          msg = err.message;
        }

        setErrorMsg(msg); // ✅ only string goes into state
      }
    finally { setLoading(false); }
  };

  return (
    <div className="admin-page">
      <h2 className="page-title">Admin – Effort Summary</h2>

      {/* Filter options */}
      <div className="admin-filters">

        <div className="mode-toggle">
          <label>
            <input type="radio" checked={mode === "email"}
              onChange={() => handleModeChange("email")} />
            <span>By Email</span>
          </label>

          <label>
            <input type="radio" checked={mode === "client"}
              onChange={() => handleModeChange("client")} />
            <span>By Client</span>
          </label>
        </div>

        <div className="query-input">
          <label>{mode === "email" ? "Email ID" : "Client Name"}</label>

          <input
            type="text"
            placeholder={mode === "email" ? "john@company.com" : "ENIA"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button className="btn primary-btn" onClick={handleSearch}>
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      {/* Output messages */}
      {error && <p className="admin-error">{error}</p>}
      {infoMsg && !error && <p className="admin-success">{infoMsg}</p>}

      {/* Table only if results exist */}
      {results.length > 0 && (
        <table className="admin-summary-table">
          <thead>
            <tr>
              <th>User Id</th>
              <th>Client</th>
              <th>Ticket</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td>{r.userId}</td>
                <td>{r.client}</td>
                <td>{r.ticket}</td>
                <td>{r.totalHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


      {results.length === 0 && !error && !infoMsg && (
        <p style={{opacity:.6}}>Enter Email or Client and click Search</p>
      )}
    </div>
  );
};

export default AdminPage;
