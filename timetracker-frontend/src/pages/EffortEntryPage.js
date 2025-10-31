import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopHeader from "../components/TopHeader";
import SideNav from "../components/SideNavigation";
import EffortTable from "../components/EffortEntryTable";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/EffortEntryPage.css";
import UnsavedChangesModal from "../components/UnsavedChangesModel";

const EffortEntryPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [rows, setRows] = useState([]);
  const [popup, setPopup] = useState({ message: "", type: "" });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [mode, setMode] = useState("");

  const [clientOptions, setClientOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);


    // ===== Unsaved changes modal state =====
    const [isDirty, setIsDirty] = useState(false);
    const [pendingNavPath, setPendingNavPath] = useState("");
    const [showModal, setShowModal] = useState(false);

  // ===== Load username =====
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    if (!token) navigate("/login");
    else setUsername(storedUsername || "User");
  }, [navigate]);

  // ===== Fetch clients & categories =====
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const [clientsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/options/clients`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/api/options/categories`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setClientOptions(clientsRes.data.data || ["ENIA"]);
        setCategoryOptions(categoriesRes.data.data || ["Test"]);
      } catch (err) {
        console.error(err);
        setPopup({ message: "Failed to load options", type: "error" });
        setTimeout(() => setPopup({ message: "", type: "" }), 3000);
      }
    };
    fetchOptions();
  }, []);

  const createNewRow = () => ({
    client: "",
    ticket: "",
    ticketDescription: "",
    category: "",
    billable: "",
    description: "",
    hours: "",
    date: "",
  });

  const calculateDateRange = (selectedMode) => {
    if (!selectedMode) return;
    const today = new Date();
    let startDate, endDate;

    if (selectedMode === "daily") {
      startDate = endDate = today;
    } else if (selectedMode === "weekly") {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      startDate = new Date(today);
      startDate.setDate(today.getDate() + diffToMonday);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 4);
    } else if (selectedMode === "monthly") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    const formatDate = (d) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    setDateRange({ start: formatDate(startDate), end: formatDate(endDate) });
  };

  const handleModeChange = (selectedMode) => {
    setMode(selectedMode);
    calculateDateRange(selectedMode);
    setRows(selectedMode ? [createNewRow()] : []);
  };

  const handleChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const handleAddRow = () => setRows((prev) => [...prev, createNewRow()]);
  const handleDeleteRow = (index) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const showPopup = (msg, type = "success") => {
    setPopup({ message: msg, type });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const nameParts = (username || "User").split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    const hasData = rows.some((r) =>
      Object.values(r).some((val) => val.trim() !== "")
    );
    if (!hasData) {
      showPopup("No data to save!", "error");
      return;
    }

    const payload = rows.map((row) => ({ email, firstName, lastName, ...row }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      showPopup(
        response.ok ? data.data?.message || "Tasks saved!" : data.data?.error || "Task not saved!",
        response.ok ? "success" : "error"
      );
      if (response.ok) setRows([createNewRow()]);
    } catch (err) {
      console.error(err);
      showPopup("Task not saved!", "error");
    }
  };

  // ===== Detect unsaved changes =====
  const hasUnsavedChanges = () =>
    rows.some((row) => Object.values(row).some((val) => val && val.toString().trim() !== ""));

  // ===== Warn on browser refresh/close =====
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [rows]);

// ===== Handle SideNav navigation =====
const handleNavClick = (path) => {
  if (hasUnsavedChanges()) {
    // Set modal state instead of window.confirm
    setIsDirty(true);
    setPendingNavPath(path);
    setShowModal(true);
  } else {
    navigate(path);
  }
};

// ===== Modal confirm/cancel handlers =====
const handleModalConfirm = () => {
  setShowModal(false);
  setIsDirty(false);
  handleSave();
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
    <div className="layout-container">
      <TopHeader username={username} />
      <div className="main-section">
        <SideNav onNavClick={handleNavClick} />
        <main className="page-content">
          <h2 className="page-title">Effort Entry</h2>

          <div className="effort-options">
            <label htmlFor="effortMode">Effort Entry Options:</label>
            <select
              id="effortMode"
              value={mode}
              onChange={(e) => handleModeChange(e.target.value)}
            >
              <option value="">Select</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {mode && (
            <>
              <div className="date-range-info">
                <strong>Date range:</strong> {dateRange.start} to {dateRange.end}
              </div>

              <div className="effort-actions-top">
                <div className="left-actions">
                  <button className="btn add-btn" onClick={handleAddRow}>
                    Add New Entry
                  </button>
                </div>
                <div className="right-actions">
                  <button className="btn save-btn" onClick={handleSave}>
                    Save Timesheet
                  </button>
                </div>
              </div>

              <EffortTable
                rows={rows}
                clients={clientOptions}
                categories={categoryOptions}
                dateRange={dateRange}
                handleChange={handleChange}
                handleDeleteRow={handleDeleteRow}
              />
            </>
          )}

          {popup.message && (
            <div className={`centered-popup ${popup.type === "error" ? "error" : "success"}`}>
              {popup.message}
            </div>
          )}

           <UnsavedChangesModal
                  visible={showModal}
                  onConfirm={handleModalConfirm}
                  unSave = {handleUnSave}
                  onCancel={handleModalCancel}  />
        </main>
      </div>
    </div>
  );
};

export default EffortEntryPage;
