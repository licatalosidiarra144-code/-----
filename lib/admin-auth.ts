// ============================================
// 后台管理鉴权（简单密码）
// ============================================
//
// /admin/cards 是个改卡牌的页面，不是给朋友用的。
// 用 .env 里的 ADMIN_PASSWORD 做一道闸——密码存在客户端 localStorage，
// 请求时塞 X-Admin-Password 头，服务端用常数时间比较校验。
//
// 没设 ADMIN_PASSWORD = 整个后台锁死（开发态方便）。
// ============================================

import { timingSafeEqual } from 'crypto';

export function checkAdminPassword(req: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false; // 没配密码 = 拒绝所有写入，读取仍可放行（看情况）
  const provided = req.headers.get('x-admin-password');
  if (!provided) return false;

  const a = Buffer.from(expected, 'utf-8');
  const b = Buffer.from(provided, 'utf-8');
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}