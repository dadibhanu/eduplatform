import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Login(){
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', as: 'admin' });
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(form);
      nav('/');
    } catch (e) {
      setErr(e.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{minHeight:'70vh'}}>
      <form className="card p-4 shadow-sm login-card" onSubmit={submit}>
        <h4 className="mb-3">Sign in</h4>
        {err && <div className="alert alert-danger">{err}</div>}
        <div className="mb-2">
          <label className="form-label">Email</label>
          <input className="form-control" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
        </div>
        <div className="mb-2">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Login as</label>
          <select className="form-select" value={form.as} onChange={e=>setForm({...form,as:e.target.value})}>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <button className="btn btn-primary" disabled={loading}>{loading? 'Signing...' : 'Sign in'}</button>
        </div>
      </form>
    </div>
  );
}