
import React, { useState, useEffect,useRef , useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopHeader from "../components/TopHeader";
import SideNav from "../components/SideNavigation";
import HorizontalEffortTable from "../components/EffortEntryHorizontaltable.js";
import UnsavedChangesModal from "../components/UnsavedChangesModel";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/EffortEntryPageHorizontal.css";
import "../components/css/EffortEntryHorizontalTable.css";

const EffortEntryPageHorizontal = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [rows, setRows] = useState([]);
  const [popup, setPopup] = useState({ message: "", type: "" });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [mode, setMode] = useState("");
  const [clientOptions, setClientOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showBottomSave, setShowBottomSave] = useState(false);
  const tableWrapperRef = useRef(null);

    // Check if table height exceeds viewport height
    useLayoutEffect(() => {
      const checkTableHeight = () => {
        if (!tableWrapperRef.current) return;
        const tableHeight = tableWrapperRef.current.getBoundingClientRect().height;
        const screenHeight = window.innerHeight;
        console.log("tableheight : "+tableHeight);
        console.log("screenHeight "+screenHeight);
        setShowBottomSave(tableHeight + 200 > screenHeight);
      };

      checkTableHeight(); // initial check
      window.addEventListener("resize", checkTableHeight);

      return () => window.removeEventListener("resize", checkTableHeight);
    }, [rows, dateRange]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    if (!token) navigate("/login");
    else setUsername(storedUsername || "User");
  }, [navigate]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const [clientsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/options/clients`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE_URL}/api/options/categories`, { headers: { Authorization: `Bearer ${token}` } }),
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
    hoursByDate: {},
  });

  const calculateDateRange = (selectedMode) => {
    if (!selectedMode) return;
    const today = new Date();
    let startDate, endDate;
    if (selectedMode === "daily") startDate = endDate = today;
    else if (selectedMode === "weekly") {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      startDate = new Date(today); startDate.setDate(today.getDate() + diffToMonday);
      endDate = new Date(startDate); endDate.setDate(startDate.getDate() + 6);
    } else if (selectedMode === "monthly") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    const formatDate = (d) => `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
    setDateRange({ start: formatDate(startDate), end: formatDate(endDate) });
  };

  const handleModeChange = (selectedMode) => {
    setMode(selectedMode);
    calculateDateRange(selectedMode);
    setRows(selectedMode ? [createNewRow()] : []);
  };

const getDateColumns = () => {
  if (!dateRange.start || !dateRange.end) return [];
  const [sd, sm, sy] = dateRange.start.split("-");
  const [ed, em, ey] = dateRange.end.split("-");
  const start = new Date(`${sy}-${sm}-${sd}`);
  const end = new Date(`${ey}-${em}-${ed}`);
  const dates = [];
  let current = new Date(start);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  while (current <= end) {
    const day = current.getDate();
    const month = monthNames[current.getMonth()];
    const weekday = dayNames[current.getDay()];
    // Example: "15 Oct (Wed)"
    dates.push(`${day} ${month} (${weekday})`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

  const handleChange = (rowIndex, field, value) => {
    const newRows = [...rows];
    newRows[rowIndex][field] = value;
    setRows(newRows);
  };

  const handleAddRow = () => setRows(prev => [...prev, createNewRow()]);
  const handleDeleteRow = (index) => setRows(prev => prev.filter((_, i) => i !== index));

  const showPopup = (msg, type="success") => { setPopup({ message: msg, type }); setTimeout(() => setPopup({ message: "", type: "" }), 3000); };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    const nameParts = (username || "User").split(" ");
    const firstName = nameParts[0]; const lastName = nameParts.slice(1).join(" ");
    const hasData = rows.some(r => Object.values(r.hoursByDate).some(val => val !== ""));
    if (!hasData) { showPopup("No data to save! All are Required", "error"); return; }
    const payload = rows.map(row => ({ email, firstName, lastName, ...row }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(()=>({}));
      console.log(response);
      console.log(response.data);
      showPopup(response.ok ? data.data?.message || "Tasks saved!" : data.data?.error || "Task not saved!", response.ok?"success":"error");
      if(response.ok) setRows([createNewRow()]);
    } catch(err){ console.error(err); }
  };

  const hasUnsavedChanges = () => rows.some(r=>Object.values(r.hoursByDate).some(v=>v&&v.toString().trim()!==""));

  // SideNav Navigation & Modal
  const handleNavClick = (path) => { if(hasUnsavedChanges()){ setIsDirty(true); setPendingNavPath(path); setShowModal(true); } else navigate(path); };
  const handleModalConfirm = () => { setShowModal(false); setIsDirty(false); handleSave(); if(pendingNavPath) navigate(pendingNavPath); setPendingNavPath(""); };
  const handleUnSave = () => { setShowModal(false); setIsDirty(false); if(pendingNavPath) navigate(pendingNavPath); setPendingNavPath(""); };
  const handleModalCancel = () => { setShowModal(false); setPendingNavPath(""); };

  return (
    <div className="layout-container">
      <TopHeader username={username} />
      <div className="main-section">
        <SideNav onNavClick={handleNavClick} />
        <main className="page-content">
          <h2 className="page-title">Effort Entry</h2>

          <div className="effort-options">
            <label>Effort Entry Options:</label>
            <select value={mode} onChange={e=>handleModeChange(e.target.value)}>
              <option value="">Select</option>
              <option value="daily">Today</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {mode && (
            <>
              <div className="date-range-info"><strong>Date range:</strong> {dateRange.start} to {dateRange.end}</div>
              <div className="effort-actions-top">
                <button className="btn add-btn" onClick={handleAddRow}>Add New Entry</button>
                <button className="btn save-btn" onClick={handleSave}>Save</button>
              </div>
              <div ref={tableWrapperRef}>
              <HorizontalEffortTable
                rows={rows}
                clients={clientOptions}
                categories={categoryOptions}
                dateColumns={getDateColumns()}
                handleChange={handleChange}
                handleDeleteRow={handleDeleteRow}
                handleAddRow ={handleAddRow}
                ref={tableWrapperRef}
              />
              </div>

                {showBottomSave && (
                <div className ="bottom-save-btn">
                  <button className="btn save-btn" onClick={handleSave}>
                    Save
                  </button>
                </div>
               )}
            </>
          )}

         {popup.message && <div className={`centered-popup ${popup.type==="error"?"error":"success"}`}>{popup.message}</div>}

          <UnsavedChangesModal
            visible={showModal}
            onConfirm={handleModalConfirm}
            unSave={handleUnSave}
            onCancel={handleModalCancel}
          />
        </main>
      </div>
    </div>
  );
};

export default EffortEntryPageHorizontal;
