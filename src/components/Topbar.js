import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { FaBrain, FaMoon, FaSun } from "react-icons/fa";

export default function Topbar() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <nav className="navbar navbar-expand-lg navbar-dark brainloom-header">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <div className="brainloom-logo d-flex align-items-center justify-content-center me-2">
            <FaBrain className="text-white" />
          </div>
          <span className="fw-bold fs-5">BrainLoom</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="nav">
          <div className="d-flex flex-wrap align-items-center gap-2 mt-3 mt-lg-0">
            <button
              onClick={toggleTheme}
              className="btn btn-outline-light btn-sm"
            >
              {theme === "light" ? <FaMoon /> : <FaSun />}
            </button>
            <Link className="btn btn-outline-light btn-sm" to="/">
              Explore
            </Link>
            {user ? (
              <>
                <Link className="btn btn-light btn-sm" to="/profile">
                  Profile
                </Link>
                {user.role === "admin" && (
                  <Link className="btn btn-warning btn-sm" to="/admin">
                    Admin
                  </Link>
                )}
                <button className="btn btn-danger btn-sm" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <Link className="btn btn-light btn-sm" to="/login">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
