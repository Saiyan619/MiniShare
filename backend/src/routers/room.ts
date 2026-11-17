import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createRoom, deleteRoom, joinRoom } from "../controllers/room";
import { fetchMessages, sendMessage } from "../controllers/message";

const joinLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

const router = Router();
router.post("/", createRoom);
router.post("/join", joinLimiter, joinRoom);
router.delete("/:roomId", deleteRoom);
// messages
router.post("/:roomId/messages", sendMessage);
router.get("/:roomId/messages", fetchMessages);

export default router;