// src/pages/SummaryPage.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";
import SummaryTable from "../components/SummaryTable";
import TopHeader from "../components/TopHeader";
import SideNav from "../components/SideNavigation";
import UnsavedChangesModal from "../components/UnsavedChangesModel";
import CommonLoader from "../components/CommonLoader";
import "./css/SummaryPage.css";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import loginCompanyLogo from "../assets/images/company-logo.png";

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
  const [results, setResults] = useState([]);
  const [activeView, setActiveView] = useState(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState("all");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
  const [consolidatedSortBy, setConsolidatedSortBy] = useState("none");
  const [projectOptionsByClient, setProjectOptionsByClient] = useState({});
  const [allProjectOptions, setAllProjectOptions] = useState([]);

  // ===== Unsaved changes modal state =====
  const summaryTableRef = useRef();
  const logoDataUrlRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showIncludeDatesModal, setShowIncludeDatesModal] = useState(false);
  const [pendingDownloadType, setPendingDownloadType] = useState(null);

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

  useEffect(() => {
    const fetchProjectsForAllClients = async () => {
      if (!clientOptions.length) {
        setProjectOptionsByClient({});
        setAllProjectOptions([]);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const responses = await Promise.all(
          clientOptions.map((clientCode) =>
            axios
              .get(`${API_BASE_URL}/api/admin-panel/projects/${clientCode}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((res) => ({
                clientCode,
                projects: Array.isArray(res?.data?.data) ? res.data.data : [],
              }))
              .catch(() => ({ clientCode, projects: [] }))
          )
        );

        const nextMap = {};
        const allProjectsSet = new Set();

        responses.forEach(({ clientCode, projects }) => {
          const normalized = Array.from(
            new Set(projects.map((p) => String(p || "").trim()).filter(Boolean))
          ).sort((a, b) => a.localeCompare(b));
          nextMap[clientCode] = normalized;
          normalized.forEach((p) => allProjectsSet.add(p));
        });

        setProjectOptionsByClient(nextMap);
        setAllProjectOptions(Array.from(allProjectsSet).sort((a, b) => a.localeCompare(b)));
      } catch (err) {
        console.error("Failed to fetch project options", err);
        setProjectOptionsByClient({});
        setAllProjectOptions([]);
      }
    };

    fetchProjectsForAllClients();
  }, [clientOptions]);


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

  const clearPopup = () => {
    setSuccess("");
    setError("");
  };


  const formatForBackend = (dateStr) => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split("-");
      return `${dd}-${mm}-${yyyy}`;
    }
    return dateStr;
  };

  const formatToAmericanDate = (dateStr) => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split("-");
      return `${mm}/${dd}/${yyyy}`;
    }
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [dd, mm, yyyy] = dateStr.split("-");
      return `${mm}/${dd}/${yyyy}`;
    }
    return dateStr;
  };

  const formatEffortDatesForExport = (dates) => {
    if (!Array.isArray(dates)) return "";
    return dates
      .map((d) => formatToAmericanDate(String(d || "").trim()))
      .filter(Boolean)
      .join(", ");
  };

  const isInvalidDateRange = (start, end) => {
    if (!start || !end) return false;
    return new Date(end) < new Date(start);
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
    const base = `${emailPart}_Effort summary_${datePart}`;

    const hasClient = selectedClientFilter !== "all";
    const hasProject = selectedProjectFilter !== "all";
    const clientPart = sanitizeFilePart(selectedClientFilter);
    const projectPart = sanitizeFilePart(selectedProjectFilter);

    if (!hasClient && !hasProject) {
      return base;
    }

    if (hasClient && !hasProject) {
      return `${base}_${clientPart}`;
    }

    return `${base}_${clientPart}_${projectPart}`;
  };

  const getLogoDataUrl = async () => {
    if (logoDataUrlRef.current) return logoDataUrlRef.current;
    const response = await fetch(loginCompanyLogo);
    const blob = await response.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    logoDataUrlRef.current = dataUrl;
    return dataUrl;
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
    clearPopup();
    setActiveView("summary");
    if (!startDate || !endDate) {
      showPopup("Please select both start and end dates", "error");
      return;
    }
    if (isInvalidDateRange(startDate, endDate)) {
      showPopup("End date cannot be earlier than start date", "error", true);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const email = localStorage.getItem("email");
      const hasClient = selectedClientFilter !== "all";
      const hasProject = selectedProjectFilter !== "all";

      const response = await axios.get(`${API_BASE_URL}/api/tasks/summary-by-range`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          email,
          startDate: formatForBackend(startDate),
          endDate: formatForBackend(endDate),
          ...(hasClient ? { client: selectedClientFilter } : {}),
          ...(hasProject ? { project: selectedProjectFilter } : {}),
        },
      });

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
    clearPopup();
    setActiveView("consolidated");
    setSummaryData([]);
    setResults([]);

    if (!startDate || !endDate) {
      showPopup("Please select both start and end dates", "error");
      return;
    }
    if (isInvalidDateRange(startDate, endDate)) {
      showPopup("End date cannot be earlier than start date", "error", true);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const email = localStorage.getItem("email");
      const payload = {
        email,
        ...(selectedClientFilter !== "all"
          ? { client: selectedClientFilter }
          : {}),
        ...(selectedProjectFilter !== "all"
          ? { project: selectedProjectFilter }
          : {}),
        startDate: formatForBackend(startDate),
        endDate: formatForBackend(endDate),
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/tasks/summary-consolidated`,
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

  const fetchConsolidatedForExport = async (includeDates = false) => {
    clearPopup();
    if (!startDate || !endDate) {
      showPopup("Please select both start and end dates", "error");
      return null;
    }
    if (isInvalidDateRange(startDate, endDate)) {
      showPopup("End date cannot be earlier than start date", "error", true);
      return null;
    }

    const token = localStorage.getItem("token");
    const email = (localStorage.getItem("email") || "").trim();

    if (!email) {
      showPopup("Logged in email not found", "error");
      return null;
    }

    const payload = {
      email,
      ...(selectedClientFilter !== "all"
        ? { client: selectedClientFilter }
        : {}),
      ...(selectedProjectFilter !== "all"
        ? { project: selectedProjectFilter }
        : {}),
      startDate: formatForBackend(startDate),
      endDate: formatForBackend(endDate),
      includeDates,
    };

    const res = await axios.post(
      `${API_BASE_URL}/api/tasks/summary-consolidated`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return Array.isArray(res?.data?.data?.data) ? res.data.data.data : [];
  };

  const generateExcel = (data, includeEffortDates = false) => {
    const headerRow = [
      "Client Name",
      "Project",
      "Ticket Number",
      "Ticket Description",
      "Billable Hours",
      "Non-Billable Hours",
      "Task Description",
    ];
    if (includeEffortDates) {
      headerRow.push("Effort Dates");
    }

    const tableRows = data.map((row) => {
      const base = [
        row.client,
        row.project,
        row.ticket,
        row.ticketDescription,
        row.billableHours ?? 0,
        row.nonBillableHours ?? 0,
        (row.descriptions || []).map((d, i) => `${i + 1}. ${d}`).join("\n"),
      ];
      if (includeEffortDates) {
        base.push(formatEffortDatesForExport(row.effortDates || []));
      }
      return base;
    });

    const worksheetData = [
      ["Effort Summary Report"],
      [
        `Date Range: ${formatToAmericanDate(startDate)} to ${formatToAmericanDate(
          endDate
        )}`,
      ],
      [],
      headerRow,
      ...tableRows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const totalCols = headerRow.length;
    const headerRowNumber = 4; // 1-based index in worksheet
    const bodyStartRowNumber = headerRowNumber + 1;
    const bodyEndRowNumber = bodyStartRowNumber + tableRows.length - 1;

    const borderStyle = {
      top: { style: "thin", color: { rgb: "D0D7E5" } },
      bottom: { style: "thin", color: { rgb: "D0D7E5" } },
      left: { style: "thin", color: { rgb: "D0D7E5" } },
      right: { style: "thin", color: { rgb: "D0D7E5" } },
    };

    const titleStyle = {
      font: { bold: true, sz: 14, color: { rgb: "0A46A0" } },
      alignment: { horizontal: "left", vertical: "center" },
    };

    const metaStyle = {
      font: { bold: true, sz: 11, color: { rgb: "2E3A59" } },
      alignment: { horizontal: "left", vertical: "center" },
    };

    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { patternType: "solid", fgColor: { rgb: "0F56B7" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: borderStyle,
    };

    const bodyStyleWhite = {
      fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } },
      alignment: { horizontal: "left", vertical: "top", wrapText: true },
      border: borderStyle,
    };

    const bodyStyleGrey = {
      fill: { patternType: "solid", fgColor: { rgb: "F2F2F2" } },
      alignment: { horizontal: "left", vertical: "top", wrapText: true },
      border: borderStyle,
    };

    // Merge title/date rows across all table columns
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
    ];

    worksheet["A1"].s = titleStyle;
    worksheet["A2"].s = metaStyle;

    // Header style
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowNumber - 1, c });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = headerStyle;
      }
    }

    // Body zebra style (white/grey)
    for (let r = bodyStartRowNumber; r <= bodyEndRowNumber; r++) {
      const useGrey = (r - bodyStartRowNumber) % 2 === 1;
      const rowStyle = useGrey ? bodyStyleGrey : bodyStyleWhite;
      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: r - 1, c });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = rowStyle;
        }
      }
    }

    worksheet["!cols"] = includeEffortDates ? [
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 24 },
      { wch: 16 },
      { wch: 18 },
      { wch: 32 },
      { wch: 30 },
    ] : [
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 24 },
      { wch: 16 },
      { wch: 18 },
      { wch: 42 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
    XLSX.writeFile(workbook, `${buildExportBaseName()}.xlsx`);
  };

  const generatePDF = async (data, includeEffortDates = false) => {
    const doc = new jsPDF("landscape");
    const THEME_BLUE = [15, 86, 183]; // #0F56B7
    let logoDataUrl = null;
    try {
      logoDataUrl = await getLogoDataUrl();
    } catch (e) {
      console.error("Failed to load PDF footer logo", e);
    }

    const drawFooterLogo = () => {
      if (!logoDataUrl) return;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const logoWidth = 24;
      const logoHeight = 7;
      const rightMargin = 8;
      const bottomMargin = 5;
      const x = pageWidth - logoWidth - rightMargin;
      const y = pageHeight - logoHeight - bottomMargin;
      doc.addImage(logoDataUrl, "PNG", x, y, logoWidth, logoHeight);
    };

    doc.setTextColor(...THEME_BLUE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Effort Summary Report", 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Date Range: ${formatToAmericanDate(startDate)} to ${formatToAmericanDate(
        endDate
      )}`,
      14,
      22
    );
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    const tableColumn = [
      "Client Name",
      "Project",
      "Ticket Number",
      "Ticket Description",
      "Billable Hours",
      "Non-Billable Hours",
      "Task Description",
    ];
    if (includeEffortDates) {
      tableColumn.push("Effort Dates");
    }

    const tableRows = data.map((row) => {
      const base = [
        row.client,
        row.project,
        row.ticket,
        row.ticketDescription,
        row.billableHours ?? 0,
        row.nonBillableHours ?? 0,
        (row.descriptions || []).map((d, i) => `${i + 1}. ${d}`).join("\n"),
      ];
      if (includeEffortDates) {
        base.push(formatEffortDatesForExport(row.effortDates || []));
      }
      return base;
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 3, valign: "top" },
      headStyles: { fillColor: THEME_BLUE, textColor: [255, 255, 255], fontStyle: "bold" },
      columnStyles: includeEffortDates
        ? { 6: { cellWidth: 65 }, 7: { cellWidth: 55 } }
        : { 6: { cellWidth: 80 } },
      pageBreak: "auto",
      didDrawPage: () => {
        drawFooterLogo();
      },
    });

    doc.save(`${buildExportBaseName()}.pdf`);
  };

  const consolidatedProjectOptions =
    selectedClientFilter === "all"
      ? allProjectOptions
      : projectOptionsByClient[selectedClientFilter] || [];

  const sortedConsolidatedResults = useMemo(() => {
    const sorted = [...(results || [])];
    if (consolidatedSortBy === "client_asc") {
      sorted.sort((a, b) =>
        String(a?.client || "").localeCompare(String(b?.client || ""))
      );
    } else if (consolidatedSortBy === "client_desc") {
      sorted.sort((a, b) =>
        String(b?.client || "").localeCompare(String(a?.client || ""))
      );
    } else if (consolidatedSortBy === "project_asc") {
      sorted.sort((a, b) =>
        String(a?.project || "").localeCompare(String(b?.project || ""))
      );
    } else if (consolidatedSortBy === "project_desc") {
      sorted.sort((a, b) =>
        String(b?.project || "").localeCompare(String(a?.project || ""))
      );
    }

    return sorted;
  }, [results, consolidatedSortBy]);

  useEffect(() => {
    if (
      selectedClientFilter !== "all" && !clientOptions.includes(selectedClientFilter)
    ) {
      setSelectedClientFilter("all");
    }
  }, [selectedClientFilter, clientOptions]);

  useEffect(() => {
    if (selectedClientFilter === "all" && selectedProjectFilter !== "all") {
      setSelectedProjectFilter("all");
    }
  }, [selectedClientFilter, selectedProjectFilter]);

  useEffect(() => {
    if (
      selectedProjectFilter !== "all" &&
      !consolidatedProjectOptions.includes(selectedProjectFilter)
    ) {
      setSelectedProjectFilter("all");
    }
  }, [selectedProjectFilter, consolidatedProjectOptions]);

  const downloadExcel = async (includeDates) => {
    try {
      setLoading(true);
      const data = await fetchConsolidatedForExport(includeDates);
      if (!data || data.length === 0) {
        showPopup("No effort records found for selected range", "error");
        return;
      }
      generateExcel(data, includeDates);
      showPopup("Excel downloaded successfully", "success");
    } catch (err) {
      console.error(err);
      showPopup("Failed to download Excel", "error");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (includeDates) => {
    try {
      setLoading(true);
      const data = await fetchConsolidatedForExport(includeDates);
      if (!data || data.length === 0) {
        showPopup("No effort records found for selected range", "error");
        return;
      }
      await generatePDF(data, includeDates);
      showPopup("PDF downloaded successfully", "success");
    } catch (err) {
      console.error(err);
      showPopup("Failed to download PDF", "error");
    } finally {
      setLoading(false);
    }
  };

  const requestExportDownload = (type) => {
    setPendingDownloadType(type);
    setShowIncludeDatesModal(true);
  };

  const handleIncludeDatesChoice = async (includeDates) => {
    const type = pendingDownloadType;
    setShowIncludeDatesModal(false);
    setPendingDownloadType(null);
    if (!type) return;

    if (type === "excel") {
      await downloadExcel(includeDates);
      return;
    }

    if (type === "pdf") {
      await downloadPDF(includeDates);
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

          <div className="consolidated-filter-row controls-card">
            <label className="field-group">
              <span className="field-label">Client:</span>
              <select
                value={selectedClientFilter}
                onChange={(e) => {
                  setSelectedClientFilter(e.target.value);
                  setSelectedProjectFilter("all");
                }}
              >
                <option value="all">All Clients</option>
                {clientOptions.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-group">
              <span className="field-label">Project:</span>
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                disabled={selectedClientFilter === "all"}
              >
                <option value="all">All</option>
                {consolidatedProjectOptions.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="date-range-container controls-card controls-row-2">
            <label className="field-group">
              <span className="field-label">Start Date:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={calendarMin}
                max={calendarMax}
              />
            </label>
            <label className="field-group">
              <span className="field-label">End Date:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={calendarMin}
                max={calendarMax}
              />
            </label>
            <div className="summary-actions">
              <button className="btn" onClick={fetchSummaryByDate}>
                Show Summary
              </button>
              <button
                className="btn"
                onClick={fetchConsolidatedSummaryByDate}
              >
                Show Consolidated Summary
              </button>
            </div>
            {!loading &&
              activeView === "consolidated" &&
              startDate &&
              endDate &&
              results.length > 0 && (
              <div className="consolidated-download-actions">
                <button
                  className="btn summary-export-btn"
                  onClick={() => requestExportDownload("excel")}
                >
                  Download Excel
                </button>
                <button
                  className="btn summary-export-btn"
                  onClick={() => requestExportDownload("pdf")}
                >
                  Download PDF
                </button>
              </div>
            )}
          </div>

          {loading && <CommonLoader overlay />}
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
                  {sortedConsolidatedResults.length > 0 ? (
                    sortedConsolidatedResults.map((row, idx) => (
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="no-data">
                        No records found for selected filters.
                      </td>
                    </tr>
                  )}
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

      {showIncludeDatesModal && (
        <div className="summary-export-modal-overlay">
          <div className="summary-export-modal-content">
            <button
              type="button"
              className="summary-export-modal-close"
              onClick={() => {
                setShowIncludeDatesModal(false);
                setPendingDownloadType(null);
              }}
              aria-label="Close"
            >
              ×
            </button>
            <p>Do you want to include effort dates in report?</p>
            <div className="summary-export-modal-actions">
              <button
                className="btn summary-export-yes-btn"
                onClick={() => handleIncludeDatesChoice(true)}
              >
                Yes
              </button>
              <button
                className="btn summary-export-no-btn"
                onClick={() => handleIncludeDatesChoice(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryPage;
