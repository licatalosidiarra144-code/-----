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

    // 房间码可能是数字 ID，也可能是 6 位字母码
    let room;
    if (/^\d+$/.test(roomCode)) {
      room = await rooms.findById(parseInt(roomCode));
    } else {
      room = await rooms.findByCode(roomCode);
    }
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 });
    }

    // 从 cookie 取当前玩家身份
    const session = await getPlayerSession();
    const me = session && session.roomCode === room.code
      ? {
          id: session.playerId,
          nickname: session.nickname,
          isOwner: session.isOwner,
        }
      : null;

    const players = await roomPlayers.listByRoom(room.id);
    const playerCount = players.length;

    // 收集所有玩家的卡（如果有的话）
    const playerCardsMap: Record<number, ReturnType<typeof getCard>[]> = {};
    const playerCardUsesMap: Record<number, Record<string, number>> = {};
    const playerDrawsMap: Record<
      number,
      { skill?: { cards: ReturnType<typeof getCard>[]; selectedId?: string }; equipment?: { cards: ReturnType<typeof getCard>[]; selectedIds: string[] } }
    > = {};

    if (room.status !== 'waiting' && room.round > 0) {
      for (const p of players) {
        const draws = await cardDraws.listByPlayerRound(p.id, room.round);
        for (const d of draws) {
          const cards = d.cardIds
            .map((id) => getCard(id))
            .filter((c): c is NonNullable<typeof c> => Boolean(c));

          if (!playerDrawsMap[p.id]) playerDrawsMap[p.id] = { skill: undefined, equipment: undefined } as any;
          if (d.drawType === 'skill') {
            playerDrawsMap[p.id].skill = {
              cards,
              selectedId: d.selectedCardId || undefined,
            };
          } else if (d.drawType === 'equipment') {
            playerDrawsMap[p.id].equipment = {
              cards,
              selectedIds: d.selectedCardId
                ? d.selectedCardId.split(',')
                : [],
            };
          }
        }
      }

      // 已选中的卡 + 剩余次数
      for (const p of players) {
        const cards = await playerCards.listByPlayerRound(p.id, room.round);
        playerCardsMap[p.id] = cards
          .map((c) => getCard(c.cardId))
          .filter((c): c is NonNullable<typeof c> => Boolean(c));
        playerCardUsesMap[p.id] = cards.reduce(
          (acc, c) => ({ ...acc, [c.cardId]: c.remainingUses }),
          {} as Record<string, number>
        );
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
      cardUses: playerCardUsesMap,
      me, // 新增：从 cookie 读到的「我」
    });
  } catch (e) {
    console.error('Get room error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}