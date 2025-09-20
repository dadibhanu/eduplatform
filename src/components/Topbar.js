import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Topbar(){
  const { user, logout } = useAuth();
  return (
    <nav className="navbar navbar-expand-lg navbar-dark topbar bg-gradient shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <div className="brand-box">EP</div>
          <span className="ms-2 brand-text">EduPlatform</span>
        </Link>

        <div className="d-flex align-items-center">
          <Link className="btn btn-sm btn-outline-light me-2" to="/">Explore</Link>
          {user ? (
            <>
              <Link className="btn btn-sm btn-light me-2" to="/profile">{user.name}</Link>
              {user.role === 'admin' && <Link className="btn btn-sm btn-warning me-2" to="/admin">Admin</Link>}
              <button className="btn btn-sm btn-danger" onClick={logout}>Logout</button>
            </>
          ) : (
            <Link className="btn btn-sm btn-light" to="/login">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}