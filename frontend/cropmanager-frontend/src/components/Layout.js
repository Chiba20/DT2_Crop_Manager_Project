import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import TopNav from "./TopNav";

export default function Layout() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.token;

  useEffect(() => {
    if (!userId) navigate("/");
  }, [userId, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div>
      <TopNav onLogout={handleLogout} />
      <Outlet />
    </div>
  );
}
