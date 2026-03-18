import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, MapPin, X, Plus, Search, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { searchCity, getAqiByCoords } from '../services/api';

const Compare = () => {
  const [cities, setCities] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!searchInput || cities.length >= 3) return;
    
    setLoading(true);
    try {
      const geoRes = await searchCity(searchInput);
      if (geoRes && geoRes.length > 0) {
        const { lat, lon, display_name } = geoRes[0];
        const cityName = display_name.split(',')[0];
        
        const aqiRes = await getAqiByCoords(lat, lon);
        if(aqiRes.list && aqiRes.list.length > 0) {
          const aqiData = aqiRes.list[0];
          if (!cities.some(c => c.name === cityName)) {
            setCities(prev => [...prev, { name: cityName, data: aqiData }]);
          }
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
    if (aqiValue <= 50) return { label: 'Good', border: 'border-emerald-500', fill: '#10b981', color: 'text-emerald-500', bg: 'bg-emerald-500' };
    if (aqiValue <= 100) return { label: 'Moderate', border: 'border-yellow-400', fill: '#facc15', color: 'text-yellow-500', bg: 'bg-yellow-400' };
    if (aqiValue <= 150) return { label: 'Sensitive', border: 'border-orange-500', fill: '#fb923c', color: 'text-orange-500', bg: 'bg-orange-500' };
    if (aqiValue <= 200) return { label: 'Unhealthy', border: 'border-red-500', fill: '#ef4444', color: 'text-red-500', bg: 'bg-red-500' };
    if (aqiValue <= 300) return { label: 'V. Unhealthy', border: 'border-purple-500', fill: '#a855f7', color: 'text-purple-500', bg: 'bg-purple-500' };
    return { label: 'Hazardous', border: 'border-rose-800', fill: '#9f1239', color: 'text-rose-800', bg: 'bg-rose-800' };
  };

  const MemoizedChart = useMemo(() => {
    if (cities.length === 0) return null;
    
    // Convert current theme text color var to string for recharts
    const chartData = cities.map(c => ({
      name: c.name,
      AQI: c.data.main.aqi,
      PM25: c.data.components.pm2_5,
      PM10: c.data.components.pm10,
      O3: c.data.components.o3,
      NO2: c.data.components.no2
    }));

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl border bg-card text-card-foreground shadow-sm mt-8 p-6 lg:p-8"
      >
        <h2 className="text-xl font-bold tracking-tight mb-6 hidden sm:block">Graphical Comparison</h2>
        <div className="w-full h-[350px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--popover-foreground))', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: 'hsl(var(--popover-foreground))', fontSize: '14px', fontWeight: 500 }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
              <Bar dataKey="AQI" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Bar dataKey="PM25" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Bar dataKey="PM10" fill="#facc15" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    );
  }, [cities]);

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl">
            <GitCompare size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight m-0">Compare Cities</h1>
            <p className="text-muted-foreground m-0 text-base">Compare Air Quality between up to 3 different locations worldwide.</p>
          </div>
        </div>

        {cities.length < 3 && (
          <form onSubmit={handleAddCity} className="rounded-2xl border bg-card p-2 sm:p-4 flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl shadow-sm">
            <div className="flex items-center flex-1 bg-muted/50 border rounded-xl px-4">
              <Search size={20} className="text-muted-foreground shrink-0" />
              <input 
                type="text" 
                placeholder="Add a city (e.g. London, Tokyo)" 
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm h-12 ml-2 placeholder:text-muted-foreground focus:ring-0"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 rounded-xl font-medium flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />} 
              {loading ? 'Fetching...' : 'Add City'}
            </button>
          </form>
        )}

        {cities.length === 0 && !loading && (
          <div className="border-2 border-dashed rounded-3xl p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
            <GitCompare size={48} className="opacity-20 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No cities added yet</h3>
            <p className="max-w-sm">Search for a city above to start your comparison.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {cities.map((city, index) => {
              const epaAqi = city.data.main.aqi;
              const aqiInfo = getAqiInfo(epaAqi);
              
              return (
                <motion.div 
                  layout
                  initial={{ scale: 0.95, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  key={city.name} 
                  className={`rounded-2xl bg-card text-card-foreground shadow-sm relative overflow-hidden border-t-4 ${aqiInfo.border} border-x border-b`}
                >
                  <div className="p-6">
                    <button 
                      onClick={() => removeCity(index)}
                      className="absolute top-4 right-4 text-muted-foreground hover:bg-destructive/10 hover:text-destructive p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Remove compared city"
                    >
                      <X size={18} />
                    </button>

                    <h2 className="flex items-center gap-2 m-0 text-xl font-bold tracking-tight mb-6">
                      <MapPin className={aqiInfo.color} size={22} /> {city.name}
                    </h2>

                    <div className="flex items-center gap-4 mb-8">
                      <span className={`text-6xl font-black leading-none ${aqiInfo.color}`}>{epaAqi}</span>
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-muted border ${aqiInfo.color}`}>
                        {aqiInfo.label}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-3">Pollutants (μg/m³)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {['pm2_5', 'pm10', 'o3', 'no2'].map(polKey => (
                          <div key={polKey} className="bg-muted/50 p-3 rounded-xl border">
                            <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">{polKey === 'pm2_5' ? 'PM2.5' : polKey.toUpperCase()}</div>
                            <div className="text-lg font-bold leading-none">{city.data.components[polKey]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Render Memoized Recharts component to avoid re-renders when tying in the search input */}
        {MemoizedChart}
        
      </motion.div>
    </div>
  );
};

export default Compare;
