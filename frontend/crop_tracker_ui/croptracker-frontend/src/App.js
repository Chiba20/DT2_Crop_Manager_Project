import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LanguageSelect from "./pages/LanguageSelect.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AddCrop from "./pages/AddCrop.jsx";
import Crops from "./pages/Crops.jsx";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LanguageSelect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/crops" element={<Crops />} />
        <Route path="/add-crop" element={<AddCrop />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
