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

// ✅ stats
export async function getHarvestStats(userId) {
  const res = await fetch(`${BACKEND}/api/harvests/stats?user_id=${userId}`, {
    method: "GET",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch harvest statistics");
  }

  return res.json();
}

// ✅ list harvest rows (FIXED route)
export async function getUserHarvests(userId) {
  const res = await fetch(`${BACKEND}/api/harvests?user_id=${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch harvests");
  }

  return res.json();
}

// ✅ NEW: monthly for selected crop
export async function getMonthlyByCrop(userId, cropName, year = "") {
  const y = year ? `&year=${year}` : "";
  const res = await fetch(
    `${BACKEND}/api/harvests/monthly?user_id=${userId}&crop=${encodeURIComponent(cropName)}${y}`,
    { method: "GET" }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch monthly crop data");
  }

  return res.json();
}

// ✅ NEW: trend for all crops per month
export async function getTrend(userId, year = "") {
  const y = year ? `&year=${year}` : "";
  const res = await fetch(
    `${BACKEND}/api/harvests/trend?user_id=${userId}${y}`,
    { method: "GET" }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch trend data");
  }

  return res.json();
}
