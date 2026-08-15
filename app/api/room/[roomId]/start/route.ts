// 房主开始游戏：按概率选局型 + 给每人发技能卡（4 选 1）

import { NextRequest, NextResponse } from 'next/server';
import { rooms, roomPlayers, cardDraws } from '@/lib/db/helpers';
import { drawCards, getCardsByMode, pickGameMode } from '@/lib/cards';
import { getPlayerSessionFromAny } from '@/lib/session-header';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: roomCode } = await params;

    const session = await getPlayerSessionFromAny(request, roomCode);
    if (!session || session.roomCode !== roomCode) {
      return NextResponse.json({ error: '请先加入房间' }, { status: 401 });
    }
    if (!session.isOwner) {
      return NextResponse.json({ error: '只有房主能开始' }, { status: 403 });
    }

    const room = await rooms.findByCode(roomCode);
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 });
    }
    if (room.status !== 'waiting') {
      return NextResponse.json({ error: '游戏已开始' }, { status: 400 });
    }

    const players = await roomPlayers.listByRoom(room.id);
    if (players.length !== 4) {
      return NextResponse.json(
        { error: `需要 4 人在场，当前 ${players.length} 人` },
        { status: 400 }
      );
    }

    const mode = pickGameMode();
    const newRound = room.round + 1;

    await rooms.update(room.id, {
      status: 'skill_picking',
      currentMode: mode,
      round: newRound,
    });

    const skillPool = getCardsByMode(mode, 'skill');
    for (const p of players) {
      const cards = drawCards(skillPool, 4);
      await cardDraws.create({
        roomId: room.id,
        playerId: p.id,
        round: newRound,
        drawType: 'skill',
        cardIds: cards.map((c) => c.id),
        rerollsUsed: 0,
      });
    }

    return NextResponse.json({
      success: true,
      mode,
      round: newRound,
    });
  } catch (e) {
    console.error('Start game error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
