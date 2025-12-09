import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [captcha, setCaptcha] = useState("");
    const [form, setForm] = useState({ email: "", username: "", password: "", captchaInput: "" });

    const navigate = useNavigate();

    useEffect(() => {
        generateCaptcha();
    }, []);

    const generateCaptcha = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let text = "";
        for (let i = 0; i < 6; i++) {
            text += chars[Math.floor(Math.random() * chars.length)];
        }
        setCaptcha(text);
    };

    // HANDLE INPUT CHANGE
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // ======================================
    // 🔥 LOGIN + REGISTER LOGIC FIXED HERE
    // ======================================
    const handleSubmit = async () => {
        if (!form.email || !form.password) {
            alert("Please fill all fields!");
            return;
        }

        // REGISTER CAPTCHA CHECK
        if (!isLogin && form.captchaInput !== captcha) {
            alert("CAPTCHA incorrect!");
            generateCaptcha();
            return;
        }

        const endpoint = isLogin ? "/api/login" : "/api/register";

        const res = await fetch(`http://127.0.0.1:5000${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: form.email,
                password: form.password,
                username: form.username,
            }),
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Something went wrong");
            return;
        }

        // LOGIN SUCCESS — SAVE TOKEN & NAVIGATE
        if (isLogin) {
            localStorage.setItem("user", JSON.stringify({ token: data.token }));
            navigate("/dashboard"); // <--- WORKS NOW
        } else {
            alert("Registered successfully! Please login.");
            setIsLogin(true);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                
                <h2 style={styles.title}>{isLogin ? "Login" : "Register"}</h2>
                <p style={styles.subtitle}>CropManager System</p>

                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    style={styles.input}
                    value={form.email}
                    onChange={handleChange}
                />

                {!isLogin && (
                    <input
                        name="username"
                        type="text"
                        placeholder="Username"
                        style={styles.input}
                        value={form.username}
                        onChange={handleChange}
                    />
                )}

                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    style={styles.input}
                    value={form.password}
                    onChange={handleChange}
                />

                {!isLogin && (
                    <>
                        <div style={styles.captchaBox}>
                            <span style={styles.captchaText}>{captcha}</span>
                            <button style={styles.refreshButton} onClick={generateCaptcha}>↻</button>
                        </div>

                        <input
                            name="captchaInput"
                            type="text"
                            placeholder="Enter CAPTCHA"
                            style={styles.input}
                            value={form.captchaInput}
                            onChange={handleChange}
                        />
                    </>
                )}

                <button style={styles.greenButton} onClick={handleSubmit}>
                    {isLogin ? "Login" : "Register"}
                </button>

                <p style={styles.toggleText}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <span style={styles.toggleLink} onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Register" : "Login"}
                    </span>
                </p>

            </div>
        </div>
    );
}

/* STYLES */
const styles = {
    container: {
        width: "100vw",
        height: "100vh",
        background: "#e9ffe8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial",
    },

    card: {
        width: "100%",
        maxWidth: "400px",
        padding: "35px 30px",
        background: "#ffffff",
        borderRadius: "14px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
        textAlign: "center",
    },

    title: {
        margin: 0,
        fontSize: "28px",
        fontWeight: "bold",
        color: "#2e7d32",
    },

    subtitle: {
        marginTop: "8px",
        marginBottom: "20px",
        fontSize: "15px",
        color: "#555",
    },

    input: {
        width: "100%",
        padding: "13px",
        marginTop: "16px",
        borderRadius: "8px",
        border: "1px solid #c9c9c9",
        fontSize: "15px",
        outline: "none",
    },

    greenButton: {
        width: "100%",
        padding: "14px",
        marginTop: "22px",
        backgroundColor: "#2e7d32",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "17px",
        cursor: "pointer",
        fontWeight: "bold",
    },

    toggleText: {
        marginTop: "18px",
        fontSize: "14px",
    },

    toggleLink: {
        color: "#2e7d32",
        cursor: "pointer",
        fontWeight: "bold",
    },

    captchaBox: {
        marginTop: "18px",
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    captchaText: {
        fontSize: "24px",
        fontStyle: "italic",
        letterSpacing: "4px",
        color: "#000",
        background: "#e1f5e0",
        padding: "8px 18px",
        borderRadius: "8px",
        textShadow: "1px 1px 1px #777",
        userSelect: "none",
    },

    refreshButton: {
        padding: "10px 14px",
        cursor: "pointer",
        backgroundColor: "#2e7d32",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "18px",
    },
};
