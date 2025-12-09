import { useState } from "react";
import api from "../api/axiosClient";

export default function AddCrop() {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [plantingDate, setPlantingDate] = useState("");

  const submitCrop = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/crops", {
        name,
        area,
        planting_date: plantingDate,
      });

      alert("Crop Added!");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Error adding crop");
    }
  };

  return (
    <div>
      <h2>Add Crop</h2>

      <form onSubmit={submitCrop}>
        <input 
          type="text"
          placeholder="Crop name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input 
          type="number"
          placeholder="Area (acres)"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />

        <input 
          type="date"
          value={plantingDate}
          onChange={(e) => setPlantingDate(e.target.value)}
        />

        <button type="submit">Save</button>
      </form>
    </div>
  );
}
