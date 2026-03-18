import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, MapPin, Trash2, Heart } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCities, getAqiByCoords, removeCity as apiRemoveCity } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedCities, setSavedCities] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-20 px-6">
        <Heart size={64} className="text-destructive mb-6 animate-pulse" />
        <h1 className="text-4xl font-bold tracking-tight mb-4">Your Saved Cities</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Log in to track air quality updates for your favorite cities around the world, all in one place.
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-xl font-semibold text-lg transition-colors shadow-sm"
        >
          Log In or Sign Up
        </button>
      </div>
    );
  }

  useEffect(() => {
    const fetchSavedCities = async () => {
      try {
        const citiesList = await getCities();
        const citiesWithAqi = await Promise.all(citiesList.map(async (city) => {
          try {
            const aqiRes = await getAqiByCoords(city.lat, city.lon);
            return { ...city, aqiData: aqiRes.list[0] };
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

  const handleRemoveCity = async (cityName) => {
    try {
      await apiRemoveCity(cityName);
      setSavedCities(prev => prev.filter(c => c.city_name !== cityName));
    } catch (err) {
      console.error("Error deleting city", err);
    }
  };

  const getAqiInfo = (aqiValue) => {
    if (aqiValue <= 50) return { label: 'Good', color: 'bg-emerald-500', text: 'text-emerald-500' };
    if (aqiValue <= 100) return { label: 'Moderate', color: 'bg-yellow-400', text: 'text-yellow-500' };
    if (aqiValue <= 150) return { label: 'Unhealthy for Sensitive', color: 'bg-orange-500', text: 'text-orange-500' };
    if (aqiValue <= 200) return { label: 'Unhealthy', color: 'bg-red-500', text: 'text-red-500' };
    if (aqiValue <= 300) return { label: 'Very Unhealthy', color: 'bg-purple-500', text: 'text-purple-500' };
    return { label: 'Hazardous', color: 'bg-rose-800', text: 'text-rose-800' };
  };

  const MemoizedCityCards = useMemo(() => {
    if (loading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 w-1/3 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="h-24 w-full bg-muted animate-pulse rounded-xl" />
        </div>
      ));
    }

    if (savedCities.length === 0) {
      return (
        <div className="col-span-full border-2 border-dashed rounded-3xl p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
          <MapPin size={48} className="opacity-20 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No cities saved yet</h3>
          <p className="mb-6 max-w-md">Go to the map and click "Like & Save City" to track it here!</p>
          <button 
            onClick={() => navigate('/')} 
            className="bg-primary text-primary-foreground focus:ring-2 focus:ring-ring hover:bg-primary/90 px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            Explore Map
          </button>
        </div>
      );
    }

    return (
      <AnimatePresence>
        {savedCities.map((city, idx) => {
          let epaAqi = 0;
          let aqiInfo = { color: 'bg-muted', text: 'text-muted-foreground', label: 'Unknown' };
          if (city.aqiData) {
            epaAqi = city.aqiData.main.aqi;
            aqiInfo = getAqiInfo(epaAqi);
          }

          return (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              key={city.city_name} 
              className="rounded-2xl border bg-card text-card-foreground shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
            >
              <div className={`absolute top-0 left-0 w-full h-1.5 ${aqiInfo.color}`} />
              <div className="p-6 flex flex-col gap-5">
                <div className="flex justify-between items-start">
                  <h3 className="flex items-center gap-2 m-0 text-xl font-semibold tracking-tight">
                    <MapPin className={aqiInfo.text} size={22} /> {city.city_name}
                  </h3>
                  <button 
                    onClick={() => handleRemoveCity(city.city_name)}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Remove city"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {city.aqiData ? (
                  <div className="bg-muted px-5 py-4 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-muted-foreground text-xs uppercase font-semibold tracking-wider mb-1">Current AQI</div>
                      <div className={`text-4xl font-black leading-none ${aqiInfo.text}`}>
                        {epaAqi} <span className="text-sm text-foreground/70 font-medium ml-1">({aqiInfo.label})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground font-semibold mb-1">PM2.5</div>
                      <div className="text-xl font-bold">{city.aqiData.components.pm2_5} <span className="text-xs text-muted-foreground font-normal">μg/m³</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-destructive/10 text-destructive text-sm font-medium p-4 rounded-xl text-center">
                    Data currently unavailable
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    );
  }, [loading, savedCities, navigate]);

  return (
    <div className="w-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-primary/10 text-primary p-3 rounded-2xl">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight m-0">My Updates</h1>
            <p className="text-muted-foreground m-0 text-base">Real-time air quality updates for your saved cities.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MemoizedCityCards}
        </div>

      </motion.div>
    </div>
  );
};

export default Dashboard;
