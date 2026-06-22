// ============================================
// Mock 数据库（in-memory）
// ============================================
//
// 房间数据存内存里，重启进程就没了。
// 适合本地演示和 MVP 阶段。
// ============================================

import { rooms as roomsTable, roomPlayers as roomPlayersTable, playerCards as playerCardsTable, cardDraws as cardDrawsTable } from './schema';

type Room = typeof roomsTable.$inferSelect & { id: number };
type RoomPlayer = typeof roomPlayersTable.$inferSelect & { id: number };
type PlayerCard = typeof playerCardsTable.$inferSelect & { id: number };
type CardDraw = typeof cardDrawsTable.$inferSelect & { id: number };

const _rooms: Room[] = [];
const _roomPlayers: RoomPlayer[] = [];
const _playerCards: PlayerCard[] = [];
const _cardDraws: CardDraw[] = [];

let nextId = {
  rooms: 1000,
  roomPlayers: 1,
  playerCards: 1,
  cardDraws: 1,
};

export const mockDb = {
  rooms: {
    create: async (data: Partial<Room>): Promise<Room> => {
      const r = {
        id: nextId.rooms++,
        code: data.code!,
        ownerId: data.ownerId!,
        status: data.status || 'waiting',
        currentMode: data.currentMode || null,
        round: data.round || 0,
        createdAt: new Date(),
      } as Room;
      _rooms.push(r);
      return r;
    },
    findByCode: async (code: string): Promise<Room | null> => {
      return _rooms.find((r) => r.code === code) || null;
    },
    findById: async (id: number): Promise<Room | null> => {
      return _rooms.find((r) => r.id === id) || null;
    },
    update: async (id: number, data: Partial<Room>): Promise<Room | null> => {
      const r = _rooms.find((x) => x.id === id);
      if (r) Object.assign(r, data);
      return r || null;
    },
  },

  roomPlayers: {
    create: async (data: Partial<RoomPlayer>): Promise<RoomPlayer> => {
      const p = {
        id: nextId.roomPlayers++,
        roomId: data.roomId!,
        nickname: data.nickname!,
        isOwner: data.isOwner ?? 0,
        joinedAt: new Date(),
      } as RoomPlayer;
      _roomPlayers.push(p);
      return p;
    },
    listByRoom: async (roomId: number): Promise<RoomPlayer[]> => {
      return _roomPlayers
        .filter((p) => p.roomId === roomId)
        .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
    },
    findById: async (id: number): Promise<RoomPlayer | null> => {
      return _roomPlayers.find((p) => p.id === id) || null;
    },
    count: async (roomId: number): Promise<number> => {
      return _roomPlayers.filter((p) => p.roomId === roomId).length;
    },
  },

  playerCards: {
    create: async (data: Partial<PlayerCard>): Promise<PlayerCard> => {
      const c = {
        id: nextId.playerCards++,
        roomId: data.roomId!,
        playerId: data.playerId!,
        round: data.round!,
        cardType: data.cardType!,
        cardId: data.cardId!,
        remainingUses: data.remainingUses ?? 0,
      } as PlayerCard;
      _playerCards.push(c);
      return c;
    },
    listByPlayerRound: async (
      playerId: number,
      round: number
    ): Promise<PlayerCard[]> => {
      return _playerCards.filter(
        (c) => c.playerId === playerId && c.round === round
      );
    },
    findByPlayerAndCard: async (
      playerId: number,
      cardId: string
    ): Promise<PlayerCard | null> => {
      return (
        _playerCards.find(
          (c) => c.playerId === playerId && c.cardId === cardId
        ) || null
      );
    },
    updateUses: async (
      id: number,
      remainingUses: number
    ): Promise<PlayerCard | null> => {
      const c = _playerCards.find((x) => x.id === id);
      if (c) c.remainingUses = remainingUses;
      return c || null;
    },
  },

  cardDraws: {
    create: async (data: Partial<CardDraw>): Promise<CardDraw> => {
      const d = {
        id: nextId.cardDraws++,
        roomId: data.roomId!,
        playerId: data.playerId!,
        round: data.round!,
        drawType: data.drawType!,
        cardIds: data.cardIds!,
        selectedCardId: data.selectedCardId || null,
      } as CardDraw;
      _cardDraws.push(d);
      return d;
    },
    listByPlayerRound: async (
      playerId: number,
      round: number
    ): Promise<CardDraw[]> => {
      return _cardDraws.filter(
        (d) => d.playerId === playerId && d.round === round
      );
    },
    listByRoomRound: async (
      roomId: number,
      round: number
    ): Promise<CardDraw[]> => {
      return _cardDraws.filter(
        (d) => d.roomId === roomId && d.round === round
      );
    },
    updateSelected: async (
      id: number,
      selectedCardId: string
    ): Promise<CardDraw | null> => {
      const d = _cardDraws.find((x) => x.id === id);
      if (d) d.selectedCardId = selectedCardId;
      return d || null;
    },
  },
};
