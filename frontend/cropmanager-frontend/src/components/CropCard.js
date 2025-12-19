import React from "react";
import YieldPredictor from "../pages/YieldPredictor";
import "../styles/Dashboard.css";

export default function CropCard({ crop, onHarvest }) {
  return (
    <div className="crop-card">
      <h3>{crop.name}</h3>
      <p>Area: {crop.area} acres</p>
      <p>Planted: {crop.planting_date}</p>

      {/* MODULE 3 */}
      <YieldPredictor cropId={crop.id} />

      <button onClick={onHarvest}>Record Harvest</button>
    </div>
  );
}
