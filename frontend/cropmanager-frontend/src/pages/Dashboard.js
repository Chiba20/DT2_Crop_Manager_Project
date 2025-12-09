import React, { useEffect, useState } from "react";
import { getCrops, addCrop, recordHarvest } from "../services/api";

export default function Dashboard() {
  const [crops, setCrops] = useState([]);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [plantingDate, setPlantingDate] = useState("");

  const [harvestCropId, setHarvestCropId] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [yieldAmount, setYieldAmount] = useState("");

  const load = async () => {
    const data = await getCrops();
    let cropList = Array.isArray(data) ? data : data.crops || [];

    // ⛔ FORCE NO NEGATIVE AREAS
    cropList = cropList.map((c) => ({
      ...c,
      area: Math.max(0, Number(c.area)),
    }));

    setCrops(cropList);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !area || !plantingDate)
      return alert("Fill all fields");

    const parsedArea = parseFloat(area);

    if (isNaN(parsedArea) || parsedArea <= 0)
      return alert("Area must be positive");

    const res = await addCrop({
      name,
      area: parsedArea,
      planting_date: plantingDate,
    });

    if (!res.id) return alert("Failed to add crop");

    alert("Crop added!");
    setName("");
    setArea("");
    setPlantingDate("");
    load();
  };

  const handleHarvest = async (e) => {
    e.preventDefault();

    if (!harvestCropId || !harvestDate || !yieldAmount)
      return alert("Fill all fields");

    const parsedYield = parseFloat(yieldAmount);

    // ⛔ NO NEGATIVE OR ZERO YIELD
    if (isNaN(parsedYield) || parsedYield <= 0)
      return alert("Yield must be positive");

    const res = await recordHarvest(harvestCropId, {
      date: harvestDate,
      yieldAmount: parsedYield,
    });

    if (res.error) return alert(res.error);

    alert("Harvest recorded!");
    setHarvestCropId("");
    setHarvestDate("");
    setYieldAmount("");
    load();
  };

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>🌾 CropManager Dashboard</h1>
        <button style={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>

      {/* 3-COLUMN GRID */}
      <div style={styles.grid}>
        {/* ADD CROP CARD */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Add New Crop</h2>
          <form onSubmit={handleAdd} style={styles.form}>
            <input
              placeholder="Crop Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />

            <input
              placeholder="Area (acres)"
              type="number"
              min="0"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              style={styles.input}
            />

            <input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
              style={styles.input}
            />

            <button type="submit" style={styles.greenBtn}>
              Add Crop
            </button>
          </form>
        </div>

        {/* CROP LIST CARD */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Current Crops</h2>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {crops.length === 0 ? (
              <p>No crops added yet.</p>
            ) : (
              <ul style={styles.list}>
                {crops.map((c) => (
                  <li key={c.id} style={styles.listItem}>
                    🌱 <b>{c.name}</b>
                    <br />📏 {c.area} acres
                    <br />📅 {c.planting_date}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* HARVEST CARD */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Record Harvest</h2>
          <form onSubmit={handleHarvest} style={styles.form}>
            <select
              value={harvestCropId}
              onChange={(e) => setHarvestCropId(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Crop</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              style={styles.input}
            />

            <input
              placeholder="Yield Amount"
              type="number"
              min="0"
              value={yieldAmount}
              onChange={(e) => setYieldAmount(e.target.value)}
              style={styles.input}
            />

            <button type="submit" style={styles.greenBtn}>
              Save Harvest
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* STYLES */
const styles = {
  container: {
    padding: "30px",
    background: "#f4fff2",
    minHeight: "100vh",
    fontFamily: "Arial",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  title: {
    color: "#2e7d32",
  },

  logoutBtn: {
    background: "#2e7d32",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: 8,
    fontSize: 15,
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "25px",
  },

  card: {
    background: "white",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.12)",
  },

  cardTitle: {
    color: "#2e7d32",
    marginBottom: 15,
  },

  form: {
    display: "flex",
    flexDirection: "column",
  },

  input: {
    padding: "12px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #bbb",
    fontSize: "15px",
  },

  greenBtn: {
    background: "#2e7d32",
    color: "white",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "6px",
  },

  list: {
    padding: 0,
    listStyle: "none",
  },

  listItem: {
    background: "#e8f5e9",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "10px",
    lineHeight: "1.5",
  },
};
