// 获取房间状态（含所有玩家、当前局信息、当前玩家身份）

import { NextRequest, NextResponse } from 'next/server';
import { rooms, roomPlayers, playerCards, cardDraws } from '@/lib/db/helpers';
import { getCard } from '@/lib/cards';
import { getPlayerSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: roomCode } = await params;

    let room;
    if (/^\d+$/.test(roomCode)) {
      room = await rooms.findById(parseInt(roomCode));
    } else {
      room = await rooms.findByCode(roomCode);
    }
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 });
    }

    const session = await getPlayerSession();
    const me =
      session && session.roomCode === room.code
        ? {
            id: session.playerId,
            nickname: session.nickname,
            isOwner: session.isOwner,
          }
        : null;

    const players = await roomPlayers.listByRoom(room.id);

    const playerCardsMap: Record<number, NonNullable<ReturnType<typeof getCard>>[]> = {};
    const playerDrawsMap: Record<
      number,
      {
        skill?: {
          cards: NonNullable<ReturnType<typeof getCard>>[];
          selectedId?: string;
          rerollsUsed: number;
        };
      }
    > = {};

    if (room.status !== 'waiting' && room.round > 0) {
      for (const p of players) {
        const draws = await cardDraws.listByPlayerRound(p.id, room.round);
        for (const d of draws) {
          if (d.drawType !== 'skill') continue;
          const cards = d.cardIds
            .map((id) => getCard(id))
            .filter((c): c is NonNullable<typeof c> => Boolean(c));

          if (!playerDrawsMap[p.id]) playerDrawsMap[p.id] = {};
          playerDrawsMap[p.id].skill = {
            cards,
            selectedId: d.selectedCardId || undefined,
            rerollsUsed: d.rerollsUsed ?? 0,
          };
        }
      }

      for (const p of players) {
        const cards = await playerCards.listByPlayerRound(p.id, room.round);
        playerCardsMap[p.id] = cards
          .filter((c) => c.cardType === 'skill')
          .map((c) => getCard(c.cardId))
          .filter((c): c is NonNullable<typeof c> => Boolean(c));
      }
    }

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        status: room.status,
        currentMode: room.currentMode,
        round: room.round,
        ownerId: room.ownerId,
      },
      players: players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        isOwner: p.isOwner === 1,
      })),
      draws: playerDrawsMap,
      selectedCards: playerCardsMap,
      me,
    });
  } catch (e) {
    console.error('Get room error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
