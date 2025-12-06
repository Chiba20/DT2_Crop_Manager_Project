import React, { useState } from "react";
import { addCrop } from "../services/api";

export default function AddCropForm() {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [plantingDate, setPlantingDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addCrop({ name, area, planting_date: plantingDate });
    alert("Crop added!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Crop name" onChange={e => setName(e.target.value)} />
      <input placeholder="Area" onChange={e => setArea(e.target.value)} />
      <input type="date" onChange={e => setPlantingDate(e.target.value)} />
      <button>Add Crop</button>
    </form>
  );
}
