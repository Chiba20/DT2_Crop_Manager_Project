// src/Dashboard.js
import React, { useEffect, useState } from "react";
import { fetchHarvests, fetchStats } from "./api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import "./Dashboard.css";

const COLORS = ["#60a5fa", "#facc15", "#fb7185", "#34d399", "#8b5cf6"];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const sRes = await fetchStats({ from, to });
      setStats(sRes);
    } catch (e) {
      console.error(e);
      setError("Unable to load data — check backend or Student1 DB.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const barData = (stats?.byCrop || []).map(c => ({
    name: c.cropName,
    total: Math.round(c.sumYield),
    avg: Math.round(c.avgYield)
  }));

  const pieData = (stats?.byCrop || []).map((c, i) => ({
    name: c.cropName,
    value: Math.round(c.sumYield),
    color: COLORS[i % COLORS.length]
  }));

  return (
    <div className="dashboard-root">
      <header className="dash-head">
        <div>
          <h1>🌾 CropManager — Harvest Dashboard</h1>
          <div className="sub">Student 2 • Module 2</div>
        </div>
        <div>
          <button className="btn" onClick={loadAll} disabled={loading}>Refresh</button>
        </div>
      </header>

      <section className="controls">
        <div className="filter-card">
          <label>From <input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label>
          <label>To <input type="date" value={to} onChange={e=>setTo(e.target.value)} /></label>
          <div className="hint">Tip: click Refresh after Student 1 records harvests</div>
        </div>

        <div className="kpis">
          <div className="kpi card-blue">
            <div className="kpi-label">Total Yield</div>
            <div className="kpi-value">{stats ? stats.totalYield.toLocaleString() : "-" } kg</div>
          </div>
          <div className="kpi card-green">
            <div className="kpi-label">Harvests</div>
            <div className="kpi-value">{stats ? stats.totalHarvests : "-"}</div>
          </div>
          <div className="kpi card-purple">
            <div className="kpi-label">Avg / Harvest</div>
            <div className="kpi-value">{stats && stats.totalHarvests ? Math.round(stats.totalYield / stats.totalHarvests) : "-" } kg</div>
          </div>
        </div>
      </section>

      <section className="visuals">
        <div className="chart-card">
          <h3>Yield by Crop</h3>
          <div style={{height:360}}>
            {loading ? <div className="loading">Loading…</div> :
              barData.length === 0 ? <div className="empty">No data yet</div> :
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={v => `${v} kg`} />
                  <Legend />
                  <Bar dataKey="total" fill="#60a5fa" name="Total" radius={[6,6,0,0]} />
                  <Bar dataKey="avg" fill="#34d399" name="Avg" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            }
          </div>
        </div>

        <div className="chart-card">
          <h3>Yield distribution</h3>
          <div style={{height:360, display:"flex", alignItems:"center", justifyContent:"center"}}>
            {loading ? <div className="loading">Loading…</div> :
              pieData.length === 0 ? <div className="empty">No data</div> :
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={120} label>
                    {pieData.map((entry, index) => <Cell key={`c-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => `${v} kg`} />
                </PieChart>
              </ResponsiveContainer>
            }
          </div>
        </div>

        <div className="table-card fullwidth">
          <h3>Crop breakdown</h3>
          {error && <div className="error">{error}</div>}
          <table className="crop-table">
            <thead>
              <tr><th>Crop</th><th>Harvests</th><th>Total (kg)</th><th>Avg (kg)</th></tr>
            </thead>
            <tbody>
              {(stats?.byCrop || []).map(c => (
                <tr key={c.cropId}>
                  <td>{c.cropName}</td>
                  <td>{c.count}</td>
                  <td>{Math.round(c.sumYield).toLocaleString()}</td>
                  <td>{Math.round(c.avgYield).toLocaleString()}</td>
                </tr>
              ))}
              {(!stats?.byCrop || stats.byCrop.length === 0) && (
                <tr><td colSpan="4" style={{textAlign:"center", padding:18}}>No data — ask Student 1 to record harvests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
