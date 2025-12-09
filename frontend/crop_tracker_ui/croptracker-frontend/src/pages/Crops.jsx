import { useEffect, useState } from "react";
import api from "../api/axiosClient";

export default function Crops() {
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    api.get("/crops").then(res => setCrops(res.data));
  }, []);

  return (
    <div>
      <h2>Your Crops</h2>
      {crops.map(crop => (
        <div key={crop.id}>
          <p><strong>{crop.name}</strong></p>
          <p>Area: {crop.area} acres</p>
          <p>Planted: {crop.planting_date}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}
