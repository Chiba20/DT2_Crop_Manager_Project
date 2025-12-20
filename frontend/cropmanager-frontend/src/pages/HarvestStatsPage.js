import React, { useEffect, useMemo, useState } from "react";
import { getHarvestStats, getMonthlyByCrop, getTrend } from "../services/api";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import "../styles/HarvestStatsPage.css";

const COLORS = ["#2E7D32", "#66BB6A", "#A5D6A7", "#81C784", "#388E3C"];
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function HarvestStatsPage() {
  const [stats, setStats] = useState([]);
  const [overallTotal, setOverallTotal] = useState(0);

  const [selectedCrop, setSelectedCrop] = useState("");
  const [monthlyCropData, setMonthlyCropData] = useState([]);
  const [trendRaw, setTrendRaw] = useState([]);

  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.userId || user.token;
    } catch {
      return null;
    }
  }, []);

  // ---------------------------
  // Fetch stats first
  // ---------------------------
  useEffect(() => {
    async function fetchStats() {
      try {
        if (!userId) throw new Error("User not found. Please login again.");

        const data = await getHarvestStats(userId);
        setStats(data.stats || []);
        setOverallTotal(Number(data.overall_total_yield || 0));

        if (data.stats?.length > 0) {
          setSelectedCrop(data.stats[0].crop_name);
        }
      } catch (err) {
        setError(err.message || "Failed to load harvest statistics");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [userId]);

  // ---------------------------
  // Fetch monthly + trend from DB
  // ---------------------------
  useEffect(() => {
    async function fetchCharts() {
      try {
        if (!userId || !selectedCrop) return;

        setChartsLoading(true);

        const monthlyRes = await getMonthlyByCrop(userId, selectedCrop);
        const monthly = Array.isArray(monthlyRes.monthly) ? monthlyRes.monthly : [];

        // convert month number -> name for recharts
        setMonthlyCropData(
          monthly.map(r => ({
            month: monthNames[(Number(r.month) || 1) - 1],
            yield: Number(r.total_yield || 0)
          }))
        );

        const trendRes = await getTrend(userId);
        setTrendRaw(Array.isArray(trendRes.trend) ? trendRes.trend : []);
      } catch (err) {
        setError(err.message || "Failed to load charts data");
      } finally {
        setChartsLoading(false);
      }
    }

    fetchCharts();
  }, [userId, selectedCrop]);

  // ---------------------------
  // Pagination (table)
  // ---------------------------
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = stats.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(stats.length / rowsPerPage);

  // ---------------------------
  // Basic chart data
  // ---------------------------
  const barData = stats.map(s => ({
    crop: s.crop_name,
    yield: Number(s.total_yield || 0)
  }));

  const pieData = stats.map(s => ({
    name: s.crop_name,
    value: Number(s.total_yield || 0)
  }));

  const topCrop =
    stats.length > 0
      ? stats.reduce((a, b) => (Number(a.total_yield) > Number(b.total_yield) ? a : b))
      : null;

  // ---------------------------
  // Trend reshape for LineChart
  // trendRaw: [{month:1,crop_name:"Maize",total_yield:100}, ...]
  // output: [{month:"Jan", Maize:100, Rice:50}, ...]
  // ---------------------------
  const { trendChartData, cropKeys } = useMemo(() => {
    const cropsSet = new Set();
    const mapByMonth = new Map(); // monthNum -> row object

    for (const r of trendRaw) {
      const m = Number(r.month);
      const crop = String(r.crop_name || "").trim();
      const y = Number(r.total_yield || 0);

      if (!m || !crop) continue;

      cropsSet.add(crop);

      if (!mapByMonth.has(m)) {
        mapByMonth.set(m, { month: monthNames[m - 1] });
      }
      mapByMonth.get(m)[crop] = y;
    }

    const data = Array.from(mapByMonth.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, row]) => row);

    return { trendChartData: data, cropKeys: Array.from(cropsSet) };
  }, [trendRaw]);

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
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>◀</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>▶</button>
              </div>
            )}
          </div>

          {/* TOP CHARTS */}
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
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MONTHLY PER CROP */}
          <div className="card">
            <h2>📆 Monthly Yield — Selected Crop</h2>

            <select
              className="crop-select"
              value={selectedCrop}
              onChange={e => setSelectedCrop(e.target.value)}
            >
              {stats.map(s => (
                <option key={s.crop_name} value={s.crop_name}>
                  {s.crop_name}
                </option>
              ))}
            </select>

            {chartsLoading ? (
              <div className="status">Loading chart...</div>
            ) : monthlyCropData.length === 0 ? (
              <div className="status">No monthly data for this crop yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyCropData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="yield" fill="#388E3C" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* TREND FOR ALL CROPS */}
          <div className="card">
            <h2>📈 Monthly Trend — All Crops</h2>

            {chartsLoading ? (
              <div className="status">Loading chart...</div>
            ) : trendChartData.length === 0 ? (
              <div className="status">No trend data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {cropKeys.map((crop, idx) => (
                    <Line
                      key={crop}
                      type="monotone"
                      dataKey={crop}
                      stroke={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
