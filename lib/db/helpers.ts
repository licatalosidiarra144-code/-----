// ============================================
// 统一数据库访问层
// ============================================

import { isMockMode, getDb, schema } from './index';
import { mockDb } from './mock';
import { eq, and } from 'drizzle-orm';

const db = isMockMode ? null : getDb();

export const realDb = {
  rooms: {
    create: async (data: typeof schema.rooms.$inferInsert) => {
      if (!db) return null;
      const r = await db.insert(schema.rooms).values(data).returning();
      return r[0];
    },
    findByCode: async (code: string) => {
      if (!db) return null;
      const r = await db
        .select()
        .from(schema.rooms)
        .where(eq(schema.rooms.code, code))
        .limit(1);
      return r[0] || null;
    },
    findById: async (id: number) => {
      if (!db) return null;
      const r = await db
        .select()
        .from(schema.rooms)
        .where(eq(schema.rooms.id, id))
        .limit(1);
      return r[0] || null;
    },
    update: async (id: number, data: Partial<typeof schema.rooms.$inferInsert>) => {
      if (!db) return null;
      const r = await db
        .update(schema.rooms)
        .set(data)
        .where(eq(schema.rooms.id, id))
        .returning();
      return r[0];
    },
  },
  roomPlayers: {
    create: async (data: typeof schema.roomPlayers.$inferInsert) => {
      if (!db) return null;
      const r = await db.insert(schema.roomPlayers).values(data).returning();
      return r[0];
    },
    listByRoom: async (roomId: number) => {
      if (!db) return [];
      return db
        .select()
        .from(schema.roomPlayers)
        .where(eq(schema.roomPlayers.roomId, roomId))
        .orderBy(schema.roomPlayers.joinedAt);
    },
    findById: async (id: number) => {
      if (!db) return null;
      const r = await db
        .select()
        .from(schema.roomPlayers)
        .where(eq(schema.roomPlayers.id, id))
        .limit(1);
      return r[0] || null;
    },
    count: async (roomId: number) => {
      if (!db) return 0;
      const r = await db
        .select()
        .from(schema.roomPlayers)
        .where(eq(schema.roomPlayers.roomId, roomId));
      return r.length;
    },
  },
  playerCards: {
    create: async (data: typeof schema.playerCards.$inferInsert) => {
      if (!db) return null;
      const r = await db.insert(schema.playerCards).values(data).returning();
      return r[0];
    },
    listByPlayerRound: async (playerId: number, round: number) => {
      if (!db) return [];
      return db
        .select()
        .from(schema.playerCards)
        .where(
          and(
            eq(schema.playerCards.playerId, playerId),
            eq(schema.playerCards.round, round)
          )
        );
    },
    findByPlayerAndCard: async (playerId: number, cardId: string) => {
      if (!db) return null;
      const r = await db
        .select()
        .from(schema.playerCards)
        .where(
          and(
            eq(schema.playerCards.playerId, playerId),
            eq(schema.playerCards.cardId, cardId)
          )
        )
        .limit(1);
      return r[0] || null;
    },
    updateUses: async (id: number, remainingUses: number) => {
      if (!db) return null;
      const r = await db
        .update(schema.playerCards)
        .set({ remainingUses })
        .where(eq(schema.playerCards.id, id))
        .returning();
      return r[0];
    },
  },
  cardDraws: {
    create: async (data: typeof schema.cardDraws.$inferInsert) => {
      if (!db) return null;
      const r = await db.insert(schema.cardDraws).values(data).returning();
      return r[0];
    },
    listByPlayerRound: async (playerId: number, round: number) => {
      if (!db) return [];
      return db
        .select()
        .from(schema.cardDraws)
        .where(
          and(
            eq(schema.cardDraws.playerId, playerId),
            eq(schema.cardDraws.round, round)
          )
        );
    },
    listByRoomRound: async (roomId: number, round: number) => {
      if (!db) return [];
      return db
        .select()
        .from(schema.cardDraws)
        .where(
          and(
            eq(schema.cardDraws.roomId, roomId),
            eq(schema.cardDraws.round, round)
          )
        );
    },
    updateSelected: async (id: number, selectedCardId: string) => {
      if (!db) return null;
      const r = await db
        .update(schema.cardDraws)
        .set({ selectedCardId })
        .where(eq(schema.cardDraws.id, id))
        .returning();
      return r[0];
    },
  },
};

export const rooms = isMockMode ? mockDb.rooms : realDb.rooms;
export const roomPlayers = isMockMode ? mockDb.roomPlayers : realDb.roomPlayers;
export const playerCards = isMockMode ? mockDb.playerCards : realDb.playerCards;
export const cardDraws = isMockMode ? mockDb.cardDraws : realDb.cardDraws;
export { isMockMode };
