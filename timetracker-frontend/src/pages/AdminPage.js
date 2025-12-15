// src/pages/AdminPage.js
import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/AdminPage.css";

const AdminPage = () => {
  const [client, setClient] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  // ===== Date limits (max = today, no min for admin) =====
  const today = new Date();
  const calendarMax = today.toISOString().split("T")[0];
  const calendarMin = ""; // no restriction for admin

  const formatForBackend = (dateStr) => {
      if (!dateStr) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [yyyy, mm, dd] = dateStr.split("-");
        return `${dd}-${mm}-${yyyy}`;
      }
      return dateStr;
    };

  const handleSearch = async () => {
    setError("");
    setInfoMsg("");
    setResults([]);

    if (!client.trim()) {
      setError("Please enter client name");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You are not logged in");
      return;
    }

    setLoading(true);

    try {

      const res = await axios.get(
              `${API_BASE_URL}/api/admin-panel/by-client?client=${client}&startDate=${formatForBackend(
                startDate
              )}&endDate=${formatForBackend(endDate)}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

      const data =Array.isArray(res.data?.data?.data)
                          ? res.data.data.data
                          : [];
      setResults(data);

      if (data.length === 0) {
        setInfoMsg("No effort records found for this client and date range");
      } else if (res.data.message) {
        setInfoMsg(res.data.message);
      }
    } catch (err) {
      console.log("test",err);
      console.error("Admin summary error:", err);
      setError("Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h2 className="page-title">Admin – Effort Summary</h2>

      {/* Filters */}
      <div className="admin-filters">
        <div className="query-input">
          <label>Client Name</label>
          <input
            type="text"
            placeholder="ENIA"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
        </div>

        <div className="date-range">
          <div className="date-input">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              min={calendarMin}
              max={calendarMax}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="date-input">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              min={calendarMin}
              max={calendarMax}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <button className="btn primary-btn" onClick={handleSearch}>
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      {/* Messages */}
      {error && <p className="admin-error">{error}</p>}
      {infoMsg && !error && <p className="admin-success">{infoMsg}</p>}

      {/* Results table */}
      {/* Admin Summary Table - Same Structure as SummaryTable.js */}
      {results.length > 0 && (
        <table className="summary-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Ticket</th>
              <th>Ticket Desc</th>
              <th>Category</th>
              <th>Description</th>
              <th>Hours</th>
              <th>Billable</th>
            </tr>
          </thead>

          <tbody>
            {results.map((task, idx) => (
              <tr key={idx}>
                <td>{task.date}</td>
                <td>{task.client}</td>
                <td>{task.ticket}</td>
                <td>{task.ticketDescription}</td>
                <td>{task.category}</td>
                <td>{task.description}</td>
                <td>{task.hours}</td>
                <td>{task.billable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


      {results.length === 0 && !error && !infoMsg && (
        <p style={{ opacity: 0.6 }}>
          Enter client and date range, then click Search
        </p>
      )}
    </div>
  );
};

export default AdminPage;
