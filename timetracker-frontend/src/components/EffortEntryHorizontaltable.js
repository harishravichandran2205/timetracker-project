import React, { useState } from "react";
import { PiNotePencilFill } from "react-icons/pi";


const HorizontalEffortTable = ({
  rows = [],
  clients = [],
  categories = [], // kept as-is
  dateColumns = [],
  taskTypeOptions = [], // SAFE DEFAULT
  projectOptions = [],
  handleChange,
  handleDeleteRow,
  handleAddRow,
  handleCopyRow,
  canDeleteRows,
  onEditDescription,
  showValidation,
  duplicateRowIndexes = [],
}) => {
  const renderDateHeader = (date) => {
    const match = /^(\d+)\s+([A-Za-z]{3})\s+\(([^)]+)\)$/.exec(date);
    if (!match) return date;

    const [, day, month, weekDay] = match;
    return (
      <span className="date-header-wrap">
        <span>{`${day} ${month}`}</span>
        <span>{`(${weekDay})`}</span>
      </span>
    );
  };

  const [actionPopup, setActionPopup] = useState({
    open: false,
    rowIndex: null,
  });

  const openActionPopup = (rowIndex) => {
    setActionPopup({ open: true, rowIndex });
  };

  const closeActionPopup = () => {
    setActionPopup({ open: false, rowIndex: null });
  };

  const onAddNewRow = () => {
    if (actionPopup.rowIndex == null) return;
    handleAddRow(actionPopup.rowIndex);
    closeActionPopup();
  };

  const onCopyExistingRow = () => {
    if (actionPopup.rowIndex == null) return;
    handleCopyRow(actionPopup.rowIndex);
    closeActionPopup();
  };
  /** 🟩 Check if row is filled (so new empty row won't highlight) */
  const isRowUsed = (row) => {
    const hasHours = Object.values(row.hoursByDate || {}).some(
      (v) => v && v.toString().trim() !== ""
    );

    const hasMainFields = [
      row.client,
      row.project,
      row.ticket,
      row.ticketDescription,
      row.category,
    ].some((v) => v && v.toString().trim() !== "");

    return hasHours || hasMainFields;
  };

  const getTotalForDate = (date) =>
    rows.reduce((sum, row) => {
      const raw = row?.hoursByDate?.[date];
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

  const formatTotal = (value) => {
    if (!Number.isFinite(value)) return "0";
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  };

  return (
    <div className="horizontal-effort-table-wrapper">
      <table className="horizontal-effort-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Project</th>
            <th>Ticket</th>
            <th>Desc</th>
            <th>Category</th>
            <th>Billable</th>
            {dateColumns.map((date) => (
              <th key={date} className="date-col">
                {renderDateHeader(date)}
              </th>
            ))}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const rowUsed = isRowUsed(row);
            const hasHours = Object.values(row.hoursByDate || {}).some(
              (v) => v && v.toString().trim() !== ""
            );
            const needs = (cond) => (showValidation && rowUsed && cond ? "field-invalid" : "");
            const isDuplicateRow = duplicateRowIndexes.includes(rowIndex);
            return (
            <tr key={rowIndex} className={isDuplicateRow ? "duplicate-row" : ""}>
              <td>
                <select
                  value={row.client}
                  className={needs(!row.client)}
                  onChange={(e) => handleChange(rowIndex, "client", e.target.value)}
                >
                  <option value="">Select</option>

                  {clients.length === 0 && (
                    <option disabled>No clients found</option>
                  )}

                  {clients.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={row.project ?? ""}
                  className={needs(!row.project)}
                  onChange={(e) => handleChange(rowIndex, "project", e.target.value)}
                  disabled={!row.client}
                >
                  <option value="">
                    {!row.client
                      ? "Select Client First"
                      : (projectOptions[rowIndex]?.length ?? 0) === 0
                      ? "No Projects Found"
                      : "Select Project"}
                  </option>
                  {(projectOptions[rowIndex] || []).map((p, i) => (
                    <option key={`${rowIndex}-project-${i}`} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={row.ticket}
                  className={needs(!row.ticket)}
                  onChange={(e) => handleChange(rowIndex, "ticket", e.target.value)}
                />
              </td>
              <td>
                <div className="ticket-desc-cell">
                  <button
                    type="button"
                    className={`task-desc-icon-btn ${needs(!row.ticketDescription || !row.ticketDescription.trim()) ? "desc-error" : ""}`}
                    title="Edit task description"
                    onClick={() => onEditDescription(rowIndex)}
                  >
                   <PiNotePencilFill />
                  </button>

                </div>
              </td>

                {/* CATEGORY */}
                <td>
                  <select
                    value={row.category ?? ""}
                    className={needs(!row.category)}
                    onChange={(e) =>
                      handleChange(rowIndex, "category", e.target.value)
                    }
                    disabled={!row.client}
                  >
                    <option value="">
                      {!row.client
                        ? "Select Client First"
                        : (taskTypeOptions[rowIndex]?.length ?? 0) === 0
                        ? "No Categories Found"
                        : "Select Category"}
                    </option>

                    {(taskTypeOptions[rowIndex] || []).map((t, i) => (
                      <option key={`${rowIndex}-${i}`} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                </td>


                {/* BILLABLE */}
                <td>
                  <input
                    type="checkbox"
                    checked={row.billable === "Yes"}
                    onChange={(e) =>
                      handleChange(rowIndex, "billable", e.target.checked ? "Yes" : "No")
                    }
                  />
                </td>

                {/* HOURS */}
                {dateColumns.map((date) => (
                  <td
                    key={date}
                    className={`date-col ${needs(!hasHours)}`}
                  >
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={row.hoursByDate?.[date] ?? ""}
                      onChange={(e) =>
                        handleChange(rowIndex, "hoursByDate", {
                          ...row.hoursByDate,
                          [date]: e.target.value,
                        })
                      }
                    />
                  </td>
                ))}

                {/* ACTIONS */}
                <td>
                  <div className="action-buttons">
                    <button
                      className="plus-btn"
                      type="button"
                      onClick={() => openActionPopup(rowIndex)}
                    >
                      +
                    </button>

                  <button
                    className="delete-btn"
                    type="button"
                    disabled={
                      rows.length <= 1 || (row.rowId !== null && row.rowId !== undefined)
                    }
                    onClick={() => handleDeleteRow(rowIndex)}
                  >
                    -
                  </button>
                </div>
              </td>

            </tr>
          )})}
          <tr className="total-hours-row">
            <td colSpan={6}>Total Hours</td>
            {dateColumns.map((date) => (
              <td key={`total-${date}`} className="date-col">
                {formatTotal(getTotalForDate(date))}
              </td>
            ))}
            <td></td>
          </tr>
        </tbody>
      </table>
      {actionPopup.open && (
        <div className="row-action-modal-backdrop" onClick={closeActionPopup}>
          <div className="row-action-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select Action</h3>
            <div className="row-action-modal-actions">
              <button type="button" className="row-action-btn row-action-btn-add" onClick={onAddNewRow}>
                Add a new row
              </button>
              <button type="button" className="row-action-btn row-action-btn-copy" onClick={onCopyExistingRow}>
                Copy row
              </button>
              <button type="button" className="row-action-btn row-action-btn-cancel" onClick={closeActionPopup}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorizontalEffortTable;
