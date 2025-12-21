const BACKEND = "http://127.0.0.1:8000";

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

export async function getHarvestStats(userId) {
  const res = await fetch(`${BACKEND}/api/harvests/stats?user_id=${userId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch harvest statistics");
  }
  return res.json();
}

export async function getYearlySummary(userId) {
  const res = await fetch(`${BACKEND}/api/harvests/summary/yearly?user_id=${userId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch yearly summary");
  }
  return res.json();
}

export async function getTopCropsYearly(userId, fromYear, toYear, top = 10) {
  const res = await fetch(
    `${BACKEND}/api/harvests/summary/top-crops-yearly?user_id=${userId}&from=${fromYear}&to=${toYear}&top=${top}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch crops comparison");
  }
  return res.json();
}

export async function getCropYearFilter(userId, cropName, year) {
  const res = await fetch(
    `${BACKEND}/api/harvests/filter/crop-year?user_id=${userId}&crop=${encodeURIComponent(cropName)}&year=${year}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch crop-year detail");
  }
  return res.json();
}

// ✅ NEW: Seasonality (Total Yield by Month in a year range)
export async function getSeasonality(userId, fromYear, toYear) {
  const res = await fetch(
    `${BACKEND}/api/harvests/seasonality?user_id=${userId}&from=${fromYear}&to=${toYear}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch seasonality");
  }
  return res.json();
}

// ✅ NEW: Yield distribution buckets in a year range
export async function getDistribution(userId, fromYear, toYear) {
  const res = await fetch(
    `${BACKEND}/api/harvests/distribution?user_id=${userId}&from=${fromYear}&to=${toYear}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch distribution");
  }
  return res.json();
}
