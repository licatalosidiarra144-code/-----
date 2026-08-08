// 客户端也可用的卡牌类型 / 文案（不要在这里 import fs）

export type CardType = 'skill';
export type GameMode = 'silver' | 'prismatic' | 'gold';

export interface Card {
  id: string;
  mode: GameMode;
  type: CardType;
  name: string;
  desc: string;
  uses: number; // 技能卡一律 0，不做次数
  imageUrl: string;
  rarity?: 'common' | 'rare' | 'epic';
}

export const MODE_LABELS: Record<GameMode, string> = {
  silver: '白银局',
  prismatic: '棱彩局',
  gold: '黄金局',
};

/** 局型固定图标，不必手改 imageUrl */
export const MODE_ICONS: Record<GameMode, string> = {
  silver: '🥈',
  prismatic: '🌈',
  gold: '🎴',
};

export function iconForMode(mode: GameMode): string {
  return MODE_ICONS[mode] ?? '🃏';
}
