'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    <div className="relative min-h-screen overflow-hidden">
      {/* ===== 暗色霓虹背景 ===== */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950" />
      <div className="pointer-events-none fixed top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-purple-600/30 blur-3xl" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
      <div className="pointer-events-none fixed top-1/2 left-1/2 -z-10 h-96 w-96 rounded-full bg-pink-600/20 blur-3xl" />

      <div className="mx-auto max-w-2xl px-4 py-16">
        {/* Logo + 标题 */}
        <div className="text-center">
          <div className="mb-4 inline-block text-7xl drop-shadow-[0_0_24px_rgba(244,63,94,0.5)]">
            🀄
          </div>
          <h1 className="mb-3 bg-gradient-to-r from-pink-300 via-rose-300 to-orange-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent drop-shadow">
            麻将抽卡器
          </h1>
          <p className="text-lg text-white/70">
            4 人一桌 · 抽技能卡 + 装备卡
            <br />
            <span className="text-sm text-white/40">
              金局=道具赛，彩局=OP 大招局
            </span>
          </p>
        </div>

        {/* 主卡片 */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* 切换按钮 */}
          <div className="mb-6 flex gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
            <button
              onClick={() => {
                setMode('create');
                setError('');
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === 'create'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              🎲 创建房间
            </button>
            <button
              onClick={() => {
                setMode('join');
                setError('');
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                mode === 'join'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              🚪 输入房间码加入
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/80">
                你的昵称
              </label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例如：张三"
                maxLength={32}
                className="border-white/20 bg-white/5 text-white placeholder-white/30 focus:border-pink-400"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">
                  房间码
                </label>
                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="6 位字母数字"
                  maxLength={6}
                  className="border-white/20 bg-white/5 font-mono tracking-widest text-white placeholder-white/30 focus:border-cyan-400"
                />
                <p className="mt-1 text-xs text-white/40">
                  让房主告诉你房间码
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-pink-500/30 bg-pink-500/10 p-3 text-sm text-pink-300">
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

        <div className="mt-8 text-center text-xs text-white/30">
          线下打麻将用 · 4 人一组 · 实时同步
        </div>
      </div>
    </div>
  );
}