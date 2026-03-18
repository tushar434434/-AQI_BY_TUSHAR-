import React, { createContext, useState, useEffect, useContext } from 'react';
import { authLogin, authRegister } from './services/api';

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
      const res = await authLogin(username, password);
      const { token } = res;
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
      const res = await authRegister(username, password);
      const { token } = res;
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
