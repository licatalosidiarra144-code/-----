// 技能卡重选一次（允许与上一轮重复）

import { NextRequest, NextResponse } from 'next/server';
import { rooms, roomPlayers, cardDraws } from '@/lib/db/helpers';
import { drawCards, getCardsByMode, type GameMode } from '@/lib/cards';
import { getPlayerSessionFromAny } from '@/lib/session-header';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: roomCode } = await params;

    const session = await getPlayerSessionFromAny(request, roomCode);
    if (!session || session.roomCode !== roomCode) {
      return NextResponse.json({ error: '请先加入房间' }, { status: 401 });
    }

    const room = await rooms.findByCode(roomCode);
    if (!room) return NextResponse.json({ error: '房间不存在' }, { status: 404 });

    if (room.status !== 'skill_picking') {
      return NextResponse.json({ error: '不在选技能卡阶段' }, { status: 400 });
    }

    if (!room.currentMode) {
      return NextResponse.json({ error: '局型未确定' }, { status: 400 });
    }

    const player = await roomPlayers.findById(session.playerId);
    if (!player || player.roomId !== room.id) {
      return NextResponse.json({ error: '玩家不存在' }, { status: 404 });
    }

    const draws = await cardDraws.listByPlayerRound(player.id, room.round);
    const skillDraw = draws.find((d) => d.drawType === 'skill');
    if (!skillDraw) {
      return NextResponse.json({ error: '没有技能卡可重选' }, { status: 400 });
    }

    if (skillDraw.selectedCardId) {
      return NextResponse.json({ error: '已经选定，不能再重选' }, { status: 400 });
    }

    const used = skillDraw.rerollsUsed ?? 0;
    if (used >= 1) {
      return NextResponse.json({ error: '本局重选次数已用完' }, { status: 400 });
    }

    const pool = getCardsByMode(room.currentMode as GameMode, 'skill');
    const cards = drawCards(pool, 4);
    await cardDraws.updateOffer(
      skillDraw.id,
      cards.map((c) => c.id),
      used + 1
    );

    return NextResponse.json({
      success: true,
      cardIds: cards.map((c) => c.id),
      rerollsUsed: used + 1,
    });
  } catch (e) {
    console.error('Skill reroll error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
