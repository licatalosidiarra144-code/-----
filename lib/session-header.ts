// ============================================
// 玩家会话解析（兼容 Cookie + Header）
// ============================================
//
// 这是小程序适配加的"翻译层"：
// - Web：靠 HttpOnly Cookie `mj_room`，所有写操作走 getPlayerSession()
// - 小程序：浏览器不在，Cookie 不一定带上来；改走 Header：
//     X-Player-Id: <数字>
//     X-Room-Code: <6 位房间码>
//
// 这个函数优先读 Header；读不到再回退到 Cookie。
// 不修改 lib/session.ts，保证 Web 行为 100% 不变。
//
// 设计原则：
// 1. 鉴权需要「最小程度」DB 校验（仅 Header 路径）。
//    Cookie 路径保持原样（Cookie 是服务端自己写的，可信）。
// 2. 校验失败一律返回 null，调用方按 401 处理。
// ============================================

import { NextRequest } from 'next/server';
import { getPlayerSession, type PlayerSession } from '@/lib/session';
import { rooms, roomPlayers } from '@/lib/db/helpers';

/**
 * 从 Header 或 Cookie 解析当前玩家身份。
 *
 * @param request  NextRequest
 * @param expectedRoomCode URL 里期望的房间码（用于校验 Cookie/Header 中的 roomCode 一致）
 * @returns PlayerSession 或 null（鉴权失败）
 */
export async function getPlayerSessionFromAny(
  request: NextRequest,
  expectedRoomCode: string
): Promise<PlayerSession | null> {
  // 1) Header 路径（小程序）
  const headerPlayerId = request.headers.get('x-player-id');
  const headerRoomCode = request.headers.get('x-room-code');
  if (headerPlayerId && headerRoomCode) {
    if (headerRoomCode !== expectedRoomCode) return null;
    const id = parseInt(headerPlayerId, 10);
    if (!Number.isFinite(id) || id <= 0) return null;

    // Header 是客户端可伪造的，必须做最小 DB 校验：
    //   - 房间必须存在
    //   - 玩家必须存在
    //   - 玩家必须属于该房间
    const room = await rooms.findByCode(expectedRoomCode);
    if (!room) return null;
    const player = await roomPlayers.findById(id);
    if (!player || player.roomId !== room.id) return null;

    return {
      roomCode: expectedRoomCode,
      playerId: id,
      nickname: player.nickname,
      isOwner: player.isOwner === 1,
    };
  }

  // 2) Cookie 路径（Web，端到端兼容旧行为）
  return getPlayerSession();
}
