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
      // 存到 sessionStorage 方便后续页面用
      sessionStorage.setItem(
        `player_${data.room.code}`,
        JSON.stringify(data.player)
      );
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
      const res = await fetch(`/api/room/${roomCode.toUpperCase().trim()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '加入失败');
        return;
      }
      sessionStorage.setItem(
        `player_${roomCode.toUpperCase().trim()}`,
        JSON.stringify(data.player)
      );
      router.push(`/room/${roomCode.toUpperCase().trim()}`);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <div className="mb-4 text-7xl">🀄</div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900">
            麻将抽卡器
          </h1>
          <p className="text-lg text-gray-600">
            4 人一桌 · 抽技能卡 + 装备卡
            <br />
            <span className="text-sm text-gray-500">
              金局=道具赛，彩局=OP 大招局
            </span>
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          {/* 切换按钮 */}
          <div className="mb-6 flex gap-2 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => {
                setMode('create');
                setError('');
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                mode === 'create'
                  ? 'bg-white text-red-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎲 创建房间
            </button>
            <button
              onClick={() => {
                setMode('join');
                setError('');
              }}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                mode === 'join'
                  ? 'bg-white text-red-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🚪 输入房间码加入
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                你的昵称
              </label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例如：张三"
                maxLength={32}
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  房间码
                </label>
                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="6 位字母数字"
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-gray-500">
                  让房主告诉你房间码
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
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

        <div className="mt-8 text-center text-xs text-gray-400">
          线下打麻将用 · 4 人一组 · 实时同步
        </div>
      </div>
    </div>
  );
}
