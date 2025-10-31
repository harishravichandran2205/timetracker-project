import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/TopHeader.css";
import logo from "../assets/images/logo-o.png";
import { BiSolidUserCircle } from "react-icons/bi";

const TopHeader = ({ username }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="top-header">
      <div className="top-left">
        <img className="o-company-logo" src={logo} alt="logo"/>
        <h1 className="app-title">EffortSheet Portal</h1>
      </div>
      <div className="top-right">
        <div
          className="profile-avatar"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className = "usericon"><BiSolidUserCircle/></span>
          <span>{username}</span>
        </div>

        {menuOpen && (
          <div className="profile-menu">
            <button onClick={() => navigate("/personal")}>👤 My Account</button>
            <hr />
            <button onClick={handleLogout}>🚪 Logout</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopHeader;
