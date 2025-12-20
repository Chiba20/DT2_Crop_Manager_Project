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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Fetch statistics
  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getHarvestStats(); // GET /harvests/stats
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

  // Reset page when stats change
  useEffect(() => {
    setCurrentPage(1);
  }, [stats]);

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = stats.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(stats.length / rowsPerPage);

  // Chart data
  const chartData = stats.map(stat => ({
    crop: stat.crop_name,
    totalYield: Number(stat.total_yield)
  }));

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
        <>
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
                {currentRows.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center" }}>
                      No records found
                    </td>
                  </tr>
                ) : (
                  currentRows.map(stat => (
                    <tr key={stat.crop_name}>
                      <td>{stat.crop_name}</td>
                      <td>{stat.total_yield}</td>
                      <td>{stat.harvest_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* PAGINATION */}
            {stats.length > rowsPerPage && (
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  ◀ Prev
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next ▶
                </button>
              </div>
            )}
          </div>

          {/* BAR CHART */}
          <div className="card">
            <h2>📊 Total Yield by Crop</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="crop" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="totalYield"
                    fill="#2E7D32"
                    barSize={40}
                    name="Total Yield (kg)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                No chart data available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
