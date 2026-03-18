import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { GitCompare, MapPin, X, Plus, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Compare = () => {
  const [cities, setCities] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!searchInput || cities.length >= 3) return;
    
    setLoading(true);
    try {
      // 1. Geocode
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchInput}`);
      if (geoRes.data && geoRes.data.length > 0) {
        const { lat, lon, display_name } = geoRes.data[0];
        const cityName = display_name.split(',')[0];
        
        // 2. Fetch AQI
        const aqiRes = await axios.get(`${API_URL}/api/aqi?lat=${lat}&lon=${lon}`);
        if(aqiRes.data.list && aqiRes.data.list.length > 0) {
          const aqiData = aqiRes.data.list[0];
          setCities(prev => [...prev, { name: cityName, data: aqiData }]);
          setSearchInput('');
        }
      } else {
        alert("City not found");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const removeCity = (index) => {
    setCities(prev => prev.filter((_, i) => i !== index));
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{ background: 'var(--accent-color)', padding: '12px', borderRadius: '16px', color: '#fff' }}>
            <GitCompare size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Compare <span className="gradient-text">Cities</span></h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>Compare Air Quality between up to 3 different locations worldwide.</p>
          </div>
        </div>

        {cities.length < 3 && (
          <form onSubmit={handleAddCity} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '15px', marginBottom: '40px', maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '0 15px' }}>
              <Search size={20} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Add a city to compare (e.g. London, Tokyo)" 
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                style={{ width: '100%', padding: '15px 10px', background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))',
                color: '#fff', padding: '0 25px', borderRadius: '12px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1
              }}
            >
              <Plus size={20} /> {loading ? 'Fetching...' : 'Add City'}
            </button>
          </form>
        )}

        {cities.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', border: '2px dashed var(--glass-border)', borderRadius: '24px' }}>
            <GitCompare size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
            <h3>No cities added yet</h3>
            <p>Search for a city above to start your comparison.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {cities.map((city, index) => {
            const epaAqi = city.data.main.aqi;
            const aqiInfo = getAqiInfo(epaAqi);
            
            return (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                key={index} className="glass-panel" 
                style={{ flex: '1 1 300px', padding: '30px', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: aqiInfo.color }} />
                
                <button 
                  onClick={() => removeCity(index)}
                  style={{ position: 'absolute', top: '15px', right: '15px', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', borderRadius: '50%', padding: '5px' }}
                  onMouseOver={e=>e.currentTarget.style.color='var(--danger)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-secondary)'}
                >
                  <X size={18} />
                </button>

                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', fontSize: '1.8rem' }}>
                  <MapPin color={aqiInfo.color} /> {city.name}
                </h2>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', marginBottom: '30px' }}>
                  <span style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1, color: aqiInfo.color }}>{epaAqi}</span>
                  <span style={{ padding: '6px 16px', borderRadius: '20px', background: `${aqiInfo.color}22`, color: aqiInfo.color, fontWeight: 700 }}>
                    {aqiInfo.label}
                  </span>
                </div>

              <div>
                <h4 style={{ color: 'var(--text-secondary)', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Pollutants (μg/m³)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '15px', borderRadius: '12px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>PM2.5</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{city.data.components.pm2_5}</div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '15px', borderRadius: '12px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>PM10</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{city.data.components.pm10}</div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '15px', borderRadius: '12px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>O3</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{city.data.components.o3}</div>
                  </div>
                  <div style={{ background: 'var(--bg-tertiary)', padding: '15px', borderRadius: '12px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '5px' }}>NO2</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{city.data.components.no2}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        </div>

        {/* Comparison Chart */}
        {cities.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-panel" 
            style={{ marginTop: '40px', padding: '30px', borderRadius: '16px' }}
          >
            <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>Graphical Comparison</h2>
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cities.map(c => ({
                    name: c.name,
                    AQI: c.data.main.aqi,
                    PM25: c.data.components.pm2_5,
                    PM10: c.data.components.pm10,
                    O3: c.data.components.o3,
                    NO2: c.data.components.no2
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend />
                  <Bar dataKey="AQI" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PM25" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PM10" fill="#facc15" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Compare;
