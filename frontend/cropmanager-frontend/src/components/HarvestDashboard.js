import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HarvestDashboard = () => {
  const [harvests, setHarvests] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch harvest data and stats from the backend
    const fetchHarvestData = async () => {
      try {
        const harvestsResponse = await axios.get('/api/harvests');
        setHarvests(harvestsResponse.data);

        const statsResponse = await axios.get('/api/harvests/stats');
        setStats(statsResponse.data);
      } catch (err) {
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchHarvestData();
  }, []);

  // Transform stats into data suitable for the bar chart
  const chartData = stats.map(stat => ({
    cropId: stat.crop_id,
    totalYield: stat.total_yield,
    avgYield: stat.avg_yield,
  }));

  return (
    <div>
      <h1>Harvest Dashboard</h1>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
          <h2>Total Harvest Summary</h2>
          <p>Total number of harvests: {harvests.length}</p>

          <h3>Crop Yield Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cropId" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalYield" fill="#8884d8" name="Total Yield" />
              <Bar dataKey="avgYield" fill="#82ca9d" name="Average Yield" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
};

export default HarvestDashboard;
