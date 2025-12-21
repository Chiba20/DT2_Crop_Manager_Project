// PredictionPage.js (FULL) — Displays acres + kg + kg/acre

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCrops } from "../services/api";
import API_BASE from "../services/config";
import "../styles/Prediction.css";

const LIMIT = 100;

export default function PredictionPage() {
  const navigate = useNavigate();

  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.userId || user?.token || null;
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

  const fetchPrediction = async () => {
    if (!selectedCropId) return;

    setLoadingPrediction(true);
    setErrorMsg("");
    setPrediction(null);

    try {
      const url = `${API_BASE}/api/predict/${selectedCropId}?user_id=${userId}`;
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

  const fmt = (v) => (v === null || v === undefined || v === "" ? "—" : v);

  const fmtNum = (v, digits = 1) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return n.toFixed(digits);
  };

  const pillClass = (cat) => {
    const c = String(cat || "").toLowerCase();
    if (c === "low") return "pill low";
    if (c === "medium") return "pill medium";
    if (c === "high") return "pill high";
    return "pill";
  };

  return (
    <div className="prediction-page">
      <div className="prediction-header">
        <div>
          <h1>Yield Prediction</h1>
          <p>Select a crop to estimate yield (kg), productivity (kg/acre), and get tips.</p>
        </div>

        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
      </div>

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
            <select value={selectedCropId} onChange={(e) => setSelectedCropId(e.target.value)}>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Area: {c.area} acres, Date: {c.planting_date})
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

      {prediction && (
        <div className="prediction-card result">
          <h2>Result</h2>

          <div className="result-grid">
            <div className="result-box">
              <span className="label">Crop</span>
              <span className="value">{fmt(prediction.crop_name)}</span>
            </div>

            <div className="result-box">
              <span className="label">Area</span>
              <span className="value">
                {fmtNum(prediction.area, 2)} {prediction.area_unit || "acres"}
              </span>
            </div>

            <div className="result-box">
              <span className="label">Predicted Yield</span>
              <span className="value">
                {fmtNum(prediction.predicted_yield, 1)} {prediction.yield_unit || "kg"}
              </span>
            </div>

            <div className="result-box">
              <span className="label">Predicted Productivity</span>
              <span className="value">
                {fmtNum(prediction.predicted_yield_per_acre, 1)}{" "}
                {prediction.yield_per_acre_unit || "kg/acre"}
              </span>
            </div>

            <div className="result-box">
              <span className="label">Category</span>
              <span className={pillClass(prediction.yield_category)}>
                {fmt(prediction.yield_category)}
              </span>
            </div>

            <div className="result-box">
              <span className="label">Baseline (Typical)</span>
              <span className="value">
                {fmtNum(prediction.baseline_yield_per_acre, 1)}{" "}
                {prediction.baseline_unit || "kg/acre"}
              </span>
            </div>

            <div className="result-box">
              <span className="label">Season</span>
              <span className="value">{fmt(prediction.season)}</span>
            </div>

            <div className="result-box">
              <span className="label">Confidence</span>
              <span className="value">{fmt(prediction.confidence)}</span>
            </div>

            <div className="result-box">
              <span className="label">Training Points</span>
              <span className="value">{fmt(prediction.training_points)}</span>
            </div>
          </div>

          <div className="tips">
            <h3>Farming Tips</h3>
            {(prediction.tips || []).length === 0 ? (
              <p className="info">No tips available.</p>
            ) : (
              <ul>
                {(prediction.tips || []).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="meta">
            <span>
              Model: {prediction.used_regression_model ? "Regression (month)" : "Baseline + Season"}
            </span>
            <span>Month planted: {fmt(prediction.month_planted)}</span>
            <span>Planting date: {fmt(prediction.planting_date)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
