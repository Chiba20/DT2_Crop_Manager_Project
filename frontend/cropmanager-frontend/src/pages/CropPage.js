import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Crop.css";

export default function CropPage() {
  const navigate = useNavigate();

  // Get logged-in user
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.token;

  const [form, setForm] = useState({
    name: "",
    area: "",
    planting_date: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const saveCrop = async () => {
    // --- Validation ---
    if (!form.name.trim()) {
      alert("Crop name cannot be empty.");
      return;
    }
    if (!isNaN(form.name)) {
      alert("Crop name must be a string.");
      return;
    }

    const areaNum = parseFloat(form.area);
    if (!form.area || isNaN(areaNum) || areaNum <= 0) {
      alert("Area must be a positive number.");
      return;
    }

    if (!form.planting_date) {
      alert("Please select a planting date.");
      return;
    }

    const body = {
      name: form.name.trim(),
      area: areaNum,
      planting_date: form.planting_date
    };

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/crop/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || data.message || "Failed to add crop.");
        return;
      }

      alert("Crop added successfully!");
      navigate("/dashboard"); // redirect to dashboard
    } catch (error) {
      console.error("Error:", error);
      alert("Could not connect to the server. Make sure backend is running.");
    }
  };

  return (
    <div className="crop-page">
      <div className="crop-card">
        <h2>Add New Crop</h2>
        <p className="crop-subtitle">Enter crop details below</p>

        <div className="input-group">
          <label>Crop Name</label>
          <input
            name="name"
            placeholder="e.g., Maize"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <label>Area (in Acres)</label>
          <input
            name="area"
            type="number"
            placeholder="e.g., 2.5"
            value={form.area}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <label>Planting Date</label>
          <input
            name="planting_date"
            type="date"
            value={form.planting_date}
            onChange={handleChange}
          />
        </div>

        <button className="save-btn" onClick={saveCrop}>
          Save Crop
        </button>
      </div>
    </div>
  );
}
