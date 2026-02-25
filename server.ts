import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("worknearby.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT CHECK(role IN ('worker', 'employer')) NOT NULL,
    lat REAL,
    lng REAL,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/users", (req, res) => {
    const { id, name, role, lat, lng } = req.body;
    const stmt = db.prepare("INSERT OR REPLACE INTO users (id, name, role, lat, lng, last_active) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)");
    stmt.run(id, name, role, lat, lng);
    res.json({ success: true });
  });

  app.post("/api/posts", (req, res) => {
    const { id, userId, title, description, category, lat, lng } = req.body;
    const stmt = db.prepare("INSERT INTO posts (id, user_id, title, description, category, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run(id, userId, title, description, category, lat, lng);
    res.json({ success: true });
  });

  app.get("/api/posts/nearby", (req, res) => {
    const { lat, lng, radius = 50 } = req.query; // radius in km
    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);

    // Simple distance calculation in SQL (Haversine approximation)
    // 6371 is Earth's radius in km
    const stmt = db.prepare(`
      SELECT p.*, u.name as user_name,
      (6371 * acos(cos(radians(?)) * cos(radians(p.lat)) * cos(radians(p.lng) - radians(?)) + sin(radians(?)) * sin(radians(p.lat)))) AS distance
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE distance < ?
      ORDER BY distance ASC
    `);
    
    const posts = stmt.all(userLat, userLng, userLat, radius);
    res.json(posts);
  });

  app.get("/api/workers/nearby", (req, res) => {
    const { lat, lng, radius = 50 } = req.query;
    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);

    const stmt = db.prepare(`
      SELECT *,
      (6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) AS distance
      FROM users
      WHERE role = 'worker' AND distance < ?
      ORDER BY distance ASC
    `);
    
    const workers = stmt.all(userLat, userLng, userLat, radius);
    res.json(workers);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
