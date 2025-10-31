import React from "react";
import { Outlet } from "react-router-dom";
import TopHeader from "./TopHeader";
import SideNav from "./SideNavigation";
import "./css/DashboardLayout.css";

const DashboardLayout = () => {
  return (
    <div className="layout-container">

      <TopHeader />

      <div className="main-section">

        <SideNav />


        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
