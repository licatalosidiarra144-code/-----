'use client';

// GradientBackground — "Iris Petal", made with the 21st.dev Gradient
// Builder and exported as live CSS (the builder's own Copy-CSS background,
// plus its soften-blur and grain passes). Zero dependencies: one <div> that
// fills its parent. Drop it behind your content:
// <div className="relative h-96"><GradientBackground className="absolute inset-0" /></div>
// Remix the source recipe (colors, mode, finish) in the editor:
// https://21st.dev/community/gradients/editor?from=fb144aa7-7b9d-49c5-b6d0-ddd3f21e0fe9

export function GradientBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        containerType: 'size',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-0.8cqmin',
          filter: 'blur(0.4cqmin)',
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
        }}
      >
        <filter id="grain-fb144aa7">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-fb144aa7)" />
      </svg>
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
