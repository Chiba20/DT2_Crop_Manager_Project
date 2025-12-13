import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Harvest.css";

export default function HarvestPage() {
    const { cropId } = useParams();
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.token;

    const [form, setForm] = useState({
        date: "",
        yieldAmount: ""
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const saveHarvest = async () => {
        const { date, yieldAmount } = form;

        // ----------- Validations -----------
        if (!date) {
            alert("Please select a date for the harvest.");
            return;
        }

        if (!yieldAmount) {
            alert("Please enter the yield amount.");
            return;
        }

        const yieldNum = parseFloat(yieldAmount);
        if (isNaN(yieldNum)) {
            alert("Yield amount must be a number.");
            return;
        }

        if (yieldNum <= 0) {
            alert("Yield amount must be greater than zero.");
            return;
        }

        // ----------- Submit to API -----------
        try {
            const response = await fetch(
                `http://127.0.0.1:5000/api/harvest/${cropId}/${userId}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ date, yieldAmount: yieldNum })
                }
            );

            const data = await response.json();

            if (data.error) {
                alert(data.error);
                return;
            }

            alert("Harvest recorded successfully!");
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            alert("Error submitting harvest. Please try again.");
        }
    };

    return (
        <div className="harvest-container">
            <div className="harvest-card">
                <h2>Record Harvest</h2>

                <div className="input-group">
                    <label>Date</label>
                    <input
                        name="date"
                        type="date"
                        value={form.date}
                        onChange={handleChange}
                    />
                </div>

                <div className="input-group">
                    <label>Yield Amount</label>
                    <input
                        name="yieldAmount"
                        type="number"
                        placeholder="Yield Amount"
                        value={form.yieldAmount}
                        onChange={handleChange}
                        min="0"
                        step="any"
                    />
                </div>

                <button className="save-btn" onClick={saveHarvest}>
                    Save Harvest
                </button>
            </div>
        </div>
    );
}
