import { useState } from "react";
import { addHarvest } from "../services/api";

export default function AddHarvestForm() {
  const [cropId, setCropId] = useState("");
  const [form, setForm] = useState({
    date: "",
    yieldAmount: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await addHarvest(cropId, form);
    alert(JSON.stringify(result));
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Record Harvest</h3>

      <input
        placeholder="Crop ID"
        value={cropId}
        onChange={(e) => setCropId(e.target.value)}
      />

      <input name="date" type="date" onChange={handleChange} />
      <input name="yieldAmount" placeholder="Yield Amount" onChange={handleChange} />
      <button>Record Harvest</button>
    </form>
  );
}
