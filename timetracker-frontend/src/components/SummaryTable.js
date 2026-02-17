// SummaryTable.js
import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
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
  const [taskTypeOptionsByRow, setTaskTypeOptionsByRow] = useState({});
  const [projectOptionsByRow, setProjectOptionsByRow] = useState({});

  const fetchTaskTypesForRow = async (rowIndex, clientCode) => {
    if (!clientCode) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE_URL}/api/admin-panel/task-types/${clientCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setTaskTypeOptionsByRow((prev) => ({ ...prev, [rowIndex]: list }));
    } catch (err) {
      console.error("Failed to fetch category options", err);
      setTaskTypeOptionsByRow((prev) => ({ ...prev, [rowIndex]: [] }));
    }
  };

  const fetchProjectsForRow = async (rowIndex, clientCode) => {
    if (!clientCode) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE_URL}/api/admin-panel/projects/${clientCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setProjectOptionsByRow((prev) => ({ ...prev, [rowIndex]: list }));
    } catch (err) {
      console.error("Failed to fetch project options", err);
      setProjectOptionsByRow((prev) => ({ ...prev, [rowIndex]: [] }));
    }
  };

  const fetchDependentOptionsForRow = async (rowIndex, clientCode) => {
    if (!clientCode) return;
    await Promise.all([
      fetchTaskTypesForRow(rowIndex, clientCode),
      fetchProjectsForRow(rowIndex, clientCode),
    ]);
  };

  useEffect(() => {
    summaryData.forEach((task, idx) => {
      if (!task?.isEditing || !task?.client) return;

      const hasTaskTypes = Object.prototype.hasOwnProperty.call(taskTypeOptionsByRow, idx);
      const hasProjects = Object.prototype.hasOwnProperty.call(projectOptionsByRow, idx);

      if (!hasTaskTypes) fetchTaskTypesForRow(idx, task.client);
      if (!hasProjects) fetchProjectsForRow(idx, task.client);
    });
  }, [summaryData, taskTypeOptionsByRow, projectOptionsByRow]);

  const handleChange = (index, field, value) => {
    const newData = [...summaryData];
    newData[index][field] = value;
    newData[index].isEditing = true;

    if (field === "client") {
      newData[index].project = "";
      newData[index].category = "";
      setProjectOptionsByRow((prev) => ({ ...prev, [index]: [] }));
      setTaskTypeOptionsByRow((prev) => ({ ...prev, [index]: [] }));
      fetchDependentOptionsForRow(index, value);
    }

    setSummaryData(newData);
  };

  const startEdit = (index) => {
    const newData = [...summaryData];
    newData[index].isEditing = true;
    setSummaryData(newData);
    fetchDependentOptionsForRow(index, newData[index].client);
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
              <th>Project</th>
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
                      <select
                        value={task.project || ""}
                        onChange={(e) => handleChange(idx, "project", e.target.value)}
                        disabled={!task.client}
                      >
                        <option value="">
                          {!task.client
                            ? "Select Client First"
                            : (projectOptionsByRow[idx]?.length ?? 0) === 0
                            ? "No Projects Found"
                            : "Select Project"}
                        </option>
                        {(projectOptionsByRow[idx] || []).map((project) => (
                          <option key={project} value={project}>
                            {project}
                          </option>
                        ))}
                      </select>
                    ) : (
                      task.project
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
                        disabled={!task.client}
                      >
                        <option value="">
                          {!task.client
                            ? "Select Client First"
                            : (taskTypeOptionsByRow[idx]?.length ?? 0) === 0
                            ? "No Categories Found"
                            : "Select Category"}
                        </option>
                        {(taskTypeOptionsByRow[idx] || categoryOptions).map((cat) => (
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
                <td colSpan={10} className="no-data">
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
