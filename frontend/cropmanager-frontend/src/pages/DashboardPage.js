import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

export default function DashboardPage() {
    const navigate = useNavigate();
    const [crops, setCrops] = useState([]);

    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.token;

    useEffect(() => {
        if (!userId) {
            navigate("/");
            return;
        }
        fetchCrops();
    }, []);

    const fetchCrops = async () => {
        const response = await fetch(`http://127.0.0.1:5000/api/crop/${userId}`);
        const data = await response.json();
        setCrops(data);
    };

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <button className="add-crop-btn" onClick={() => navigate("/crop")}>
                ➕ Add New Crop
            </button>

            <div className="crops-grid">
                {crops.map((crop) => (
                    <div className="crop-card" key={crop.id}>
                        <h3>{crop.name}</h3>
                        <p>Area: {crop.area} acres</p>
                        <p>Planted: {crop.planting_date}</p>
                        <button onClick={() => navigate(`/harvest/${crop.id}`)}>
                            Record Harvest
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
