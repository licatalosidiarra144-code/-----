// ============================================
// 麻将抽卡器 · 数据库 Schema
// ============================================
//
// 数据生命周期：
// - 房间是临时的，4 人游戏结束后可以解散
// - 卡牌库是固定的（30 张），不存数据库，写在 lib/cards 下面
// ============================================

import {
  pgTable,
  serial,
  varchar,
  text,
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
    // 6 位数字房间码，例如 "A3F7K2"，用户扫码或输入进房
    code: varchar('code', { length: 8 }).notNull().unique(),
    // 房主 user_id（创建房间的人）
    ownerId: varchar('owner_id', { length: 64 }).notNull(),
    // 房间状态
    // 'waiting' = 等人阶段
    // 'skill_picking' = 抽技能卡中
    // 'equipment_picking' = 抽装备卡中
    // 'playing' = 展示 + 装备使用阶段
    // 'finished' = 房间结束
    status: varchar('status', { length: 20 }).default('waiting').notNull(),
    // 当前局：'gold'（金）| 'rainbow'（彩）
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
// 每局每个玩家会选：1 张技能卡 + 3 张装备卡
// cardId 引用 lib/cards 里的卡 ID（字符串，如 "gold-skill-001"）
export const playerCards = pgTable(
  'player_cards',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id').references(() => rooms.id).notNull(),
    playerId: integer('player_id').references(() => roomPlayers.id).notNull(),
    round: integer('round').notNull(), // 第几局
    // 'skill' | 'equipment'
    cardType: varchar('card_type', { length: 20 }).notNull(),
    // 卡 ID（对应 lib/cards 里的 id）
    cardId: varchar('card_id', { length: 64 }).notNull(),
    // 装备卡的剩余使用次数
    // 技能卡永远是 0（用不到这个字段）
    remainingUses: integer('remaining_uses').default(0).notNull(),
  },
  (t) => ({
    playerIdx: index('player_cards_player_idx').on(t.playerId, t.round),
  })
);

// ---------- 抽卡池快照 ----------
// 每局开始时给每个玩家发的卡（4 张技能卡选 1，5 张装备卡选 3）
// 存下来是为了"展示阶段"让玩家看到自己选过什么
export const cardDraws = pgTable(
  'card_draws',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id').references(() => rooms.id).notNull(),
    playerId: integer('player_id').references(() => roomPlayers.id).notNull(),
    round: integer('round').notNull(),
    // 抽卡类型：'skill' | 'equipment'
    drawType: varchar('draw_type', { length: 20 }).notNull(),
    // 抽到的卡 ID 列表（JSON 数组）
    // 例如 ["gold-skill-001", "gold-skill-003", "gold-skill-005", "gold-skill-008"]
    cardIds: jsonb('card_ids').$type<string[]>().notNull(),
    // 玩家选中的卡 ID（抽出后，玩家还没选时为 null）
    selectedCardId: varchar('selected_card_id', { length: 64 }),
  },
  (t) => ({
    playerIdx: index('card_draws_player_idx').on(t.playerId, t.round),
  })
);
