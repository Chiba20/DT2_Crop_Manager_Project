import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCrops } from "../services/api";
import "../styles/Prediction.css";

const LIMIT = 100; // load many crops once

export default function PredictionPage() {
  const navigate = useNavigate();

  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.userId || user?.token || null; // your login returns userId
    } catch {
      return null;
    }
  }, []);

  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState("");

  const [loadingCrops, setLoadingCrops] = useState(false);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [prediction, setPrediction] = useState(null);

  // ✅ Load crops once
  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    const load = async () => {
      setLoadingCrops(true);
      setErrorMsg("");
      try {
        const res = await getCrops(userId, 1, LIMIT);
        const rows = Array.isArray(res?.data) ? res.data : [];
        setCrops(rows);

        // auto-select first crop if exists
        if (rows.length > 0) setSelectedCropId(String(rows[0].id));
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to load crops.");
      } finally {
        setLoadingCrops(false);
      }
    };

    load();
  }, [userId, navigate]);

  // ✅ Fetch prediction
  const fetchPrediction = async () => {
    if (!selectedCropId) return;

    setLoadingPrediction(true);
    setErrorMsg("");
    setPrediction(null);

    try {
      const url = `http://localhost:5000/api/predict/${selectedCropId}?user_id=${userId}`;
      const res = await fetch(url);

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || "Prediction failed.");
        return;
      }

      setPrediction(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Server error. Check backend is running.");
    } finally {
      setLoadingPrediction(false);
    }
  };

  return (
    <div className="prediction-page">
      <div className="prediction-header">
        <div>
          <h1>Prediction</h1>
          <p>Choose a crop to predict yield, category, and get tips.</p>
        </div>

        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
      </div>

      {/* Crop selector */}
      <div className="prediction-card">
        <h2>Select Crop</h2>

        {loadingCrops ? (
          <p className="info">Loading crops...</p>
        ) : crops.length === 0 ? (
          <div className="empty">
            <p>No crops found. Add a crop first.</p>
            <button className="primary" onClick={() => navigate("/crop")}>
              ➕ Add Crop
            </button>
          </div>
        ) : (
          <div className="controls">
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Area: {c.area}, Date: {c.planting_date})
                </option>
              ))}
            </select>

            <button className="primary" onClick={fetchPrediction} disabled={loadingPrediction}>
              {loadingPrediction ? "Predicting..." : "Predict Yield"}
            </button>
          </div>
        )}

        {errorMsg && <p className="error">{errorMsg}</p>}
      </div>

      {/* Prediction result */}
      {prediction && (
        <div className="prediction-card result">
          <h2>Result</h2>

          <div className="result-grid">
            <div className="result-box">
              <span className="label">Crop</span>
              <span className="value">{prediction.crop_name}</span>
            </div>

            <div className="result-box">
              <span className="label">Predicted Yield</span>
              <span className="value">{prediction.predicted_yield}</span>
            </div>

            <div className="result-box">
              <span className="label">Category</span>
              <span className={`pill ${prediction.yield_category?.toLowerCase()}`}>
                {prediction.yield_category}
              </span>
            </div>

            <div className="result-box">
              <span className="label">Training Points</span>
              <span className="value">{prediction.training_points}</span>
            </div>
          </div>

          <div className="tips">
            <h3>Farming Tips</h3>
            <ul>
              {(prediction.tips || []).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>

          <div className="meta">
            <span>
              Model: {prediction.used_regression_model ? "Regression" : "Fallback"}
            </span>
            <span>
              Month planted: {prediction.month_planted}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
