// 使用装备卡（变灰 - remainingUses -1）

import { NextRequest, NextResponse } from 'next/server';
import { rooms, roomPlayers, playerCards } from '@/lib/db/helpers';
import { getPlayerSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: roomCode } = await params;
    const { cardId } = await request.json();

    const session = await getPlayerSession();
    if (!session || session.roomCode !== roomCode) {
      return NextResponse.json({ error: '请先加入房间' }, { status: 401 });
    }

    const room = await rooms.findByCode(roomCode);
    if (!room) return NextResponse.json({ error: '房间不存在' }, { status: 404 });

    if (room.status !== 'playing') {
      return NextResponse.json({ error: '游戏未在进行中' }, { status: 400 });
    }

    const player = await roomPlayers.findById(session.playerId);
    if (!player || player.roomId !== room.id) {
      return NextResponse.json({ error: '玩家不存在' }, { status: 404 });
    }

    // 找到这张 playerCard
    const playerCard = await playerCards.findByPlayerAndCard(player.id, cardId);
    if (!playerCard || playerCard.round !== room.round) {
      return NextResponse.json({ error: '你没有这张卡' }, { status: 404 });
    }
    if (playerCard.cardType !== 'equipment') {
      return NextResponse.json({ error: '技能卡不能"使用"，是永久被动' }, { status: 400 });
    }
    if (playerCard.remainingUses <= 0) {
      return NextResponse.json({ error: '这张卡已经用完了' }, { status: 400 });
    }

    // 扣减
    const updated = await playerCards.updateUses(
      playerCard.id,
      playerCard.remainingUses - 1
    );

    return NextResponse.json({
      success: true,
      remainingUses: updated?.remainingUses ?? 0,
    });
  } catch (e) {
    console.error('Use card error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}