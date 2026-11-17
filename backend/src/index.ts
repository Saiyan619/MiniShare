import "dotenv/config";
import express from "express";
import cors from "cors";
import roomRoutes from "./routers/room"; // adjust to your path
import { startCleanup } from "./job/cleanup";

const app = express();

// needed on Render/Fly so the rate limiter sees real client IPs
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173", // Vite's default port
  })
);
app.use(express.json({ limit: "100kb" })); // messages are capped at 10k chars, so this is plenty

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/rooms", roomRoutes);
app.use("/:roomId/messages", roomRoutes);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`server running on port ${port}`);
  startCleanup();
});