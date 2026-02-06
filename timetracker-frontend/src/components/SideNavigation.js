import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BiSolidHome, BiSolidBarChartSquare } from "react-icons/bi";
import { MdAccessTimeFilled } from "react-icons/md";
import { GrDocumentTime } from "react-icons/gr";
import "./css/SideNavigation.css";

const navItems = [
  { path: "/dashboard", icon: <BiSolidHome />, label: "Dashboard" },
  { path: "/effort-entry-horizon", icon: <GrDocumentTime />, label: "Effort Entry" },
  { path: "/summary", icon: <BiSolidBarChartSquare />, label: "Summary" },
];

const SideNav = ({ onNavClick }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // safe click handler: use parent handler if it's a function, else use navigate()
  const handleNavClick = (path) => {
    if (typeof onNavClick === "function") {
      onNavClick(path);
    } else {
      navigate(path);
    }
  };

  // ---- roles -> isAdmin ----
  let roles = [];
  try {
    roles = JSON.parse(localStorage.getItem("roles")) || [];
  } catch {
    roles = [];
  }

  const isAdmin = roles.some((r) =>
    r.toString().toLowerCase() === "admin"
  );

  return (
    <aside className="side-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <div
            key={item.path}
            className={`nav-item ${isActive ? "active" : ""}`}
            onClick={() => handleNavClick(item.path)}
          >
            <div className="nav-icon">{item.icon}</div>
            <div className="nav-label">{item.label}</div>
          </div>
        );
      })}

      {/* Admin-only tab */}
      {isAdmin && (
        <div
          className={`nav-item ${
            location.pathname === "/admin-panel" ? "active" : ""
          }`}
          onClick={() => handleNavClick("/admin-panel")}
        >
          <div className="nav-icon">🔐</div>
          <div className="nav-label">Admin Panel</div>
        </div>
      )}
    </aside>
  );
};

export default SideNav;
