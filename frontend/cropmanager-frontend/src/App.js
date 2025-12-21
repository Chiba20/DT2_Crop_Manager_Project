import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CropPage from "./pages/CropPage";
import HarvestPage from "./pages/HarvestPage";
import HarvestStatsPage from "./pages/HarvestStatsPage";
import YieldPredictor from "./pages/YieldPredictor";


import Layout from "./components/Layout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<AuthPage />} />

        {/* Protected */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/crop" element={<CropPage />} />
          <Route path="/harvest/:cropId" element={<HarvestPage />} />
          <Route path="/harvest-stats" element={<HarvestStatsPage />} />

          {/* Module 3 */}
          <Route path="/predict" element={<YieldPredictor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
