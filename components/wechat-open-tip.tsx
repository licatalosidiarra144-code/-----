'use client';

import { useEffect, useState } from 'react';

/** 微信内置浏览器常拦交互 / 表现异常，引导用系统浏览器打开 */
export function WeChatOpenTip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isWeChat = /MicroMessenger/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    setShow(isWeChat && isIOS);
  }, []);

  if (!show) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-amber-300/40 bg-amber-500/95 px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] text-center text-sm font-medium leading-snug text-amber-950">
      微信里可能点不动。请点右上角
      <span className="mx-1 rounded bg-amber-950/15 px-1.5 py-0.5 font-bold">···</span>
      →「在 Safari 打开」
    </div>
  );
}
