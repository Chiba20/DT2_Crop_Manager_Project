import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCrops, updateCrop, deleteCrop } from "../services/api";
import "../styles/Dashboard.css";

export default function DashboardPage() {
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [isCropsAdded, setIsCropsAdded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    area: "",
    planting_date: "",
  });

  const [page, setPage] = useState(1);
  const limit = 5;
  const [total, setTotal] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.token;

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };


  const fetchCrops = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getCrops(userId, page, limit);
      setCrops(data.data || []);
      setTotal(data.total || 0);
      setIsCropsAdded(data.data?.length > 0);
    } catch (err) {
      console.error("Error fetching crops:", err);
      setCrops([]);
      setTotal(0);
      setIsCropsAdded(false);
    }
  }, [userId, page]);

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    fetchCrops();
  }, [userId, page, fetchCrops, navigate]);

  const handleDelete = async (cropId) => {
    if (!window.confirm("Are you sure you want to delete this crop?")) return;
    await deleteCrop(cropId, userId);
    fetchCrops();
  };

  const handleEditClick = (crop) => {
    setEditingId(crop.id);
    setEditForm({
      name: crop.name,
      area: crop.area,
      planting_date: crop.planting_date,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", area: "", planting_date: "" });
  };

  const handleSaveEdit = async (cropId) => {
    const areaNum = parseFloat(editForm.area);

    // Validation
    if (!editForm.name.trim()) return alert("Name cannot be empty");
    if (!isNaN(editForm.name)) return alert("Name must be text");
    if (!areaNum || areaNum <= 0) return alert("Area must be positive");
    if (!editForm.planting_date) return alert("Planting date required");

    await updateCrop(cropId, userId, {
      name: editForm.name.trim(),
      area: areaNum,
      planting_date: editForm.planting_date,
    });

    setEditingId(null);
    fetchCrops();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>



      {/* Action Buttons */}
      <div className="dashboard-actions">
        <button className="add-crop-btn" onClick={() => navigate("/crop")}>
            ➕ Add New Crop
        </button>
        {isCropsAdded && (
          <button
             className="view-harvest-btn"
             onClick={() => navigate("/harvest-stats")}
          >
             📊 View Harvest Stats
          </button>
        )}
      </div>

      {/* Crops Table */}
      <div className="crops-table-container">
        {crops.length === 0 ? (
          <p>No crops added yet.</p>
        ) : (
          <table className="crops-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Area</th>
                <th>Planting Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {Array.isArray(crops) && crops.map((crop) => (
                <tr key={crop.id}>
                  <td>
                    {editingId === crop.id ? (
                      <input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    ) : (
                      crop.name
                    )}
                  </td>

                  <td>
                    {editingId === crop.id ? (
                      <input
                        type="number"
                        value={editForm.area}
                        onChange={(e) =>
                          setEditForm({ ...editForm, area: e.target.value })
                        }
                      />
                    ) : (
                      crop.area
                    )}
                  </td>

                  <td>
                    {editingId === crop.id ? (
                      <input
                        type="date"
                        value={editForm.planting_date}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            planting_date: e.target.value,
                          })
                        }
                      />
                    ) : (
                      crop.planting_date
                    )}
                  </td>

                  <td>
                    {editingId === crop.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(crop.id)}>
                          Save
                        </button>
                        <button onClick={handleCancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/harvest/${crop.id}`)}
                        >
                          Record Harvest
                        </button>
                        <button onClick={() => handleEditClick(crop)}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(crop.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", gap: "10px" }}>
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))} disabled={page >= totalPages}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
