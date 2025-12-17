import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login");  // login | register | reset
  const [captcha, setCaptcha] = useState("");
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    captchaInput: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (mode === "register") generateCaptcha();
  }, [mode]);

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let text = "";
    for (let i = 0; i < 6; i++) text += chars[Math.floor(Math.random() * chars.length)];
    setCaptcha(text);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.email || (mode !== "reset" && !form.password)) {
      return alert("Please fill all fields!");
    }

    if (mode === "register" && form.captchaInput !== captcha) {
      alert("Incorrect CAPTCHA!");
      generateCaptcha();
      return;
    }

    const endpoint =
      mode === "login" ? "/api/login" :
      mode === "register" ? "/api/register" :
      "/api/reset-password";

    const body = mode === "reset" ? { email: form.email } : form;

    try {
      const res = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) return alert(data.message);

      if (mode === "login") {
        localStorage.setItem("user", JSON.stringify({ token: data.userId }));
        navigate("/dashboard");  // Navigate to dashboard after login
      } else if (mode === "register") {
        alert("Registered successfully! Please login.");
        setMode("login");
        setForm({ email: "", username: "", password: "", captchaInput: "" });
      } else {
        alert("Password reset link sent!");
        setMode("login");
      }
    } catch (error) {
      alert("Server error: " + error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {mode === "login" ? "Login" : mode === "register" ? "Register" : "Reset Password"}
        </h2>
        <p className="auth-subtitle">CropManager System</p>

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="auth-input"
          value={form.email}
          onChange={handleChange}
        />

        {mode === "register" && (
          <input
            name="username"
            type="text"
            placeholder="Username"
            className="auth-input"
            value={form.username}
            onChange={handleChange}
          />
        )}

        {mode !== "reset" && (
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="auth-input"
            value={form.password}
            onChange={handleChange}
          />
        )}

        {mode === "register" && (
          <>
            <div className="captcha-box">
              <span className="captcha-text">{captcha}</span>
              <button type="button" className="captcha-refresh" onClick={generateCaptcha}>↻</button>
            </div>
            <input
              name="captchaInput"
              type="text"
              placeholder="Enter CAPTCHA"
              className="auth-input"
              value={form.captchaInput}
              onChange={handleChange}
            />
          </>
        )}

        {mode === "login" && (
          <p className="forgot-password" onClick={() => setMode("reset")}>
            Forgot Password?
          </p>
        )}

        <button className="auth-button" onClick={handleSubmit}>
          {mode === "login" ? "Login" : mode === "register" ? "Register" : "Reset Password"}
        </button>

        <p className="toggle-text">
          {mode === "login" ? "Don't have an account?" : mode === "register" ? "Already have an account?" : "Remembered your password?"}
          <span className="toggle-link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? " Register" : mode === "register" ? " Login" : " Login"}
          </span>
        </p>
      </div>
    </div>
  );
}
