// src/services/api.js

const API_BASE = "http://127.0.0.1:5000";

export async function addCrop(data) {
  const res = await fetch(`${API_BASE}/crops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getCrops() {
  const res = await fetch(`${API_BASE}/crops`);
  return res.json();
}

export async function addHarvest(cropId, data) {
  const res = await fetch(`${API_BASE}/crops/${cropId}/harvest`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
