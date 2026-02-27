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
import { PiArrowFatLeftFill } from "react-icons/pi";
import { PiArrowFatRightFill } from "react-icons/pi";
import { IoIosSave } from "react-icons/io";



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
  const [duplicateRowIndexes, setDuplicateRowIndexes] = useState([]);
  const tableWrapperRef = useRef(null);
  const [savedRowsSnapshot, setSavedRowsSnapshot] = useState([]);
  const TICKET_DESC_CACHE_KEY = "ticketDescriptionCache";

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
  const normalizeBillable = (value) => (String(value || "").trim().toLowerCase() === "yes" ? "Yes" : "No");
  const normalizeTicketKey = (ticket) => String(ticket || "").trim().toUpperCase();

  const [ticketDescriptionCache, setTicketDescriptionCache] = useState(() => {
    try {
      const raw = localStorage.getItem(TICKET_DESC_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });

  const setTicketDescriptionInCache = (ticket, description) => {
    const key = normalizeTicketKey(ticket);
    const value = String(description || "").trim();
    if (!key || !value) return;

    setTicketDescriptionCache((prev) => {
      if (prev[key] === value) return prev;
      const next = { ...prev, [key]: value };
      localStorage.setItem(TICKET_DESC_CACHE_KEY, JSON.stringify(next));
      return next;
    });
  };

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

  const [taskTypeOptions, setTaskTypeOptions] = useState([[]]);
  const [projectOptions, setProjectOptions] = useState([[]]);

  useEffect(() => {
    setTaskTypeOptions((prev) => {
      const copy = Array.isArray(prev) ? [...prev] : [];

      // ensure one entry per row
      while (copy.length < rows.length) {
        copy.push([]);
      }

      // trim if rows removed
      if (copy.length > rows.length) {
        copy.length = rows.length;
      }

      return copy;
    });
  }, [rows.length]);

  useEffect(() => {
    setProjectOptions((prev) => {
      const copy = Array.isArray(prev) ? [...prev] : [];

      while (copy.length < rows.length) {
        copy.push([]);
      }

      if (copy.length > rows.length) {
        copy.length = rows.length;
      }

      return copy;
    });
  }, [rows.length]);



  const fetchTaskTypesForRow = async (rowIndex, clientCode) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API_BASE_URL}/api/admin-panel/task-types/${clientCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = Array.isArray(res.data.data) ? res.data.data  : [];

      setTaskTypeOptions((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const copy = [...safePrev];
        copy[rowIndex] = list;
        console.log("✅ res:",copy);
        return copy;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjectsForRow = async (rowIndex, clientCode) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE_URL}/api/admin-panel/projects/${clientCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setProjectOptions((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const copy = [...safePrev];
        copy[rowIndex] = list;
        return copy;
      });
    } catch (err) {
      console.error(err);
      setProjectOptions((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const copy = [...safePrev];
        copy[rowIndex] = [];
        return copy;
      });
    }
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

  const optionsFetchedRef = useRef(false);

  useEffect(() => {
    const fetchClientOptions = async () => {
      if (optionsFetchedRef.current) return;
      optionsFetchedRef.current = true;

      try {
        const token = localStorage.getItem("token");
        const clientsRes = await axios.get(
          `${API_BASE_URL}/api/admin-panel/client-codes`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const extractArray = (res) => {
          if (Array.isArray(res?.data.data)) return res.data.data;
          if (Array.isArray(res?.data)) return res.data;
          if (Array.isArray(res)) return res;
          return [];
        };

        setClientOptions(extractArray(clientsRes));
        setCategoryOptions([]);

      } catch (err) {
        console.error("Failed to fetch options", err);
        setClientOptions([]);
        setCategoryOptions([]);
      }
    };

    fetchClientOptions();
  }, []);



  const createNewRow = () => ({
    rowId: null,
    client: "",
    project: "",
    ticket: "",
    ticketDescription: "",
    category: "",
    billable: "No",
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

    // current visible start → normalise to Monday
    const currentStart = parseDMY(dateRange.start);
    const currentMonday = getMonday(currentStart);

    const today = new Date();

    // 🔹 We now clamp by END OF CURRENT MONTH (today's month)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); // e.g. Dec 31

    // 👉 next week start = current Monday + 7
    const newStart = new Date(currentMonday);
    newStart.setDate(newStart.getDate() + 7);

    // if the new start itself is after month end → don't move further
    if (newStart > monthEnd) return;

    // tentative week end = start + 6
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + 6);

    // clamp week end to monthEnd if it goes beyond
    if (newEnd > monthEnd) {
      newEnd.setTime(monthEnd.getTime());
    }

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
      if (mode === "weekly" && (current.getDay() === 0 || current.getDay() === 6)) {
        current.setDate(current.getDate() + 1);
        continue;
      }

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

    if (field === "client") {
      newRows[rowIndex].category = "";
      newRows[rowIndex].project = "";
    }
    if (field === "ticket") {
      newRows[rowIndex].ticketDescription = "";
    }

    setRows(newRows);
    setIsDirty(true);
    setDuplicateRowIndexes([]);

    if (field === "client" && value) {
      fetchTaskTypesForRow(rowIndex, value);
      fetchProjectsForRow(rowIndex, value);
    }
  };


  const handleDeleteRow = (index) => {
    // ❌ Block delete if only 1 row will remain
    if (rows.length <= 1) {
      showPopup("At least one row must remain", "error");
      return;
    }

    const row = rows[index];

    // ❌ Block delete for fetched rows (those having rowId)
    if (row.rowId !== null && row.rowId !== undefined) {
      showPopup("Cannot delete rows loaded from server", "error");
      return;
    }

    // ✅ Allow delete for newly added rows (rowId == null)
    setRows((prev) => prev.filter((_, i) => i !== index));
    setDuplicateRowIndexes([]);
  };



  const isDeleteAllowed = () => {
    if (rows.length <= 1) return false;                          // prevent deletion if only 1 row
    return rows.every(r => r.rowId === null);                    // if fetched from DB → block delete
  };
  const hasPersisted = rows.some(
    (r) => r.rowId !== null && r.rowId !== undefined
  );

  // global flag: can we delete rows at all?
  const canDeleteRows = rows.length > 1 && !hasPersisted;

  const handleAddRow = () => {
    setRows((prev) => [...prev, createNewRow()]);
    setTaskTypeOptions((prev) => [...prev, []]);
    setProjectOptions((prev) => [...prev, []]);
    setDuplicateRowIndexes([]);
  };

  const handleCopyRow = (sourceIndex) => {
    const sourceRow = rows[sourceIndex];
    if (!sourceRow) return;

    const copiedRow = {
      ...sourceRow,
      rowId: null,
      hoursByDate: { ...(sourceRow.hoursByDate || {}) },
    };

    setRows((prev) => {
      const next = [...prev];
      next.splice(sourceIndex + 1, 0, copiedRow);
      return next;
    });

    setTaskTypeOptions((prev) => {
      const safePrev = Array.isArray(prev) ? [...prev] : [];
      const sourceOptions = Array.isArray(safePrev[sourceIndex]) ? [...safePrev[sourceIndex]] : [];
      safePrev.splice(sourceIndex + 1, 0, sourceOptions);
      return safePrev;
    });

    setProjectOptions((prev) => {
      const safePrev = Array.isArray(prev) ? [...prev] : [];
      const sourceOptions = Array.isArray(safePrev[sourceIndex]) ? [...safePrev[sourceIndex]] : [];
      safePrev.splice(sourceIndex + 1, 0, sourceOptions);
      return safePrev;
    });

    setIsDirty(true);
    setDuplicateRowIndexes([]);
  };


  const showPopup = (msg, type = "success") => {
    const normalizedMessage =
      typeof msg === "string"
        ? msg
        : msg?.message
        ? String(msg.message)
        : msg?.error
        ? String(msg.error)
        : Array.isArray(msg)
        ? msg.map((m) => (typeof m === "string" ? m : JSON.stringify(m))).join(", ")
        : msg
        ? JSON.stringify(msg)
        : "";

    setPopup({ message: normalizedMessage, type });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  };



  // ✅ SAVE
 const handleSave = async () => {
   const token = localStorage.getItem("token");
   const email = localStorage.getItem("email");
   const firstName = localStorage.getItem("firstName");
   const lastName = localStorage.getItem("lastName");

   const isRowUsed = (r) => {
     const hasHours = Object.values(r.hoursByDate || {}).some(
       (v) => v && v.toString().trim() !== ""
     );
     const hasMainFields = [
       r.client,
       r.project,
       r.ticket,
       r.ticketDescription,
       r.category,
       r.description,
     ].some((v) => v && v.toString().trim() !== "");
     return hasHours || hasMainFields;
   };

   const rowsToSave = rows.filter(isRowUsed);

   if (rowsToSave.length !== rows.length) {
     setRows(rowsToSave.length > 0 ? rowsToSave : [createNewRow()]);
   }

   if (rowsToSave.length === 0) {
     showPopup("No tasks to save", "error");
     return;
   }

   // ❗ Require all core fields for "used" rows
   const rowsMissingRequired = rowsToSave.filter((r) => {
     const hasHours = Object.values(r.hoursByDate || {}).some(
       (v) => v && v.toString().trim() !== ""
     );

     return !r.client ||
       !r.project ||
       !r.ticket ||
       !r.ticketDescription ||
       !r.category ||

       !hasHours;
   });

   if (rowsMissingRequired.length > 0) {
     setShowValidation(true);
     showPopup("Please fill all required fields", "error");
     return;
   }
   setShowValidation(false);

   const buildDuplicateKey = (r) => {
     const hoursPart = Object.entries(r.hoursByDate || {})
       .filter(([, v]) => v !== null && v !== undefined && v.toString().trim() !== "")
       .map(([k, v]) => [normalizeDateKey(k), Number.parseFloat(v)])
       .filter(([, v]) => Number.isFinite(v))
       .sort((a, b) => a[0].localeCompare(b[0]))
       .map(([k, v]) => `${k}:${v}`)
       .join("|");

     return [
       (r.client || "").trim().toUpperCase(),
       (r.project || "").trim(),
       (r.ticket || "").trim(),
       (r.ticketDescription || "").trim(),
       (r.category || "").trim(),
       normalizeBillable(r.billable),
       (r.description || "").trim(),
       hoursPart,
     ].join("~");
   };

   const seen = new Map();
   const duplicateIndexes = [];

   rowsToSave.forEach((r, idx) => {
     const key = buildDuplicateKey(r);
     if (seen.has(key)) {
       duplicateIndexes.push(idx);
     } else {
       seen.set(key, idx);
     }
   });

   if (duplicateIndexes.length > 0) {
     const rowRefs = new Set(rowsToSave);
     const originalIndexes = rows
       .map((r, i) => ({ r, i }))
       .filter(({ r }) => rowRefs.has(r))
       .map(({ i }) => i);

     const highlighted = duplicateIndexes
       .map((i) => originalIndexes[i])
       .filter((i) => i !== undefined);

     setDuplicateRowIndexes(highlighted);
     showPopup("Duplicate row detected. Please modify copied row before saving.", "error");
     return;
   }

   if (!hasUnsavedChanges()) {
     showPopup("Task(s) already saved", "error");
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
         const start = dateRange?.start ? parseDMY(dateRange.start) : null;
         const end = dateRange?.end ? parseDMY(dateRange.end) : null;
         let year = new Date().getFullYear();
         if (start && end) {
           // Use the visible range's year, handling year-boundary weeks
           const monthIndex = Number(month) - 1;
           const candidate = new Date(start.getFullYear(), monthIndex, Number(day));
           year =
             candidate < start && end.getFullYear() > start.getFullYear()
               ? end.getFullYear()
               : start.getFullYear();
         }
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
   const payload = rowsToSave.map((row) => {
     const normalizedHoursByDate = {};
     for (const [key, val] of Object.entries(row.hoursByDate || {})) {
         const normalizedKey = toDMY(key);
        if (val == null || val.toString().trim() === "") {
              continue; // 🔥 do not send empty hours
        }
        normalizedHoursByDate[normalizedKey] = val;
     }


     return {
       rowId: row.rowId || null,
       email,
       firstName,
       lastName,
       client: row.client,
       project: row.project,
       ticket: row.ticket,
       ticketDescription: row.ticketDescription,
       category: row.category,
       description: row.description,
       billable: normalizeBillable(row.billable),
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
   for (const r of rowsToSave) {
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
    console.log("HOURS PAYLOAD", payload.map(p => p.hoursByDate));
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
     setDuplicateRowIndexes([]);
   } catch (error) {
     console.error("Save failed:", error);
     const errMsg =
       error.response?.data?.error || error.message || "Failed to save tasks.";
     showPopup(errMsg, "error");
   }
 };

 const [showValidation, setShowValidation] = useState(false);



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

     const root = response?.data;
     const wrapped = root?.data;
     const entries = Array.isArray(wrapped?.data)
       ? wrapped.data
       : Array.isArray(wrapped)
       ? wrapped
       : Array.isArray(root?.data)
       ? root.data
       : Array.isArray(root)
       ? root
       : [];

     // ✅ Convert API shape directly into your row structure
     const mappedRows = entries.map((entry) => ({
       rowId: entry.rowId ?? entry.row_id ?? entry.rowID ?? null,
       client: entry.client || "",
       project: entry.project || "",
       ticket: entry.ticket || "",
       ticketDescription: entry.ticketDescription || "",
       category: entry.category || "",
       billable: normalizeBillable(entry.billable),
       description: entry.description || "",
       hoursByDate: entry.hoursByDate || {},

     }));
     const finalRows = mappedRows.length > 0 ? mappedRows : [createNewRow()];

     mappedRows.forEach((entry) => {
       const description = String(entry.ticketDescription || "").trim();
       if (description) {
         setTicketDescriptionInCache(entry.ticket, description);
       }
     });

     setRows(finalRows);

     finalRows.forEach((r, index) => {
       if (r.client) {
         fetchTaskTypesForRow(index, r.client);
         fetchProjectsForRow(index, r.client);
       }
     });

     // ✅ SNAPSHOT MUST MATCH ROWS
     setSavedRowsSnapshot(JSON.parse(JSON.stringify(finalRows)));
     if (showMessage) {
       const okMessage =
         wrapped?.message ||
         root?.message ||
         (entries.length > 0
           ? "Effort Entries Fetched For This Week"
           : "No Effort Entries Found");
       showPopup(okMessage, "success");
     }

   } catch (err) {
     console.error("Failed to fetch effort entries:", err);
     const errMsg =
       err?.response?.data?.error ||
       err?.response?.data?.message ||
       err?.response?.data?.data?.error ||
       err?.response?.data?.data?.message ||
       err?.message ||
       "Failed to load effort entries";
     showPopup(errMsg, "error");
   }
 };

 const [descModal, setDescModal] = useState({
   open: false,
   rowIndex: null,
   ticket: "",
   ticketDescription: "",
   taskDescription: "",
   ticketFound: false,
   ticketExistsInDb: false,
   ticketDescriptionEditable: true,
   loading: false,
 });

const closeDescModal = () => {
  setDescModal({
    open: false,
    rowIndex: null,
    ticket: "",
    ticketDescription: "",
    taskDescription: "",
    ticketFound: false,
    ticketExistsInDb: false,
    ticketDescriptionEditable: true,
    loading: false,
  });
};

const handleOpenDescription = async (rowIndex) => {
  const token = localStorage.getItem("token");
  const row = rows[rowIndex];
  if (!row) return;

  const ticket = (row.ticket || "").trim();
  const ticketKey = normalizeTicketKey(ticket);
  if (!ticket) {
    showPopup("Enter Ticket Number before opening Desc", "error");
    return;
  }
  const localTicketDescription =
    rows.find(
      (r) =>
        (r.ticket || "").trim().toUpperCase() === ticket.toUpperCase() &&
        (r.ticketDescription || "").trim()
    )?.ticketDescription || "";
  const cachedTicketDescription = ticketDescriptionCache[ticketKey] || "";
  const resolvedDescription = cachedTicketDescription || localTicketDescription || row.ticketDescription || "";
  const hasResolvedDescription = Boolean((resolvedDescription || "").trim());

  setDescModal({
    open: true,
    rowIndex,
    ticket,
    ticketDescription: resolvedDescription,
    taskDescription: row.description || "",
    ticketFound: hasResolvedDescription,
    ticketExistsInDb: false,
    ticketDescriptionEditable: !hasResolvedDescription,
    loading: true,
  });

  try {
    const response = await axios.get(`${API_BASE_URL}/api/tickets/description`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { ticket },
    });

    const exists = Boolean(response.data?.exists);
    const dbDescription = response.data?.ticketDescription || "";
    if (exists && dbDescription.trim()) {
      setTicketDescriptionInCache(ticket, dbDescription);
    }

    if (exists) {
      setRows((prev) => prev.map((r) => (
        (r.ticket || "").trim().toUpperCase() === ticket.toUpperCase()
          ? { ...r, ticketDescription: dbDescription || cachedTicketDescription || r.ticketDescription || resolvedDescription }
          : r
      )));
    }

    setDescModal((prev) => ({
      ...prev,
      loading: false,
      ticketFound: exists || hasResolvedDescription,
      ticketExistsInDb: exists,
      ticketDescription: exists
        ? (dbDescription || cachedTicketDescription || resolvedDescription)
        : resolvedDescription,
      ticketDescriptionEditable: !(exists || hasResolvedDescription),
    }));
  } catch (err) {
    console.error("Ticket lookup failed:", err);
    showPopup("Could not fetch ticket description", "error");
    setDescModal((prev) => ({
      ...prev,
      loading: false,
      ticketFound: hasResolvedDescription,
      ticketExistsInDb: false,
      ticketDescription: resolvedDescription || prev.ticketDescription,
      ticketDescriptionEditable: !hasResolvedDescription,
    }));
  }
};

const handleTaskDescriptionChange = (e) => {
  const value = e.target.value;
  setDescModal((prev) => ({ ...prev, taskDescription: value }));
};

const handleTicketDescriptionChange = (e) => {
  const value = e.target.value;
  setDescModal((prev) => ({ ...prev, ticketDescription: value }));
};

const handleEnableTicketDescriptionEdit = () => {
  setDescModal((prev) => ({ ...prev, ticketDescriptionEditable: true }));
};

const handleDescriptionSave = async () => {
  if (descModal.rowIndex == null) return;

  const token = localStorage.getItem("token");
  const ticketDescription = (descModal.ticketDescription || "").trim();

  if (!ticketDescription) {
    showPopup("Ticket Description is required", "error");
    return;
  }

  setTicketDescriptionInCache(descModal.ticket, ticketDescription);

  const row = rows[descModal.rowIndex];
  const currentTicketDescription = (row?.ticketDescription || "").trim();
  const ticketDescriptionChanged = currentTicketDescription !== ticketDescription;

  if (ticketDescriptionChanged) {
    try {
      await axios.put(
        `${API_BASE_URL}/api/tickets/description`,
        {
          ticket: descModal.ticket,
          ticketDescription,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err) {
      // If ticket doesn't exist yet in DB, keep local value; DB will get value on task save.
      if (err?.response?.status !== 404) {
        console.error("Failed to update ticket description:", err);
        showPopup("Failed to update Ticket Description in DB", "error");
        return;
      }
    }
  }

  const newRows = [...rows];
  const targetTicket = descModal.ticket;
  for (let i = 0; i < newRows.length; i += 1) {
    if ((newRows[i].ticket || "").trim() === targetTicket) {
      newRows[i].ticketDescription = ticketDescription;
    }
  }
  newRows[descModal.rowIndex].description = descModal.taskDescription;

  setRows(newRows);
  setIsDirty(true);
  closeDescModal();
};

const handleDescriptionCancel = () => {
  closeDescModal();
};


  // ✅ Trigger fetch on mode/date change
  useEffect(() => {
    if (mode && dateRange.start && dateRange.end) {
      fetchEffortEntries(true);
    }
  }, [mode, dateRange.start, dateRange.end]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unsaved changes + modal logic
  const hasUnsavedChanges = () => {
    return JSON.stringify(rows) !== JSON.stringify(savedRowsSnapshot);
  };

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
            <div className="save-btn-div">

            <button className="btn save-btn" onClick={handleSave}>
                                Save <IoIosSave />
            </button>
            </div>
          </div>

          {mode && (
            <>
              <div className="date-range-info">
                <strong>Date range:</strong> {dateRange.start} to {dateRange.end}
              </div>

              <div className="effort-actions-top">
                <div className="left-actions">
                  {mode === "weekly" && (
                    <button className="btn prev-week-btn" onClick={handlePrevWeek}>
                      <PiArrowFatLeftFill />
                    </button>
                  )}
                </div>

                <div className="right-actions">
                  {mode === "weekly" && (
                    <button className="btn next-week-btn" onClick={handleNextWeek}>
                      <PiArrowFatRightFill />
                    </button>
                  )}

                </div>
              </div>

              <div ref={tableWrapperRef}>
                <HorizontalEffortTable
                  rows={rows}
                  clients={clientOptions}
                  categories={categoryOptions}
                  taskTypeOptions={taskTypeOptions}
                  projectOptions={projectOptions}
                  dateColumns={getDateColumns()}
                  handleChange={handleChange}
                  handleDeleteRow={handleDeleteRow}
                  handleAddRow={handleAddRow}
                  handleCopyRow={handleCopyRow}
                  canDeleteRows={canDeleteRows}
                  onEditDescription={handleOpenDescription}
                  showValidation={showValidation}
                  duplicateRowIndexes={duplicateRowIndexes}
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
          {descModal.open && (
            <div className="task-desc-modal-backdrop">
              <div className="task-desc-modal">
                <h3>Desc</h3>
                <div className="desc-modal-ticket">Ticket Number: {descModal.ticket}</div>
                {descModal.loading ? (
                  <div className="desc-modal-loading">Checking ticket in DB...</div>
                ) : (
                  <>
                    <div className="desc-modal-section">
                      <div className="desc-modal-section-header">
                        <label>Ticket Description</label>
                        <button
                          type="button"
                          className="btn desc-edit-btn"
                          onClick={handleEnableTicketDescriptionEdit}
                          disabled={descModal.ticketDescriptionEditable}
                        >
                          Edit
                        </button>
                      </div>
                      <textarea
                        value={descModal.ticketDescription}
                        onChange={handleTicketDescriptionChange}
                        rows={3}
                        disabled={!descModal.ticketDescriptionEditable}
                        placeholder="Enter ticket description"
                      />
                    </div>
                    <div className="desc-modal-section">
                      <label>Task Description</label>
                      <textarea
                        value={descModal.taskDescription}
                        onChange={handleTaskDescriptionChange}
                        rows={8}
                        placeholder="Enter task description for this entry"
                      />
                    </div>
                  </>
                )}
                <div className="task-desc-modal-actions">
                  <button className="btn" onClick={handleDescriptionCancel}>
                    Cancel
                  </button>
                  <button
                    className="btn save-btn"
                    onClick={handleDescriptionSave}
                    disabled={descModal.loading}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EffortEntryPageHorizontal;
