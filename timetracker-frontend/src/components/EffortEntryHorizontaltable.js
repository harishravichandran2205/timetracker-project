
import React , { forwardRef } from "react";


const HorizontalEffortTable = ({
  rows,
  clients,
  categories,
  dateColumns,
  handleChange,
  handleDeleteRow,
  handleAddRow,
  canDeleteRows,

},ref ) => {
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
            <th>Task Description</th>
            {dateColumns.map((date) => (
              <th key={date}>{date.split("-")[0]}</th>
            ))}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>
                <select
                  value={row.client}
                  onChange={(e) => handleChange(rowIndex, "client", e.target.value)}
                >
                  <option value="">Select</option>
                  {clients.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={row.ticket}
                  onChange={(e) => handleChange(rowIndex, "ticket", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={row.ticketDescription}
                  onChange={(e) => handleChange(rowIndex, "ticketDescription", e.target.value)}
                />
              </td>
              <td>
                <select
                  value={row.category}
                  onChange={(e) => handleChange(rowIndex, "category", e.target.value)}
                >
                  <option value="">Select</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={row.billable}
                  onChange={(e) => handleChange(rowIndex, "billable", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => handleChange(rowIndex, "description", e.target.value)}
                />
              </td>
              {dateColumns.map((date) => (
                <td key={date}>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={row.hoursByDate?.[date] || ""}
                    onChange={(e) =>
                      handleChange(rowIndex, "hoursByDate", {
                        ...row.hoursByDate,
                        [date]: e.target.value,
                      })
                    }
                  />
                </td>
              ))}
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HorizontalEffortTable;
