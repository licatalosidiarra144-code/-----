'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IrisPetalPageBackground } from '@/components/ui/iris-petal';
import { WeChatOpenTip } from '@/components/wechat-open-tip';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '创建失败');
        return;
      }
      router.push(`/room/${data.room.code}`);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!roomCode.trim()) {
      setError('请输入房间码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const code = roomCode.toUpperCase().trim();
      const res = await fetch(`/api/room/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '加入失败');
        return;
      }
      router.push(`/room/${code}`);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 min-h-dvh overflow-x-hidden text-white">
      <IrisPetalPageBackground />
      <WeChatOpenTip />

      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-16">
        <div className="text-center">
          <div
            className="mb-3 inline-block text-6xl font-black text-rose-300 drop-shadow-[0_0_24px_rgba(244,63,94,0.5)] sm:mb-4 sm:text-7xl"
            style={{ fontFamily: 'var(--font-noto-serif-tc), "PingFang TC", serif' }}
          >
            發
          </div>
          <h1 className="mb-2 bg-gradient-to-r from-pink-300 via-rose-300 to-orange-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent drop-shadow sm:mb-3 sm:text-4xl">
            麻将抽卡器
          </h1>
          <p className="text-base text-white/70 sm:text-lg">
            4 人一桌 · 只抽技能卡
            <br />
            <span className="text-sm text-white/55">
              白银 30% · 棱彩 40% · 黄金 30%
            </span>
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:mt-12 sm:p-8">
          <div className="mb-5 flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1 sm:mb-6 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setError('');
              }}
              className={`min-h-11 flex-1 touch-manipulation rounded-lg px-2 py-2.5 text-sm font-medium transition sm:px-4 ${
                mode === 'create'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60'
              }`}
            >
              🎲 创建房间
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('join');
                setError('');
              }}
              className={`min-h-11 flex-1 touch-manipulation rounded-lg px-2 py-2.5 text-sm font-medium transition sm:px-4 ${
                mode === 'join'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60'
              }`}
            >
              🚪 加入房间
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                你的昵称
              </label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例如：张三"
                maxLength={32}
                autoComplete="nickname"
                enterKeyHint="done"
                className="border-white/20 bg-white/5 text-white placeholder-white/30 focus:border-pink-400 focus:ring-pink-400/30"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/80">
                  房间码
                </label>
                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="6 位字母数字"
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
                  enterKeyHint="go"
                  className="border-white/20 bg-white/5 font-mono text-lg tracking-[0.35em] text-white placeholder-white/30 focus:border-cyan-400 focus:ring-cyan-400/30"
                />
                <p className="mt-1.5 text-xs text-white/55">让房主发你房间码，或扫邀请码</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-pink-500/30 bg-pink-500/10 p-3 text-sm text-pink-200">
                {error}
              </div>
            )}

            <Button
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading
                ? '处理中...'
                : mode === 'create'
                  ? '创建房间（房主）'
                  : '加入房间'}
            </Button>
          </div>
        </div>

        <div className="mt-8 pb-4 text-center text-xs text-white/55">
          线下打麻将用 · 4 人一组 · 实时同步
        </div>
      </div>
    </div>
  );
}
