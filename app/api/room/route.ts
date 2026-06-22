// 创建房间（房主）

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { generateUniqueRoomCode } from '@/lib/room/code';
import { rooms, roomPlayers } from '@/lib/db/helpers';

export async function POST(request: NextRequest) {
  try {
    const { nickname } = await request.json();
    if (!nickname || nickname.length > 32) {
      return NextResponse.json(
        { error: '请输入昵称（1-32 字）' },
        { status: 400 }
      );
    }

    const code = await generateUniqueRoomCode();
    const ownerId = nanoid(12);

    const room = await rooms.create({
      code,
      ownerId,
      status: 'waiting',
      round: 0,
    });

    if (!room) {
      return NextResponse.json({ error: '创建失败' }, { status: 500 });
    }

    const owner = await roomPlayers.create({
      roomId: room.id,
      nickname: nickname.trim(),
      isOwner: 1,
    });

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        ownerId: room.ownerId,
      },
      player: {
        id: owner!.id,
        nickname: owner!.nickname,
        isOwner: true,
      },
    });
  } catch (e) {
    console.error('Create room error:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
