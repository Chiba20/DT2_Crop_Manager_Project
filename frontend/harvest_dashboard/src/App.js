import React, { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

function App() {
  const API_URL = "http://localhost:5002";

  const [harvests, setHarvests] = useState([]);
  const [stats, setStats] = useState(null);

  const [newCrop, setNewCrop] = useState("");
  const [newYield, setNewYield] = useState("");
  const [newDate, setNewDate] = useState("");

  // Fetch harvests and stats
  const loadData = () => {
    fetch(`${API_URL}/harvests`)
      .then((res) => res.json())
      .then((data) => setHarvests(data));

    fetch(`${API_URL}/harvests/stats`)
      .then((res) => res.json())
      .then((data) => setStats(data));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add new harvest
  const addHarvest = () => {
    if (!newCrop || !newYield || !newDate) {
      alert("Please fill all fields");
      return;
    }

    fetch(`${API_URL}/harvests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crop: newCrop,
        yield: parseFloat(newYield),
        date: newDate,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        loadData();
        setNewCrop("");
        setNewYield("");
        setNewDate("");
      });
  };

  // Bar Chart Data
  const barData =
    stats &&
    {
      labels: Object.keys(stats.crop_yield),
      datasets: [
        {
          label: "Yield per Crop (kg)",
          data: Object.values(stats.crop_yield),
          backgroundColor: [
            "#4caf50",
            "#2196f3",
            "#ff9800",
            "#9c27b0",
            "#f44336",
          ],
        },
      ],
    };

  // Pie Chart Data
  const pieData =
    stats &&
    {
      labels: Object.keys(stats.crop_yield),
      datasets: [
        {
          label: "Yield Distribution (%)",
          data: Object.values(stats.crop_yield),
          backgroundColor: [
            "#ff6384",
            "#36a2eb",
            "#ffcd56",
            "#4bc0c0",
            "#9966ff",
          ],
        },
      ],
    };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1 style={{ color: "green" }}>🌾 Crop Harvest Dashboard</h1>

      {/* Summary Cards */}
      {stats && (
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "20px",
            marginBottom: "30px",
          }}
        >
          <div style={cardStyle}>
            <h3>Total Yield</h3>
            <p>{stats.total_yield} kg</p>
          </div>

          <div style={cardStyle}>
            <h3>Total Records</h3>
            <p>{stats.count}</p>
          </div>

          <div style={cardStyle}>
            <h3>Top Crop</h3>
            <p>{stats.top_crop}</p>
          </div>
        </div>
      )}

      {/* Add Harvest */}
      <div style={formBox}>
        <h3>Add Harvest Entry</h3>

        <input
          placeholder="Crop"
          value={newCrop}
          onChange={(e) => setNewCrop(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Yield (kg)"
          type="number"
          value={newYield}
          onChange={(e) => setNewYield(e.target.value)}
          style={inputStyle}
        />

        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          style={inputStyle}
        />

        <button style={buttonStyle} onClick={addHarvest}>
          Add Harvest
        </button>
      </div>

      {/* Table */}
      <h2>📋 Harvest Records</h2>
      <table width="100%" border="1" cellPadding="10" style={{ marginTop: "10px" }}>
        <thead style={{ background: "#e0e0e0" }}>
          <tr>
            <th>ID</th>
            <th>Crop</th>
            <th>Yield (kg)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {harvests.map((h) => (
            <tr key={h.id}>
              <td>{h.id}</td>
              <td>{h.crop}</td>
              <td>{h.yield}</td>
              <td>{h.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Charts */}
      <h2 style={{ marginTop: "40px" }}>📊 Visual Insights</h2>

      <div style={{ display: "flex", gap: "30px", marginTop: "20px" }}>
        <div style={{ width: "50%" }}>
          <h3>Yield Per Crop (Bar Chart)</h3>
          {stats && <Bar data={barData} />}
        </div>

        <div style={{ width: "40%" }}>
          <h3>Yield Distribution (Pie Chart)</h3>
          {stats && <Pie data={pieData} />}
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  flex: 1,
  background: "#f4f4f4",
  padding: "20px",
  borderRadius: "10px",
  textAlign: "center",
  fontSize: "20px",
  fontWeight: "bold",
};

const formBox = {
  marginTop: "30px",
  background: "#f5f5f5",
  padding: "20px",
  width: "350px",
  borderRadius: "10px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "5px",
  border: "1px solid gray",
};

const buttonStyle = {
  width: "100%",
  padding: "10px",
  background: "green",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default App;
