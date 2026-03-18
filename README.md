# 🌍 AQI Tracker & Air Quality Visualizer

A comprehensive, full-stack application for tracking real-time Air Quality Index (AQI) across the globe. Built with a modern **React + Vite** frontend and a robust **Node.js/Express + SQLite** backend.

## ✨ Features

- **Interactive Global Map**: Drag pins or double-click anywhere on the map to find the real-time AQI of any location. Search for specific cities using the search bar.
- **Save Favorite Cities**: Create an account to like and save specific cities. View them anytime in your personalized Dashboard.
- **City Comparisons**: Compare up to 3 cities side-by-side using beautiful Bar Charts to see PM2.5, PM10, Ozone, and NO2 pollutants at a glance.
- **Health Advisories & Voice**: Read health guidelines based on AQI levels, or use the built-in Text-To-Speech feature to have the application read the air quality out loud.
- **AeroBot Chatbot**: An integrated smart chatbot ready to answer your questions about air quality terminology and health standards.
- **Top 5 / Lowest 5 AQI Ranker**: See the most polluted and cleanest major cities in the world updated in real-time right from the home page!

---

## 📸 Screenshots
*(Take screenshots of your application and add the images to your repository to display them here!)*

- **Home Page (Global Map):** `![Home Page](./docs/home.png)`
- **User Dashboard:** `![Dashboard](./docs/dashboard.png)`
- **Compare Cities Graph:** `![Compare](./docs/compare.png)`

---

## 🛠️ Tech Stack Make-up

**Frontend:**
- React (Vite)
- React-Leaflet (Maps & Geocoding)
- Framer Motion (Animations)
- Recharts (Data Visualization)
- Lucide React (Icons)
- Vanilla CSS (Glassmorphism UI)

**Backend:**
- Node.js & Express
- SQLite (Local Database)
- JWT (User Authentication & Sessions)
- bcrypt (Password Hashing)
- Axios & WAQI/OpenWeather API (Data fetching)

---

## 🚀 Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- An API Key from WAQI or OpenWeather (for fetching AQI data).

### 2. Backend Setup
Navigate to the `server` folder, install dependencies, and start the local server:
```bash
cd server
npm install

# Create a .env file and add your secrets
echo "PORT=5000" > .env
echo "OPENWEATHER_API_KEY=your_api_key_here" >> .env
echo "JWT_SECRET=your_jwt_secret_here" >> .env

# Start the node server
npm start # or node server.js
```

### 3. Frontend Setup
Open a new terminal, navigate to the `client` folder, install dependencies, and spin up Vite:
```bash
cd client
npm install

npm run dev
```

---

## ☁️ Live Deployment

This repository is configured to be deployed automatically on **[Render](https://render.com/)** using Blueprints.

1. Connect your GitHub account to Render.
2. Click **New > Blueprint** and select this repository.
3. Render will use the included `render.yaml` file to safely and automatically deploy *both* your backend and frontend for free!
4. Provide the environment variables when prompted (`OPENWEATHER_API_KEY` & `JWT_SECRET`).

---

**Author:** [@tushar434434](https://github.com/tushar434434)
