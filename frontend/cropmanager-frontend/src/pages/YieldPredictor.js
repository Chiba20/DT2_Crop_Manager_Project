import React, { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:5000/api";

export default function YieldPredictor({ cropId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/predict/${cropId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Prediction failed");
        return res.json();
      })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        setError("Prediction unavailable");
        setLoading(false);
      });
  }, [cropId]);

  if (loading) return <p className="prediction loading">Predicting yield…</p>;
  if (error) return <p className="prediction error">{error}</p>;

  return (
    <div className="prediction-box">
      <p><b>Predicted Yield:</b> {data.predicted_yield}</p>
      <p><b>Category:</b> {data.category}</p>
      <p className="prediction-tip">{data.tip}</p>
    </div>
  );
}
