import React, { useState } from "react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [mode, setMode] = useState("login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 to-green-400 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        <h2 className="text-3xl font-bold text-center text-green-700 mb-6">
          {mode === "login" ? "Welcome Back" : "Create Your Account"}
        </h2>

        <p className="text-center text-sm mb-6">
          {mode === "login" ? (
            <>Don't have an account? <span className="text-green-700 font-semibold cursor-pointer" onClick={() => setMode("register")}>Register</span></>
          ) : (
            <>Already have an account? <span className="text-green-700 font-semibold cursor-pointer" onClick={() => setMode("login")}>Login</span></>
          )}
        </p>

        {mode === "login" ? (
          <form className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input type="password" placeholder="Password" className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
            <button className="w-full bg-green-600 text-white p-3 rounded-xl text-lg font-semibold shadow-md hover:bg-green-700 transition">Login</button>
          </form>
        ) : (
          <form className="space-y-4">
            <input type="text" placeholder="Full Name" className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input type="email" placeholder="Email" className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input type="password" placeholder="Password" className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input type="password" placeholder="Confirm Password" className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input type="text" placeholder="Phone Number" className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500" />

            <select className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Select Culture</option>
              <option value="en-US">English (US)</option>
              <option value="ar-SA">Arabic</option>
              <option value="fr-FR">French</option>
            </select>

            <div className="flex items-center space-x-2 mt-2">
              <input type="checkbox" />
              <label>I agree to the Privacy Policy</label>
            </div>

            <button className="w-full bg-green-600 text-white p-3 rounded-xl text-lg font-semibold shadow-md hover:bg-green-700 transition">Register</button>
          </form>
        )}
      </motion.div>
    </div>
  );
}