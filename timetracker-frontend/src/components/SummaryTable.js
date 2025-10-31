// SummaryTable.js
import React, { forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/SummaryTable.css";

const SummaryTable = forwardRef(({
  summaryData = [],
  setSummaryData,
  showPopup,
  calendarMin,
  calendarMax,
  clientOptions = [],
  categoryOptions = [],
}, ref) => {

  const handleChange = (index, field, value) => {
    const newData = [...summaryData];
    newData[index][field] = value;
    newData[index].isEditing = true;
    setSummaryData(newData);
  };

  const startEdit = (index) => {
    const newData = [...summaryData];
    newData[index].isEditing = true;
    setSummaryData(newData);
  };

  const cancelEdit = (index) => {
    const newData = [...summaryData];
    newData[index].isEditing = false;
    setSummaryData(newData);
  };

  // ✅ Single-row save
  const handleSave = async (index) => {
    const task = summaryData[index];
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/tasks/${task.id}`, task, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newData = [...summaryData];
      newData[index].isEditing = false;
      setSummaryData(newData);
      showPopup("Task updated successfully", "success");
    } catch (err) {
      console.error(err);
      showPopup("Failed to update task", "error");
    }
  };

  // ✅ Multi-row save (used by modal)
  const handleSaveAll = async () => {
    const editedTasks = summaryData.filter((task) => task.isEditing);
    if (editedTasks.length === 0) return;

    try {
      const token = localStorage.getItem("token");
      await Promise.all(
        editedTasks.map((task) =>
          axios.put(`${API_BASE_URL}/api/tasks/${task.id}`, task, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      const updatedData = summaryData.map((task) => ({
        ...task,
        isEditing: false,
      }));
      setSummaryData(updatedData);
      showPopup("All unsaved changes have been saved!", "success");
    } catch (err) {
      console.error(err);
      showPopup("Failed to save some tasks", "error");
    }
  };

  // 👇 Expose both functions to parent (SummaryPage)
  useImperativeHandle(ref, () => ({
    handleSaveAll,
    handleSave,
  }));

  return (
    <div className="summary-section">
      <div className="table-container">
        <table className="summary-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Ticket</th>
              <th>Ticket Desc</th>
              <th>Category</th>
              <th>Description</th>
              <th>Hours</th>
              <th>Billable</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.length > 0 ? (
              summaryData.map((task, idx) => (
                <tr key={task.id || idx}>
                  <td>
                    {task.isEditing ? (
                      <input
                        type="date"
                        value={
                          task.date && /^\d{2}-\d{2}-\d{4}$/.test(task.date)
                            ? (() => {
                                const [dd, mm, yyyy] = task.date.split("-");
                                return `${yyyy}-${mm}-${dd}`;
                              })()
                            : task.date || ""
                        }
                        min={calendarMin}
                        max={calendarMax}
                        onChange={(e) => {
                          const [yyyy, mm, dd] = e.target.value.split("-");
                          handleChange(idx, "date", `${dd}-${mm}-${yyyy}`);
                        }}
                      />
                    ) : (
                      task.date
                    )}
                  </td>

                  <td>
                    {task.isEditing ? (
                      <select
                        value={task.client || ""}
                        onChange={(e) => handleChange(idx, "client", e.target.value)}
                      >
                        <option value="">Select</option>
                        {clientOptions.map((client) => (
                          <option key={client} value={client}>
                            {client}
                          </option>
                        ))}
                      </select>
                    ) : (
                      task.client
                    )}
                  </td>

                  <td>
                    {task.isEditing ? (
                      <input
                        type="text"
                        value={task.ticket || ""}
                        onChange={(e) => handleChange(idx, "ticket", e.target.value)}
                      />
                    ) : (
                      task.ticket
                    )}
                  </td>

                  <td>
                    {task.isEditing ? (
                      <input
                        type="text"
                        value={task.ticketDescription || ""}
                        onChange={(e) =>
                          handleChange(idx, "ticketDescription", e.target.value)
                        }
                      />
                    ) : (
                      task.ticketDescription
                    )}
                  </td>

                  <td>
                    {task.isEditing ? (
                      <select
                        value={task.category || ""}
                        onChange={(e) => handleChange(idx, "category", e.target.value)}
                      >
                        <option value="">Select</option>
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    ) : (
                      task.category
                    )}
                  </td>

                  <td>
                    {task.isEditing ? (
                      <input
                        type="text"
                        value={task.description || ""}
                        onChange={(e) => handleChange(idx, "description", e.target.value)}
                      />
                    ) : (
                      task.description
                    )}
                  </td>

                  <td>
                    {task.isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={task.hours || ""}
                        onChange={(e) => handleChange(idx, "hours", e.target.value)}
                      />
                    ) : (
                      task.hours
                    )}
                  </td>

                  <td>
                    {task.isEditing ? (
                      <select
                        value={task.billable || ""}
                        onChange={(e) => handleChange(idx, "billable", e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    ) : (
                      task.billable
                    )}
                  </td>

                  <td>
                    {task.isEditing ? (
                      <div className="edit-actions">
                        <button className="save-btn" onClick={() => handleSave(idx)}>
                          Save
                        </button>
                        <button className="cancel-btn" onClick={() => cancelEdit(idx)}>
                          X
                        </button>
                      </div>
                    ) : (
                      <button className="edit-btn" onClick={() => startEdit(idx)}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="no-data">
                  No data available for selected range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default SummaryTable;
