console.log("APP LOADING...");

import { useState, useEffect } from "react";
import AddCropForm from "./components/AddCropForm";
import CropList from "./components/CropList";
import { getCrops } from "./api";

function App() {
  const [crops, setCrops] = useState([]);

  const loadCrops = async () => {
    const data = await getCrops();
    setCrops(data);
  };

  useEffect(() => {
    loadCrops();
  }, []);

  return (
    <div className="container">
      <h1>Crop Management System</h1>

      <AddCropForm refresh={loadCrops} />

      <CropList crops={crops} refresh={loadCrops} />
    </div>
  );
}

export default App;
