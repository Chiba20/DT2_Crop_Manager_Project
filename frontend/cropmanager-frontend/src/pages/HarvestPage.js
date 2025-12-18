import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recordHarvest } from "../services/api";
import "../styles/Harvest.css";

export default function HarvestPage() {
  const { cropId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.token;

  const [form, setForm] = useState({ date: "", yieldAmount: "" });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const saveHarvest = async () => {
    const { date, yieldAmount } = form;

    if (!date) return alert("Date is required");
    if (!yieldAmount) return alert("Yield amount is required");

    const yieldNum = parseFloat(yieldAmount);
    if (isNaN(yieldNum) || yieldNum <= 0) return alert("Yield must be a number > 0");

    const res = await recordHarvest(cropId, userId, { date, yield_amount: yieldNum });

    if (res.error) return alert(res.error);

    alert("Harvest recorded successfully!");
    navigate("/dashboard");
  };

  return (
    <div className="harvest-container">
      <div className="harvest-card">
        <h2>Record Harvest</h2>

        <div className="input-group">
          <label>Date</label>
          <input type="date" name="date" value={form.date} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Yield Amount</label>
          <input type="number" name="yieldAmount" value={form.yieldAmount} onChange={handleChange} min="0" step="any" />
        </div>

        <button className="save-btn" onClick={saveHarvest}>Save Harvest</button>
      </div>
    </div>
  );
}
