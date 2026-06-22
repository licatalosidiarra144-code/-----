'use client';

import { cn } from '@/components/utils';
import type { Card } from '@/lib/cards';

const RARITY_STYLE: Record<string, string> = {
  common: 'from-slate-100 to-slate-200 border-slate-300',
  rare: 'from-blue-100 to-blue-200 border-blue-400',
  epic: 'from-amber-100 to-orange-200 border-amber-400',
};

const RARITY_GLOW: Record<string, string> = {
  common: '',
  rare: 'shadow-blue-200',
  epic: 'shadow-amber-300',
};

export function CardTile({
  card,
  selected = false,
  disabled = false,
  gray = false,
  size = 'md',
  onClick,
  showUses = true,
  badge,
}: {
  card: Card;
  selected?: boolean;
  disabled?: boolean;
  gray?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showUses?: boolean;
  badge?: string;
}) {
  const sizeClasses = {
    sm: 'w-24 h-36 text-xs',
    md: 'w-32 h-48 text-sm',
    lg: 'w-40 h-60 text-base',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-col items-center justify-between rounded-xl border-2 bg-gradient-to-br p-2 shadow-md transition-all',
        RARITY_STYLE[card.rarity || 'common'],
        RARITY_GLOW[card.rarity || 'common'],
        sizeClasses[size],
        selected && 'ring-4 ring-red-500 ring-offset-2 scale-105',
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

      <div className="flex-1 flex items-center justify-center text-4xl">
        {card.imageUrl}
      </div>

      <div className="text-center">
        <div className="font-bold text-gray-900 leading-tight">
          {card.name}
        </div>
        <div className="mt-1 line-clamp-2 text-xs text-gray-600">
          {card.desc}
        </div>
        {showUses && card.type === 'equipment' && (
          <div className="mt-1 text-xs font-semibold text-red-600">
            剩 {card.uses} / {card.uses} 次
          </div>
        )}
      </div>
    </button>
  );
}
