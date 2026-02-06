import React from "react";
import { PiNotePencilFill } from "react-icons/pi";


const HorizontalEffortTable = ({
  rows = [],
  clients = [],
  categories = [], // kept as-is
  dateColumns = [],
  taskTypeOptions = [], // SAFE DEFAULT
  handleChange,
  handleDeleteRow,
  handleAddRow,
  canDeleteRows,
  onEditDescription,
  showValidation,
}) => {
  /** 🟩 Check if row is filled (so new empty row won't highlight) */
  const isRowUsed = (row) => {
    const hasHours = Object.values(row.hoursByDate || {}).some(
      (v) => v && v.toString().trim() !== ""
    );

    const hasMainFields = [
      row.client,
      row.ticket,
      row.ticketDescription,
      row.category,
      row.billable,
    ].some((v) => v && v.toString().trim() !== "");

    return hasHours || hasMainFields;
  };

  return (
    <div className="horizontal-effort-table-wrapper">
      <table className="horizontal-effort-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Ticket</th>
            <th>Ticket Description</th>
            <th>Category</th>
            <th>Billable</th>
            {dateColumns.map((date) => (
              <th key={date} className="date-col">
                {date.split("-")[0]}
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
            return (
            <tr key={rowIndex}>
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
                <input
                  type="text"
                  value={row.ticket}
                  className={needs(!row.ticket)}
                  onChange={(e) => handleChange(rowIndex, "ticket", e.target.value)}
                />
              </td>
              <td>
                <div className="ticket-desc-cell">
                  <input
                    type="text"
                    value={row.ticketDescription}
                    className={needs(!row.ticketDescription || !row.ticketDescription.trim())}
                    onChange={(e) => handleChange(rowIndex, "ticketDescription", e.target.value)}
                  />

                  <button
                    type="button"
                    className={
                      "task-desc-icon-btn " +
                      (showValidation && isRowUsed(row) && (!row.description || !row.description.trim())
                        ? "desc-error"
                        : "")
                    }
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
                  <select
                    value={row.billable ?? ""}
                    className={needs(!row.billable)}
                    onChange={(e) =>
                      handleChange(rowIndex, "billable", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
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
                      onClick={() => handleAddRow(rowIndex)}
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
        </tbody>
      </table>
    </div>
  );
};

export default HorizontalEffortTable;
