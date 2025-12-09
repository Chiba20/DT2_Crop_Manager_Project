import { useNavigate } from "react-router-dom";

export default function LanguageSelect() {
  const navigate = useNavigate();

  const choose = (lang) => {
    localStorage.setItem("lang", lang);
    navigate("/login");
  };

  return (
    <div className="container">
      <h2>Choose Language</h2>

      <button onClick={() => choose("en")}>English</button>
      <button onClick={() => choose("sw")}>Kiswahili</button>
    </div>
  );
}
