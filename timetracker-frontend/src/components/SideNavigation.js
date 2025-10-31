import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiClock, FiBarChart2 } from "react-icons/fi";
import { BiSolidHome , BiSolidBarChartSquare } from "react-icons/bi";// Feather icons
import { MdAccessTimeFilled } from "react-icons/md";
import { GrDocumentTime } from "react-icons/gr";
import "./css/SideNavigation.css";

const navItems = [
  { path: "/dashboard", icon: <BiSolidHome />, label: "Dashboard" },
  { path: "/effort-entry", icon: <MdAccessTimeFilled />, label: "Effort Entry-row" },
  { path: "/summary", icon: <BiSolidBarChartSquare />, label: "Summary" },
  { path: "/effort-entry-horizon", icon: <GrDocumentTime />, label: "Effort Entry-horizon" },
];

const SideNav = ({ onNavClick }) => {
  const location = useLocation();


  return (
    <aside className="side-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <div
            key={item.path}
            className={`nav-item ${isActive ? "active" : ""}`}
             onClick={() => onNavClick && onNavClick(item.path)}
          >
            <div className="nav-icon">{item.icon}</div>
            <div className="nav-label">{item.label}</div>
          </div>
        );
      })}
    </aside>
  );
};

export default SideNav;
