'use client';

import { cn } from '@/components/utils';

/**
 * Iris Petal — Silk Blend 风格纯 CSS 渐变背景
 * 参考 https://21st.dev/@serafimcloud/components/iris-petal
 * 色板：#1B1035 / #4A3A8C / #B58AC9 / #F5D6E6 · 柔焦 + 胶片颗粒
 */
export function GradientBackground({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      {/* 底色 */}
      <div className="absolute inset-0" style={{ backgroundColor: '#1B1035' }} />

      {/* Silk Blend：多层径向色团 + 柔焦 */}
      <div
        className="absolute inset-[-25%] scale-110 blur-3xl"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 55% 45% at 18% 28%, #F5D6E6 0%, transparent 58%),
            radial-gradient(ellipse 50% 40% at 86% 18%, #B58AC9 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 72% 78%, #4A3A8C 0%, transparent 60%),
            radial-gradient(ellipse 45% 40% at 28% 82%, #B58AC9 0%, transparent 55%),
            radial-gradient(ellipse 70% 55% at 50% 50%, #4A3A8C 0%, transparent 65%)
          `,
        }}
      />

      {/* 轻微方向过渡，压住中心 */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'linear-gradient(155deg, #1B1035 0%, transparent 42%, rgba(181,138,201,0.35) 72%, rgba(245,214,230,0.25) 100%)',
        }}
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.28] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.55'/></svg>`
          )}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '180px 180px',
        }}
      />
    </div>
  );
}

/** 全页固定背景（首页 / 房间 / 后台共用） */
export function IrisPetalPageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <GradientBackground className="h-full w-full" />
    </div>
  );
}
