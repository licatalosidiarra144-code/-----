// ============================================
// 房间码生成（3 位数字，100–999）
// ============================================

import { rooms } from '@/lib/db/helpers';

export function generateRoomCode(): string {
  return String(100 + Math.floor(Math.random() * 900));
}

export async function generateUniqueRoomCode(): Promise<string> {
  const tried = new Set<string>();
  for (let i = 0; i < 80; i++) {
    const code = generateRoomCode();
    if (tried.has(code)) continue;
    tried.add(code);
    const existing = await rooms.findByCode(code);
    if (!existing) return code;
  }

  for (let n = 100; n <= 999; n++) {
    const code = String(n);
    const existing = await rooms.findByCode(code);
    if (!existing) return code;
  }

  throw new Error('房间码已用尽，请稍后再试');
}
