// src/api.js
const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001/api";

export async function fetchHarvests({ from, to, cropId } = {}) {
  const qp = new URLSearchParams();
  if (from) qp.set("from", from);
  if (to) qp.set("to", to);
  if (cropId) qp.set("cropId", cropId);
  const url = `${API}/harvests${qp.toString() ? "?" + qp.toString() : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchHarvests failed ${res.status}`);
  return res.json(); // { harvests: [...] }
}

export async function fetchStats({ from, to } = {}) {
  const qp = new URLSearchParams();
  if (from) qp.set("from", from);
  if (to) qp.set("to", to);
  const url = `${API}/harvests/stats${qp.toString() ? "?" + qp.toString() : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchStats failed ${res.status}`);
  return res.json(); // { totalYield, totalHarvests, byCrop }
}
