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
import AdminPage from "./pages/AdminPage.js";
import FilteredSummary from "./pages/admin/FilteredSummary";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AutoLogout from "./components/AutoLogout.js";




// 1. Create a sub-component for the routes logic
function AppRoutes() {
  const { isAuthenticated } = useAuth(); // Destructure to get the boolean

  return (
    <Routes>
      {/* Public pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected pages wrapped in DashboardLayout */}
      {isAuthenticated ? (
        <Route path="/" element={<AutoLogout><DashboardLayout /></AutoLogout>}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="effort-entry" element={<EffortEntryPage />} />
          <Route path="summary" element={<SummaryPage />} />
          <Route path="personal" element={<MyAccountPage />} />
          <Route path="effort-entry-horizon" element={<EffortEntryPageHorizon />} />
          <Route path="admin-panel" element={<AdminPage />} />
          <Route path="/admin/filtered-summary" element={<FilteredSummary />} />
        </Route>
      ) : (
        /* If not authenticated, redirect any unknown/protected route to login */
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
