// 房主开始游戏：随机选模式 + 给每人发技能卡

import { NextRequest, NextResponse } from 'next/server';
import { rooms, roomPlayers, cardDraws } from '@/lib/db/helpers';
import { drawCards, getCardsByMode, CardType } from '@/lib/cards';
import { getPlayerSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: roomCode } = await params;

    // 身份校验：从 cookie 读，且必须是本房间的房主
    const session = await getPlayerSession();
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

    // 随机选模式：金 or 彩
    const mode = Math.random() < 0.5 ? 'gold' : 'rainbow';
    const newRound = room.round + 1;

    await rooms.update(room.id, {
      status: 'skill_picking',
      currentMode: mode,
      round: newRound,
    });

    // 给每人抽 4 张技能卡
    const skillPool = getCardsByMode(mode, 'skill' as CardType);
    for (const p of players) {
      const cards = drawCards(skillPool, 4);
      await cardDraws.create({
        roomId: room.id,
        playerId: p.id,
        round: newRound,
        drawType: 'skill',
        cardIds: cards.map((c) => c.id),
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