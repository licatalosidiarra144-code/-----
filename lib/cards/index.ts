// ============================================
// 卡牌数据 · 从 data/cards.json 加载（仅服务端）
// ============================================
//
// 编辑卡牌：改 data/cards.json 即可，无需改代码。
// 管理界面：访问 /admin/cards 增删改。
// 客户端请从 `@/lib/cards/types` 引入类型与 MODE_LABELS。

import fs from 'fs';
import path from 'path';
import type { Card, CardType, GameMode } from './types';

export type { Card, CardType, GameMode } from './types';
export { MODE_LABELS } from './types';

const CARDS_FILE = path.join(process.cwd(), 'data', 'cards.json');

// 简单缓存：JSON 文件内容不变就不重新解析
let _cache: { raw: string; cards: Card[] } | null = null;

function loadCards(): Card[] {
  try {
    const raw = fs.readFileSync(CARDS_FILE, 'utf-8');
    if (_cache && _cache.raw === raw) return _cache.cards;
    const parsed = JSON.parse(raw);
    const cards: Card[] = Array.isArray(parsed) ? parsed : parsed.cards || [];
    _cache = { raw, cards };
    return cards;
  } catch (e) {
    console.error('[cards] Failed to load data/cards.json:', e);
    return [];
  }
}

export function getAllCards(): Card[] {
  return loadCards();
}

export function getCard(id: string): Card | undefined {
  return loadCards().find((c) => c.id === id);
}

export function getCardsByMode(mode: GameMode, type?: CardType): Card[] {
  return loadCards().filter(
    (c) => c.mode === mode && (!type || c.type === type)
  );
}

/** 白银 30% / 棱彩 40% / 黄金 30% */
export function pickGameMode(rand: number = Math.random()): GameMode {
  if (rand < 0.3) return 'silver';
  if (rand < 0.7) return 'prismatic';
  return 'gold';
}

// 抽 N 张不重复的卡（从一个卡池）
export function drawCards(pool: Card[], n: number): Card[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
