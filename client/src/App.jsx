import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Compare from './pages/Compare';

const AppRoutes = () => {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh', position: 'relative', paddingBottom: '40px' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/compare" element={<Compare />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
