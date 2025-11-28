import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
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

  // ✅ Helpers
  const formatForBackend = (dmy) => {
    const [d, m, y] = dmy.split("-");
    return `${y}-${m}-${d}`;
  };

  const parseDMY = (dmy) => {
             const [d, m, y] = dmy.split("-");
             return new Date(`${y}-${m}-${d}`);
     };

     const formatDMY = (d) =>
        `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;

     const getMonday = (date) => {
      const d = new Date(date);
      const day = d.getDay(); // 0=Sun, 1=Mon...
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      return d;
     };

  const pad2 = (n) => String(n).padStart(2, "0");

  // Handles keys like "dd-MM-yyyy" or "yyyy-MM-dd" and normalizes to "dd-MM-yyyy"
  const normalizeDateKey = (raw) => {
    if (!raw) return raw;
    // yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split("-");
      return `${d}-${m}-${y}`;
    }
    // dd-MM-yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw;

    // Fallback: try Date parsing and return dd-MM-yyyy
    const t = new Date(raw);
    if (!isNaN(t.valueOf())) {
      return `${pad2(t.getDate())}-${pad2(t.getMonth() + 1)}-${t.getFullYear()}`;
    }
    return raw;
  };

  // Check if table height exceeds viewport height
  useLayoutEffect(() => {
    const checkTableHeight = () => {
      if (!tableWrapperRef.current) return;
      const tableHeight = tableWrapperRef.current.getBoundingClientRect().height;
      const screenHeight = window.innerHeight;
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
        setClientOptions(clientsRes.data?.data || ["ENIA"]);
        setCategoryOptions(categoriesRes.data?.data || ["Test"]);
      } catch (err) {
        console.error(err);
        setPopup({ message: "Failed to load options", type: "error" });
        setTimeout(() => setPopup({ message: "", type: "" }), 3000);
      }
    };
    fetchOptions();
  }, []);

  const createNewRow = () => ({
    rowId: null,
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

    if (selectedMode === "daily") {
      startDate = endDate = today;
    } else if (selectedMode === "weekly") {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      startDate = new Date(today);
      startDate.setDate(today.getDate() + diffToMonday);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else if (selectedMode === "monthly") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    const fmt = (d) => `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
    setDateRange({ start: fmt(startDate), end: fmt(endDate) });
  };

  const handleModeChange = (selectedMode) => {
    setMode(selectedMode);
    calculateDateRange(selectedMode);
    setRows(selectedMode ? [createNewRow()] : []);
  };

  // 🟩 Previous/Next Week
  const handlePrevWeek = () => {
    if (mode !== "weekly" || !dateRange.start) return;

    // current start → normalize to Monday
    const currentStart = parseDMY(dateRange.start);
    const currentMonday = getMonday(currentStart);

    const today = new Date();

    // earliest allowed = 1st of previous month (your old rule)
    const allowedStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // go one full week back from current Monday
    let newStart = new Date(currentMonday);
    newStart.setDate(newStart.getDate() - 7);

    // don't go before allowedStart
    if (newStart < allowedStart) {
      newStart = allowedStart;
    }

    // always show full 7 days (Mon–Sun), even if it crosses into next month
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + 6);

    setDateRange({
      start: formatDMY(newStart),
      end: formatDMY(newEnd),
    });
  };



  const handleNextWeek = () => {
    if (mode !== "weekly" || !dateRange.start) return;

    // current range start → normalize to Monday
    const currentStart = parseDMY(dateRange.start);
    const currentMonday = getMonday(currentStart);

    const today = new Date();

    // real current week Monday (based on today)
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + diffToMonday);

    // 👉 next week = Monday + 7
    const newStart = new Date(currentMonday);
    newStart.setDate(newStart.getDate() + 7);

    // keep your rule: don't go beyond current week
    if (newStart > currentWeekStart) return;

    // 👉 always full 7 days (Mon–Sun), even if next month
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + 6);

    setDateRange({
      start: formatDMY(newStart),
      end: formatDMY(newEnd),
    });
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
      dates.push(`${day} ${month} (${weekday})`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const handleChange = (rowIndex, field, value) => {
    const newRows = [...rows];
    newRows[rowIndex][field] = value;
    setRows(newRows);
    setIsDirty(true);
  };

  const handleAddRow = () => setRows((prev) => [...prev, createNewRow()]);
  const handleDeleteRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));

  const showPopup = (msg, type = "success") => {
    setPopup({ message: msg, type });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  };

  // ✅ SAVE
 const handleSave = async () => {
   const token = localStorage.getItem("token");
   const email = localStorage.getItem("email");
   const firstName = localStorage.getItem("firstName");
   const lastName = localStorage.getItem("lastName");

   if (!rows || rows.length === 0) {
     showPopup("No tasks to save", "error");
     return;
   }


   // ✅ Helper to pad digits
   const pad2 = (n) => String(n).padStart(2, "0");


   // ✅ Helper: Convert any date format → dd-MM-yyyy
   const toDMY = (raw) => {
     if (!raw) return raw;

     // Case 1: already dd-MM-yyyy
     if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw;

     // Case 2: yyyy-MM-dd
     if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
       const [y, m, d] = raw.split("-");
       return `${d}-${m}-${y}`;
     }

     // Case 3: "3 Nov (Mon)" or "03 Nov (Mon)"
     if (/[A-Za-z]{3}/.test(raw)) {
       try {
         const parts = raw.split(" ");
         const day = parts[0].padStart(2, "0");
         const monthShort = parts[1];
         const monthMap = {
           Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
           Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
         };
         const month = monthMap[monthShort] || "01";
         const year = new Date().getFullYear(); // ✅ always current year
         return `${day}-${month}-${year}`;
       } catch {
         return raw;
       }
     }

     // Case 4: fallback — try parsing ISO or JS date
     const parsed = new Date(Date.parse(raw));
     if (!isNaN(parsed.valueOf())) {
       const dd = pad2(parsed.getDate());
       const mm = pad2(parsed.getMonth() + 1);
       const yyyy = parsed.getFullYear();
       return `${dd}-${mm}-${yyyy}`;
     }

     return raw;
   };


   // ✅ Normalize payload
   const payload = rows.map((row) => {
     const normalizedHoursByDate = {};
     for (const [key, val] of Object.entries(row.hoursByDate || {})) {
       if (val && val.toString().trim() !== "") {
         const normalizedKey = toDMY(key);
         normalizedHoursByDate[normalizedKey] = val;
       }
     }

     return {
       rowId: row.rowId || null,
       email,
       firstName,
       lastName,
       client: row.client,
       ticket: row.ticket,
       ticketDescription: row.ticketDescription,
       category: row.category,
       description: row.description,
       billable: row.billable,
       hoursByDate: normalizedHoursByDate,
     };
   });

   // ✅ Future date validation
   const today = new Date();
   const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

   const toYMD = (dmy) => {
     const [d, m, y] = dmy.split("-");
     return `${y}-${m}-${d}`;
   };

   const futureDates = [];
   for (const r of rows) {
     for (const [dt, val] of Object.entries(r.hoursByDate || {})) {
       if (!val) continue;
       const dmy = toDMY(dt);
       const ymd = toYMD(dmy);
       if (ymd > todayStr) futureDates.push(dmy);
     }
   }

   if (futureDates.length > 0) {
     futureDates.sort((a, b) => toYMD(a).localeCompare(toYMD(b)));
     if (futureDates.length === 1) {
       showPopup(`Cannot save future date: ${futureDates[0]}`, "error");
     } else {
       showPopup(
         `Cannot save future dates (${futureDates[0]} to ${futureDates[futureDates.length - 1]})`,
         "error"
       );
     }
     return;
   }

   // ✅ Send to backend
   try {
     const response = await axios.post(
       `${API_BASE_URL}/api/tasks-new`,
       payload,
       {
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
       }
     );
     console.log(payload);

     showPopup(response.data.data?.message ||response.data.data?.error|| "Tasks saved successfully!",
       response.data.data.error ? "error" : "success"
     );
     await fetchEffortEntries(false);
     console.log("Payload sent to backend:", payload);
     setIsDirty(false);
   } catch (error) {
     console.error("Save failed:", error);
     const errMsg =
       error.response?.data?.error || error.message || "Failed to save tasks.";
     showPopup(errMsg, "error");
   }
 };



 const fetchEffortEntries = async (showMessage) => {
   const token = localStorage.getItem("token");
   const email = localStorage.getItem("email");

   if (!email || !dateRange.start || !dateRange.end) return;

   try {
     const response = await axios.get(`${API_BASE_URL}/api/effort-entry-horizon`, {
       headers: { Authorization: `Bearer ${token}` },
       params: {
         email,
         startDate: formatForBackend(dateRange.start),
         endDate: formatForBackend(dateRange.end),
       },
     });

     // ✅ Backend can return array or wrapped {data: []}
     const entries  = Array.isArray(response.data.data.data) ?response.data.data.data : [];
       console.log(response.data.data.data);
       console.log("entries");
       console.log( response.data.data.data);

     // ✅ Convert API shape directly into your row structure
     const mappedRows = entries.map((entry) => ({
       rowId: entry.rowId ?? entry.row_id ?? entry.rowID ?? null,
       client: entry.client || "",
       ticket: entry.ticket || "",
       ticketDescription: entry.ticketDescription || "",
       category: entry.category || "",
       billable: entry.billable || "",
       description: entry.description || "",
       hoursByDate: entry.hoursByDate || {},

     }));
     setRows(mappedRows.length > 0 ? mappedRows : [createNewRow()]);
     if(showMessage){
        showPopup(response.data.data.message, "success");
     }

   } catch (err) {
     console.error("Failed to fetch effort entries:", err);
     showPopup("Failed to load effort entries", "error");
   }
 };

  // ✅ Trigger fetch on mode/date change
  useEffect(() => {
    if (mode && dateRange.start && dateRange.end) {
      fetchEffortEntries(true);
    }
  }, [mode, dateRange.start, dateRange.end]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unsaved changes + modal logic
  const hasUnsavedChanges = () =>
    rows.some((r) => Object.values(r.hoursByDate || {}).some((v) => v && v.toString().trim() !== ""));

  const handleNavClick = (path) => {
    if (hasUnsavedChanges()) {
      setIsDirty(true);
      setPendingNavPath(path);
      setShowModal(true);
    } else navigate(path);
  };

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

  return (
    <div className="layout-container">
      <TopHeader username={username} />
      <div className="main-section">
        <SideNav onNavClick={handleNavClick} />
        <main className="page-content">
          <h2 className="page-title">Effort Entry</h2>

          <div className="effort-options">
            <label>Effort Entry Options:</label>
            <select value={mode} onChange={(e) => handleModeChange(e.target.value)}>
              <option value="">Select</option>
              <option value="daily">Today</option>
              <option value="weekly">Weekly</option>
              {/* <option value="monthly">Monthly</option> */}
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
                  {mode === "weekly" && (
                    <button className="btn prev-week-btn" onClick={handlePrevWeek}>
                      Previous Week
                    </button>
                  )}
                </div>

                <div className="right-actions">
                  {mode === "weekly" && (
                    <button className="btn next-week-btn" onClick={handleNextWeek}>
                      Next Week
                    </button>
                  )}
                  <button className="btn save-btn" onClick={handleSave}>
                    Save
                  </button>
                </div>
              </div>

              <div ref={tableWrapperRef}>
                <HorizontalEffortTable
                  rows={rows}
                  clients={clientOptions}
                  categories={categoryOptions}
                  dateColumns={getDateColumns()}
                  handleChange={handleChange}
                  handleDeleteRow={handleDeleteRow}
                  handleAddRow={handleAddRow}
                />
              </div>

              {showBottomSave && (
                <div className="bottom-save-btn">
                  <button className="btn save-btn" onClick={handleSave}>
                    Save
                  </button>
                </div>
              )}
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
            unSave={handleUnSave}
            onCancel={handleModalCancel}
          />
        </main>
      </div>
    </div>
  );
};

export default EffortEntryPageHorizontal;
