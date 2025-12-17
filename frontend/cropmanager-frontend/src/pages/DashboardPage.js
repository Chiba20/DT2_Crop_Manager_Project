import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCrops } from "../services/api";  // Import API functions
import "../styles/Dashboard.css";  // Assuming you have a CSS file for styling

export default function DashboardPage() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [isCropsAdded, setIsCropsAdded] = useState(false);  // Track if crops have been added

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.token;

  // Fetch crops data
  const fetchCrops = useCallback(async () => {
    const data = await getCrops(userId);
    console.log("Fetched Crops Data:", data);  // Log the crops data
    setCrops(data);
    if (data.length > 0) {
      setIsCropsAdded(true);  // Mark crops as added if there are any crops
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    fetchCrops();
  }, [userId, fetchCrops, navigate]);  // Fetch crops when userId or fetchCrops changes

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <button className="add-crop-btn" onClick={() => navigate("/crop")}>
        ➕ Add New Crop
      </button>

      {/* Show this button if crops have been added */}
      {isCropsAdded && (
        <button className="add-crop-btn" onClick={() => navigate("/harvest-stats")}>
          ➕ View Harvest Stats
        </button>
      )}

      {/* Displaying Crops */}
      <div className="crops-grid">
        {crops.map((crop) => (
          <div className="crop-card" key={crop.id}>
            <h3>{crop.name}</h3>
            <p>Area: {crop.area} acres</p>
            <p>Planted: {crop.planting_date}</p>
            <button onClick={() => navigate(`/harvest/${crop.id}`)}>Record Harvest</button>
          </div>
        ))}
      </div>
    </div>
  );
}
