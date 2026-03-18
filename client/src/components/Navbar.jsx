import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from './ThemeProvider';
import { Wind, LogOut, LayoutDashboard, Map as MapIcon, LogIn, UserPlus, GitCompare, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavLink = ({ to, icon: Icon, children }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
          isActive 
            ? "bg-primary/10 text-primary" 
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <Icon size={18} /> <span className="hidden sm:inline">{children}</span>
      </Link>
    );
  };

  return (
    <header 
      className="fixed top-0 left-0 z-50 w-full h-16 border-b bg-background/80 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-background/60"
    >
      <nav className="flex items-center justify-between h-full w-full max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="bg-gradient-to-tr from-emerald-500 to-blue-500 p-1.5 rounded-lg">
              <Wind className="text-white w-5 h-5" />
            </div>
            <span className="hidden xs:inline-block">AQI Tracker</span>
          </Link>
        </div>
        
        <div className="flex items-center justify-center gap-1 md:gap-2 mx-auto absolute left-1/2 -translate-x-1/2">
          <NavLink to="/" icon={MapIcon}>Map</NavLink>
          <NavLink to="/compare" icon={GitCompare}>Compare</NavLink>
          <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-3 ml-2">
              <div className="flex items-center gap-2 bg-secondary/50 border px-2 py-1 rounded-full">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                  alt="Avatar" 
                  className="w-6 h-6 rounded-full bg-background" 
                />
                <span className="text-sm font-semibold pr-2">{user.username}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link to="/login" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-xl hover:bg-secondary transition-colors">
                <LogIn size={16} /> Login
              </Link>
              <Link to="/register" className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:opacity-90 shadow-sm transition-opacity">
                <UserPlus size={16} /> <span className="hidden sm:inline">Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
