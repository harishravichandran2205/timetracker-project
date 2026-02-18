import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/AddClient.css";
import "./css/AddTaskType.css";

const AddProjectForClient = () => {
  const [action, setAction] = useState("add");
  const [clientCodes, setClientCodes] = useState([]);
  const [projects, setProjects] = useState([]);

  const [clientCode, setClientCode] = useState("");
  const [project, setProject] = useState("");
  const [newProject, setNewProject] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
        setClientCodes([]);
        setError("Failed to load client codes");
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    if (!clientCode || action === "add") {
      setProjects([]);
      setProject("");
      return;
    }

    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_BASE_URL}/api/admin-panel/projects/${clientCode}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setProjects(list);
      } catch {
        setProjects([]);
      }
    };

    fetchProjects();
  }, [clientCode, action]);

  const validate = () => {
    setError("");
    setMessage("");

    if (!clientCode) {
      setError("Client Code is required");
      return false;
    }
    if (action === "add" && !project) {
      setError("Project is required");
      return false;
    }
    if ((action === "modify" || action === "delete") && !project) {
      setError("Please select a Project");
      return false;
    }
    if (action === "modify" && !newProject) {
      setError("New Project is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const token = localStorage.getItem("token");

    let url = "";
    let payload = {};

    if (action === "add") {
      url = "/api/admin-panel/project/add";
      payload = { clientCode, project };
    }

    if (action === "delete") {
      url = "/api/admin-panel/project/delete";
      payload = { clientCode, project };
    }

    if (action === "modify") {
      url = "/api/admin-panel/project/modify";
      payload = { clientCode, oldProject: project, newProject };
    }

    try {
      const res = await axios.post(`${API_BASE_URL}${url}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(res.data?.data?.message || "Success");
      setProject("");
      setNewProject("");

      if (action !== "add" && clientCode) {
        const projectsRes = await axios.get(
          `${API_BASE_URL}/api/admin-panel/projects/${clientCode}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProjects(Array.isArray(projectsRes.data?.data) ? projectsRes.data.data : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  return (
    <div className="add-client-page">
      <div className="filter-card">
        <label className="section-label">Project for Client Management</label>

        <div className="radio-group">
          {["add", "modify", "delete"].map((a) => (
            <label key={a}>
              <input
                type="radio"
                checked={action === a}
                onChange={() => {
                  setAction(a);
                  setProject("");
                  setNewProject("");
                  setError("");
                  setMessage("");
                }}
              />
              {a.toUpperCase()}
            </label>
          ))}
        </div>

        <div className="task-type-row">
          <div className="query-input input-small">
            <select value={clientCode} onChange={(e) => setClientCode(e.target.value)}>
              <option value="">Select Client</option>
              {clientCodes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {action === "add" && (
            <div className="query-input input-small">
              <input
                placeholder="Project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              />
            </div>
          )}

          {(action === "modify" || action === "delete") && (
            <div className="query-input input-small">
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                disabled={!clientCode}
              >
                <option value="">
                  {!clientCode
                    ? "Select Client First"
                    : projects.length === 0
                    ? "No Projects Found"
                    : "Select Project"}
                </option>
                {projects.map((p, i) => (
                  <option key={`${p}-${i}`} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          {action === "modify" && (
            <div className="query-input input-small">
              <input
                placeholder="New Project"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
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

export default AddProjectForClient;
