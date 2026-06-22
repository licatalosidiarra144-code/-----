// ============================================
// 房间码生成（6 位字母数字）
// ============================================

import { mockDb } from '@/lib/db/mock';

// 排除容易混淆的字符（0/O, 1/I/L）
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

export async function generateUniqueRoomCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateRoomCode();
    const existing = await mockDb.rooms.findByCode(code);
    if (!existing) return code;
    attempts++;
  }
  // 极端情况：连 10 次都重复（基本不可能）
  return generateRoomCode();
}
