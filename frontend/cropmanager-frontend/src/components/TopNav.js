import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/TopNav.css";

export default function TopNav({ onLogout }) {
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <nav className="topnav">
      <div className="topnav-left">
        <span className="brand">Crop Manager</span>
      </div>

      <div className="topnav-links">
        <Link className={isActive("/dashboard")} to="/dashboard">Dashboard</Link>
        <Link className={isActive("/harvest-stats")} to="/harvest-stats">Harvest Stats</Link>
        <Link className={isActive("/prediction")} to="/prediction">Prediction</Link>
      </div>

      <div className="topnav-right">
        <button className="logout" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}
