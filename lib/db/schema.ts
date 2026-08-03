// ============================================
// 麻将抽卡器 · 数据库 Schema
// ============================================
//
// 数据生命周期：
// - 房间是临时的，4 人游戏结束后可以解散
// - 卡牌库固定在 data/cards.json，不存数据库
// ============================================

import {
  pgTable,
  serial,
  varchar,
  timestamp,
  jsonb,
  integer,
  index,
} from 'drizzle-orm/pg-core';

// ---------- 房间 ----------
// 一个房间 = 4 个玩家的一局麻将
export const rooms = pgTable(
  'rooms',
  {
    id: serial('id').primaryKey(),
    // 6 位房间码，例如 "A3F7K2"，用户扫码或输入进房
    code: varchar('code', { length: 8 }).notNull().unique(),
    // 房主 user_id（创建房间的人）
    ownerId: varchar('owner_id', { length: 64 }).notNull(),
    // 房间状态
    // 'waiting' = 等人阶段
    // 'skill_picking' = 抽技能卡中（4 选 1，可重选 1 次）
    // 'playing' = 展示技能卡（桌面执行效果）
    // 'finished' = 房间结束
    status: varchar('status', { length: 20 }).default('waiting').notNull(),
    // 当前局：'silver' | 'prismatic' | 'gold'
    currentMode: varchar('current_mode', { length: 20 }),
    // 局数（从 1 开始）
    round: integer('round').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    codeIdx: index('rooms_code_idx').on(t.code),
  })
);

// ---------- 房间里的玩家 ----------
// 一个房间最多 4 个玩家
export const roomPlayers = pgTable(
  'room_players',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id').references(() => rooms.id).notNull(),
    // 玩家昵称（不是账号，就是个名字）
    nickname: varchar('nickname', { length: 32 }).notNull(),
    // 房主标识
    isOwner: integer('is_owner').default(0).notNull(),
    // 加入时间
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (t) => ({
    roomIdx: index('room_players_room_idx').on(t.roomId),
  })
);

// ---------- 玩家选的卡 ----------
// 每局每个玩家选 1 张技能卡
// cardId 引用 data/cards.json 里的卡 ID（如 "gold-skill-01"）
export const playerCards = pgTable(
  'player_cards',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id').references(() => rooms.id).notNull(),
    playerId: integer('player_id').references(() => roomPlayers.id).notNull(),
    round: integer('round').notNull(), // 第几局
    // 现仅为 'skill'（保留字段兼容旧数据）
    cardType: varchar('card_type', { length: 20 }).notNull(),
    // 卡 ID（对应 lib/cards 里的 id）
    cardId: varchar('card_id', { length: 64 }).notNull(),
    // 技能卡不做次数，恒为 0（保留字段兼容旧数据）
    remainingUses: integer('remaining_uses').default(0).notNull(),
  },
  (t) => ({
    playerIdx: index('player_cards_player_idx').on(t.playerId, t.round),
  })
);

// ---------- 抽卡池快照 ----------
// 每局开始时给每个玩家发 4 张技能卡（4 选 1，可重选 1 次）
export const cardDraws = pgTable(
  'card_draws',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id').references(() => rooms.id).notNull(),
    playerId: integer('player_id').references(() => roomPlayers.id).notNull(),
    round: integer('round').notNull(),
    // 现仅为 'skill'
    drawType: varchar('draw_type', { length: 20 }).notNull(),
    // 抽到的卡 ID 列表（JSON 数组）
    cardIds: jsonb('card_ids').$type<string[]>().notNull(),
    // 玩家选中的卡 ID（抽出后，玩家还没选时为 null）
    selectedCardId: varchar('selected_card_id', { length: 64 }),
    // 本局已用重选次数（最多 1）
    rerollsUsed: integer('rerolls_used').default(0).notNull(),
  },
  (t) => ({
    playerIdx: index('card_draws_player_idx').on(t.playerId, t.round),
  })
);
