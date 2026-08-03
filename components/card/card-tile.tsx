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
  const sizeClasses = {
    sm: 'w-24 h-36 text-xs',
    md: 'w-32 h-48 text-sm',
    lg: 'w-40 h-60 text-base',
  };
  const mode = MODE_STYLE[card.mode];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-col items-center justify-between rounded-xl border-2 bg-gradient-to-br p-2 shadow-lg transition-all',
        mode.tile,
        RARITY_RING[card.rarity || 'common'],
        sizeClasses[size],
        selected && 'ring-4 ring-rose-500 ring-offset-2 scale-105',
        !selected && !disabled && 'hover:scale-105 hover:shadow-xl',
        disabled && 'cursor-not-allowed opacity-60',
        gray && 'grayscale opacity-40',
        'cursor-pointer'
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
          {badge}
        </div>
      )}

      <div
        className={cn(
          'absolute right-1.5 top-1.5 rounded px-1 py-0.5 text-[9px] font-bold leading-none',
          mode.chip,
          mode.chipText
        )}
      >
        {MODE_LABEL[card.mode]}
      </div>

      <div className="mt-3 flex flex-1 items-center justify-center text-4xl drop-shadow-sm">
        {card.imageUrl}
      </div>

      <div className="text-center">
        <div className="font-bold leading-tight text-gray-900">{card.name}</div>
        <div className="mt-1 line-clamp-2 text-xs text-gray-700">{card.desc}</div>
      </div>
    </button>
  );
}
