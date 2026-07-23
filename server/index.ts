import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createAdminDataStore } from "./routes/admin";

export function createServer() {
  const app = express();
  const adminStore = createAdminDataStore();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.get("/api/admin/data", async (_req, res) => {
    try {
      const data = await adminStore.load();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to load admin data" });
    }
  });

  app.put("/api/admin/data", async (req, res) => {
    try {
      await adminStore.save(req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to save admin data" });
    }
  });

  return app;
}
