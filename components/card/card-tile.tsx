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
  // 文字优先：图标缩小，描述占主要高度
  const sizeClasses = {
    sm: 'w-[7.5rem] min-h-[10.5rem] text-[11px]',
    md: 'w-[10.5rem] min-h-[15rem] text-sm sm:w-44',
    lg: 'w-full max-w-sm min-h-[11rem] text-sm',
  };
  const emojiClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-2xl',
  };
  const descClamp = {
    sm: 'line-clamp-4',
    md: 'line-clamp-6',
    lg: 'line-clamp-none',
  };
  const mode = MODE_STYLE[card.mode];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-col rounded-xl border-2 bg-gradient-to-br p-2.5 shadow-lg transition-all',
        mode.tile,
        RARITY_RING[card.rarity || 'common'],
        sizeClasses[size],
        selected && 'ring-4 ring-rose-500 ring-offset-2 scale-[1.02]',
        !selected && !disabled && 'hover:scale-[1.02] hover:shadow-xl',
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
