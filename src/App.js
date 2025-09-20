// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import TopicDetail from './pages/TopicDetail';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Topbar from './components/Topbar';
import PrivateRoute from './auth/PrivateRoute';
import AdminContentEditor from "./pages/AdminContentEditor";

export default function App() {
  return (
    <div className="app-root">
      <Topbar />
      <div className="container-fluid mt-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/topic/*" element={<TopicDetail />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        </Routes>
      </div>
    </div>
  );
}
