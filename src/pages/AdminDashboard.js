import React from 'react';

export default function AdminDashboard(){
  return (
    <div className="card p-3 shadow-sm">
      <h4>Admin Dashboard</h4>
      <p className="text-muted">Create, edit and manage topics and content.</p>

      <div className="row">
        <div className="col-md-6">
          <div className="admin-panel p-3 bg-white rounded shadow-sm">
            <h6>Quick Actions</h6>
            <button className="btn btn-primary btn-sm me-2">Create Topic</button>
            <button className="btn btn-outline-secondary btn-sm">Manage Users</button>
          </div>
        </div>
        <div className="col-md-6">
          <div className="p-3 bg-white rounded shadow-sm">
            <h6>Statistics</h6>
            <div className="d-flex gap-3">
              <div className="stat-box p-2 text-center">
                <div className="h3 mb-0">12</div>
                <div className="small text-muted">Active Topics</div>
              </div>
              <div className="stat-box p-2 text-center">
                <div className="h3 mb-0">3</div>
                <div className="small text-muted">Pending Reviews</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}