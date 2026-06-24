// ============================================
// 玩家会话（HttpOnly Cookie）
// ============================================
//
// 设计：单个 cookie 存「当前所在房间」的身份。
// 进新房（create / join）时覆盖写。
// 所有需要「我是谁」的接口都从这里读，不再信请求体。
// ============================================

import { cookies } from 'next/headers';

export interface PlayerSession {
  roomCode: string;   // 当前所在的房间码（用于校验 URL）
  playerId: number;
  nickname: string;
  isOwner: boolean;
}

const COOKIE_NAME = 'mj_room';

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    // secure: 由反向代理(Nginx)上 HTTPS 时再开；本地开发不开
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === '1',
    maxAge: 60 * 60 * 24 * 7, // 7 天，方便朋友偶尔关浏览器再回来
  };
}

export async function setPlayerSession(session: PlayerSession) {
  const c = await cookies();
  c.set(COOKIE_NAME, JSON.stringify(session), cookieOpts());
}

export async function getPlayerSession(): Promise<PlayerSession | null> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlayerSession;
  } catch {
    return null;
  }
}

export async function clearPlayerSession() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}