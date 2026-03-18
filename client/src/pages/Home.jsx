import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import Chatbot from '../components/Chatbot';
import { Search, Heart, MapPin, Navigation, Volume2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = () => {
  const [position, setPosition] = useState([28.6139, 77.2090]); // Default Delhi
  const [searchedCity, setSearchedCity] = useState('Delhi');
  const [searchInput, setSearchInput] = useState('');
  const [recentSearches, setRecentSearches] = useState([]); // [{ name, aqi }]
  const [showRecent, setShowRecent] = useState(false);
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

  const fetchAqi = async (lat, lon) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/aqi?lat=${lat}&lon=${lon}`);
      if(res.data.list && res.data.list.length > 0) {
        setAqiData(res.data.list[0]);
      }
    } catch (err) {
      console.error("Error fetching AQI:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAqi(position[0], position[1]);
  }, [position]);

  // Open the marker popup automatically so the Like button is immediately visible
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [aqiData]);

  const updateRecentSearches = (cityName, aqiValue) => {
    const newItem = { name: cityName, aqi: aqiValue };
    // Filter out if already exists
    const filtered = recentSearches.filter(item => item.name !== cityName);
    const updated = [newItem, ...filtered].slice(0, 3); // Max 3 items
    
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Load recent searches and Global High/Low Cities on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
    
    // Fetch Top Global High/Low Cities
    const fetchTopCities = async () => {
      try {
        const globalCoordinates = {
          'Delhi': { lat: 28.6139, lon: 77.2090 },
          'Lahore': { lat: 31.5204, lon: 74.3587 },
          'Beijing': { lat: 39.9042, lon: 116.4074 },
          'Dhaka': { lat: 23.8103, lon: 90.4125 },
          'Dubai': { lat: 25.2048, lon: 55.2708 },
          'Mumbai': { lat: 19.0760, lon: 72.8777 },
          'London': { lat: 51.5074, lon: -0.1278 },
          'New York': { lat: 40.7128, lon: -74.0060 },
          'Tokyo': { lat: 35.6762, lon: 139.6503 },
          'Zurich': { lat: 47.3769, lon: 8.5417 },
          'Reykjavik': { lat: 64.1466, lon: -21.9426 },
          'Vancouver': { lat: 49.2827, lon: -123.1207 },
          'Sydney': { lat: -33.8688, lon: 151.2093 }
        };

        const globalData = [];
        await Promise.all(Object.entries(globalCoordinates).map(async ([name, coords]) => {
            try {
              const res = await axios.get(`http://localhost:5000/api/aqi?lat=${coords.lat}&lon=${coords.lon}`);
              if(res.data.list && res.data.list.length > 0) {
                globalData.push({ name, aqi: res.data.list[0].main.aqi, lat: coords.lat, lon: coords.lon });
              }
            } catch (e) {
               // Ignore failed fetches for individual cities
            }
        }));

        // Sort all for Highest and Lowest (Bottom section)
        const sortedDesc = [...globalData].sort((a, b) => b.aqi - a.aqi);
        setHighestAqiCities(sortedDesc.slice(0, 5));
        setLowestAqiCities(sortedDesc.slice(-5).reverse());

      } catch (e) {
        console.error("Top cities error:", e);
      }
    };
    fetchTopCities();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput) return;

    try {
      // Use OpenWeather Geocoding API (using our backend proxy ideally, but direct for simplicity here)
      // Note: for production, proxy this through backend to hide API key!
      // Using a free geocoding API for demonstration
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchInput}`);
      if (res.data && res.data.length > 0) {
        const { lat, lon, display_name } = res.data[0];
        // 2) Get AQI for this exact location to save in recent
        let fetchedAqi = null;
        try {
          const aqiRes = await axios.get(`http://localhost:5000/api/aqi?lat=${lat}&lon=${lon}`);
          if(aqiRes.data.list && aqiRes.data.list.length > 0) {
            fetchedAqi = aqiRes.data.list[0].main.aqi;
          }
        } catch (e) { console.error(e); }

        // Extract main city name from display_name
        const newCity = display_name.split(',')[0];
        setSearchedCity(newCity);
        setIsSaved(false); // Reset saved status on new search
        setShowRecent(false);

        // Save to recent searches (Max 3, containing AQI)
        updateRecentSearches(newCity, fetchedAqi);

      } else {
        alert("City not found!");
      }
    } catch (err) {
      console.error("Geocoding error", err);
    }
  };

  const handleSaveCity = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/cities/save', {
        city_name: searchedCity,
        lat: position[0],
        lon: position[1]
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setIsSaved(true);
    } catch (err) {
      console.error("Error saving city", err);
      alert("Could not save city.");
    }
  };

  const onMarkerDragEnd = async (e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setPosition([position.lat, position.lng]);
    
    // Reverse geocode to find city name of the new dragged pin
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`);
      if (res.data && res.data.display_name) {
        let city = res.data.address.city || res.data.address.town || res.data.address.village || res.data.display_name.split(',')[0];
        setSearchedCity(city);
        setIsSaved(false);
      }
    } catch (err) {
      console.error("Reverse geocoding error", err);
    }
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    alert("Thank you for your feedback!");
    setFeedback({ rating: 5, comment: '' });
  };

  const RecenterMap = ({ lat, lon }) => {
    const map = useMap();
    useEffect(() => {
      map.flyTo([lat, lon], 12, { animate: true, duration: 2 });
    }, [lat, lon, map]);
    return null;
  };

  const MapDoubleClickEvent = () => {
    useMapEvents({
      dblclick(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        
        // Reverse geocode new double-clicked pin
        axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(res => {
            if (res.data && res.data.display_name) {
              let city = res.data.address.city || res.data.address.town || res.data.address.village || res.data.display_name.split(',')[0];
              setSearchedCity(city);
              setIsSaved(false);
            }
          })
          .catch(err => console.error("Reverse geocoding error", err));
      }
    });
    return null;
  };



  const getAqiInfo = (aqiValue) => {
    if (aqiValue <= 50) return { label: 'Good', color: '#10b981', health: 'Air quality is considered satisfactory, and air pollution poses little risk.' };
    if (aqiValue <= 100) return { label: 'Moderate', color: '#facc15', health: 'Air quality is acceptable; however, there may be a moderate health concern for sensitive individuals.' };
    if (aqiValue <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#fb923c', health: 'Members of sensitive groups may experience health effects.' };
    if (aqiValue <= 200) return { label: 'Unhealthy', color: '#ef4444', health: 'Everyone may begin to experience health effects.' };
    if (aqiValue <= 300) return { label: 'Very Unhealthy', color: '#a855f7', health: 'Health warnings of emergency conditions. Population is affected.' };
    return { label: 'Hazardous', color: '#9f1239', health: 'Health alert: everyone may experience more serious health effects.' };
  };

  const createCustomIcon = (aqi) => {
    const aqiInfo = getAqiInfo(aqi);
    const badgeColor = aqiInfo.color;
    return new L.divIcon({
      className: 'custom-aqi-marker',
      html: `
        <div style="display:flex; flex-direction:column; align-items:center;">
          <div style="background-color: ${badgeColor}; color: white; font-weight: 800; font-size: 15px; padding: 6px 12px; border-radius: 8px; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); min-width: 45px; text-align: center;">
            ${aqi}
          </div>
          <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid ${badgeColor}; margin-top: -2px; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));"></div>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 45],
      popupAnchor: [0, -45]
    });
  };

  const speakAqi = (cityName, aqiValue, health) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `The Air Quality Index in ${cityName} is ${aqiValue}. This condition is considered ${health}.`;
      const msg = new SpeechSynthesisUtterance(text);
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    } else {
      alert("Text-to-speech is not supported in your browser.");
    }
  };

  const resetLocation = () => {
    setPosition([28.6139, 77.2090]); // Reset to India (Delhi)
    setSearchedCity('Delhi');
    setIsSaved(false);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '15px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* Search Bar (Now Outside Map) */}
      <div style={{
          display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', maxWidth: '800px', margin: '0 auto 20px', zIndex: 1000, position: 'relative'
      }}>
        <div className="glass-panel" style={{
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '10px',
          width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
            <Search size={20} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search city..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setShowRecent(true)}
              onBlur={() => setTimeout(() => setShowRecent(false), 200)}
              style={{ 
                border: 'none', background: 'transparent', outline: 'none',
                fontSize: '1rem', color: 'var(--text-primary)', flex: 1
              }}
            />
            <button type="submit" style={{ 
              background: 'var(--accent-color)', color: '#fff', 
              padding: '8px 16px', borderRadius: '8px', fontWeight: 600
            }}>
              Find
            </button>
          </form>
        </div>

        {/* Recent Searches Dropdown */}
        {showRecent && recentSearches.length > 0 && (
          <div className="glass-panel" style={{ padding: '10px 0', width: '100%', position: 'absolute', top: '100%', left: 0 }}>
            <div style={{ padding: '0 15px 5px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Recent Searches</div>
            {recentSearches.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  setSearchInput(item.name);
                }}
                style={{ 
                  padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: idx < recentSearches.length - 1 ? '1px solid var(--glass-border)' : 'none'
                }}
                onMouseOver={e=>e.currentTarget.style.background='rgba(0,0,0,0.05)'}
                onMouseOut={e=>e.currentTarget.style.background='transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Search size={14} color="var(--text-secondary)" /> {item.name}
                </div>
                {item.aqi && (
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '10px' }}>
                    AQI: {item.aqi}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map container */}
      <div style={{ position: 'relative', width: '100%', height: '70vh', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-shadow)' }}>
        
        {/* Reset Location Button Overlay */}
        <button 
          onClick={resetLocation}
          style={{
            position: 'absolute', top: '100px', right: '10px', zIndex: 1000,
            background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)',
            padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px',
            fontWeight: 600, color: 'var(--text-primary)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <Navigation size={16} /> Reset
        </button>
        


      <MapContainer center={position} zoom={11} doubleClickZoom={false} style={{ width: '100%', height: '100%', zIndex: 1 }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street View">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Dark Mode">
            <TileLayer
              attribution='&copy; CartoDB'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <RecenterMap lat={position[0]} lon={position[1]} />
        <MapDoubleClickEvent />
        
        {aqiData && (
          <Marker 
            position={position} 
            draggable={true}
            icon={createCustomIcon(aqiData.main.aqi)}
            eventHandlers={{ dragend: onMarkerDragEnd }}
            ref={(r) => { 
              markerRef.current = r; 
              if(r) setTimeout(() => r.openPopup(), 100); 
            }}
          >
            <Popup className="custom-popup" closeButton={true} autoPan={true}>
              {(() => {
                const epaAqi = aqiData.main.aqi;
                const aqiInfo = getAqiInfo(epaAqi);
                
                return (
                  <div style={{ padding: '5px', minWidth: '220px' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={20} className="gradient-text"/> {searchedCity}
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: aqiInfo.color }}>
                        {aqiInfo.label}
                      </span>
                      <div style={{ background: aqiInfo.color, color: '#fff', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                        AQI: {epaAqi}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px', lineHeight: 1.4, display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                      <strong>Health Advisory:</strong> {aqiInfo.health}
                      <button 
                        onClick={() => speakAqi(searchedCity, epaAqi, aqiInfo.health)}
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}
                        title="Listen to Air Quality"
                      >
                        <Volume2 size={16} />
                      </button>
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: '8px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>PM2.5</div>
                        <div style={{ fontWeight: 600 }}>{aqiData.components.pm2_5}</div>
                      </div>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: '8px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>PM10</div>
                        <div style={{ fontWeight: 600 }}>{aqiData.components.pm10}</div>
                      </div>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: '8px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>O3</div>
                        <div style={{ fontWeight: 600 }}>{aqiData.components.o3}</div>
                      </div>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: '8px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>NO2</div>
                        <div style={{ fontWeight: 600 }}>{aqiData.components.no2}</div>
                      </div>
                    </div>

                    <button 
                      onClick={handleSaveCity}
                      style={{ 
                        marginTop: '15px', width: '100%', padding: '10px', 
                        background: isSaved ? 'var(--bg-tertiary)' : 'var(--accent-color)', 
                        color: isSaved ? 'var(--text-primary)' : '#fff',
                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        fontWeight: 600
                      }}
                    >
                      <Heart fill={isSaved ? 'var(--danger)' : 'transparent'} color={isSaved ? 'var(--danger)' : 'currentColor'} size={18} />
                      {isSaved ? 'Saved to Dashboard' : 'Like & Save City'}
                    </button>
                  </div>
                );
              })()}
            </Popup>
          </Marker>
        )}
      </MapContainer>
      </div> {/* End Map Container div */}

      {/* Top 5 / Bottom 5 Global AQI Section (Below Map) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', margin: '20px 0' }}>
        
        {/* Top 5 Highest AQI (Most Polluted) */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ color: '#9f1239', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#9f1239', animation: 'pulse 2s infinite' }}></span>
            Highest AQI (Most Polluted)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {highestAqiCities.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading global data...</p> : 
              highestAqiCities.map((c, i) => {
                const aqiInfo = getAqiInfo(c.aqi);
                return (
                  <div key={i} onClick={() => { setPosition([c.lat, c.lon]); setSearchedCity(c.name); window.scrollTo(0,0); }} style={{ 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', 
                    borderRadius: '12px', background: 'var(--bg-tertiary)', borderLeft: `4px solid ${aqiInfo.color}`,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  >
                    <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ background: aqiInfo.color, color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>AQI {c.aqi}</span>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* Top 5 Lowest AQI (Cleanest Air) */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></span>
            Lowest AQI (Cleanest Air)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {lowestAqiCities.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading global data...</p> : 
              lowestAqiCities.map((c, i) => {
                const aqiInfo = getAqiInfo(c.aqi);
                return (
                  <div key={i} onClick={() => { setPosition([c.lat, c.lon]); setSearchedCity(c.name); window.scrollTo(0,0); }} style={{ 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', 
                    borderRadius: '12px', background: 'var(--bg-tertiary)', borderLeft: `4px solid ${aqiInfo.color}`,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  >
                    <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ background: aqiInfo.color, color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>AQI {c.aqi}</span>
                  </div>
                );
              })
            }
          </div>
        </div>

      </div>

      {/* Feedback Section */}
      <div className="glass-panel" style={{ margin: '20px auto 40px', padding: '15px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '800px', borderRadius: '16px' }}>
        <h3 style={{ marginBottom: '10px', fontSize: '1.1rem' }}>We value your feedback</h3>
        
        <form onSubmit={handleFeedbackSubmit} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[1,2,3,4,5].map(star => (
              <button 
                key={star} type="button" 
                onClick={() => setFeedback({...feedback, rating: star})}
                style={{ fontSize: '1.5rem', color: star <= feedback.rating ? '#f59e0b' : '#cbd5e1' }}
              >
                ★
              </button>
            ))}
          </div>
          <input 
            type="text"
            placeholder="Tell us your thoughts..." 
            value={feedback.comment}
            onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
            style={{ 
              flex: 1, minWidth: '200px', height: '40px', padding: '0 15px', borderRadius: '20px', border: '1px solid var(--glass-border)',
              background: 'var(--bg-secondary)', outline: 'none', fontFamily: 'inherit', color: 'var(--text-primary)'
            }}
            required
          />
          <button type="submit" style={{ 
            background: 'linear-gradient(135deg, var(--accent-color), var(--accent-secondary))', color: '#fff', 
            padding: '8px 20px', borderRadius: '20px', fontWeight: 600, fontSize: '0.9rem'
          }}>
            Submit
          </button>
        </form>
      </div>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
            <Heart size={48} className="gradient-text" style={{ margin: '0 auto 15px' }} />
            <h2 style={{ marginBottom: '10px' }}>Sign in required</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>
              You need an account to save cities to your personalized AQI dashboard.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <button 
                onClick={() => navigate('/login')}
                style={{ background: 'var(--accent-color)', color: '#fff', padding: '12px', borderRadius: '12px', fontWeight: 600 }}
              >
                Log In
              </button>
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', padding: '12px', borderRadius: '12px', fontWeight: 600 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Chatbot />
    </div>
  );
};

export default MapComponent;
