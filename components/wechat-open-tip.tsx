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
    <div className="relative z-50 border-b border-amber-300/40 bg-amber-500/95 px-3 py-2.5 text-center text-sm font-medium text-amber-950">
      苹果微信里可能点不动。请点右上角
      <span className="mx-1 rounded bg-amber-950/15 px-1.5 py-0.5 font-bold">···</span>
      →「在浏览器中打开」
    </div>
  );
}
