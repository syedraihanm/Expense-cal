import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("expenses.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/expenses", (req, res) => {
    try {
      const expenses = db.prepare("SELECT * FROM expenses ORDER BY date DESC").all();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", (req, res) => {
    const { title, amount, category, date } = req.body;
    if (!title || !amount || !category || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const info = db.prepare(
        "INSERT INTO expenses (title, amount, category, date) VALUES (?, ?, ?, ?)"
      ).run(title, amount, category, date);
      res.json({ id: info.lastInsertRowid, title, amount, category, date });
    } catch (error) {
      res.status(500).json({ error: "Failed to add expense" });
    }
  });

  app.put("/api/expenses/:id", (req, res) => {
    const { id } = req.params;
    const { title, amount, category, date } = req.body;
    try {
      db.prepare(
        "UPDATE expenses SET title = ?, amount = ?, category = ?, date = ? WHERE id = ?"
      ).run(title, amount, category, date, id);
      res.json({ id, title, amount, category, date });
    } catch (error) {
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
