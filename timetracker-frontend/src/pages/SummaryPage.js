// src/pages/SummaryPage.js
import React, { useState, useEffect , useRef} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";
import SummaryTable from "../components/SummaryTable";
import TopHeader from "../components/TopHeader";
import SideNav from "../components/SideNavigation";
import UnsavedChangesModal from "../components/UnsavedChangesModel";
import "./css/SummaryPage.css";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SummaryPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summaryData, setSummaryData] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role] = useState(localStorage.getItem("role") || "user");
  const [searchBy, setSearchBy] = useState("email");
  const [results, setResults] = useState([]);
  const [activeView, setActiveView] = useState(null);

  // ===== Unsaved changes modal state =====
  const summaryTableRef = useRef();
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState("");
  const [showModal, setShowModal] = useState(false);

  // ===== Load username =====
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    setUsername(storedUsername || "User");
  }, []);

  // ===== Fetch clients & categories =====
  useEffect(() => {
    const fetchClientOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const clientsRes = await axios.get(
          `${API_BASE_URL}/api/admin-panel/client-codes`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const clients = Array.isArray(clientsRes?.data?.data)
          ? clientsRes.data.data
          : Array.isArray(clientsRes?.data)
          ? clientsRes.data
          : [];

        setClientOptions(clients);
      } catch (err) {
        console.error("Failed to fetch client options", err);
        setClientOptions([]);
      }
    };

    fetchClientOptions();
  }, []);


  // ===== Popup messages =====
const showPopup = (msg, type = "success", persist = false) => {
  setSuccess(type === "success" ? msg : "");
  setError(type === "error" ? msg : "");

  // Auto-hide only if not persistent
  if (!persist) {
    setTimeout(() => {
      setSuccess("");
      setError("");
    }, 3000);
  }
};


  const formatForBackend = (dateStr) => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split("-");
      return `${dd}-${mm}-${yyyy}`;
    }
    return dateStr;
  };

  const sanitizeFilePart = (value) =>
    (value || "")
      .toString()
      .trim()
      .replace(/[\\/:*?"<>|]/g, " ")
      .replace(/\s+/g, " ");

  const getEmailPrefix = (email) => {
    const safeEmail = (email || "").trim();
    if (!safeEmail) return "user";
    return safeEmail.includes("@") ? safeEmail.split("@")[0] : safeEmail;
  };

  const buildExportBaseName = () => {
    const datePart = new Date().toISOString().slice(0, 10);
    const email = localStorage.getItem("email") || "";
    const emailPart = sanitizeFilePart(getEmailPrefix(email));
    return `${emailPart}_Effort summary_${datePart}`;
  };

  const today = new Date();
  const calendarMax = today.toISOString().split("T")[0];
  const calendarMin =
    role.toLowerCase() === "admin"
      ? ""
      : new Date(today.getFullYear(), today.getMonth() - 1, 1)
          .toISOString()
          .split("T")[0];

  // ===== Fetch summary data by date range =====
  const fetchSummaryByDate = async () => {
    setActiveView("summary");
    if (!startDate || !endDate) {
      showPopup("Please select both start and end dates", "error");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const email = localStorage.getItem("email");

      const response = await axios.get(
        `${API_BASE_URL}/api/tasks/summary-by-range?email=${email}&startDate=${formatForBackend(
          startDate
        )}&endDate=${formatForBackend(endDate)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

     console.log(response);
      const fetchedTasks = Array.isArray(response.data?.data?.data)
        ? response.data.data.data
        : [];

       // if response is Empty
      var backendMessage = "";
      if (fetchedTasks.length === 0) {
          backendMessage = response.data?.data?.message || "No records found for selected date range.";
          showPopup(backendMessage, "error", true); // <— true = make it persistent
          setSummaryData([]); // Clear table
          return;
        }
        else {
          showPopup(backendMessage, "error", false);
        }

      // Add isEditing flag to each row
      const formattedData = fetchedTasks.map((task) => ({
        ...task,
        isEditing: false,
      }));

      setSummaryData(formattedData);
      setIsDirty(false); // Data just loaded, no unsaved changes
    } catch (err) {
      console.error(err);
      showPopup("Failed to fetch summary", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchConsolidatedSummaryByDate = async () => {
    setActiveView("consolidated");
    setSummaryData([]);
    setResults([]);

    if (!startDate || !endDate) {
      showPopup("Please select both start and end dates", "error");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const email = localStorage.getItem("email");

      const payload = {
        searchBy,
        emails: [email],
        startDate: formatForBackend(startDate),
        endDate: formatForBackend(endDate)
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/admin-panel/search`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = Array.isArray(res?.data?.data?.data)
        ? res.data.data.data
        : [];

      setResults(data);

      if (data.length === 0) {
        showPopup("No effort records found for entered criteria", "error", true);
      }

    } catch (err) {
      console.error(err);
      showPopup("Failed to fetch consolidated summary", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchConsolidatedForExport = async () => {
    if (!startDate || !endDate) {
      showPopup("Please select both start and end dates", "error");
      return null;
    }

    const token = localStorage.getItem("token");
    const email = (localStorage.getItem("email") || "").trim();

    if (!email) {
      showPopup("Logged in email not found", "error");
      return null;
    }

    const payload = {
      searchBy: "email",
      emails: [email],
      startDate: formatForBackend(startDate),
      endDate: formatForBackend(endDate),
      exportAll: true,
    };

    const res = await axios.post(
      `${API_BASE_URL}/api/admin-panel/search`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
  };

  const generateExcel = (data) => {
    const excelData = data.map((row) => ({
      "Client Name": row.client,
      Project: row.project,
      "Ticket Number": row.ticket,
      "Ticket Description": row.ticketDescription,
      "Billable Hours": row.billableHours ?? 0,
      "Non-Billable Hours": row.nonBillableHours ?? 0,
      "Task Description": (row.descriptions || [])
        .map((d, i) => `${i + 1}. ${d}`)
        .join("\n"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
    XLSX.writeFile(workbook, `${buildExportBaseName()}.xlsx`);
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
      "Task Description",
    ];

    const tableRows = data.map((row) => [
      row.client,
      row.project,
      row.ticket,
      row.ticketDescription,
      row.billableHours ?? 0,
      row.nonBillableHours ?? 0,
      (row.descriptions || []).map((d, i) => `${i + 1}. ${d}`).join("\n"),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 3, valign: "top" },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: { 6: { cellWidth: 80 } },
      pageBreak: "auto",
    });

    doc.save(`${buildExportBaseName()}.pdf`);
  };

  const downloadExcel = async () => {
    try {
      setLoading(true);
      const data = await fetchConsolidatedForExport();
      if (!data || data.length === 0) {
        showPopup("No effort records found for selected range", "error");
        return;
      }
      generateExcel(data);
      showPopup("Excel downloaded successfully", "success");
    } catch (err) {
      console.error(err);
      showPopup("Failed to download Excel", "error");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      setLoading(true);
      const data = await fetchConsolidatedForExport();
      if (!data || data.length === 0) {
        showPopup("No effort records found for selected range", "error");
        return;
      }
      generatePDF(data);
      showPopup("PDF downloaded successfully", "success");
    } catch (err) {
      console.error(err);
      showPopup("Failed to download PDF", "error");
    } finally {
      setLoading(false);
    }
  };

  // ===== Detect edits in table =====
  const handleDataChange = (newData) => {
    setSummaryData(newData);
    // Only mark dirty if a row is in editing mode
    const dirty = newData.some((row) => row.isEditing);
    setIsDirty(dirty);
  };

  // ===== Handle navigation =====
  const handleNavClick = (path) => {
    if (isDirty) {
      setPendingNavPath(path);
      setShowModal(true);
    } else {
      navigate(path);
    }
  };

  const handleModalConfirm = async () => {
    setShowModal(false);
    setIsDirty(false);
    if (summaryTableRef.current) {
        await summaryTableRef.current.handleSaveAll(); // Saves all unsaved rows
      }
    if (pendingNavPath) navigate(pendingNavPath);
    setPendingNavPath("");
  };

const handleUnSave = () => {
  setShowModal(false);
  setIsDirty(false);
  if (pendingNavPath) navigate(pendingNavPath);
  setPendingNavPath("");
};

  const handleModalCancel = () => {
    setShowModal(false);
    setPendingNavPath("");
  };

  // ===== Warn on browser refresh/close =====
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <div className="summary-container">
      <TopHeader username={username} />
      <div className="main-section">
        <SideNav onNavClick={handleNavClick} />

        <div className="page-content">
          <header className="summary-header">
            <h1>Summary</h1>
          </header>

          <div className="date-range-container">
            <label>
              Start Date:{" "}
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={calendarMin}
                max={calendarMax}
              />
            </label>
            <label>
              End Date:{" "}
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={calendarMin}
                max={calendarMax}
              />
            </label>
            <button className="btn" onClick={fetchSummaryByDate}>
              Show Summary
            </button>
            <button
              className="btn"
              onClick={fetchConsolidatedSummaryByDate}
            >
              Show Consolidated Summary
            </button>
            {!loading &&
              activeView === "consolidated" &&
              startDate &&
              endDate &&
              results.length > 0 && (
              <div className="consolidated-download-actions">
                <button className="btn summary-export-btn" onClick={downloadExcel}>
                  Download Excel
                </button>
                <button className="btn summary-export-btn" onClick={downloadPDF}>
                  Download PDF
                </button>
              </div>
            )}
          </div>

          {loading && <p>Loading summary...</p>}
          {error && <div className="popup error">{error}</div>}
          {success && <div className="popup success">{success}</div>}

          {!loading && activeView === "summary" &&  summaryData.length > 0 && (
            <SummaryTable  ref={summaryTableRef}
              summaryData={summaryData}
              setSummaryData={handleDataChange}
              showPopup={showPopup}
              calendarMin={calendarMin}
              calendarMax={calendarMax}
              clientOptions={clientOptions}
              categoryOptions={categoryOptions}
            />
          )}

          {!loading &&
            activeView === "consolidated" &&
            startDate &&
            endDate &&
            results.length > 0 && (
            <div className="summary-table-wrapper">
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Project</th>
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
                      <td>{row.project}</td>
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
            </div>
          )}
        </div>
      </div>

      {/* Unsaved changes modal */}
      <UnsavedChangesModal
        visible={showModal}
        onConfirm={handleModalConfirm}
        unSave = {handleUnSave}
        onCancel={handleModalCancel}
      />
    </div>
  );
};

export default SummaryPage;
