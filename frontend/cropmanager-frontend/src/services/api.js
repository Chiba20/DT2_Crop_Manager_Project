const BACKEND = "http://127.0.0.1:5000";

// Fetch crops data for a specific user
export async function getCrops(userId) {
  const res = await fetch(`${BACKEND}/api/crop/${userId}`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

// Fetch harvest statistics (total yield, average yield)
export async function getHarvestStats() {
  const res = await fetch(`${BACKEND}/api/harvests/stats`, {
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

// Add a new crop
export async function addCrop(payload) {
  const res = await fetch(`${BACKEND}/api/crop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// Record harvest for a crop (validate and submit data)
export async function recordHarvest(cropId, userId, payload) {
  const res = await fetch(`${BACKEND}/api/harvest/${cropId}/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
