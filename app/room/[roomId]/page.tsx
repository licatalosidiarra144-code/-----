'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { CardTile } from '@/components/card/card-tile';
import { type Card, type GameMode, MODE_LABELS } from '@/lib/cards/types';
import { FloatingPaths } from '@/components/background-paths/FloatingPaths';

interface Player {
  id: number;
  nickname: string;
  isOwner: boolean;
}

interface RoomData {
  room: {
    id: number;
    code: string;
    status: string;
    currentMode: GameMode | null;
    round: number;
    ownerId: string;
  };
  players: Player[];
  draws: Record<
    number,
    { skill?: { cards: Card[]; selectedId?: string; rerollsUsed: number } }
  >;
  selectedCards: Record<number, Card[]>;
  me: { id: number; nickname: string; isOwner: boolean } | null;
}

interface Me {
  id: number;
  nickname: string;
  isOwner: boolean;
}

const PLAYER_GRADIENTS = [
  'from-rose-500 via-red-500 to-orange-500',
  'from-amber-500 via-orange-500 to-yellow-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-violet-500 via-purple-500 to-fuchsia-500',
] as const;

const MODE_BANNER: Record<GameMode, string> = {
  silver: '🥈 白银局',
  prismatic: '🌈 棱彩局',
  gold: '🎴 黄金局',
};

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl p-12 text-center text-gray-500">
          加载中...
        </div>
      }
    >
      <RoomPageInner />
    </Suspense>
  );
}

function RoomPageInner() {
  const params = useParams<{ roomId: string }>();
  const roomId = (params?.roomId || '').toUpperCase();
  const searchParams = useSearchParams();
  const joinFlag = searchParams?.get('join') === '1';

  const [me, setMe] = useState<Me | null>(null);
  const [data, setData] = useState<RoomData | null>(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [playerView, setPlayerView] = useState<Player | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinNick, setJoinNick] = useState('');
  const [joinErr, setJoinErr] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (joinFlag && !me) setJoinOpen(true);
  }, [joinFlag, me]);

  async function doJoin() {
    const nick = joinNick.trim();
    if (!nick) {
      setJoinErr('请输入昵称');
      return;
    }
    if (nick.length > 32) {
      setJoinErr('昵称最多 32 字');
      return;
    }
    setJoinLoading(true);
    setJoinErr('');
    try {
      const res = await fetch(`/api/room/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nick }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) {
        setJoinErr(d.error || '加入失败');
        return;
      }
      setMe(d.player);
      setJoinOpen(false);
      setJoinNick('');
      window.history.replaceState({}, '', `/room/${roomId}`);
    } catch {
      setJoinErr('网络错误，请重试');
    } finally {
      setJoinLoading(false);
    }
  }

  useEffect(() => {
    if (!roomId) return;
    function fetchRoom() {
      fetch(`/api/room/${roomId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setData(d);
            if (d.me) setMe(d.me);
          } else {
            setError(d.error || '房间加载失败');
          }
        })
        .catch(() => {});
    }
    fetchRoom();
    pollRef.current = setInterval(fetchRoom, 1500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roomId]);

  async function startGame() {
    if (!me?.isOwner) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/room/${roomId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error);
    } finally {
      setActionLoading(false);
    }
  }

  async function pickSkill(cardId: string) {
    if (!me) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/room/${roomId}/skill-pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error);
    } finally {
      setActionLoading(false);
    }
  }

  async function rerollSkill() {
    if (!me) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/room/${roomId}/skill-reroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error);
    } finally {
      setActionLoading(false);
    }
  }

  async function nextRound() {
    if (!me?.isOwner) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/room/${roomId}/next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error);
    } finally {
      setActionLoading(false);
    }
  }

  /** 手机 / 微信内置浏览器也能用的复制 */
  async function copyRoomCode(code: string) {
    const text = code.trim().toUpperCase();
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.fontSize = '16px'; // 避免 iOS 缩放
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 2000);
    } else {
      window.prompt('复制失败，请长按全选后复制：', text);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-12 text-center">
        <div className="mb-4 text-4xl">😢</div>
        <p className="text-lg text-gray-600">{error}</p>
      </div>
    );
  }

  const joinDialog = joinOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
        <h3 className="mb-2 text-lg font-bold text-white">🀄 加入房间</h3>
        <p className="mb-4 text-sm text-white/50">
          房间码：
          <span className="font-mono font-bold text-pink-400">{roomId}</span>
        </p>
        <input
          type="text"
          value={joinNick}
          onChange={(e) => setJoinNick(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !joinLoading) doJoin();
          }}
          placeholder="输入你的昵称"
          maxLength={32}
          autoFocus
          className="mb-3 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
        />
        {joinErr && <p className="mb-3 text-xs text-pink-400">{joinErr}</p>}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setJoinOpen(false);
              setJoinErr('');
              setJoinNick('');
              window.history.replaceState({}, '', `/room/${roomId}`);
            }}
            disabled={joinLoading}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={doJoin}
            disabled={joinLoading || !joinNick.trim()}
            className="flex-1"
          >
            {joinLoading ? '加入中…' : '加入'}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  if (!data || !me) {
    return (
      <>
        <div className="mx-auto max-w-2xl p-12 text-center text-gray-500">
          {joinFlag ? '准备加入房间…' : '加载中…'}
        </div>
        {joinDialog}
      </>
    );
  }

  const myDraw = data.draws[me.id];
  const mySelectedCards = data.selectedCards[me.id] || [];
  const mySkillSelected = myDraw?.skill?.selectedId;

  return (
    <div className="relative mx-auto min-h-screen max-w-5xl px-4 py-8">
      <div className="pointer-events-none fixed inset-0 z-0 text-white/50">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.08),_transparent_60%)]" />

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/50">房间码 · 点一下可复制</div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copyRoomCode(data.room.code)}
                className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-2xl font-bold tracking-widest text-white drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] active:scale-95"
                aria-label="复制房间码"
              >
                {data.room.code}
              </button>
              <button
                type="button"
                onClick={() => copyRoomCode(data.room.code)}
                className="rounded-md border border-pink-400/50 bg-pink-500/20 px-2.5 py-1 text-xs font-semibold text-pink-100 active:scale-95"
              >
                {codeCopied ? '已复制 ✓' : '复制'}
              </button>
              {data.room.status === 'waiting' && data.players.length < 4 && (
                <button
                  onClick={() => setInviteOpen(true)}
                  className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs text-white/80 backdrop-blur-sm hover:border-pink-400 hover:text-pink-300"
                >
                  📱 邀请
                </button>
              )}
            </div>
            {codeCopied && (
              <div className="mt-1 text-xs text-emerald-300">
                已复制，可直接粘贴发微信
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-white/50">状态</div>
            <div className="text-lg font-semibold text-white">
              {statusLabel(data.room.status)}
            </div>
            {data.room.round > 0 && (
              <div className="text-xs text-white/40">第 {data.room.round} 局</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-white/50">人数</div>
            <div className="text-lg font-semibold text-white">
              {data.players.length} / 4
            </div>
          </div>
        </div>
        {data.room.currentMode && (
          <div className="mt-3 text-center text-lg font-bold text-white drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]">
            {MODE_BANNER[data.room.currentMode] || MODE_LABELS[data.room.currentMode]}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="mb-3 px-1 text-sm font-semibold text-white/80">🪑 玩家</div>
        <div className="grid grid-cols-4 gap-3">
          {data.players.map((p, idx) => {
            const skillDone = data.draws[p.id]?.skill?.selectedId;
            const grad = PLAYER_GRADIENTS[idx % PLAYER_GRADIENTS.length];
            return (
              <button
                key={p.id}
                onClick={() => setPlayerView(p)}
                className={`group relative flex flex-col items-center overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-4 shadow-md transition-all hover:scale-105 hover:shadow-xl`}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10" />
                <div className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/40 bg-white/25 text-xl font-bold text-white shadow-inner backdrop-blur-sm">
                  {p.nickname[0]}
                  {p.isOwner && (
                    <span className="absolute -right-1 -top-1 text-base drop-shadow">👑</span>
                  )}
                </div>
                <div className="relative mt-2 text-sm font-semibold text-white drop-shadow">
                  {p.nickname}
                </div>
                <div className="relative mt-1.5">
                  <span className="inline-block rounded-full bg-white/30 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    {data.room.status === 'waiting'
                      ? '等待中'
                      : skillDone
                        ? '已就绪 ✓'
                        : '选技能中'}
                  </span>
                </div>
              </button>
            );
          })}
          {Array.from({ length: 4 - data.players.length }).map((_, i) => {
            const slotIdx = data.players.length + i;
            const grad = PLAYER_GRADIENTS[slotIdx % PLAYER_GRADIENTS.length];
            return (
              <div
                key={`empty-${i}`}
                className={`relative flex flex-col items-center overflow-hidden rounded-2xl border-2 border-dashed border-white/60 bg-gradient-to-br ${grad} p-4 opacity-50`}
              >
                <div className="pointer-events-none absolute inset-0 bg-white/40" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-white/60 bg-white/20 text-xl font-bold text-white/70 backdrop-blur-sm">
                  +
                </div>
                <div className="relative mt-2 text-sm font-medium text-white/80">空位</div>
                <div className="relative mt-1.5">
                  <span className="inline-block rounded-full bg-white/30 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                    等待加入
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {data.room.status === 'waiting' && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-lg backdrop-blur-xl">
          {me.isOwner ? (
            <>
              <p className="mb-2 text-lg font-semibold text-white">等齐 4 人后，房主点这里开始</p>
              <p className="mb-6 text-sm text-white/50">
                系统按概率抽局型：白银 30% / 棱彩 40% / 黄金 30%
              </p>
              <Button
                onClick={startGame}
                disabled={data.players.length !== 4 || actionLoading}
                size="lg"
              >
                {data.players.length === 4 ? '🎲 开始游戏' : `还差 ${4 - data.players.length} 人`}
              </Button>
            </>
          ) : (
            <p className="text-lg text-white/60">等房主开始游戏...</p>
          )}
        </div>
      )}

      {data.room.status === 'skill_picking' && myDraw?.skill && (
        <SkillPickPhase
          cards={myDraw.skill.cards}
          selectedId={mySkillSelected}
          rerollsUsed={myDraw.skill.rerollsUsed ?? 0}
          allPlayersReady={data.players.every(
            (p) => data.draws[p.id]?.skill?.selectedId
          )}
          onPick={pickSkill}
          onReroll={rerollSkill}
          loading={actionLoading}
        />
      )}

      {data.room.status === 'playing' && (
        <PlayingPhase
          mySelectedCards={mySelectedCards}
          isOwner={me.isOwner}
          onNextRound={nextRound}
          loading={actionLoading}
        />
      )}

      {playerView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPlayerView(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {playerView.nickname} 的技能卡
                {playerView.isOwner && ' 👑'}
              </h3>
              <button
                onClick={() => setPlayerView(null)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data.selectedCards[playerView.id] || []).map((c) => (
                <div key={c.id} className="text-xs">
                  <CardTile card={c} size="sm" disabled />
                </div>
              ))}
              {(data.selectedCards[playerView.id] || []).length === 0 && (
                <p className="text-sm text-white/50">还没选技能卡</p>
              )}
            </div>
          </div>
        </div>
      )}

      {inviteOpen && origin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setInviteOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-center shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">📱 扫码加入</h3>
              <button
                onClick={() => setInviteOpen(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-sm text-white/50">让好友用浏览器扫这个码进房间</p>
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="font-mono text-xl font-bold tracking-widest text-white">
                {data.room.code}
              </span>
              <button
                type="button"
                onClick={() => copyRoomCode(data.room.code)}
                className="rounded-md border border-pink-400/50 bg-pink-500/20 px-2.5 py-1 text-xs font-semibold text-pink-100"
              >
                {codeCopied ? '已复制 ✓' : '复制房间码'}
              </button>
            </div>
            <div className="flex justify-center rounded-xl border border-white/10 bg-white p-4">
              <QRCodeSVG
                value={`${origin}/room/${roomId}?join=1`}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              <div className="mb-1 text-white/40">或复制链接发给好友：</div>
              <div className="break-all font-mono text-left">
                {`${origin}/room/${roomId}?join=1`}
              </div>
              <button
                type="button"
                onClick={() => copyRoomCode(`${origin}/room/${roomId}?join=1`)}
                className="mt-2 w-full rounded-md border border-white/20 bg-white/10 py-1.5 text-xs text-white"
              >
                {codeCopied ? '已复制 ✓' : '复制链接'}
              </button>
            </div>
          </div>
        </div>
      )}

      {joinDialog}
    </div>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    waiting: '⏳ 等待中',
    skill_picking: '🎯 选技能卡',
    playing: '🀄 游戏中',
    finished: '🏁 已结束',
  };
  return map[status] || status;
}

function SkillPickPhase({
  cards,
  selectedId,
  rerollsUsed,
  allPlayersReady,
  onPick,
  onReroll,
  loading,
}: {
  cards: Card[];
  selectedId?: string;
  rerollsUsed: number;
  allPlayersReady: boolean;
  onPick: (cardId: string) => void;
  onReroll: () => void;
  loading: boolean;
}) {
  if (selectedId) {
    const card = cards.find((c) => c.id === selectedId);
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-lg backdrop-blur-xl">
        <p className="mb-2 text-lg font-semibold text-white">✅ 你已选：</p>
        {card && (
          <div className="flex justify-center">
            <CardTile card={card} selected disabled />
          </div>
        )}
        <p className="mt-4 text-sm text-white/50">
          {allPlayersReady ? '所有人选完了，进入游戏...' : '等其他人选完...'}
        </p>
      </div>
    );
  }

  const canReroll = rerollsUsed < 1;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl">
      <h2 className="mb-2 text-center text-xl font-bold text-white">🎯 选 1 张技能卡（4 选 1）</h2>
      <p className="mb-6 text-center text-sm text-white/50">
        本局可重选 1 次
        {canReroll ? '（尚未使用）' : '（已用完）'}
      </p>
      <div className="mb-6 flex flex-wrap justify-center gap-4">
        {cards.map((c) => (
          <CardTile
            key={c.id}
            card={c}
            onClick={() => onPick(c.id)}
            disabled={loading}
          />
        ))}
      </div>
      <div className="text-center">
        <Button
          variant="outline"
          onClick={onReroll}
          disabled={!canReroll || loading}
        >
          {canReroll ? '🔄 重选一次' : '重选已用完'}
        </Button>
      </div>
    </div>
  );
}

function PlayingPhase({
  mySelectedCards,
  isOwner,
  onNextRound,
  loading,
}: {
  mySelectedCards: Card[];
  isOwner: boolean;
  onNextRound: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl">
        <h2 className="mb-2 text-center text-xl font-bold text-white">🀄 你的技能卡</h2>
        <p className="mb-6 text-center text-sm text-white/50">
          效果在真麻将桌上执行；这里只做展示
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {mySelectedCards.map((c) => (
            <CardTile key={c.id} card={c} selected disabled />
          ))}
        </div>
      </div>

      {isOwner && (
        <div className="rounded-2xl border border-yellow-400/40 bg-yellow-500/10 p-4 text-center shadow-lg backdrop-blur-xl">
          <p className="mb-2 text-sm text-yellow-200">这一局麻将打完了？</p>
          <Button onClick={onNextRound} disabled={loading} variant="outline">
            🎲 开下一局
          </Button>
        </div>
      )}
    </div>
  );
}
