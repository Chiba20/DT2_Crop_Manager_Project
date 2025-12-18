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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getHarvestStats();
        setStats(data);
      } catch (err) {
        setError("Failed to load harvest statistics");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  /* Bar chart data (all crops) */
  const chartData = stats.map(stat => ({
    crop: stat.crop_name,
    totalYield: stat.total_yield
  }));

  /* Pagination logic */
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = stats.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(stats.length / rowsPerPage);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🌾 Harvest Dashboard</h1>
        <p>Total yield analysis for all crops</p>
      </div>

      {loading && <div className="status">Loading harvest data...</div>}
      {error && <div className="status error">{error}</div>}

      {!loading && !error && (
        <>
          {/* TABLE AT TOP */}
          <div className="card">
            <h2>📋 Harvest Records</h2>

            <table className="styled-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Total Yield (kg)</th>
                  <th>Harvest Count</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((stat, index) => (
                  <tr key={index}>
                    <td>{stat.crop_name}</td>
                    <td>{stat.total_yield}</td>
                    <td>{stat.harvest_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PAGINATION */}
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                ◀ Prev
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next ▶
              </button>
            </div>
          </div>

          {/* BAR CHART AT BOTTOM */}
          <div className="card">
            <h2>📊 Total Yield by Crop</h2>

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
          </div>
        </>
      )}
    </div>
  );
}
