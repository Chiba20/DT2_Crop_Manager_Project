import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./AuthPage";

// ------------------ PROTECTED ROUTE ------------------
function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  
  if (!user || !user.token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ------------------ MAIN APP ------------------
function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Page */}
        <Route path="/" element={<AuthPage />} />

        {/* Example protected placeholder page */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <h1 style={{ textAlign: "center", marginTop: 50 }}>
                Protected Dashboard Page
              </h1>
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
