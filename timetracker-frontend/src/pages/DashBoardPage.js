import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopHeader from "../components/TopHeader";
import SideNav from "../components/SideNavigation";
import API_BASE_URL from "../config/BackendApiConfig";
import "./css/DashBoardPage.css";

import BillableNonBillablePie from "../components/BillableNonBillablePie";
import PreviousMonthWeeklyBar from "../components/PreviousMonthWeeklyBar";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [currentRows, setCurrentRows] = useState([]);
  const [monthOffset, setMonthOffset] = useState(0);

  const pad2 = (n) => String(n).padStart(2, "0");
  const formatForBackend = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0);
  const startDate = formatForBackend(monthStart);
  const endDate = formatForBackend(monthEnd);
  const monthLabel = monthStart.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");

    if (!token) {
      navigate("/login");
      return;
    }
    setUsername(storedUsername || "User");
  }, [navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const email = localStorage.getItem("email");

        const currentRes = await axios.get(
          `${API_BASE_URL}/api/effort-entry-horizon`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { email, startDate, endDate },
          }
        );

        setCurrentRows(
          Array.isArray(currentRes.data?.data?.data)
            ? currentRes.data.data.data
            : []
        );
      } catch (err) {
        console.error("Dashboard fetch failed", err);
      }
    };

    fetchDashboardData();
  }, [startDate, endDate]);

  return (
    <div className="layout-container">
      <TopHeader username={username} />

      <div className="main-section">
        <SideNav activePage="dashboard" />

        <main className="page-content">
          <h2 className="page-title">Dashboard</h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={() => setMonthOffset((v) => v - 1)}
            >
              &lt;
            </button>
            <h4 style={{ margin: 0, textAlign: "center" }}>
              {monthLabel} – Effort Summary
            </h4>
            <button
              type="button"
              className="btn"
              onClick={() => setMonthOffset((v) => v + 1)}
              disabled={monthOffset >= 0}
              title={monthOffset >= 0 ? "Cannot view future months" : ""}
            >
              &gt;
            </button>
          </div>

          <div className="dashboard-charts">
            <BillableNonBillablePie rows={currentRows} />
            <PreviousMonthWeeklyBar
              rows={currentRows}
              rangeStart={monthStart}
              rangeEnd={monthEnd}
              monthLabelOverride={monthLabel}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;

