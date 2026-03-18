import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
      setUser({ token, username });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
      const { token } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      setUser({ token, username });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, { username, password });
      const { token } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      setUser({ token, username });
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
