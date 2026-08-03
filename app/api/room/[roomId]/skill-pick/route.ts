// 玩家选技能卡（4 选 1）；全员选完 → playing

import { NextRequest, NextResponse } from 'next/server';
import { rooms, roomPlayers, cardDraws, playerCards } from '@/lib/db/helpers';
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

    if (room.status !== 'skill_picking') {
      return NextResponse.json({ error: '不在选技能卡阶段' }, { status: 400 });
    }

    const player = await roomPlayers.findById(session.playerId);
    if (!player || player.roomId !== room.id) {
      return NextResponse.json({ error: '玩家不存在' }, { status: 404 });
    }

    const draws = await cardDraws.listByPlayerRound(player.id, room.round);
    const skillDraw = draws.find((d) => d.drawType === 'skill');
    if (!skillDraw) {
      return NextResponse.json({ error: '没有技能卡可选' }, { status: 400 });
    }

    if (skillDraw.selectedCardId) {
      return NextResponse.json({ error: '你已经选过了' }, { status: 400 });
    }

    if (!skillDraw.cardIds.includes(cardId)) {
      return NextResponse.json({ error: '这张卡不在你抽到的列表里' }, { status: 400 });
    }

    await cardDraws.updateSelected(skillDraw.id, cardId);

    await playerCards.create({
      roomId: room.id,
      playerId: player.id,
      round: room.round,
      cardType: 'skill',
      cardId,
      remainingUses: 0,
    });

    const allPlayers = await roomPlayers.listByRoom(room.id);
    let allDone = true;
    for (const p of allPlayers) {
      const pDraws = await cardDraws.listByPlayerRound(p.id, room.round);
      const pSkill = pDraws.find((d) => d.drawType === 'skill');
      if (!pSkill?.selectedCardId) {
        allDone = false;
        break;
      }
    }

    if (allDone) {
      await rooms.update(room.id, { status: 'playing' });
    }

    return NextResponse.json({ success: true, allDone });
  } catch (e) {
    console.error('Skill pick error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
