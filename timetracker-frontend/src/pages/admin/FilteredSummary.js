import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import "../css/AdminPage.css";
import axios from "axios";
import API_BASE_URL from "../../config/BackendApiConfig";
import * as XLSX from "xlsx-js-style";

const FilteredSummary = () => {
 const [searchBy, setSearchBy] = useState("client");
  const [client, setClient] = useState("");
  const [emails, setEmails] = useState("");

  const location = useLocation();
   const startDate = location.state?.startDate || "";
      const endDate = location.state?.endDate || "";
  const rawResults = location.state?.results;
  console.log(rawResults);
  const results = Array.isArray(rawResults.data) ? rawResults.data : [];

  if (results.length === 0) {
    return <p style={{ padding: "20px" }}>No summary data available</p>;
  }

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

  return (
    <div className="admin-page">
      <h2 className="page-title">Summary Result</h2>

      <table className="summary-table">
        <thead>
          <tr>
            <th>Client Name</th>
            <th>Ticket Number</th>
            <th>Ticket Description</th>
            <th>Billable Hours</th>
            <th>Non-Billable Hours</th>
            <th>Task Description</th>
          </tr>
        </thead>
        <tbody>
          {results.map((row, idx) => (
            <tr key={idx}>
              <td>{row.client}</td>
              <td>{row.ticket}</td>
              <td>{row.ticketDescription}</td>
              <td>{row.billableHours}</td>
              <td>{row.nonBillableHours}</td>
              <td>
                <ol className="task-list">
                  {(row.descriptions || []).map((desc, i) => (
                    <li key={i}>{desc}</li>
                  ))}
                </ol>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="download-btn-container">
       <button className="btn secondary-btn" onClick={downloadExcel}>
                                Download Full Report
       </button>
       </div>
    </div>

  );

};

export default FilteredSummary;
