import { useEffect, useState } from "react";
import { getCrops } from "../services/api";

export default function CropList() {
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await getCrops();
      setCrops(data);
    }
    load();
  }, []);

  return (
    <div>
      <h3>Crops List</h3>
      {crops.map((c) => (
        <div key={c.id}>
          {c.id}. {c.name} — {c.area} acres — Planted: {c.planting_date}
        </div>
      ))}
    </div>
  );
}
