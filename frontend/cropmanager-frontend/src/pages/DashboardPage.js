import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCrops } from "../services/api";  // Your API functions
import "../styles/Dashboard.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [isCropsAdded, setIsCropsAdded] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.token;

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/"); // go back to login
  };

  // Fetch crops
  const fetchCrops = useCallback(async () => {
    if (!userId) return;
    const data = await getCrops(userId);
    setCrops(data);
    setIsCropsAdded(data.length > 0);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    fetchCrops();
  }, [userId, fetchCrops, navigate]);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Action Buttons */}
      <div className="dashboard-actions" style={{ display: "flex", gap: "20px", margin: "20px 0" }}>
        <button className="add-crop-btn" onClick={() => navigate("/crop")}>
          ➕ Add New Crop
        </button>
        {isCropsAdded && (
          <button className="view-harvest-btn" onClick={() => navigate("/harvest-stats")}>
            📊 View Harvest Stats
          </button>
        )}
      </div>

      {/* Crops Table */}
      <div className="crops-table-container">
        {crops.length === 0 ? (
          <p>No crops added yet.</p>
        ) : (
          <table className="crops-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Name</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Area (acres)</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Planting Date</th>
                <th style={{ border: "1px solid #ddd", padding: "8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {crops.map((crop) => (
                <tr key={crop.id}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{crop.name}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{crop.area}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{crop.planting_date}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    <button onClick={() => navigate(`/harvest/${crop.id}`)}>
                      Record Harvest
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
