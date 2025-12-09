// src/services/api.js
const BACKEND = "http://127.0.0.1:5000";

export async function getCrops() {
  const res = await fetch(`${BACKEND}/crops`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

export async function addCrop(payload) {
  const res = await fetch(`${BACKEND}/crops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function recordHarvest(cropId, payload) {
  const res = await fetch(`${BACKEND}/crops/${cropId}/harvest`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
