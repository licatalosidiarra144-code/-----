// 玩家选技能卡

import { NextRequest, NextResponse } from 'next/server';
import { rooms, roomPlayers, cardDraws, playerCards } from '@/lib/db/helpers';
import { getCard } from '@/lib/cards';
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

    // 找到本轮的技能卡 draw
    const draws = await cardDraws.listByPlayerRound(player.id, room.round);
    const skillDraw = draws.find((d) => d.drawType === 'skill');
    if (!skillDraw) {
      return NextResponse.json({ error: '没有技能卡可选' }, { status: 400 });
    }

    // 验证选中的卡在 draw 列表里
    if (!skillDraw.cardIds.includes(cardId)) {
      return NextResponse.json({ error: '这张卡不在你抽到的列表里' }, { status: 400 });
    }

    // 更新 draw.selectedCardId
    await cardDraws.updateSelected(skillDraw.id, cardId);

    // 写入 playerCards（技能卡的 remainingUses = 0）
    await playerCards.create({
      roomId: room.id,
      playerId: player.id,
      round: room.round,
      cardType: 'skill',
      cardId,
      remainingUses: 0,
    });

    // 检查所有人是否都选完了
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
      // 推进到抽装备卡阶段
      const { getCardsByMode, drawCards } = await import('@/lib/cards');
      const equipPool = getCardsByMode(room.currentMode as 'gold' | 'rainbow', 'equipment');

      for (const p of allPlayers) {
        const cards = drawCards(equipPool, 5);
        await cardDraws.create({
          roomId: room.id,
          playerId: p.id,
          round: room.round,
          drawType: 'equipment',
          cardIds: cards.map((c) => c.id),
        });
      }
      await rooms.update(room.id, { status: 'equipment_picking' });
    }

    return NextResponse.json({ success: true, allDone });
  } catch (e) {
    console.error('Skill pick error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}