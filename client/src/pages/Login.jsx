import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';
import { Wind } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const res = await login(username, password);
    setIsLoading(false);
    
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel" 
        style={{ padding: '40px', width: '100%', maxWidth: '400px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Wind className="gradient-text" size={48} style={{ margin: '0 auto 10px' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Log in to monitor air quality</p>
        </div>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(255, 61, 0, 0.1)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '1px solid rgba(255, 61, 0, 0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Username</label>
            <input 
              type="text" 
              value={username} onChange={e => setUsername(e.target.value)} required 
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
              onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              value={password} onChange={e => setPassword(e.target.value)} required 
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
              onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              marginTop: '10px', padding: '14px', borderRadius: '8px', 
              background: 'linear-gradient(135deg, var(--accent-color), #00b0ff)', 
              color: '#000', fontWeight: 'bold', fontSize: '1rem', 
              opacity: isLoading ? 0.7 : 1, transition: 'transform 0.1s, box-shadow 0.2s' 
            }}
            onMouseOver={e => !isLoading && (e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.5)')}
            onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
            onMouseDown={e => !isLoading && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isLoading ? 'Logging gently...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-color)', fontWeight: 600 }}>Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
