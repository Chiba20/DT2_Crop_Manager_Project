import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE from "../services/config";
import "../styles/Auth.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // login | register | reset
  const [captcha, setCaptcha] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    for (let i = 0; i < 6; i++)
      text += chars[Math.floor(Math.random() * chars.length)];
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
      mode === "login"
        ? "/api/login"
        : mode === "register"
        ? "/api/register"
        : "/api/reset-password";

    const body = mode === "reset" ? { email: form.email } : form;

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) return alert(data.message);

      if (mode === "login") {
        localStorage.setItem(
          "user",
          JSON.stringify({ token: data.userId })
        );
        navigate("/dashboard");
      } else if (mode === "register") {
        alert("Registered successfully! Please login.");
        setMode("login");
        setForm({
          email: "",
          username: "",
          password: "",
          captchaInput: "",
        });
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
      <div className="authWrap">
        <div className="authCard">
          {/* Brand */}
          <div className="authBrand">
            <span className="plantIcon">🌱</span>
            <span className="brandText">CropManager</span>
          </div>

          {/* Title */}
          <h2 className="auth-title">
            {mode === "login"
              ? "Login"
              : mode === "register"
              ? "Create Account"
              : "Reset Password"}
          </h2>

          {/* Email */}
          <div className="inputGroup">
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="auth-input"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          {/* Username */}
          {mode === "register" && (
            <div className="inputGroup">
              <input
                name="username"
                placeholder="Username"
                className="auth-input"
                value={form.username}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Password */}
          {mode !== "reset" && (
            <div className="inputGroup">
              <input
                name="password"
                type={showPw ? "text" : "password"}
                placeholder="Password"
                className="auth-input"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="eyeBtn"
                onClick={() => setShowPw((s) => !s)}
              >
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
          )}

          {/* Forgot Password */}
          {mode === "login" && (
            <div
              className="forgot-password"
              onClick={() => setMode("reset")}
            >
              Forgot Password?
            </div>
          )}

          {/* CAPTCHA */}
          {mode === "register" && (
            <>
              <div className="captcha-box">
                <span className="captcha-text">{captcha}</span>
                <button onClick={generateCaptcha}>↻</button>
              </div>
              <div className="inputGroup">
                <input
                  name="captchaInput"
                  placeholder="Enter CAPTCHA"
                  className="auth-input"
                  value={form.captchaInput}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* Submit */}
          <button className="auth-button" onClick={handleSubmit}>
            {mode === "login"
              ? "Login"
              : mode === "register"
              ? "Register"
              : "Reset Password"}
          </button>

          {/* Mode toggle */}
          <div className="toggle-text">
            {mode === "login"
              ? "Don't have an account?"
              : mode === "register"
              ? "Already have an account?"
              : "Remembered your password?"}
            <span
              className="toggle-link"
              onClick={() =>
                setMode(mode === "login" ? "register" : "login")
              }
            >
              {mode === "login" ? " Register" : " Login"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
