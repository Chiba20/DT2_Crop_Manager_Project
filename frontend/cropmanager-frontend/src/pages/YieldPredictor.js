import React, { useState } from "react";
import axios from "axios";
import "../styles/YieldPredictor.css";

const crops = ["maize", "rice", "wheat", "beans", "tomato", "potato"];
const seasons = ["rainy", "dry", "cool"];

export default function YieldPredictor() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.token;

  const [crop, setCrop] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [season, setSeason] = useState("");
  const [useHistory, setUseHistory] = useState(true);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handlePredict = async () => {
    setError("");
    setResult(null);

    if (!crop || !plantingDate || !season) {
      setError("Please fill all fields");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/predict-harvest",
        {
          crop,
          planting_date: plantingDate,
          season,
          user_id: userId,
          use_history: useHistory,
        }
      );

      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to fetch prediction. Please try again later."
      );
    }
  };

  return (
    <div className="predict-page">
      <div className="predict-card">
        <h2 className="predict-title">🌱 Harvest Prediction</h2>

        {/* Crop */}
        <div className="predict-field">
          <label>Crop</label>
          <select value={crop} onChange={(e) => setCrop(e.target.value)}>
            <option value="">-- Select crop --</option>
            {crops.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Planting Date */}
        <div className="predict-field">
          <label>Planting Date</label>
          <input
            type="date"
            value={plantingDate}
            onChange={(e) => setPlantingDate(e.target.value)}
          />
        </div>

        {/* Season */}
        <div className="predict-field">
          <label>Season</label>
          <select value={season} onChange={(e) => setSeason(e.target.value)}>
            <option value="">-- Select season --</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* History */}
        <div className="predict-checkbox">
          <input
            type="checkbox"
            checked={useHistory}
            onChange={() => setUseHistory(!useHistory)}
          />
          <span>Use my previous crop data (if available)</span>
        </div>

        <button className="predict-btn" onClick={handlePredict}>
          Predict Harvest
        </button>

        {/* Error */}
        {error && <div className="predict-error">{error}</div>}

        {/* ✅ SUCCESS BLOCK */}
        {result && result.recommended && (
          <div className="predict-result success">
            <h3>✅ Harvest Prediction</h3>

            <p>
              <strong>Harvest Date:</strong>{" "}
              {result.predicted_harvest_date}
            </p>

            <p>
              <strong>Growth Duration:</strong>{" "}
              {result.duration_days} days
            </p>

            {/* Confidence Range */}
            <p className="predict-confidence">
              📅 <strong>Expected Window:</strong>{" "}
              ± 7 days
            </p>

            {/* History Used */}
            {result.history_used && (
              <p>📊 Personalized using your past data</p>
            )}

            {/* History Not Available */}
            {!result.history_used && useHistory && (
              <p className="predict-info">
                ℹ️ Previous crop data not available. Using general crop averages.
              </p>
            )}
          </div>
        )}

        {/* ⚠️ NOT RECOMMENDED BLOCK */}
        {result && result.recommended === false && (
          <div className="predict-result warning">
            <p>
              <strong>⚠️ {result.message}</strong>
            </p>
            {result.reason && (
              <p className="predict-info">
                ℹ️ {result.reason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

