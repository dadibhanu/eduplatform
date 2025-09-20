import React from 'react';
import { useAuth } from '../auth/AuthProvider';

export default function Profile(){
  const { user } = useAuth();
  return (
    <div className="card p-3 shadow-sm">
      <h4>Profile</h4>
      <p><strong>Name:</strong> {user?.name}</p>
      <p><strong>Email:</strong> {user?.email}</p>
      <p><strong>Role:</strong> {user?.role}</p>
    </div>
  );
}