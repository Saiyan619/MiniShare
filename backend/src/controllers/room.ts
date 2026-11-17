import { Request, Response } from "express";
import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db/db";
import { rooms } from "../db/schema";
import { authenticate, unauthorized } from "../utils/auth";

// no 0/O, 1/I/L, so codes are easy to read off one screen and type on another
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const JOIN_WINDOW_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

const generateCode = () =>
  Array.from({ length: CODE_LENGTH }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");

const generateToken = () => crypto.randomBytes(32).toString("hex");

// Postgres unique-violation; Drizzle may wrap the driver error in `cause`
const isUniqueViolation = (error: any) => (error?.code ?? error?.cause?.code) === "23505";

export const createRoom = async (_req: Request, res: Response) => {
  try {
    const tokenA = generateToken();
    const now = Date.now();

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      try {
        const [room] = await db
          .insert(rooms)
          .values({
            code: generateCode(),
            tokenA,
            createdAt: new Date(now),
            expiresAt: new Date(now + ROOM_TTL_MS),
          })
          .returning({ id: rooms.id, code: rooms.code, token_a: rooms.tokenA });

        return res.status(201).json({ message: "share room created", room });
      } catch (error) {
        if (!isUniqueViolation(error)) throw error; // code collision -> try a new code
      }
    }

    return res.status(500).json({ message: "server error" });
  } catch (error) {
    console.error("createRoom failed:", error);
    return res.status(500).json({ message: "server error" });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const raw = req.body?.code;
    const code = typeof raw === "string" ? raw.trim().toUpperCase() : "";

    // same response for every failure so a guesser learns nothing
    const fail = () => res.status(400).json({ message: "invalid or unavailable room" });

    if (code.length !== CODE_LENGTH) return fail();

    const now = Date.now();

    // one atomic update: only succeeds if the room exists, slot B is still open,
    // the room hasn't expired, and it's still inside the 10-minute join window
    const [room] = await db
      .update(rooms)
      .set({ tokenB: generateToken() })
      .where(
        and(
          eq(rooms.code, code),
          isNull(rooms.tokenB),
          gt(rooms.expiresAt, new Date(now)),
          gt(rooms.createdAt, new Date(now - JOIN_WINDOW_MS))
        )
      )
      .returning({ id: rooms.id, token_b: rooms.tokenB });

    if (!room) return fail();

    return res.status(200).json({ message: "share room joined", room });
  } catch (error) {
    console.error("joinRoom failed:", error);
    return res.status(500).json({ message: "server error" });
  }
};


export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const auth = await authenticate(req);
    if (!auth) return unauthorized(res);

    // messages go with it, thanks to onDelete: cascade
    await db.delete(rooms).where(eq(rooms.id, auth.room.id));

    return res.status(200).json({ message: "room deleted" });
  } catch (error) {
    console.error("deleteRoom failed:", error);
    return res.status(500).json({ message: "server error" });
  }
};