import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import "./css/MonthlyTicketEffortStack.css";

const toHours = (hoursByDate) =>
  Object.values(hoursByDate || {})
    .map((v) => Number(v || 0))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => a + b, 0);

const MonthlyTicketEffortStack = ({ rows = [] }) => {
  const [page, setPage] = useState(0);
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [showTicketSearch, setShowTicketSearch] = useState(false);
  const [ticketSearchInput, setTicketSearchInput] = useState("");
  const ticketSearchRef = useRef(null);
  const pageSize = 5;

  const aggregatedRows = useMemo(() => {
    const grouped = new Map();

    rows.forEach((row) => {
      const ticket = String(row.ticket || "").trim();
      const client = String(row.client || "").trim();
      const project = String(row.project || "").trim();
      if (!ticket) return;

      const hours = toHours(row.hoursByDate);
      if (hours <= 0) return;

      const key = `${client}__${project}__${ticket}`;
      const current = grouped.get(key) || {
        key,
        client,
        project,
        ticket,
        billable: 0,
        nonBillable: 0,
      };

      if (String(row.billable || "").toLowerCase() === "yes") {
        current.billable += hours;
      } else {
        current.nonBillable += hours;
      }

      grouped.set(key, current);
    });

    return Array.from(grouped.values())
      .map((item) => ({ ...item, total: item.billable + item.nonBillable }))
      .filter((item) => item.total > 0);
  }, [rows]);

  const clientOptions = useMemo(
    () =>
      Array.from(new Set(aggregatedRows.map((r) => r.client).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [aggregatedRows]
  );

  const projectOptions = useMemo(() => {
    const filteredByClient =
      selectedClient === "all"
        ? aggregatedRows
        : aggregatedRows.filter((r) => r.client === selectedClient);

    return Array.from(new Set(filteredByClient.map((r) => r.project).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [aggregatedRows, selectedClient]);

  const ticketRows = useMemo(() => {
    const ticketFilters = Array.from(
      new Set(
      ticketSearchInput
        .split(",")
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean)
      )
    );

    const list = aggregatedRows.filter((r) => {
      const clientOk = selectedClient === "all" || r.client === selectedClient;
      const projectOk = selectedProject === "all" || r.project === selectedProject;
      const ticketValue = String(r.ticket || "").trim().toUpperCase();
      const ticketOk =
        ticketFilters.length === 0 ||
        ticketFilters.some((token) => ticketValue.includes(token));
      return clientOk && projectOk && ticketOk;
    });
    return list.sort((a, b) => b.total - a.total).slice(0, 30);
  }, [aggregatedRows, selectedClient, selectedProject, ticketSearchInput]);

  const totalPages = Math.ceil(ticketRows.length / pageSize);
  const safePage = Math.min(page, Math.max(totalPages - 1, 0));
  const visibleRows = ticketRows.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize
  );

  useEffect(() => {
    setPage(0);
  }, [rows, selectedClient, selectedProject, ticketSearchInput]);

  useEffect(() => {
    if (selectedClient !== "all" && !clientOptions.includes(selectedClient)) {
      setSelectedClient("all");
    }
  }, [clientOptions, selectedClient]);

  useEffect(() => {
    if (selectedProject !== "all" && !projectOptions.includes(selectedProject)) {
      setSelectedProject("all");
    }
  }, [projectOptions, selectedProject]);

  useEffect(() => {
    if (!showTicketSearch) return;

    const handleClickOutside = (event) => {
      if (ticketSearchRef.current && !ticketSearchRef.current.contains(event.target)) {
        setShowTicketSearch(false);
        setTicketSearchInput("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTicketSearch]);

  const maxTotal = useMemo(
    () => (ticketRows.length ? Math.max(...ticketRows.map((r) => r.total)) : 0),
    [ticketRows]
  );

  return (
    <div className="dashboard-card dashboard-card--ticket-stack">
      <div className="ticket-stack-head">
        <h4 className="ticket-stack-title">Ticket Based Effort</h4>
        <div className="ticket-sort-wrap">
          <label htmlFor="ticket-client" className="ticket-sort-label">
            Client:
          </label>
          <select
            id="ticket-client"
            className="ticket-sort-select"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="all">All</option>
            {clientOptions.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>
          <label htmlFor="ticket-project" className="ticket-sort-label">
            Project:
          </label>
          <select
            id="ticket-project"
            className="ticket-sort-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="all">All</option>
            {projectOptions.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
        <div ref={ticketSearchRef} className="ticket-search-wrap">
          <button
            type="button"
            className="ticket-search-btn"
            onClick={() => setShowTicketSearch((prev) => !prev)}
            title="Search ticket numbers"
            aria-label="Search ticket numbers"
          >
            <FaSearch />
          </button>
          {showTicketSearch && (
            <div className="ticket-search-input-wrap">
              <input
                type="text"
                className="ticket-search-input"
                value={ticketSearchInput}
                onChange={(e) => setTicketSearchInput(e.target.value)}
                placeholder="Enter ticket numbers separated by commas"
              />
            </div>
          )}
        </div>
        <div className="ticket-stack-nav">
          <button
            type="button"
            className="ticket-nav-btn"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={safePage <= 0}
            aria-label="Previous entries"
            title="Previous entries"
          >
            {"<"}
          </button>
          <span className="ticket-page-indicator">
            {safePage + 1}/{Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            className="ticket-nav-btn"
            onClick={() => setPage((p) => Math.min(p + 1, Math.max(totalPages - 1, 0)))}
            disabled={safePage >= totalPages - 1}
            aria-label="Next entries"
            title="Next entries"
          >
            {">"}
          </button>
        </div>
      </div>
      <div className="ticket-stack-legend">
        <span className="legend-dot legend-dot-billable" />
        <span>Billable</span>
        <span className="legend-dot legend-dot-nonbillable" />
        <span>Non-Billable</span>
      </div>

      <div className="ticket-stack-list">
        {visibleRows.length === 0 ? (
          <p className="ticket-stack-empty">No ticket effort data available</p>
        ) : (
          visibleRows.map((item) => {
          const totalPctOfMax = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
          const billablePct = item.total > 0 ? (item.billable / item.total) * 100 : 0;
          const nonBillablePct = item.total > 0 ? (item.nonBillable / item.total) * 100 : 0;

          return (
            <div className="ticket-stack-row" key={item.key}>
              <div className="ticket-code" title={item.ticket}>
                {item.ticket}
              </div>

              <div className="ticket-stack-track">
                <div
                  className="ticket-stack-fill"
                  style={{ width: `${Math.max(totalPctOfMax, 4)}%` }}
                >
                  <span
                    className="segment-billable"
                    style={{ width: `${billablePct}%` }}
                    title={`Billable: ${item.billable.toFixed(2)}h`}
                  />
                  <span
                    className="segment-nonbillable"
                    style={{ width: `${nonBillablePct}%` }}
                    title={`Non-Billable: ${item.nonBillable.toFixed(2)}h`}
                  />
                </div>
              </div>

              <div className="ticket-total">{item.total.toFixed(2)} h</div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
};

export default MonthlyTicketEffortStack;
