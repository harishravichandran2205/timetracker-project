// src/components/EffortTable.js
import React from "react";

const EffortTable = ({
  rows,
  clients,
  categories,
  dateRange,
  handleChange,
  handleDeleteRow,
}) => {
  return (
    <table className="effort-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Client</th>
          <th>Ticket</th>
          <th>Ticket Description</th>
          <th>Category</th>
          <th>Billable</th>
          <th>Description</th>
          <th>Hours</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            <td>
              <input
                type="date"
                min={dateRange.start}
                max={dateRange.end}
                value={
                  row.date
                    ? (() => {
                        const [dd, mm, yyyy] = row.date.split("-");
                        return `${yyyy}-${mm}-${dd}`;
                      })()
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) handleChange(index, "date", "");
                  else {
                    const [yyyy, mm, dd] = val.split("-");
                    handleChange(index, "date", `${dd}-${mm}-${yyyy}`);
                  }
                }}
              />
            </td>
            <td>
              <select
                value={row.client}
                onChange={(e) => handleChange(index, "client", e.target.value)}
              >
                <option value="">Select</option>
                {clients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <input
                type="text"
                value={row.ticket}
                onChange={(e) => handleChange(index, "ticket", e.target.value)}
              />
            </td>
            <td>
              <input
                type="text"
                value={row.ticketDescription}
                onChange={(e) =>
                  handleChange(index, "ticketDescription", e.target.value)
                }
              />
            </td>
            <td>
              <select
                value={row.category}
                onChange={(e) => handleChange(index, "category", e.target.value)}
              >
                <option value="">Select</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <select
                value={row.billable}
                onChange={(e) => handleChange(index, "billable", e.target.value)}
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
                onChange={(e) => handleChange(index, "description", e.target.value)}
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                step="0.5"
                value={row.hours}
                onChange={(e) => handleChange(index, "hours", e.target.value)}
              />
            </td>
            <td>
              <button className="delete-btn" onClick={() => handleDeleteRow(index)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default EffortTable;
