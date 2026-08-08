'use client';

import { useId } from 'react';

// GradientBackground — "Iris Petal" (21st.dev)
// iOS / 微信：全屏层必须 pointer-events:none，避免挡住点击；
// 不用 cqmin（部分 WebKit 表现异常），滤镜 id 用 useId 防冲突。

export function GradientBackground({ className }: { className?: string }) {
  const rawId = useId().replace(/:/g, '');
  const grainId = `grain-${rawId}`;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-8px',
          pointerEvents: 'none',
          // 固定 px 模糊，避免 iOS 上 cqmin 失效/异常
          filter: 'blur(12px)',
          backgroundColor: '#1B1035',
          backgroundImage:
            "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.080'/></svg>\"), linear-gradient(155deg, #1B1035 0%, #4A3A8C 33%, #B58AC9 67%, #F5D6E6 100%)",
          backgroundSize: '120px 120px, auto',
          backgroundBlendMode: 'overlay, normal',
        }}
      />
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.08,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      >
        <filter id={grainId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter={`url(#${grainId})`}
          style={{ pointerEvents: 'none' }}
        />
      </svg>
    </div>
  );
}

/** 全页固定背景：z-0 + 禁点击，内容层用 z-10 盖住 */
export function IrisPetalPageBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <GradientBackground className="h-full w-full" />
    </div>
  );
}
