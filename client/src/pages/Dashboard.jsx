import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LayoutDashboard, MapPin, Trash2, Heart } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedCities, setSavedCities] = useState([]);
  const [loading, setLoading] = useState(true);

  // If not logged in, prompt them
  if (!user) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <Heart size={64} className="gradient-text" style={{ marginBottom: '20px' }} />
        <h1 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>Your Saved Cities</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '30px' }}>
          Log in to track air quality updates for your favorite cities around the world, all in one place.
        </p>
        <button 
          onClick={() => navigate('/login')}
          style={{ padding: '15px 30px', borderRadius: '12px', background: 'var(--accent-color)', color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}
        >
          Log In or Sign Up
        </button>
      </div>
    );
  }

  useEffect(() => {
    const fetchSavedCities = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/cities', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        // Fetch real-time AQI for each saved city
        const citiesWithAqi = await Promise.all(res.data.map(async (city) => {
          try {
            const aqiRes = await axios.get(`http://localhost:5000/api/aqi?lat=${city.lat}&lon=${city.lon}`);
            return { ...city, aqiData: aqiRes.data.list[0] };
          } catch (e) {
            return { ...city, aqiData: null };
          }
        }));

        setSavedCities(citiesWithAqi);
      } catch (err) {
        console.error("Error fetching saved cities", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedCities();
  }, [user]);

  const removeCity = async (cityName) => {
    try {
      await axios.delete(`http://localhost:5000/api/cities/${cityName}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSavedCities(prev => prev.filter(c => c.city_name !== cityName));
    } catch (err) {
      console.error("Error deleting city", err);
    }
  };

  const getAqiInfo = (aqiValue) => {
    if (aqiValue <= 50) return { label: 'Good', color: '#10b981' };
    if (aqiValue <= 100) return { label: 'Moderate', color: '#facc15' };
    if (aqiValue <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#fb923c' };
    if (aqiValue <= 200) return { label: 'Unhealthy', color: '#ef4444' };
    if (aqiValue <= 300) return { label: 'Very Unhealthy', color: '#a855f7' };
    return { label: 'Hazardous', color: '#9f1239' };
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
          <div style={{ background: 'var(--accent-secondary)', padding: '12px', borderRadius: '16px', color: '#fff' }}>
            <LayoutDashboard size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', margin: 0 }}>My <span className="gradient-text">Updates</span></h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>Real-time air quality updates for your saved cities.</p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Loading your cities...</p>
        ) : savedCities.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <MapPin size={48} color="var(--text-secondary)" style={{ opacity: 0.3, marginBottom: '20px' }} />
            <h3>No cities saved yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Go to the map and click "Like & Save City" to track it here!</p>
            <button onClick={() => navigate('/')} style={{ padding: '10px 20px', background: 'var(--accent-color)', color: '#fff', borderRadius: '8px', fontWeight: 600 }}>Explore Map</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {savedCities.map((city, idx) => {
              let epaAqi = 0;
              let aqiInfo = { color: '#ccc', label: 'Unknown' };
              if (city.aqiData) {
                epaAqi = city.aqiData.main.aqi;
                aqiInfo = getAqiInfo(epaAqi);
              }

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                  key={city.city_name} 
                  className="glass-panel" 
                  style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.4rem' }}>
                      <MapPin color={aqiInfo.color} size={24} /> {city.city_name}
                    </h3>
                    <button 
                      onClick={() => removeCity(city.city_name)}
                      style={{ color: 'var(--text-secondary)', padding: '5px', borderRadius: '8px', background: 'var(--bg-tertiary)' }}
                      onMouseOver={e=>e.currentTarget.style.color='var(--danger)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-secondary)'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {city.aqiData ? (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `6px solid ${aqiInfo.color}` }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Current AQI</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, color: aqiInfo.color }}>
                          {epaAqi} <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 600 }}>({aqiInfo.label})</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>PM2.5 Level</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{city.aqiData.components.pm2_5} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>μg/m³</span></div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '16px', textAlign: 'center' }}>
                      Data currently unavailable
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default Dashboard;
