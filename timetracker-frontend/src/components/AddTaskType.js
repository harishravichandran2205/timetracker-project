import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/AddTaskType.css";

const AddTaskType = () => {
  const [action, setAction] = useState("add");

  const [clientCodes, setClientCodes] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);

  const [clientCode, setClientCode] = useState("");
  const [taskType, setTaskType] = useState("");
  const [newTaskType, setNewTaskType] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ================= LOAD CLIENT CODES =================
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_BASE_URL}/api/admin-panel/client-codes`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setClientCodes(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        setError("Failed to load client codes");
      }
    };
    fetchClients();
  }, []);

  // ================= LOAD TASK TYPES =================
  useEffect(() => {
    if (!clientCode || action === "add") {
      setTaskTypes([]);
      return;
    }

    const fetchTaskTypes = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${API_BASE_URL}/api/admin-panel/task-types/${clientCode}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("RAW RESPONSE:", res.data);

        // ✅ FIX: extract from res.data.data
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        console.log("TASK TYPES:", list);

        setTaskTypes(list);
        setTaskType("");
      } catch (err) {
        console.error(err);
        setTaskTypes([]);
      }
    };

    fetchTaskTypes();
  }, [clientCode, action]);




  // ================= VALIDATION =================
  const validate = () => {
    setError("");
    setMessage("");

    if (!clientCode) return setError("Client Code is required"), false;
    if (action === "add" && !taskType) return setError("Task Type is required"), false;
    if ((action === "modify" || action === "delete") && !taskType)
      return setError("Please select a Task Type"), false;
    if (action === "modify" && !newTaskType)
      return setError("New Task Type is required"), false;

    return true;
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (!validate()) return;

    const token = localStorage.getItem("token");

    let url = "";
    let payload = {};

    if (action === "add") {
      url = "/api/admin-panel/task-type/add";
      payload = { clientCode, taskType };
    }

    if (action === "delete") {
      url = "/api/admin-panel/task-type/delete";
      payload = { clientCode, taskType };
    }

    if (action === "modify") {
      url = "/api/admin-panel/task-type/modify";
      payload = { clientCode, oldTaskType: taskType, newTaskType };
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}${url}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(res.data?.data?.message || "Success");
      setTaskType("");
      setNewTaskType("");
      setTaskTypes([]);
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  return (
    <div className = "add-client-page">
        <div className="filter-card">
          <label className="section-label">Task Type Management</label>

          {/* ACTION */}
          <div className="radio-group">
            {["add", "modify", "delete"].map((a) => (
              <label key={a}>

                <input
                  type="radio"
                  checked={action === a}
                  onChange={() => {
                    setAction(a);
                    setTaskType("");
                    setNewTaskType("");
                  }}
                />
                {a.toUpperCase()}
              </label>
            ))}
          </div>

          {/* CLIENT */}
          <div className="task-type-row">
          <div className="query-input input-small">
          <select value={clientCode} onChange={(e) => setClientCode(e.target.value)}>
            <option value="">Select Client</option>
            {clientCodes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          </div>


          {/* ADD */}
          {action === "add" && (

            <div className="query-input input-small">
            <input
              placeholder="Task Type"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
            />
            </div>

          )}

          {/* MODIFY / DELETE */}
          {(action === "modify" || action === "delete") && (
            <div className="query-input input-small">
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              disabled={!clientCode}
            >

              <option value="">
                {!clientCode
                  ? "Select Client First"
                  : taskTypes.length === 0
                  ? "No Task Types Found"
                  : "Select Task Type"}
              </option>

              {taskTypes.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
            </div>
          )}

          {/* MODIFY NEW NAME */}
          {action === "modify" && (
            <div className="query-input input-small">
            <input
              placeholder="New Task Type"
              value={newTaskType}
              onChange={(e) => setNewTaskType(e.target.value)}
            />
            </div>
          )}

          <button className="btn primary-btn" onClick={handleSubmit}>
            {action.toUpperCase()}
          </button>
           </div>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}

    </div>
    </div>
  );
};

export default AddTaskType;
