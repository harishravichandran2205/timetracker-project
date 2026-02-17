import React, { useState } from "react";
import GetSummary from "../components/GetSummary";
import AddUserRole from "../components/AddUserRole";
import AddTaskType from "../components/AddTaskType";
import AddClient from "../components/AddClient";
import AddProjectForClient from "../components/AddProjectForClient";
import "./css/AdminPage.css";

const AdminPage = () => {
  const [selectedOption, setSelectedOption] = useState("");

  const renderComponent = () => {
    switch (selectedOption) {
      case "summary":
        return <GetSummary />;
      case "userRole":
        return <AddUserRole />;
      case "taskType":
        return <AddTaskType />;
      case "client":
        return <AddClient />;
      case "projectForClient":
        return <AddProjectForClient />;
      default:
        return <p>Please select an option above</p>;
    }
  };

  return (
    <div className="admin-page">
      <h2 className="page-title">Admin Panel</h2>

      {/* Radio Buttons */}
      <div className="admin-radio-group">
        <label>
          <input
            type="radio"
            name="adminOption"
            value="summary"
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          Get Summary
        </label>

        <label>
          <input
            type="radio"
            name="adminOption"
            value="userRole"
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          Add User Role
        </label>

        <label>
          <input
            type="radio"
            name="adminOption"
            value="taskType"
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          Add Task Type
        </label>

        <label>
          <input
            type="radio"
            name="adminOption"
            value="client"
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          Add Client
        </label>

        <label>
          <input
            type="radio"
            name="adminOption"
            value="projectForClient"
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          Add Project for Client
        </label>
      </div>

      {/* Render Selected Component */}
      <div className="admin-content">
        {renderComponent()}
      </div>
    </div>
  );
};

export default AdminPage;
