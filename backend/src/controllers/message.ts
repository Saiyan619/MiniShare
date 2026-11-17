import { Request, Response } from "express";
import crypto from "node:crypto";
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "../db/db";
import { rooms, messages } from "../db/schema";
import { authenticate, unauthorized } from "../utils/auth";

const MAX_TEXT_LENGTH = 10_000;
const FETCH_LIMIT = 200;


export const sendMessage = async (req: Request, res: Response) => {
  try {
    const auth = await authenticate(req);
    if (!auth) return unauthorized(res);

    const text = req.body?.text;
    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ message: "text is required" });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ message: `text too long (max ${MAX_TEXT_LENGTH} characters)` });
    }

    const [message] = await db
      .insert(messages)
      .values({ roomId: auth.room.id, sender: auth.side, text })
      .returning({ id: messages.id, createdAt: messages.createdAt });

    return res.status(201).json({ message });
  } catch (error) {
    console.error("sendMessage failed:", error);
    return res.status(500).json({ message: "server error" });
  }
};

export const fetchMessages = async (req: Request, res: Response) => {
  try {
    const auth = await authenticate(req);
    if (!auth) return unauthorized(res);

    const after = Math.max(0, Number(req.query.after) || 0);

    const rows = await db
      .select({
        id: messages.id,
        sender: messages.sender,
        text: messages.text,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(and(eq(messages.roomId, auth.room.id), gt(messages.id, after)))
      .orderBy(asc(messages.id))
      .limit(FETCH_LIMIT);

    return res.status(200).json({
      messages: rows,
      you: auth.side,
      paired: auth.room.tokenB !== null,
    });
  } catch (error) {
    console.error("fetchMessages failed:", error);
    return res.status(500).json({ message: "server error" });
  }
};