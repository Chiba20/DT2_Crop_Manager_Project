import AddCropForm from "../components/AddCropForm";
import CropList from "../components/CropList";
import AddHarvestForm from "../components/AddHarvestForm";

export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Crop Manager Dashboard</h1>

      <AddCropForm />
      <hr />

      <CropList />
      <hr />

      <AddHarvestForm />
    </div>
  );
}
