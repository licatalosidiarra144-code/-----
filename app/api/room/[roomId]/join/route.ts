// 加入房间（含中途退出后用原昵称重进）

import { NextRequest, NextResponse } from 'next/server';
import { rooms, roomPlayers } from '@/lib/db/helpers';
import { setPlayerSession } from '@/lib/session';
import { decideJoin } from '@/lib/room-join';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: roomCode } = await params;
    const { nickname } = await request.json();

    const room = await rooms.findByCode(roomCode);
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 });
    }

    const players = await roomPlayers.listByRoom(room.id);
    const decision = decideJoin({
      roomStatus: room.status,
      playerCount: players.length,
      nickname: typeof nickname === 'string' ? nickname : '',
      existingPlayers: players,
    });

    if (decision.action === 'reject') {
      return NextResponse.json(
        { error: decision.error },
        { status: decision.status }
      );
    }

    if (decision.action === 'rejoin') {
      const p = decision.player;
      const isOwner = p.isOwner === 1 || p.isOwner === true;
      await setPlayerSession({
        roomCode: room.code,
        playerId: p.id,
        nickname: p.nickname,
        isOwner,
      });
      return NextResponse.json({
        success: true,
        rejoined: true,
        player: {
          id: p.id,
          nickname: p.nickname,
          isOwner,
        },
      });
    }

    const player = await roomPlayers.create({
      roomId: room.id,
      nickname: nickname.trim(),
      isOwner: 0,
    });

    await setPlayerSession({
      roomCode: room.code,
      playerId: player!.id,
      nickname: player!.nickname,
      isOwner: false,
    });

    return NextResponse.json({
      success: true,
      rejoined: false,
      player: {
        id: player!.id,
        nickname: player!.nickname,
        isOwner: false,
      },
    });
  } catch (e) {
    console.error('Join room error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
