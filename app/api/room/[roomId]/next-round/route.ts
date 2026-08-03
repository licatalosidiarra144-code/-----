// 房主开下一局：重新抽局型 + 发技能卡

import { NextRequest, NextResponse } from 'next/server';
import { rooms, roomPlayers, cardDraws } from '@/lib/db/helpers';
import { getCardsByMode, drawCards, pickGameMode } from '@/lib/cards';
import { getPlayerSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: roomCode } = await params;

    const session = await getPlayerSession();
    if (!session || session.roomCode !== roomCode) {
      return NextResponse.json({ error: '请先加入房间' }, { status: 401 });
    }
    if (!session.isOwner) {
      return NextResponse.json({ error: '只有房主能开下一局' }, { status: 403 });
    }

    const room = await rooms.findByCode(roomCode);
    if (!room) return NextResponse.json({ error: '房间不存在' }, { status: 404 });

    const newRound = room.round + 1;
    const mode = pickGameMode();

    await rooms.update(room.id, {
      status: 'skill_picking',
      currentMode: mode,
      round: newRound,
    });

    const players = await roomPlayers.listByRoom(room.id);
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

    return NextResponse.json({ success: true, mode, round: newRound });
  } catch (e) {
    console.error('Next round error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
