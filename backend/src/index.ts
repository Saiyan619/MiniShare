import "dotenv/config";
import express from "express";
import cors from "cors";
import roomRoutes from "./routers/room"; // adjust to your path
import { startCleanup } from "./job/cleanup";

const app = express();

// needed on Render/Fly so the rate limiter sees real client IPs
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "https://minshare.vercel.app",
  ...(process.env.CLIENT_ORIGIN?.split(",").map((origin) => origin.trim()) ?? []),
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
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