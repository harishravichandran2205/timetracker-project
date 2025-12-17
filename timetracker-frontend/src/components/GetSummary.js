// src/pages/AdminPage.js
import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";
import "../pages/css/AdminPage.css";
import "../pages/css/SummaryPage.css";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";

const GetSummary = () => {
  const [searchBy, setSearchBy] = useState("client");
  const [client, setClient] = useState("");
  const [emails, setEmails] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const today = new Date();
  const calendarMax = today.toISOString().split("T")[0];
  const navigate = useNavigate();

  const formatForBackend = (dateStr) => {
    if (!dateStr) return "";
    const [yyyy, mm, dd] = dateStr.split("-");
    return `${dd}-${mm}-${yyyy}`;
  };

  const buildSummaryData = (rows = []) => {
    const map = {};

    rows.forEach((row) => {
      if (!row || !row.ticket) return;

      const ticket = row.ticket;

      if (!map[ticket]) {
        map[ticket] = {
          client: row.client || "",
          ticket: row.ticket,
          ticketDescription: row.ticketDescription || "",
          billableHours: 0,
          nonBillableHours: 0,
          descriptions: new Set() // ✅ Use Set for uniqueness
        };
      }

      const hours = Number(row.hours || 0);

      if (row.billable === "Yes") {
        map[ticket].billableHours += hours;
      } else {
        map[ticket].nonBillableHours += hours;
      }

      if (row.description) {
        map[ticket].descriptions.add(row.description.trim());
      }
    });

    // Convert Set → Array for rendering
    return Object.values(map).map(item => ({
      ...item,
      descriptions: Array.from(item.descriptions)
    }));
  };

  const downloadExcel = async () => {
    try {
      const token = localStorage.getItem("token");

      const payload = {
        searchBy,
        client,
        emails: emails.split(",").map(e => e.trim()).filter(Boolean),
        startDate: formatForBackend(startDate),
        endDate: formatForBackend(endDate),
        exportAll: true // ✅ KEY
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/admin-panel/search`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data =Array.isArray(res.data?.data?.data)
                                ? res.data.data.data
                                : [];

      const fullData = buildSummaryData(data);
      generateExcel(fullData);

    } catch (err) {
      alert("Failed to download Excel");
    }
  };

  const generateExcel = (data) => {
    const excelData = data.map(row => ({
      "Client Name": row.client,
      "Ticket Number": row.ticket,
      "Ticket Description": row.ticketDescription,
      "Billable Hours": row.billableHours,
      "Non-Billable Hours": row.nonBillableHours,
      "Task Description": (row.descriptions || [])
        .map((d, i) => `${i + 1}. ${d}`)
        .join("\n")
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // ===== Header Style =====
    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" }
    };

    ["A1","B1","C1","D1","E1","F1"].forEach(cell => {
      if (worksheet[cell]) worksheet[cell].s = headerStyle;
    });

    // ===== Wrap text for Task Description =====
    excelData.forEach((_, i) => {
      const cell = `F${i + 2}`;
      if (worksheet[cell]) {
        worksheet[cell].s = {
          alignment: { wrapText: true, vertical: "top" }
        };
      }
    });

    // ===== Column widths =====
    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 30 },
      { wch: 16 },
      { wch: 20 },
      { wch: 60 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");

    XLSX.writeFile(
      workbook,
      `Effort_Summary_${new Date().toISOString().slice(0,10)}.xlsx`
    );
  };






  const handleSearch = async () => {
    setError("");
    setInfoMsg("");
    setResults([]);

    if (searchBy === "client" && !client.trim()) {
      setError("Please enter client name");
      return;
    }
    if (searchBy === "email" && !emails.trim()) {
      setError("Please enter at least one email");
      return;
    }
    if (searchBy === "both" && (!client.trim() || !emails.trim())) {
      setError("Please enter both client and email");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select start and end dates");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You are not logged in");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        searchBy,
        client,
        emails: emails.split(",").map(e => e.trim()).filter(Boolean),
        startDate: formatForBackend(startDate),
        endDate: formatForBackend(endDate)
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/admin-panel/search`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const summaryData = res?.data?.data || [];

      console.log("Summary Data:", summaryData);

     if (summaryData.length === 0) {
       setInfoMsg("No effort records found for entered criteria");
       return;
     }

     navigate("/admin/filtered-summary", {
       state: { results: summaryData }
     });
    } catch (err) {
      setError("Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">

      {/* FILTER CARD */}
      <div className="filter-card">

        <div className="search-by">
          <label className="section-label">Search By</label>
          <div className="radio-group">
            <label><input type="radio" checked={searchBy === "client"} onChange={() => setSearchBy("client")} /> Client</label>
            <label><input type="radio" checked={searchBy === "email"} onChange={() => setSearchBy("email")} /> Email</label>
            <label><input type="radio" checked={searchBy === "both"} onChange={() => setSearchBy("both")} /> Both</label>
          </div>
        </div>
        <div className="date-range-container" >
            <div className="filter-grid">
              {(searchBy === "client" || searchBy === "both") && (
                <div className="query-input input-small">
                  <label>Client Name</label>
                  <textarea rows="2" value={client} onChange={(e) => setClient(e.target.value)} />
                </div>
              )}

          {(searchBy === "email" || searchBy === "both") && (
            <div className="query-input input-large">
              <label>Email IDs</label>
              <textarea
                rows="2"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="user1@test.com, user2@test.com"
              />
            </div>
          )}

              <div className="query-input input-date">
                <label>Start Date</label>
                <input type="date" value={startDate} max={calendarMax} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div className="query-input input-date">
                <label>End Date</label>
                <input type="date" value={endDate} max={calendarMax} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="action-row">
              <button className="btn primary-btn" onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </button>
              <button className="btn secondary-btn" onClick={downloadExcel}>
                Download Full Report
              </button>
            </div>
       </div>
      </div>



    </div>
  );
};

export default GetSummary;
