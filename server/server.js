const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Database DB
const initDb = async () => {
    try {
        const fs = require('fs');
        const schema = fs.readFileSync('./schema.sql', 'utf8');
        const database = await db.getDb();
        await database.exec(schema);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database. Ensure permissions are correct.', err.message);
    }
};

initDb();

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const result = await db.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
            [username, passwordHash]
        );
        
        const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// --- AQI Proxy Route ---
app.get('/api/aqi', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'lat and lon are required' });
    }
    
    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        // The key provided is 40 chars, which is a WAQI API token.
        const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'ok') {
            const aqiValue = data.data.aqi === '-' ? 0 : data.data.aqi;
            res.json({
                list: [{
                    main: { aqi: aqiValue },
                    components: {
                        pm2_5: data.data.iaqi?.pm25?.v || 0,
                        pm10: data.data.iaqi?.pm10?.v || 0,
                        o3: data.data.iaqi?.o3?.v || 0,
                        no2: data.data.iaqi?.no2?.v || 0
                    }
                }]
            });
        } else {
            console.error('WAQI API error:', data.data);
            res.status(400).json({ error: 'Failed to fetch AQI data from WAQI' });
        }
    } catch (err) {
        console.error('Error fetching AQI:', err);
        res.status(500).json({ error: 'Failed to fetch AQI data' });
    }
});

// --- Chatbot Route (Mock Rule-based) ---
app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    const lowerMessage = message.toLowerCase();
    
    let reply = "I'm a simple AQI bot. I can help answer questions about Air Quality Index. Try asking about 'Good AQI', 'Bad AQI', or 'PM2.5'.";
    
    if (lowerMessage.includes('good aqi')) {
        reply = "An AQI between 1 and 2 is considered Good or Fair by OpenWeather standards. PM2.5 levels are very low, making it ideal for outdoor activities.";
    } else if (lowerMessage.includes('bad aqi') || lowerMessage.includes('poor')) {
        reply = "An AQI of 4 or 5 indicates Poor or Very Poor air quality. It's recommended to stay indoors or wear a mask if you need to go outside.";
    } else if (lowerMessage.includes('pm2.5') || lowerMessage.includes('pm 2.5')) {
        reply = "PM2.5 refers to fine particulate matter that is 2.5 microns or less in diameter. It can penetrate deeply into the respiratory tract and even enter the bloodstream.";
    }
    
    res.json({ reply });
});

// --- Saved Cities Routes ---
app.post('/api/cities/save', verifyToken, async (req, res) => {
    const { city_name, lat, lon } = req.body;
    const userId = req.user.userId;

    if (!city_name || !lat || !lon) {
        return res.status(400).json({ error: 'City name, lat, and lon are required' });
    }

    try {
        await db.query(
            'INSERT INTO saved_cities (user_id, city_name, lat, lon) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, city_name) DO NOTHING',
            [userId, city_name, lat, lon]
        );
        res.json({ success: true, message: 'City saved successfully' });
    } catch (err) {
        console.error('Error saving city:', err);
        res.status(500).json({ error: 'Failed to save city' });
    }
});

app.get('/api/cities', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const result = await db.query('SELECT city_name, lat, lon FROM saved_cities WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching saved cities:', err);
        res.status(500).json({ error: 'Failed to fetch saved cities' });
    }
});

app.delete('/api/cities/:name', verifyToken, async (req, res) => {
    const userId = req.user.userId;
    const cityName = req.params.name;
    try {
        await db.query('DELETE FROM saved_cities WHERE user_id = ? AND city_name = ?', [userId, cityName]);
        res.json({ success: true, message: 'City removed successfully' });
    } catch (err) {
        console.error('Error deleting city:', err);
        res.status(500).json({ error: 'Failed to remove city' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
