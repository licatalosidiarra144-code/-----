// 加入房间

import { NextRequest, NextResponse } from 'next/server';
import { rooms, roomPlayers } from '@/lib/db/helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId: roomCode } = await params;
    const { nickname } = await request.json();

    if (!nickname || nickname.length > 32) {
      return NextResponse.json(
        { error: '请输入昵称（1-32 字）' },
        { status: 400 }
      );
    }

    const room = await rooms.findByCode(roomCode);
    if (!room) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 });
    }

    if (room.status !== 'waiting') {
      return NextResponse.json({ error: '游戏已开始' }, { status: 400 });
    }

    const count = await roomPlayers.count(room.id);
    if (count >= 4) {
      return NextResponse.json({ error: '房间已满（4人）' }, { status: 400 });
    }

    const player = await roomPlayers.create({
      roomId: room.id,
      nickname: nickname.trim(),
      isOwner: 0,
    });

    return NextResponse.json({
      success: true,
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
