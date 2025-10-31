import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashBoardPage";
import EffortEntryPage from "./pages/EffortEntryPage";
import SummaryPage from "./pages/SummaryPage";
import MyAccountPage from "./pages/MyAccountPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage.js"
import DashboardLayout from "./components/DashboardLayout.js";
import EffortEntryPageHorizon from "./pages/EffortEntryPageHorizontal.js";// Layout with static TopHeader & SideNav

function App() {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Router>
      <Routes>
        {/* Public pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected pages wrapped in DashboardLayout */}
        {isAuthenticated ? (
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="effort-entry" element={<EffortEntryPage />} />
            <Route path="summary" element={<SummaryPage />} />
            <Route path="personal" element={<MyAccountPage />} />
            <Route path="effort-entry-horizon" element={<EffortEntryPageHorizon />} />
          </Route>
        ) : (
          // If not authenticated, redirect any protected route to login
          <Route path="*" element={<Navigate to="/login" />} />
        )}

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
