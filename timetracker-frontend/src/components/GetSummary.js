// src/pages/AdminPage.js
import React, { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/GetSummary.css";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const sanitizeFilePart = (value) =>
    (value || "")
      .toString()
      .trim()
      .replace(/[\\/:*?"<>|]/g, " ")
      .replace(/\s+/g, " ");

  const getEmailPrefix = (emailsInput) => {
    const list = Array.isArray(emailsInput)
      ? emailsInput
      : String(emailsInput || "").split(",");
    return list
      .map((e) => e.trim())
      .filter(Boolean)
      .map((email) => (email.includes("@") ? email.split("@")[0] : email))
      .join("_");
  };

  const buildExportBaseName = () => {
    const datePart = new Date().toISOString().slice(0, 10);
    const clientPart = sanitizeFilePart(client);
    const emailPart = sanitizeFilePart(getEmailPrefix(emails));

    if (searchBy === "client" && clientPart) {
      return `${clientPart}_Effort summary_${datePart}`;
    }
    if (searchBy === "email" && emailPart) {
      return `${emailPart}_Effort summary_${datePart}`;
    }
    if (searchBy === "both") {
      const prefix = [clientPart, emailPart].filter(Boolean).join("_");
      if (prefix) return `${prefix}_Effort summary_${datePart}`;
    }
    return `Effort summary_${datePart}`;
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
        exportAll: true
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/admin-panel/search`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const summaryData =Array.isArray(res.data?.data?.data)
                                ? res.data.data.data
                                : [];
      generateExcel(summaryData);

    } catch (err) {
      alert("Failed to download Excel");
    }
  };

  const generatePDF = (data) => {
    const doc = new jsPDF("landscape");

    doc.setFontSize(14);
    doc.text("Effort Summary Report", 14, 15);

    const tableColumn = [
      "Client Name",
      "Project",
      "Ticket Number",
      "Ticket Description",
      "Billable Hours",
      "Non-Billable Hours",
      "Task Description"
    ];

    const tableRows = data.map(row => [
      row.client,
      row.project,
      row.ticket,
      row.ticketDescription,
      row.billableHours ?? 0,
      row.nonBillableHours ?? 0,
      (row.descriptions || [])
        .map((d, i) => `${i + 1}. ${d}`)
        .join("\n")
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: "top"
      },
      headStyles: {
        fillColor: [41, 128, 185]
      },
      columnStyles: {
        6: { cellWidth: 80 }
      },
      pageBreak: "auto"
    });

    doc.save(`${buildExportBaseName()}.pdf`);
  };

  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token:", token);

      const payload = {
        searchBy,
        client,
        emails: emails.split(",").map(e => e.trim()).filter(Boolean),
        startDate: formatForBackend(startDate),
        endDate: formatForBackend(endDate),
        exportAll: true
      };

      console.log("PDF Payload:", payload);

      const res = await axios.post(
        `${API_BASE_URL}/api/admin-panel/search`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("PDF API Response:", res);

      const summaryData = Array.isArray(res.data?.data?.data)
        ? res.data.data.data
        : [];

      console.log("PDF Data Length:", summaryData.length);

      generatePDF(summaryData);

    } catch (err) {
      console.error("PDF Download Error:", err);
      console.error("Response:", err?.response);
      console.error("Message:", err?.message);
      alert("Failed to download PDF");
    }
  };





  const generateExcel = (data) => {
    const excelData = data.map(row => ({
      "Client Name": row.client,
      "Project": row.project,
      "Ticket Number": row.ticket,
      "Ticket Description": row.ticketDescription,
      "Billable Hours": row.billableHours ?? 0,
      "Non-Billable Hours": row.nonBillableHours ?? 0,
      "Task Description": (row.descriptions || [])
        .map((d, i) => `${i + 1}. ${d}`)
        .join("\n")
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Header style
    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" }
    };

    ["A1","B1","C1","D1","E1","F1","G1"].forEach(cell => {
      if (worksheet[cell]) worksheet[cell].s = headerStyle;
    });

    // Wrap text for descriptions
    excelData.forEach((_, i) => {
      const cell = `G${i + 2}`;
      if (worksheet[cell]) {
        worksheet[cell].s = {
          alignment: { wrapText: true, vertical: "top" }
        };
      }
    });

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 30 },
      { wch: 16 },
      { wch: 20 },
      { wch: 60 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");

    XLSX.writeFile(
      workbook,
      `${buildExportBaseName()}.xlsx`
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
       state: { results: summaryData,
       emails: emails.split(",").map(e => e.trim()).filter(Boolean),
        startDate: formatForBackend(startDate),
         endDate: formatForBackend(endDate),
         searchBy : searchBy,
         client: client
         }
     });
    } catch (err) {
      setError("Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className = "get-summary-page">

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
                Download Excel
              </button>
              <button className="btn secondary-btn" onClick={downloadPDF}>
                 Download PDF
              </button>
            </div>
       </div>
      </div>
    </div>
  );
};

export default GetSummary;
