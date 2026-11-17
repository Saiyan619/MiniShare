import { Request, Response } from "express";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/db";
import { rooms } from "../db/schema";

type Side = "A" | "B";

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};

export const authenticate = async (req: Request) => {
  const roomId = Number(req.params.roomId);
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!Number.isInteger(roomId) || roomId <= 0 || !token) return null;

  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
  if (!room || room.expiresAt.getTime() <= Date.now()) return null;

  let side: Side | null = null;
  if (safeEqual(token, room.tokenA)) side = "A";
  else if (room.tokenB && safeEqual(token, room.tokenB)) side = "B";

  return side ? { room, side } : null;
};

export const unauthorized = (res: Response) =>
  res.status(401).json({ message: "unauthorized" });