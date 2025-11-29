const API_URL = "http://localhost:5000";

export async function getCrops() {
  const res = await fetch(`${API_URL}/crops`);
  return res.json();
}

export async function addCrop(data) {
  const res = await fetch(`${API_URL}/crops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function harvestCrop(id, harvestedAmount) {
  const res = await fetch(`${API_URL}/crops/${id}/harvest`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ harvested_amount: harvestedAmount }),
  });
  return res.json();
}
