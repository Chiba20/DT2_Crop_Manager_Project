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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import "../styles/HarvestStatsPage.css";

const COLORS = ["#2E7D32", "#66BB6A", "#A5D6A7", "#81C784", "#388E3C"];

export default function HarvestStatsPage() {
  const [stats, setStats] = useState([]);
  const [overallTotal, setOverallTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    async function fetchStats() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const data = await getHarvestStats(user.userId || user.token);

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

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = stats.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(stats.length / rowsPerPage);

  const barData = stats.map(s => ({
    crop: s.crop_name,
    yield: Number(s.total_yield)
  }));

  const pieData = stats.map(s => ({
    name: s.crop_name,
    value: Number(s.total_yield)
  }));

  const topCrop =
    stats.length > 0
      ? stats.reduce((a, b) => (a.total_yield > b.total_yield ? a : b))
      : null;

  return (
    <div className="dashboard">
      <h1 className="title">🌾 Harvest Dashboard</h1>
      <p className="subtitle">Crop-wise yield analysis</p>

      {loading && <div className="status">Loading...</div>}
      {error && <div className="status error">{error}</div>}

      {!loading && !error && (
        <>
          {/* SUMMARY CARDS */}
          <div className="summary-grid">
            <div className="summary-card">
              <h3>Total Harvest</h3>
              <p>{overallTotal} kg</p>
            </div>
            <div className="summary-card">
              <h3>Total Crops</h3>
              <p>{stats.length}</p>
            </div>
            <div className="summary-card">
              <h3>Top Crop</h3>
              <p>{topCrop ? topCrop.crop_name : "N/A"}</p>
            </div>
          </div>

          {/* TABLE */}
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
                {currentRows.map(row => (
                  <tr key={row.crop_name}>
                    <td>{row.crop_name}</td>
                    <td>{row.total_yield}</td>
                    <td>{row.harvest_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  ◀
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  ▶
                </button>
              </div>
            )}
          </div>

          {/* CHARTS */}
          <div className="chart-grid">
            <div className="card">
              <h2>📊 Yield by Crop</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="crop" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="yield" fill="#2E7D32" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2>🥧 Contribution Share</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
