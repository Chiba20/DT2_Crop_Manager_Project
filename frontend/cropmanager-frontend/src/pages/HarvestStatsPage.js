import React, { useEffect, useState } from "react";
import { getHarvestStats } from "../services/api";  // API function to fetch stats
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"; // Recharts for the bar chart
import { PieChart, Pie, Cell } from "recharts";  // Recharts for the pie chart

export default function HarvestStatsPage() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getHarvestStats();
        setStats(data);
        setLoading(false);
      } catch (err) {
        setError("Error fetching harvest statistics");
        setLoading(false);
      }
    };
    fetchStats();
  }, []); // Fetch stats when the page loads

  // Prepare data for the Bar Chart (Crop-wise Yield Comparison)
  const chartData = stats.map((stat) => ({
    cropName: stat.crop_name,   // Use crop_name instead of crop_id
    totalYield: stat.total_yield,
    avgYield: stat.avg_yield,
  }));

  // Prepare data for the Pie Chart (Total Yield per Crop Type)
  const pieData = stats.map((stat) => ({
    name: stat.crop_name,  // Use crop_name
    value: stat.total_yield,
  }));

  // Define colors for the Pie Chart slices
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="harvest-stats">
      <h1>Harvest Statistics (Module 2)</h1>

      {loading ? (
        <p>Loading harvest data...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
          {/* Total Harvest Summary (Table Format) */}
          <div className="total-harvest-summary">
            <h3>Total Harvest Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Total Yield (kg)</th>
                  <th>Average Yield (kg)</th>
                  <th>Harvest Count</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, index) => (
                  <tr key={index}>
                    <td>{stat.crop_name}</td>
                    <td>{stat.total_yield}</td>
                    <td>{stat.avg_yield}</td>
                    <td>{stat.harvest_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pie Chart for Total Yield per Crop Type */}
          <div className="chart">
            <h3>Total Yield per Crop Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart for Crop-wise Yield Comparison */}
          <div className="chart">
            <h3>Crop-wise Yield Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cropName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalYield" fill="#8884d8" name="Total Yield" />
                <Bar dataKey="avgYield" fill="#82ca9d" name="Average Yield" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
