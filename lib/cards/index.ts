// ============================================
// 卡牌数据 · 从 data/cards.json 加载
// ============================================
//
// 编辑卡牌：改 data/cards.json 即可，无需改代码。
// 管理界面：访问 /admin/cards 增删改。

import fs from 'fs';
import path from 'path';

export type CardType = 'skill' | 'equipment';

export interface Card {
  id: string;
  mode: 'gold' | 'rainbow';
  type: CardType;
  name: string;
  desc: string;
  uses: number; // 技能卡 = 0
  imageUrl: string;
  rarity?: 'common' | 'rare' | 'epic';
}

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

export function getCardsByMode(
  mode: 'gold' | 'rainbow',
  type?: CardType
): Card[] {
  return loadCards().filter(
    (c) => c.mode === mode && (!type || c.type === type)
  );
}

// 抽 N 张不重复的卡（从一个卡池）
export function drawCards(pool: Card[], n: number): Card[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
