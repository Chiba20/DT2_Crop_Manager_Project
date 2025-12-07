import React, { useEffect, useState } from "react";

export default function AuthPage() {
  const backend = "http://127.0.0.1:5000";

  const [mode, setMode] = useState("login");
  const [theme, setTheme] = useState("D");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [captcha, setCaptcha] = useState("");
  const [inputCaptcha, setInputCaptcha] = useState("");

  const generateCaptcha = () => {
    const text = Math.random().toString(36).substring(2, 7).toUpperCase();
    setCaptcha(text);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const login = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${backend}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) return alert(data.message || "Login failed");
      localStorage.setItem("user", JSON.stringify({ token: data.token }));
      window.location.href = "/quizzes";
    } catch (err) {
      alert("Backend not reachable");
    }
  };

  const register = async (e) => {
    e.preventDefault();
    if (inputCaptcha !== captcha) {
      alert("Verification text does not match!");
      generateCaptcha();
      return;
    }
    try {
      const res = await fetch(`${backend}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPassword }),
      });
      const data = await res.json();
      if (!data.success) return alert(data.message || "Register failed");
      alert("Account created successfully!");
      setMode("login");
      generateCaptcha();
    } catch {
      alert("Backend not reachable");
    }
  };

  // ------------------- STYLES (unchanged) --------------------
  const base = {
    container: {
      height: "100vh",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      paddingTop: 36,
      fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
      boxSizing: "border-box",
    },
    topBar: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 20px",
      zIndex: 50,
      boxSizing: "border-box",
    },
    card: {
      width: 420,
      maxWidth: "92%",
      padding: 34,
      borderRadius: 16,
      boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
      textAlign: "center",
      marginTop: 24,
      boxSizing: "border-box",
    },
    title: {
      fontSize: 26,
      fontWeight: 700,
      marginBottom: 6,
    },
    switchText: { fontSize: 14, color: "#444", marginBottom: 6 },
    link: { cursor: "pointer", fontWeight: 700 },
    form: { marginTop: 14 },
    input: {
      width: "100%",
      padding: "12px 14px",
      margin: "10px 0",
      borderRadius: 10,
      border: "1px solid #d0d0d0",
      background: "#f8f8f8",
      fontSize: 15,
      outline: "none",
      transition: "0.18s",
      boxSizing: "border-box",
    },
    captchaBox: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 10px",
      borderRadius: 10,
      border: "1px solid #bfe7bf",
      maxWidth: 200,
      margin: "10px auto 6px auto",
    },
    captchaText: {
      fontSize: 20,
      fontWeight: 800,
      letterSpacing: 4,
    },
    refreshBtn: {
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: 18,
      padding: "4px 6px",
    },
    button: {
      width: "100%",
      padding: "12px 14px",
      marginTop: 12,
      borderRadius: 10,
      border: "none",
      fontSize: 16,
      fontWeight: 700,
      cursor: "pointer",
    },
    footerText: { marginTop: 12, fontSize: 12, color: "#777" },
  };

  // Theme D only
  const t = {
    containerBg: "linear-gradient(135deg,#fffaf0 0%, #f0fff7 50%, #f9fff5 100%)",
    topBar: { background: "transparent", color: "#184d2b" },
    card: { ...base.card, background: "white" },
    title: { ...base.title, color: "#1a6e36" },
    link: { ...base.link, color: "#1a6e36" },
    input: { ...base.input, background: "#fff", border: "1px solid #f0eae7" },
    inputFocus: { boxShadow: "0 6px 18px rgba(30,120,60,0.06)", borderColor: "#a9e8b0" },
    captchaBox: { ...base.captchaBox, background: "#f0fff2" },
    captchaText: { ...base.captchaText, color: "#3f8a4c" },
    buttonLogin: { ...base.button, background: "#6fcf97", color: "#fff", borderRadius: 999 },
    buttonRegister: { ...base.button, background: "#2f9f65", color: "#fff", borderRadius: 999 },
    footerText: base.footerText,
  };

  const styles = {
    container: { ...base.container, background: t.containerBg },
    topBar: { ...base.topBar, ...t.topBar },
    card: t.card,
    title: t.title,
    switchText: base.switchText,
    link: t.link,
    form: base.form,
    input: t.input,
    inputFocus: t.inputFocus,
    captchaBox: t.captchaBox,
    captchaText: t.captchaText,
    refreshBtn: base.refreshBtn,
    buttonLogin: t.buttonLogin,
    buttonRegister: t.buttonRegister,
    footerText: t.footerText,
  };

  const [focusedInput, setFocusedInput] = useState(null);
  const applyInputStyle = (name) =>
    focusedInput === name ? { ...styles.input, ...styles.inputFocus } : styles.input;

  return (
    <div style={styles.container}>
      {/* ---------------- TOP BAR (theme removed) ---------------- */}
      <div style={styles.topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>🌱</div>
          <div style={{ color: t.topBar.color, fontWeight: 700 }}>Crop Manager</div>
        </div>

        <div style={{ fontSize: 13, color: t.topBar.color }}>v1.0</div>
      </div>

      {/* ---------------- CARD ---------------- */}
      <div style={styles.card}>
        <h2 style={styles.title}>🌱 Crop Manager</h2>

        {mode === "login" ? (
          <p style={styles.switchText}>
            Don’t have an account?{" "}
            <span style={styles.link} onClick={() => { setMode("register"); generateCaptcha(); }}>
              Register
            </span>
          </p>
        ) : (
          <p style={styles.switchText}>
            Already registered?{" "}
            <span style={styles.link} onClick={() => setMode("login")}>
              Login
            </span>
          </p>
        )}

        {/* ---------------- LOGIN FORM ---------------- */}
        {mode === "login" ? (
          <form onSubmit={login} style={styles.form}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
              style={applyInputStyle("email")}
              type="email"
              placeholder="📧 Email Address"
              required
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
              style={applyInputStyle("password")}
              type="password"
              placeholder="🔒 Password"
              required
            />

            <button type="submit" style={styles.buttonLogin}>Login</button>

            {/* ---------- ADDED: FORGOT PASSWORD ---------- */}
            <div style={{ marginTop: 10 }}>
              <span
                style={{ ...styles.link, fontSize: 14 }}
                onClick={() => alert("Forgot password clicked (add route)")}
              >
                Forgot Password?
              </span>
            </div>
          </form>
        ) : (
          /* ---------------- REGISTER FORM ---------------- */
          <form onSubmit={register} style={styles.form}>
            <input
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              onFocus={() => setFocusedInput("regEmail")}
              onBlur={() => setFocusedInput(null)}
              style={applyInputStyle("regEmail")}
              type="email"
              placeholder="📧 Email Address"
              required
            />

            <input
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              onFocus={() => setFocusedInput("regPassword")}
              onBlur={() => setFocusedInput(null)}
              style={applyInputStyle("regPassword")}
              type="password"
              placeholder="🔒 Create Password"
              required
            />

            <div style={styles.captchaBox}>
              <div style={styles.captchaText}>{captcha}</div>
              <button type="button" onClick={generateCaptcha} style={styles.refreshBtn}>↻</button>
            </div>

            <input
              value={inputCaptcha}
              onChange={(e) => setInputCaptcha(e.target.value)}
              onFocus={() => setFocusedInput("inputCaptcha")}
              onBlur={() => setFocusedInput(null)}
              style={applyInputStyle("inputCaptcha")}
              type="text"
              placeholder="Re-type the text above"
              required
            />

            <button type="submit" style={styles.buttonRegister}>Register</button>
          </form>
        )}

        <div style={styles.footerText}>
          © {new Date().getFullYear()} Crop Manager — Simple Auth UI
        </div>
      </div>
    </div>
  );
}
