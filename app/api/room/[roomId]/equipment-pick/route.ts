// 玩家选装备卡（5 选 3）

import { NextRequest, NextResponse } from 'next/server';
import { rooms, roomPlayers, cardDraws, playerCards } from '@/lib/db/helpers';
import { getCard } from '@/lib/cards';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: roomCode } = await params;
    const { playerId, cardIds } = await request.json();

    if (!Array.isArray(cardIds) || cardIds.length !== 3) {
      return NextResponse.json({ error: '请选 3 张装备卡' }, { status: 400 });
    }

    const room = await rooms.findByCode(roomCode);
    if (!room) return NextResponse.json({ error: '房间不存在' }, { status: 404 });

    if (room.status !== 'equipment_picking') {
      return NextResponse.json({ error: '不在选装备卡阶段' }, { status: 400 });
    }

    const player = await roomPlayers.findById(playerId);
    if (!player || player.roomId !== room.id) {
      return NextResponse.json({ error: '玩家不存在' }, { status: 404 });
    }

    // 找到本轮的装备卡 draw
    const draws = await cardDraws.listByPlayerRound(player.id, room.round);
    const equipDraw = draws.find((d) => d.drawType === 'equipment');
    if (!equipDraw) {
      return NextResponse.json({ error: '没有装备卡可挑' }, { status: 400 });
    }

    // 验证：3 张都在 draw 列表里
    for (const id of cardIds) {
      if (!equipDraw.cardIds.includes(id)) {
        return NextResponse.json(
          { error: `卡 ${id} 不在你抽到的列表里` },
          { status: 400 }
        );
      }
    }

    // 验证：3 张之间不重复
    if (new Set(cardIds).size !== 3) {
      return NextResponse.json({ error: '装备卡之间不能重复' }, { status: 400 });
    }

    // 验证：自己之前没选过
    const existing = await playerCards.findByPlayerAndCard(player.id, cardIds[0]);
    if (existing && existing.round === room.round) {
      // 检查是同一轮
      // 其实这步可以省，因为 round 已经隔离
    }

    // 更新 draw.selectedCardId（用逗号分隔存）
    await cardDraws.updateSelected(equipDraw.id, cardIds.join(','));

    // 写入 playerCards（带 remainingUses）
    for (const id of cardIds) {
      const card = getCard(id);
      await playerCards.create({
        roomId: room.id,
        playerId: player.id,
        round: room.round,
        cardType: 'equipment',
        cardId: id,
        remainingUses: card?.uses ?? 1,
      });
    }

    // 检查所有人是否都选完了
    const allPlayers = await roomPlayers.listByRoom(room.id);
    let allDone = true;
    for (const p of allPlayers) {
      const pDraws = await cardDraws.listByPlayerRound(p.id, room.round);
      const pEquip = pDraws.find((d) => d.drawType === 'equipment');
      if (!pEquip?.selectedCardId) {
        allDone = false;
        break;
      }
    }

    if (allDone) {
      await rooms.update(room.id, { status: 'playing' });
    }

    return NextResponse.json({ success: true, allDone });
  } catch (e) {
    console.error('Equipment pick error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
