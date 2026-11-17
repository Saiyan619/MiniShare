import { pgTable, serial, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  tokenA: text("token_a").notNull(),
  tokenB: text("token_b"), // null = slot open, code still works
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    roomId: integer("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    sender: varchar("sender", { length: 1 }).notNull(), // 'A' or 'B'
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("messages_room_idx").on(t.roomId, t.id)]
);