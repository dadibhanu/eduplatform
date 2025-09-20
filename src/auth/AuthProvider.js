import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('edu_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('edu_token'));

  useEffect(() => {
    if (user) localStorage.setItem('edu_user', JSON.stringify(user));
    else localStorage.removeItem('edu_user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('edu_token', token);
    else localStorage.removeItem('edu_token');
  }, [token]);

  const login = async ({ email, password, as }) => {
    const res = await api.post('/auth/login', { email, password, as });
    const { token, user } = res.data;
    setToken(token);
    setUser(user);
    return user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);