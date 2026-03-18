import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip as MapTooltip, useMap, LayersControl, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Chatbot from '../components/Chatbot';
import { Search, Heart, MapPin, Navigation, Volume2, Flame, Leaf } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { searchCity, reverseGeocode, getAqiByCoords, saveCity } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { useTheme } from '../components/ThemeProvider';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Home = () => {
  const [position, setPosition] = useState([28.6139, 77.2090]); // Default Delhi
  const [searchedCity, setSearchedCity] = useState('Delhi');
  
  // Search Autocomplete State
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const [highestAqiCities, setHighestAqiCities] = useState([]);
  const [lowestAqiCities, setLowestAqiCities] = useState([]);
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const [showAuthModal, setShowAuthModal] = useState(false);

  const markerRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // 1. Fetch AQI whenever position changes
  useEffect(() => {
    const fetchAqi = async () => {
      setLoading(true);
      try {
        const res = await getAqiByCoords(position[0], position[1]);
        if (res.list && res.list.length > 0) {
          setAqiData(res.list[0]);
        }
      } catch (err) {
        console.error("Error fetching AQI:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAqi();
  }, [position]);

  // Open Popup automatically when AQI Data loads
  useEffect(() => {
    if (markerRef.current) markerRef.current.openPopup();
  }, [aqiData]);

  // 2. Fetch Global Top/Low Cities on Mount
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
    
    const fetchTopCities = async () => {
      try {
        const globalCoordinates = {
          'Delhi': { lat: 28.6139, lon: 77.2090 }, 'Lahore': { lat: 31.5204, lon: 74.3587 },
          'Beijing': { lat: 39.9042, lon: 116.4074 }, 'Dubai': { lat: 25.2048, lon: 55.2708 },
          'New York': { lat: 40.7128, lon: -74.0060 }, 'Tokyo': { lat: 35.6762, lon: 139.6503 },
          'Zurich': { lat: 47.3769, lon: 8.5417 }, 'Reykjavik': { lat: 64.1466, lon: -21.9426 },
        };
        const globalData = [];
        await Promise.all(Object.entries(globalCoordinates).map(async ([name, coords]) => {
            try {
              const res = await getAqiByCoords(coords.lat, coords.lon);
              if(res.list && res.list.length > 0) {
                globalData.push({ name, aqi: res.list[0].main.aqi, lat: coords.lat, lon: coords.lon });
              }
            } catch (e) { /* ignore */ }
        }));
        const sortedDesc = [...globalData].sort((a, b) => b.aqi - a.aqi);
        setHighestAqiCities(sortedDesc.slice(0, 4));
        setLowestAqiCities(sortedDesc.slice(-4).reverse());
      } catch (e) { console.error("Top cities error:", e); }
    };
    fetchTopCities();
  }, []);

  // 3. Autocomplete Search Effect
  useEffect(() => {
    if (debouncedSearch && showSearchDropdown) {
      searchCity(debouncedSearch).then(results => {
        setSearchResults(results.slice(0, 5));
      }).catch(err => console.error(err));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch, showSearchDropdown]);

  const updateRecentSearches = (cityName, aqiValue) => {
    const newItem = { name: cityName, aqi: aqiValue };
    const filtered = recentSearches.filter(item => item.name !== cityName);
    const updated = [newItem, ...filtered].slice(0, 3);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const executeSearchSelection = async (lat, lon, displayName) => {
    const cityName = displayName.split(',')[0];
    setPosition([parseFloat(lat), parseFloat(lon)]);
    setSearchedCity(cityName);
    setIsSaved(false);
    setShowSearchDropdown(false);
    setSearchInput('');
    
    try {
      const aqiRes = await getAqiByCoords(lat, lon);
      if(aqiRes.list && aqiRes.list.length > 0) {
        updateRecentSearches(cityName, aqiRes.list[0].main.aqi);
      }
    } catch {}
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchInput) return;
    try {
      const res = await searchCity(searchInput);
      if (res && res.length > 0) {
        executeSearchSelection(res[0].lat, res[0].lon, res[0].display_name);
      } else {
        alert("City not found!");
      }
    } catch (err) { console.error(err); }
  };

  const handleSaveCity = async () => {
    if (!user) return setShowAuthModal(true);
    try {
      await saveCity(searchedCity, position[0], position[1]);
      setIsSaved(true);
    } catch (err) {
      alert("Could not save city.");
    }
  };

  const onMarkerDragEnd = async (e) => {
    const marker = e.target;
    const pos = marker.getLatLng();
    setPosition([pos.lat, pos.lng]);
    try {
      const res = await reverseGeocode(pos.lat, pos.lng);
      if (res && res.display_name) {
        let city = res.address?.city || res.address?.town || res.address?.village || res.display_name.split(',')[0];
        setSearchedCity(city);
        setIsSaved(false);
      }
    } catch (err) {}
  };

  const RecenterMap = ({ lat, lon }) => {
    const map = useMap();
    useEffect(() => {
      map.flyTo([lat, lon], 12, { animate: true, duration: 1.5 });
    }, [lat, lon, map]);
    return null;
  };

  const MapDoubleClickEvent = () => {
    useMapEvents({
      dblclick(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        reverseGeocode(lat, lng).then(res => {
          if (res && res.display_name) {
            let city = res.address?.city || res.address?.town || res.display_name.split(',')[0];
            setSearchedCity(city);
            setIsSaved(false);
          }
        }).catch(()=>{});
      }
    });
    return null;
  };

  const getAqiInfo = (aqiValue) => {
    if (aqiValue <= 50) return { label: 'Good', color: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-500', health: 'Air quality is satisfactory, poses little risk.' };
    if (aqiValue <= 100) return { label: 'Moderate', color: '#facc15', bgClass: 'bg-yellow-400', textClass: 'text-yellow-500', health: 'Acceptable; moderate concern for sensitive individuals.' };
    if (aqiValue <= 150) return { label: 'Sensitive', color: '#fb923c', bgClass: 'bg-orange-500', textClass: 'text-orange-500', health: 'Members of sensitive groups may experience effects.' };
    if (aqiValue <= 200) return { label: 'Unhealthy', color: '#ef4444', bgClass: 'bg-red-500', textClass: 'text-red-500', health: 'Everyone may begin to experience health effects.' };
    if (aqiValue <= 300) return { label: 'Very Unhealthy', color: '#a855f7', bgClass: 'bg-purple-500', textClass: 'text-purple-500', health: 'Health warnings of emergency conditions.' };
    return { label: 'Hazardous', color: '#9f1239', bgClass: 'bg-rose-800', textClass: 'text-rose-800', health: 'Health alert: everyone may experience more serious health effects.' };
  };

  const speakAqi = (cityName, aqiValue, health) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(`The Air Quality Index in ${cityName} is ${aqiValue}. This condition is considered ${health}.`);
      window.speechSynthesis.speak(msg);
    }
  };

  const createCustomIcon = (aqi) => {
    const aqiInfo = getAqiInfo(aqi);
    return new L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div class="flex flex-col items-center hover:-translate-y-1 transition-transform duration-300">
          <div style="background-color:${aqiInfo.color}" class="text-white font-black text-sm px-3 py-1.5 rounded-xl border-2 border-white dark:border-zinc-800 shadow-md min-w-[45px] text-center filter drop-shadow-lg">
            ${aqi}
          </div>
          <div style="border-top-color:${aqiInfo.color}" class="w-0 h-0 border-l-[6px] border-r-[6px] border-l-transparent border-r-transparent border-t-[8px] -mt-0.5 filter drop-shadow-sm"></div>
        </div>
      `,
      iconSize: [50, 50], iconAnchor: [25, 45], popupAnchor: [0, -45], tooltipAnchor: [20, -25]
    });
  };

  return (
    <div className="w-full flex flex-col gap-6">

      {/* Autocomplete Search Bar */}
      <div className="w-full max-w-2xl mx-auto relative z-[1001]">
        <div className="bg-background/80 backdrop-blur-xl border shadow-sm rounded-2xl flex items-center px-4 overflow-visible group focus-within:ring-2 focus-within:ring-primary transition-all">
          <form onSubmit={handleManualSearch} className="flex items-center w-full h-14">
            <Search className="text-muted-foreground mr-3" size={20} />
            <input 
              type="text" 
              placeholder="Search for a city..." 
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base h-full w-full"
            />
            {searchInput && (
              <button 
                type="button" 
                onClick={() => setSearchInput('')}
                className="text-muted-foreground hover:text-foreground p-2"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        <AnimatePresence>
          {showSearchDropdown && (searchInput.trim().length > 0 || recentSearches.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-[calc(100%+8px)] left-0 w-full bg-background border shadow-xl rounded-xl overflow-hidden"
            >
              {searchResults.length > 0 ? (
                <div className="flex flex-col">
                  {searchResults.map((res, i) => (
                    <div 
                      key={i} 
                      onClick={() => executeSearchSelection(res.lat, res.lon, res.display_name)}
                      className="px-4 py-3 hover:bg-muted cursor-pointer flex items-center gap-3 border-b last:border-0 transition-colors"
                    >
                      <MapPin size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium">{res.display_name}</span>
                    </div>
                  ))}
                </div>
              ) : recentSearches.length > 0 && !searchInput ? (
                <div className="flex flex-col">
                  <div className="px-4 py-2 text-xs font-bold text-muted-foreground bg-muted/50 uppercase tracking-wider">Recent Searches</div>
                  {recentSearches.map((item, idx) => (
                    <div 
                      key={idx} onClick={() => setSearchInput(item.name)}
                      className="px-4 py-3 hover:bg-secondary cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <div className="flex items-center gap-3 text-sm font-medium"><Search size={14} className="text-muted-foreground"/> {item.name}</div>
                      {item.aqi && <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">AQI {item.aqi}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching network...</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div 
        className="w-full h-[60vh] min-h-[500px] rounded-3xl overflow-hidden border shadow-sm relative z-0"
        onMouseLeave={() => setShowSearchDropdown(false)}
      >
        <button 
          onClick={() => { setPosition([28.6139, 77.2090]); setSearchedCity('Delhi'); setIsSaved(false); }}
          className="absolute bottom-6 left-6 z-[1000] bg-background/90 backdrop-blur-md border px-4 py-2.5 rounded-xl font-medium shadow-md flex items-center gap-2 hover:bg-muted transition-colors"
        >
          <Navigation size={18} /> Default View
        </button>

        <MapContainer center={position} zoom={11} doubleClickZoom={false} className="w-full h-full">
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked={theme !== 'dark'} name="Light Theme">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CartoDB' />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked={theme === 'dark'} name="Dark Theme">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CartoDB' />
            </LayersControl.BaseLayer>
          </LayersControl>

          <RecenterMap lat={position[0]} lon={position[1]} />
          <MapDoubleClickEvent />

          {aqiData && (
            <Marker 
              position={position} draggable={true} 
              icon={createCustomIcon(aqiData.main.aqi)} 
              eventHandlers={{ dragend: onMarkerDragEnd }}
              ref={r => { markerRef.current = r; if(r) setTimeout(()=>r.openPopup(), 100); }}
            >
              <MapTooltip direction="right" offset={[15, -20]} opacity={1} className="sm:hidden lg:block bg-background border rounded-xl text-foreground !p-2 !shadow-lg">
                <span className="font-semibold text-sm">Hover Info: {searchedCity} AQI {aqiData.main.aqi}</span>
              </MapTooltip>

              <Popup className="glass-popup" closeButton={false} autoPan={true}>
                {(() => {
                  const epaAqi = aqiData.main.aqi;
                  const aqiInfo = getAqiInfo(epaAqi);
                  return (
                    <div className="p-1 w-[260px] flex flex-col gap-3 font-sans">
                      <div className="flex justify-between items-start">
                        <h3 className="m-0 text-lg font-bold flex items-center gap-1.5"><MapPin size={18} className={aqiInfo.textClass}/> {searchedCity}</h3>
                        <div className={`${aqiInfo.bgClass} text-white px-2 py-1 rounded-lg text-xs font-black`}>AQI {epaAqi}</div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground font-medium flex gap-2 items-start leading-relaxed">
                        <span>{aqiInfo.health}</span>
                        <button onClick={() => speakAqi(searchedCity, epaAqi, aqiInfo.health)} className="text-primary hover:bg-primary/10 p-1.5 rounded-full shrink-0 transition-colors">
                          <Volume2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {['pm2_5', 'pm10', 'o3', 'no2'].map(p => (
                          <div key={p} className="bg-muted p-2 rounded-lg text-center flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{p.replace('_','.')}</span>
                            <span className="font-semibold text-sm">{aqiData.components[p]}</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={handleSaveCity}
                        className={`mt-2 w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${isSaved ? 'bg-secondary text-foreground border-transparent' : 'bg-primary text-primary-foreground shadow-sm hover:opacity-90'}`}
                      >
                        <Heart className={isSaved ? "text-destructive fill-destructive" : ""} size={16} />
                        {isSaved ? 'Saved to Dashboard' : 'Like & Save City'}
                      </button>
                    </div>
                  );
                })()}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Global Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        
        <div className="border bg-card text-card-foreground rounded-2xl p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-rose-600 font-bold mb-5 tracking-tight text-lg">
            <Flame className="animate-pulse" /> Most Polluted Highlights
          </h3>
          <div className="flex flex-col gap-3">
            {highestAqiCities.length === 0 ? <p className="text-muted-foreground text-sm">Loading global data...</p> : 
              highestAqiCities.map((c, i) => {
                const aInfo = getAqiInfo(c.aqi);
                return (
                  <div key={i} onClick={() => { setPosition([c.lat, c.lon]); setSearchedCity(c.name); window.scrollTo(0,0); }} 
                    className={`flex justify-between items-center bg-muted/50 hover:bg-muted cursor-pointer p-3 rounded-xl border-l-4 ${aInfo.border || 'border-l-'+aInfo.bgClass.replace('bg-','')} transition-colors`}
                  >
                    <span className="font-semibold">{c.name}</span>
                    <span className={`${aInfo.bgClass} text-white px-3 py-1 text-xs font-bold rounded-full`}>AQI {c.aqi}</span>
                  </div>
                );
              })
            }
          </div>
        </div>

        <div className="border bg-card text-card-foreground rounded-2xl p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-emerald-500 font-bold mb-5 tracking-tight text-lg">
            <Leaf /> Cleanest Air Highlights
          </h3>
          <div className="flex flex-col gap-3">
            {lowestAqiCities.length === 0 ? <p className="text-muted-foreground text-sm">Loading global data...</p> : 
              lowestAqiCities.map((c, i) => {
                const aInfo = getAqiInfo(c.aqi);
                return (
                  <div key={i} onClick={() => { setPosition([c.lat, c.lon]); setSearchedCity(c.name); window.scrollTo(0,0); }} 
                  className={`flex justify-between items-center bg-muted/50 hover:bg-muted cursor-pointer p-3 rounded-xl border-l-4 ${aInfo.border || 'border-l-'+aInfo.bgClass.replace('bg-','')} transition-colors`}
                  >
                    <span className="font-semibold">{c.name}</span>
                    <span className={`${aInfo.bgClass} text-white px-3 py-1 text-xs font-bold rounded-full`}>AQI {c.aqi}</span>
                  </div>
                );
              })
            }
          </div>
        </div>

      </div>

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card text-card-foreground p-8 rounded-3xl shadow-xl border w-full max-w-sm text-center">
              <Heart size={48} className="text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 tracking-tight">Sign in required</h2>
              <p className="text-muted-foreground mb-8 text-sm">You need an account to save cities to your personalized AQI dashboard.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate('/login')} className="bg-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90">Log In</button>
                <button onClick={() => setShowAuthModal(false)} className="bg-muted text-foreground py-3 font-semibold rounded-xl hover:bg-secondary">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Chatbot />
    </div>
  );
};

export default Home;
