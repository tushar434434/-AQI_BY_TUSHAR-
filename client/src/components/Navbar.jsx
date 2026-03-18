import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Wind, LogOut, LayoutDashboard, Map as MapIcon, LogIn, UserPlus, GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavLink = ({ to, icon: Icon, children }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        style={{ 
          display: 'flex', alignItems: 'center', gap: '6px', 
          color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)', 
          fontWeight: isActive ? 600 : 500,
          transition: 'all 0.2s',
          padding: '8px 12px',
          borderRadius: '12px',
          background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
        }} 
        onMouseOver={e => !isActive && (e.currentTarget.style.color = 'var(--text-primary)')} 
        onMouseOut={e => !isActive && (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <Icon size={18} /> {children}
      </Link>
    );
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="glass-panel" 
      style={{
        position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)', maxWidth: '1200px', height: '65px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 1000
      }}
    >
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', padding: '6px', borderRadius: '10px', display: 'flex' }}>
            <Wind color="#fff" size={24} />
          </div>
          <span style={{ fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>AQI Tushar</span>
        </Link>
      </div>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
        <NavLink to="/" icon={MapIcon}>Map</NavLink>
        <NavLink to="/compare" icon={GitCompare}>Compare</NavLink>
        <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', padding: '5px 12px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                alt="user avatar" 
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9' }} 
              />
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.username}</span>
            </div>
            <button 
              onClick={handleLogout} 
              style={{ padding: '8px', borderRadius: '10px', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '12px', fontWeight: 600, color: 'var(--text-primary)', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)' }}>
              <LogIn size={16} /> Login
            </Link>
            <Link to="/register" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 16px', borderRadius: '12px', fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}>
              <UserPlus size={16} /> Sign Up
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
