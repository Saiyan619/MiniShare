import { and, isNull, lte, or } from "drizzle-orm";
import { db } from "../db/db";
import { rooms } from "../db/schema";

const INTERVAL_MS = 10 * 60 * 1000;
const JOIN_WINDOW_MS = 10 * 60 * 1000;

const cleanup = async () => {
  try {
    const now = Date.now();
    const removed = await db
      .delete(rooms)
      .where(
        or(
          // expired rooms
          lte(rooms.expiresAt, new Date(now)),
          // rooms nobody joined within the join window (frees their codes)
          and(isNull(rooms.tokenB), lte(rooms.createdAt, new Date(now - JOIN_WINDOW_MS)))
        )
      )
      .returning({ id: rooms.id });

    if (removed.length > 0) console.log(`cleanup: removed ${removed.length} room(s)`);
  } catch (error) {
    console.error("cleanup failed:", error); // never crash the server over this
  }
};

export const startCleanup = () => {
  cleanup(); // once at startup
  setInterval(cleanup, INTERVAL_MS);
};