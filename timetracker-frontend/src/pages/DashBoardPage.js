import React, { useState, useEffect } from "react";
import axios from "axios";
import SummaryTable from "../components/SummaryTable";
import API_BASE_URL from "../config/BackendApiConfig";
import { useNavigate } from "react-router-dom";
import TopHeader from "../components/TopHeader";
import SideNav from "../components/SideNavigation";
import "./css/DashBoardPage.css";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [summaryData, setSummaryData] = useState([]);

  const clientOptions = ["Client A", "Client B", "ENIA"];
  const categoryOptions = ["Development", "Testing", "Design", "Analysis"];

  const formatDateForInput = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const today = new Date();
  const startDate = formatDateForInput(today);
  const endDate = formatDateForInput(today);

  // Check if there are unsaved changes (dummy example, update if you have editable rows)
  const hasUnsavedChanges = () =>
    summaryData.some((row) =>
      Object.values(row).some((val) => val && val.toString().trim() !== "")
    );

  // Handle navigation from SideNav
  const handleNavClick = (path) => {
    if (hasUnsavedChanges()) {
      const leave = window.confirm(
        "You have unsaved changes! Are you sure you want to leave without saving?"
      );
      if (!leave) return;
    }
    navigate(path);
  };

  // Warn on browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [summaryData]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    if (!token) {
      navigate("/login");
      return;
    }

    setUsername(
      storedUsername
        ? storedUsername.charAt(0).toUpperCase() + storedUsername.slice(1)
        : "User"
    );

    const fetchSummary = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/tasks/summary-by-range?email=${email}&startDate=${startDate}&endDate=${endDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSummaryData(response.data?.data?.data || []);
      } catch (err) {
        console.error("Error fetching summary:", err);
      }
    };

    fetchSummary();
  }, [navigate, startDate, endDate]);

  return (
    <div className="layout-container">
      {/* Header */}
      <TopHeader username={username} />

      <div className="main-section">

        <SideNav onNavClick={handleNavClick} activePage="dashboard" />

        <main className="page-content">
          <h2 className="page-title">Dashboard</h2>
          <SummaryTable
            summaryData={summaryData}
            clientOptions={clientOptions}
            categoryOptions={categoryOptions}
            startDate={startDate}
            endDate={endDate}
            editable={false}
          />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
