import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import Pages
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CropPage from "./pages/CropPage";
import HarvestPage from "./pages/HarvestPage";
import HarvestStatsPage from "./pages/HarvestStatsPage"; // Import the Harvest Stats Page

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* AuthPage for login */}
        <Route path="/" element={<AuthPage />} />

        {/* DashboardPage for displaying crops and harvest stats */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* CropPage for adding a new crop */}
        <Route path="/crop" element={<CropPage />} />

        {/* HarvestPage to record harvest for a specific crop */}
        <Route path="/harvest/:cropId" element={<HarvestPage />} />

        {/* Harvest Stats Page for displaying harvest statistics */}
        <Route path="/harvest-stats" element={<HarvestStatsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
