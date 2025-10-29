import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { FaBrain } from "react-icons/fa";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", as: "admin" });
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(form);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center brainloom-root">
      <form
        className="card brainloom-card p-4 shadow-lg"
        style={{ width: "100%", maxWidth: 420 }}
        onSubmit={submit}
      >
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-3 bg-primary text-white">
            <FaBrain className="me-2" />
            <span className="fw-bold fs-4">BrainLoom</span>
          </div>
          <p className="text-muted mt-2">Sign in to continue</p>
        </div>

        {err && <div className="alert alert-danger">{err}</div>}

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Login as</label>
          <select
            className="form-select"
            value={form.as}
            onChange={(e) => setForm({ ...form, as: e.target.value })}
          >
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
