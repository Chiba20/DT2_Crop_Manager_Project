const BACKEND = "http://127.0.0.1:5000";

// -----------------------------
// CROPS API
// -----------------------------

export async function getCrops(userId, page = 1, limit = 5) {
  const res = await fetch(`${BACKEND}/api/crop/${userId}?page=${page}&limit=${limit}`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

export async function addCrop(userId, payload) {
  const res = await fetch(`${BACKEND}/api/crop/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateCrop(cropId, userId, payload) {
  const res = await fetch(`${BACKEND}/api/crop/${cropId}/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteCrop(cropId, userId) {
  const res = await fetch(`${BACKEND}/api/crop/${cropId}/${userId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

// -----------------------------
// HARVEST API
// -----------------------------

export async function recordHarvest(cropId, userId, payload) {
  const res = await fetch(`${BACKEND}/api/harvest/${cropId}/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to record harvest");
  }

  return res.json();
}

export async function getHarvestStats() {
  const res = await fetch(`${BACKEND}/api/harvests/stats`, {
    method: "GET",
    credentials: "include" // important if using session
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch harvest statistics");
  }

  return res.json(); // { stats: [...], overall_total_yield: ... }
}

export async function getUserHarvests() {
  const res = await fetch(`${BACKEND}/api/harvests`, {
    method: "GET",
    credentials: "include"
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch harvests");
  }

  return res.json();
}
