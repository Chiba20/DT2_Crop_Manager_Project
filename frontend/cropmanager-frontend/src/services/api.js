const BACKEND = "http://127.0.0.1:5000";

// Fetch crops data for a specific user (with pagination)
export async function getCrops(userId, page = 1, limit = 5) {
  const res = await fetch(`${BACKEND}/api/crop/${userId}?page=${page}&limit=${limit}`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

// Add a new crop
export async function addCrop(userId, payload) {
  const res = await fetch(`${BACKEND}/api/crop/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Update a crop
export async function updateCrop(cropId, userId, payload) {
  const res = await fetch(`${BACKEND}/api/crop/${cropId}/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Delete a crop
export async function deleteCrop(cropId, userId) {
  const res = await fetch(`${BACKEND}/api/crop/${cropId}/${userId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

// Record harvest
export async function recordHarvest(cropId, userId, payload) {
  const res = await fetch(`${BACKEND}/api/harvest/${cropId}/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), // {date, yield_amount}
  });
  return res.json();
}

// Get harvest stats (optional)
export async function getHarvestStats() {
  const res = await fetch(`${BACKEND}/api/harvests/stats`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
