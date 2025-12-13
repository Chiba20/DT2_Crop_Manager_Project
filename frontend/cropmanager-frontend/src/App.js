import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CropPage from "./pages/CropPage";
import HarvestPage from "./pages/HarvestPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/crop" element={<CropPage />} />
                <Route path="/harvest/:cropId" element={<HarvestPage />} />
            </Routes>
        </BrowserRouter>
    );
}
