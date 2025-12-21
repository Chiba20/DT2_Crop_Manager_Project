import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCrops, updateCrop, deleteCrop } from "../services/api";
import "../styles/Dashboard.css";

export default function DashboardPage() {
  const navigate = useNavigate();

  // ✅ Safe user load (prevents crash if localStorage empty/broken)
  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      // your old code used token; keep both to avoid breaking
      return user?.userId || user?.token || null;
    } catch {
      return null;
    }
  }, []);

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

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ Logout
  // Logout is handled in TopNav; keep Dashboard focused on crops/actions.

  // ✅ Fetch crops
  const fetchCrops = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const data = await getCrops(userId, page, limit);

      const rows = Array.isArray(data?.data) ? data.data : [];
      setCrops(rows);
      setTotal(Number(data?.total) || 0);
      setIsCropsAdded(rows.length > 0);
    } catch (err) {
      console.error("Error fetching crops:", err);
      setCrops([]);
      setTotal(0);
      setIsCropsAdded(false);
      setErrorMsg("Failed to load crops. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userId, page, limit]);

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    fetchCrops();
  }, [userId, page, fetchCrops, navigate]);

  // Cleanup any accidentally rendered large "Prediction" banner inside the dashboard.
  // Some pages may render a banner element that we want hidden here; remove it safely.
  useEffect(() => {
    const root = document.querySelector('.dashboard-page');
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll('*'));
    nodes.forEach((el) => {
      try {
        const text = (el.textContent || '').trim();
        if (!text.includes('Prediction')) return;
        const style = window.getComputedStyle(el);
        // target visible banner-like elements with a non-transparent background
        if (style && style.backgroundColor && !/rgba?\(0,\s*0,\s*0,\s*0\)/.test(style.backgroundColor)) {
          // avoid removing small inline labels by checking size
          if (el.offsetWidth > 200 && el.offsetHeight > 30) {
            el.remove();
          }
        }
      } catch (e) {
        // ignore
      }
    });
  }, []);


  // ✅ Delete crop (with try/catch)
  const handleDelete = async (cropId) => {
    if (!window.confirm("Are you sure you want to delete this crop?")) return;

    try {
      await deleteCrop(cropId, userId);
      fetchCrops();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete crop. Please try again.");
    }
  };

  // ✅ Start edit
  const handleEditClick = (crop) => {
    setEditingId(crop.id);
    setEditForm({
      name: crop?.name ?? "",
      area: crop?.area ?? "",
      planting_date: crop?.planting_date ?? "",
    });
  };

  // ✅ Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", area: "", planting_date: "" });
  };

  // ✅ Validation helpers
  const isValidName = (name) => {
    const n = String(name || "").trim();
    if (!n) return { ok: false, msg: "Name cannot be empty." };
    if (!isNaN(Number(n))) return { ok: false, msg: "Name must be text (not a number)." };
    if (n.length < 2) return { ok: false, msg: "Name must be at least 2 characters." };
    return { ok: true };
  };

  const isValidArea = (area) => {
    const a = Number(area);
    if (!Number.isFinite(a)) return { ok: false, msg: "Area must be a number." };
    if (a <= 0) return { ok: false, msg: "Area must be a positive number." };
    return { ok: true };
  };

  const isValidDate = (dateStr) => {
    if (!dateStr) return { ok: false, msg: "Planting date is required." };
    // expects YYYY-MM-DD
    const parts = String(dateStr).split("-");
    if (parts.length !== 3) return { ok: false, msg: "Date must be YYYY-MM-DD." };
    const [y, m, d] = parts.map(Number);
    if (!y || !m || !d) return { ok: false, msg: "Invalid planting date." };
    return { ok: true };
  };

  // ✅ Save edit (with full validation + try/catch)
  const handleSaveEdit = async (cropId) => {
    const nameCheck = isValidName(editForm.name);
    if (!nameCheck.ok) return alert(nameCheck.msg);

    const areaCheck = isValidArea(editForm.area);
    if (!areaCheck.ok) return alert(areaCheck.msg);

    const dateCheck = isValidDate(editForm.planting_date);
    if (!dateCheck.ok) return alert(dateCheck.msg);

    try {
      await updateCrop(cropId, userId, {
        name: String(editForm.name).trim(),
        area: Number(editForm.area),
        planting_date: editForm.planting_date,
      });

      setEditingId(null);
      setEditForm({ name: "", area: "", planting_date: "" });
      fetchCrops();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update crop. Please try again.");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>

      {/* Actions */}
      <div className="dashboard-actions">
        <button className="add-crop-btn" onClick={() => navigate("/crop")}>
          ➕ Add New Crop
        </button>

        {/* only show these if there is at least one crop */}
        {isCropsAdded && (
          <>
            <button
              className="view-harvest-btn"
              onClick={() => navigate("/harvest-stats")}
            >
              📊 View Harvest Stats
            </button>

            <button className="predict-btn" onClick={() => navigate("/prediction")}>
              🧠 Prediction
            </button>
          </>
        )}
        {/* Inline prediction summary box placed at same level as action buttons */}
        {/* Inline prediction removed — use Prediction page via top nav */}
      </div>

      {/* Table */}
      <div className="crops-table-container">
        {loading && <p>Loading crops...</p>}
        {errorMsg && <p className="error">{errorMsg}</p>}

        {!loading && crops.length === 0 ? (
          <p>No crops added yet.</p>
        ) : (
          <table className="crops-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Area (acres)</th>
                <th>Planting Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {Array.isArray(crops) &&
                crops.map((crop) => (
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
                          min="0"
                          step="0.01"
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

                    <td style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {editingId === crop.id ? (
                        <>
                          <button onClick={() => handleSaveEdit(crop.id)}>
                            Save
                          </button>
                          <button onClick={handleCancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => navigate(`/harvest/${crop.id}`)}>
                            Record Harvest
                          </button>
                          <button onClick={() => handleEditClick(crop)}>Edit</button>
                          <button onClick={() => handleDelete(crop.id)}>Delete</button>
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
          <div className="pagination">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              Prev
            </button>

            <span>
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
