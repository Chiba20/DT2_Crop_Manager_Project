import React from "react";
import AddCropForm from "./components/AddCropForm";
import CropList from "./components/CropList";
import AddHarvestForm from "./components/AddHarvestForm";

function App() {
  return (
    <div className="container" style={{ padding: "20px" }}>
      <h1>Crop Tracker Dashboard</h1>

      <AddCropForm />
      <hr />
      <CropList />
      <hr />
      <AddHarvestForm />
    </div>
  );
}

export default App;
