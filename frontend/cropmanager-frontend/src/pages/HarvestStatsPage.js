import React, { useEffect, useState } from "react";
import { getHarvestStats } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import "../styles/HarvestStatsPage.css";

export default function HarvestStatsPage() {
  const [stats, setStats] = useState([]);
  const [overallTotal, setOverallTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        // ✅ GET USER FROM LOCAL STORAGE
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user || !user.token) {
          setError("User not logged in");
          setLoading(false);
          return;
        }

        // ✅ PASS USER ID TO API
        const data = await getHarvestStats(user.token);

        setStats(data.stats || []);
        setOverallTotal(data.overall_total_yield || 0);
      } catch (err) {
        setError(err.message || "Failed to load harvest statistics");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🌾 Harvest Dashboard</h1>
        <p>Total yield analysis for your crops</p>
        <h3>✅ Total Harvest: {overallTotal} kg</h3>
      </div>

      {loading && <div className="status">Loading harvest data...</div>}
      {error && <div className="status error">{error}</div>}

      {!loading && !error && (
        <div className="card">
          <h2>📋 Harvest Summary</h2>
          <table className="styled-table">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Total Yield (kg)</th>
                <th>Harvest Count</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No records found
                  </td>
                </tr>
              ) : (
                stats.map(stat => (
                  <tr key={stat.crop_name}>
                    <td>{stat.crop_name}</td>
                    <td>{stat.total_yield}</td>
                    <td>{stat.harvest_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}