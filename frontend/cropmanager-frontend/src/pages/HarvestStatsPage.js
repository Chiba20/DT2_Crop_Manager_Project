import React, { useEffect, useMemo, useState } from "react";
import {
  getHarvestStats,
  getYearlySummary,
  getCropYearFilter,
  getTopCropsYearly,
  getSeasonality,
  getDistribution,
} from "../services/api";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "../styles/HarvestStatsPage.css";

// ✅ Color system (NO black bars)
const BAR_PRIMARY = "#2E7D32";
const BAR_LIGHT = "#66BB6A";
const BAR_DARK = "#1B5E20";
const LINE_COLORS = ["#2E7D32", "#66BB6A", "#1B5E20", "#43A047", "#81C784", "#388E3C", "#A5D6A7"];
const PIE_COLORS = ["#2E7D32", "#66BB6A", "#A5D6A7", "#81C784", "#388E3C"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 1 });

function safeDate(d) {
  if (!d) return "N/A";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString();
}

export default function HarvestStatsPage() {
  const [stats, setStats] = useState([]);
  const [overallTotal, setOverallTotal] = useState(0);
  const [topCrop, setTopCrop] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Crop + Year filter
  const [yearOptions, setYearOptions] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [cropYearDetail, setCropYearDetail] = useState(null);

  // Range controls (for range charts)
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [topN, setTopN] = useState(6);

  // Charts data
  const [compare, setCompare] = useState({ top_names: [], series: [] });
  const [yearlyTotals, setYearlyTotals] = useState([]);
  const [seasonality, setSeasonality] = useState([]);
  const [distribution, setDistribution] = useState([]);

  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.userId || user.token;
    } catch {
      return null;
    }
  }, []);

  // ===== Init dashboard =====
  useEffect(() => {
    async function init() {
      try {
        if (!userId) throw new Error("User not found. Please login again.");

        // Main stats (table + summary cards)
        const data = await getHarvestStats(userId);
        const s = data.stats || [];
        setStats(s);
        setOverallTotal(data.overall_total_yield || 0);

        const best =
          s.length > 0
            ? s.reduce((a, b) => (Number(a.total_yield) > Number(b.total_yield) ? a : b))
            : null;
        setTopCrop(best);

        if (s.length) setSelectedCrop(s[0].crop_name);

        // Years list (from yearly summary)
        const yearly = await getYearlySummary(userId);
        const y = (yearly.yearly || []).map((r) => ({
          year: String(r.year),
          total_yield: Number(r.total_yield || 0),
        }));
        setYearlyTotals(y);

        const years = y
          .map((r) => Number(r.year))
          .filter(Boolean)
          .sort((a, b) => a - b);

        setYearOptions(years);

        if (years.length) {
          setSelectedYear(String(years[years.length - 1]));
          setFromYear(String(years[0]));
          setToYear(String(years[years.length - 1]));
        }
      } catch (e) {
        setError(e.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [userId]);

  // ===== Table pagination =====
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = stats.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(stats.length / rowsPerPage);

  // ===== Crop + Year detail =====
  useEffect(() => {
    async function loadCropYear() {
      try {
        if (!userId || !selectedCrop || !selectedYear) return;
        const d = await getCropYearFilter(userId, selectedCrop, selectedYear);
        setCropYearDetail(d);
      } catch (e) {
        setError(e.message || "Failed to load crop-year detail");
      }
    }
    loadCropYear();
  }, [userId, selectedCrop, selectedYear]);

  // ===== Range charts (compare + seasonality + distribution) =====
  useEffect(() => {
    async function loadRangeCharts() {
      try {
        if (!userId || !fromYear || !toYear) return;

        // Compare (top N crops across years)
        const cmp = await getTopCropsYearly(userId, fromYear, toYear, topN);
        setCompare({ top_names: cmp.top_names || [], series: cmp.series || [] });

        // Seasonality (12 months)
        const seas = await getSeasonality(userId, fromYear, toYear);
        const monthMap = new Map(
          (seas.monthly || []).map((m) => [Number(m.month), Number(m.total_yield || 0)])
        );
        setSeasonality(
          MONTHS.map((name, idx) => ({
            month: name,
            total_yield: monthMap.get(idx + 1) || 0,
          }))
        );

        // Distribution (bucket counts)
        const dist = await getDistribution(userId, fromYear, toYear);
        setDistribution(
          (dist.buckets || []).map((b) => ({
            bucket: b.label,
            count: Number(b.count || 0),
          }))
        );
      } catch (e) {
        setError(e.message || "Failed to load range charts");
      }
    }
    loadRangeCharts();
  }, [userId, fromYear, toYear, topN]);

  // ===== Crop-year pie =====
  const cropYearPie = useMemo(() => {
    if (!cropYearDetail) return [];
    return [
      { name: "Planted", value: Number(cropYearDetail.planted_count || 0) },
      { name: "Harvest events", value: Number(cropYearDetail.harvest_events || 0) },
    ];
  }, [cropYearDetail]);

  // ===== Crop-year monthly yield (12 months) =====
  const cropYearMonthly = useMemo(() => {
    if (!cropYearDetail) return [];
    const monthMap = new Map(
      (cropYearDetail.monthly || []).map((m) => [Number(m.month), Number(m.total_yield || 0)])
    );
    return MONTHS.map((m, idx) => ({
      month: m,
      yield: monthMap.get(idx + 1) || 0,
    }));
  }, [cropYearDetail]);

  // ===== Compare totals bar (for top crops in range) =====
  const totalsBar = useMemo(() => {
    const totals = {};
    for (const name of compare.top_names || []) totals[name] = 0;

    for (const row of compare.series || []) {
      for (const name of compare.top_names || []) {
        totals[name] += Number(row[name] || 0);
      }
    }

    return (compare.top_names || []).map((name) => ({
      crop: name,
      total: totals[name] || 0,
    }));
  }, [compare]);

  // ===== Filter yearly totals by range =====
  const yearlyTotalsRange = useMemo(() => {
    if (!fromYear || !toYear) return yearlyTotals;
    const f = Number(fromYear);
    const t = Number(toYear);
    return yearlyTotals.filter((r) => Number(r.year) >= f && Number(r.year) <= t);
  }, [yearlyTotals, fromYear, toYear]);

  const lineKeys = useMemo(() => compare.top_names || [], [compare]);

  return (
    <div className="dashboard">
      <h1 className="title">🌾 Harvest Dashboard</h1>
      <p className="subtitle">Scalable analytics for many crops across months and years</p>

      {loading && <div className="status">Loading...</div>}
      {error && <div className="status error">{error}</div>}

      {!loading && !error && (
        <>
          {/* ✅ Summary cards */}
          <div className="summary-grid">
            <div className="summary-card">
              <h3>Total Harvest</h3>
              <p>{fmt(overallTotal)} kg</p>
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

          {/* ✅ Table (top) + pagination + last cropping date */}
          <div className="card">
            <h2>📋 Harvest Summary</h2>

            <div className="table-wrap">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Total Yield (kg)</th>
                    <th>Harvest Count</th>
                    <th>Last Cropping Date</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row) => (
                    <tr key={row.crop_name}>
                      <td>{row.crop_name}</td>
                      <td>{fmt(row.total_yield)}</td>
                      <td>{row.harvest_count}</td>
                      <td>{safeDate(row.last_cropping_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                  ◀
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                  ▶
                </button>
              </div>
            )}
          </div>

          {/* ✅ 🎯 Crop + Year Filter (right after table) */}
          <div className="card">
            <div className="card-header">
              <h2>🎯 Crop + Year Filter</h2>
              <div className="card-hint">Pick a crop + year to see planting vs harvesting and monthly yield.</div>
            </div>

            <div className="filter-box">
              <div className="filter-row">
                <div className="field">
                  <label>Select Crop</label>
                  <select className="crop-select" value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
                    {stats.map((s) => (
                      <option key={s.crop_name} value={s.crop_name}>
                        {s.crop_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Select Year</label>
                  <select className="crop-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {cropYearDetail && (
                  <div className="mini-cards">
                    <div className="mini-card">
                      <span>Planted</span>
                      <strong>{cropYearDetail.planted_count}</strong>
                    </div>
                    <div className="mini-card">
                      <span>Harvest events</span>
                      <strong>{cropYearDetail.harvest_events}</strong>
                    </div>
                    <div className="mini-card">
                      <span>Total yield</span>
                      <strong>{fmt(cropYearDetail.total_yield)} kg</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="chart-grid">
                <div className="card inner">
                  <h3>Planted vs Harvested</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={cropYearPie} dataKey="value" nameKey="name" outerRadius={110} label>
                        {cropYearPie.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="card inner">
                  <h3>Monthly Yield in {selectedYear}</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={cropYearMonthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {/* ✅ NO BLACK */}
                      <Bar dataKey="yield" fill={BAR_PRIMARY} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Year range controls */}
          <div className="card">
            <div className="card-header">
              <h2>📅 Year Range</h2>
              <div className="card-hint">This range controls the comparison + seasonality + distribution charts.</div>
            </div>

            <div className="range-row">
              <div className="field small">
                <label>From</label>
                <select className="crop-select" value={fromYear} onChange={(e) => setFromYear(e.target.value)}>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field small">
                <label>To</label>
                <select className="crop-select" value={toYear} onChange={(e) => setToYear(e.target.value)}>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field small">
                <label>Compare Top</label>
                <select className="crop-select" value={topN} onChange={(e) => setTopN(Number(e.target.value))}>
                  <option value={4}>Top 4</option>
                  <option value={6}>Top 6</option>
                  <option value={8}>Top 8</option>
                  <option value={10}>Top 10</option>
                </select>
              </div>
            </div>
          </div>

          {/* ✅ 📈 Crop Harvest Comparison Across Years */}
          <div className="card">
            <div className="card-header">
              <h2>📈 Crop Harvest Comparison Across Years</h2>
              <div className="card-hint">We only show Top N crops so the chart stays readable with large datasets.</div>
            </div>

            <div className="chart-grid">
              <div className="card inner">
                <h3>Yield per Crop per Year (Top {topN})</h3>
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={compare.series || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {lineKeys.map((name, i) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={LINE_COLORS[i % LINE_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card inner">
                <h3>Total Yield per Crop (Selected Years)</h3>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={totalsBar}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="crop" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {/* ✅ NO BLACK */}
                    <Bar dataKey="total" fill={BAR_LIGHT} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ✅ Big-data safe charts (no crop labels explosion) */}
          <div className="chart-grid">
            <div className="card">
              <h2>📈 Total Harvest per Year</h2>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={yearlyTotalsRange}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total_yield" stroke={BAR_PRIMARY} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2>🗓️ Seasonality (Total Yield by Month)</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={seasonality}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {/* ✅ NO BLACK */}
                  <Bar dataKey="total_yield" fill={BAR_PRIMARY} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2>📊 Yield Distribution (Harvest Records)</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {/* ✅ NO BLACK */}
                  <Bar dataKey="count" fill={BAR_DARK} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
