'use client';

import { cn } from '@/components/utils';
import type { Card, GameMode } from '@/lib/cards/types';

const MODE_STYLE: Record<
  GameMode,
  { tile: string; chip: string; chipText: string }
> = {
  silver: {
    tile: 'from-slate-50 to-slate-300 border-slate-400 shadow-slate-400/30',
    chip: 'bg-slate-700',
    chipText: 'text-white',
  },
  prismatic: {
    tile: 'from-fuchsia-100 via-violet-100 to-cyan-100 border-fuchsia-400 shadow-fuchsia-300/40',
    chip: 'bg-gradient-to-r from-fuchsia-600 to-violet-600',
    chipText: 'text-white',
  },
  gold: {
    tile: 'from-amber-100 to-orange-200 border-amber-500 shadow-amber-300/40',
    chip: 'bg-amber-600',
    chipText: 'text-white',
  },
};

const MODE_LABEL: Record<GameMode, string> = {
  silver: '白银',
  prismatic: '棱彩',
  gold: '黄金',
};

const RARITY_RING: Record<string, string> = {
  common: '',
  rare: 'ring-2 ring-cyan-400 ring-offset-1',
  epic: 'ring-2 ring-fuchsia-500 ring-offset-1',
};

export function CardTile({
  card,
  selected = false,
  disabled = false,
  gray = false,
  size = 'md',
  onClick,
  badge,
}: {
  card: Card;
  selected?: boolean;
  disabled?: boolean;
  gray?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  badge?: string;
}) {
  // 文字优先；md 用 w-full 适配手机两列网格，避免固定宽度叠在一起
  const sizeClasses = {
    sm: 'w-[7.5rem] min-h-[10.5rem] text-[11px]',
    md: 'w-full min-w-0 min-h-[13.5rem] text-xs',
    lg: 'w-full max-w-none min-h-[11rem] text-sm',
  };
  const emojiClasses = {
    sm: 'text-xl',
    md: 'text-xl',
    lg: 'text-2xl',
  };
  const descClamp = {
    sm: 'line-clamp-4',
    md: 'line-clamp-5',
    lg: 'line-clamp-none',
  };
  const mode = MODE_STYLE[card.mode];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border-2 bg-gradient-to-br p-2 shadow-md transition-all sm:p-2.5',
        mode.tile,
        RARITY_RING[card.rarity || 'common'],
        sizeClasses[size],
        selected && 'ring-2 ring-rose-500 sm:ring-4',
        !selected && !disabled && 'active:brightness-95',
        disabled && 'cursor-not-allowed opacity-60',
        gray && 'grayscale opacity-40',
        onClick && !disabled ? 'cursor-pointer' : 'cursor-default'
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
          {badge}
        </div>
      )}

      <div className="mb-1.5 flex items-start justify-between gap-1">
        <div className={cn('shrink-0 leading-none drop-shadow-sm', emojiClasses[size])}>
          {card.imageUrl}
        </div>
        <div
          className={cn(
            'rounded px-1 py-0.5 text-[9px] font-bold leading-none',
            mode.chip,
            mode.chipText
          )}
        >
          {MODE_LABEL[card.mode]}
        </div>
      </div>

      <div className="min-h-0 flex-1 text-left">
        <div className="mb-1 font-bold leading-snug text-gray-900">{card.name}</div>
        <div
          className={cn(
            'leading-snug text-gray-800',
            size === 'lg' ? 'text-sm' : 'text-[11px] sm:text-xs',
            descClamp[size]
          )}
        >
          {card.desc}
        </div>
      </div>
    </button>
  );
}
