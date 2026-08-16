'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { CardTile } from '@/components/card/card-tile';
import { type Card, type GameMode, MODE_LABELS } from '@/lib/cards/types';
import { cn } from '@/components/utils';
import { IrisPetalPageBackground } from '@/components/ui/iris-petal';
import { WeChatOpenTip } from '@/components/wechat-open-tip';

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

  // 有房间数据但没有会话（中途退出/换浏览器）→ 弹出重进
  useEffect(() => {
    if (data && !me) setJoinOpen(true);
    else if (joinFlag && !me) setJoinOpen(true);
  }, [joinFlag, me, data]);

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

  const gameStarted = Boolean(data && data.room.status !== 'waiting');

  const joinDialog = joinOpen ? (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl border border-white/10 bg-slate-900/95 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl sm:rounded-2xl sm:p-6">
        <h3 className="mb-2 text-lg font-bold text-white">
          {gameStarted ? '🔄 重新进入' : '🀄 加入房间'}
        </h3>
        <p className="mb-1 text-sm text-white/55">
          房间码：
          <span className="font-mono font-bold tracking-wider text-pink-400">{roomId}</span>
        </p>
        <p className="mb-4 text-xs text-white/45">
          {gameStarted
            ? '中途退出了？输入原来的昵称即可回到本桌'
            : '输入昵称加入这桌'}
        </p>
        <input
          type="text"
          value={joinNick}
          onChange={(e) => setJoinNick(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !joinLoading) doJoin();
          }}
          placeholder={gameStarted ? '原来的昵称' : '输入你的昵称'}
          maxLength={32}
          autoFocus
          autoComplete="nickname"
          enterKeyHint="go"
          className="mb-3 min-h-11 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-base text-white placeholder-white/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
        />
        {joinErr && <p className="mb-3 text-xs text-pink-400">{joinErr}</p>}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setJoinOpen(false);
              setJoinErr('');
              setJoinNick('');
              if (!me) {
                window.location.href = '/';
                return;
              }
              window.history.replaceState({}, '', `/room/${roomId}`);
            }}
            disabled={joinLoading}
            className="flex-1"
          >
            {me ? '取消' : '回首页'}
          </Button>
          <Button
            variant="primary"
            onClick={doJoin}
            disabled={joinLoading || !joinNick.trim()}
            className="flex-1"
          >
            {joinLoading ? '进入中…' : gameStarted ? '重新进入' : '加入'}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl p-12 text-center text-gray-500">
        加载中…
      </div>
    );
  }

  if (!me) {
    return (
      <>
        <div className="relative z-10 mx-auto min-h-dvh max-w-2xl px-4 pt-[max(2rem,env(safe-area-inset-top))] text-center text-white/70">
          <IrisPetalPageBackground />
          <WeChatOpenTip />
          <div className="relative z-10 pt-16">
            <p className="text-lg text-white/80">房间 {roomId}</p>
            <p className="mt-2 text-sm text-white/50">
              {gameStarted
                ? '请用原来的昵称重新进入'
                : '请输入昵称加入房间'}
            </p>
          </div>
        </div>
        {joinDialog}
      </>
    );
  }

  const myDraw = data.draws[me.id];
  const mySkillSelected = myDraw?.skill?.selectedId;

  return (
    <div className="relative z-10 mx-auto min-h-dvh max-w-5xl px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 sm:py-8">
      <IrisPetalPageBackground />
      <WeChatOpenTip />

      <div className="relative z-10 mb-4 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur-xl sm:mb-6 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs text-white/55 sm:text-sm">房间码 · 点一下可复制</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copyRoomCode(data.room.code)}
                className="min-h-11 touch-manipulation rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-mono text-xl font-bold tracking-widest text-white drop-shadow-[0_0_8px_rgba(244,63,94,0.6)] active:scale-95 sm:text-2xl"
                aria-label="复制房间码"
              >
                {data.room.code}
              </button>
              <button
                type="button"
                onClick={() => copyRoomCode(data.room.code)}
                className="min-h-11 touch-manipulation rounded-md border border-pink-400/50 bg-pink-500/20 px-3 py-1.5 text-sm font-semibold text-pink-100 active:scale-95"
              >
                {codeCopied ? '已复制 ✓' : '复制'}
              </button>
              {data.room.status === 'waiting' && data.players.length < 4 && (
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="min-h-11 touch-manipulation rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white/80"
                >
                  📱 邀请
                </button>
              )}
            </div>
            {codeCopied && (
              <div className="mt-1 text-xs text-emerald-300">已复制，可直接粘贴发微信</div>
            )}
          </div>
          <div className="flex gap-4 sm:gap-6">
            <div>
              <div className="text-xs text-white/55">状态</div>
              <div className="text-base font-semibold text-white sm:text-lg">
                {statusLabel(data.room.status)}
              </div>
              {data.room.round > 0 && (
                <div className="text-xs text-white/45">第 {data.room.round} 局</div>
              )}
            </div>
            <div>
              <div className="text-xs text-white/55">人数</div>
              <div className="text-base font-semibold text-white sm:text-lg">
                {data.players.length} / 4
              </div>
            </div>
          </div>
        </div>
        {data.room.currentMode && (
          <div className="mt-3 text-center text-base font-bold text-white drop-shadow-[0_0_12px_rgba(244,63,94,0.5)] sm:text-lg">
            {MODE_BANNER[data.room.currentMode] || MODE_LABELS[data.room.currentMode]}
          </div>
        )}
      </div>

      <div className="relative z-10 mb-4 sm:mb-6">
        <div className="mb-2 px-1 text-sm font-semibold text-white/80 sm:mb-3">🪑 玩家</div>
        {/* 手机 2×2，宽屏 1×4，避免四人挤成一条看不清 */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {data.players.map((p, idx) => {
            const skillDone = data.draws[p.id]?.skill?.selectedId;
            const grad = PLAYER_GRADIENTS[idx % PLAYER_GRADIENTS.length];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlayerView(p)}
                className={`group relative flex min-h-[5.5rem] flex-col items-center overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-2.5 shadow-md transition-all active:scale-[0.98] sm:min-h-0 sm:p-4`}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-white/25 text-base font-bold text-white shadow-inner sm:h-14 sm:w-14 sm:text-xl">
                  {p.nickname[0]}
                  {p.isOwner && (
                    <span className="absolute -right-1 -top-1 text-sm drop-shadow sm:text-base">👑</span>
                  )}
                </div>
                <div className="relative mt-1.5 max-w-full truncate px-1 text-xs font-semibold text-white drop-shadow sm:mt-2 sm:text-sm">
                  {p.nickname}
                </div>
                <div className="relative mt-1">
                  <span className="inline-block rounded-full bg-white/30 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
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
                className={`relative flex min-h-[5.5rem] flex-col items-center overflow-hidden rounded-2xl border-2 border-dashed border-white/60 bg-gradient-to-br ${grad} p-2.5 opacity-50 sm:min-h-0 sm:p-4`}
              >
                <div className="pointer-events-none absolute inset-0 bg-white/40" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-white/60 bg-white/20 text-base font-bold text-white/70 sm:h-14 sm:w-14 sm:text-xl">
                  +
                </div>
                <div className="relative mt-1.5 text-xs font-medium text-white/80 sm:mt-2 sm:text-sm">
                  空位
                </div>
                <div className="relative mt-1">
                  <span className="inline-block rounded-full bg-white/30 px-1.5 py-0.5 text-[10px] font-medium text-white/80">
                    等待加入
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {data.room.status === 'waiting' && (
        <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-5 text-center shadow-lg backdrop-blur-xl sm:p-8">
          {me.isOwner ? (
            <>
              <p className="mb-2 text-base font-semibold text-white sm:text-lg">
                等齐 4 人后，房主点这里开始
              </p>
              <p className="mb-5 text-sm text-white/55 sm:mb-6">
                系统按概率抽局型：白银 20% / 棱彩 50% / 黄金 30%
              </p>
              <Button
                onClick={startGame}
                disabled={data.players.length !== 4 || actionLoading}
                size="lg"
                className="w-full sm:w-auto"
              >
                {data.players.length === 4 ? '🎲 开始游戏' : `还差 ${4 - data.players.length} 人`}
              </Button>
            </>
          ) : (
            <p className="text-base text-white/60 sm:text-lg">等房主开始游戏...</p>
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
          meId={me.id}
          players={data.players}
          selectedCards={data.selectedCards}
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
          <div className="mx-auto flex max-w-sm justify-center">
            <CardTile card={card} size="lg" selected disabled />
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
    <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur-xl sm:p-6">
      <h2 className="mb-1 text-center text-lg font-bold text-white sm:mb-2 sm:text-xl">
        🎯 选 1 张技能卡（4 选 1）
      </h2>
      <p className="mb-4 text-center text-sm text-white/55 sm:mb-6">
        本局可重选 1 次
        {canReroll ? '（尚未使用）' : '（已用完）'}
      </p>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-3">
        {cards.map((c) => (
          <div key={c.id} className="min-w-0">
            <CardTile
              card={c}
              onClick={() => onPick(c.id)}
              disabled={loading}
            />
          </div>
        ))}
      </div>
      <div className="text-center">
        <Button
          variant="outline"
          onClick={onReroll}
          disabled={!canReroll || loading}
          className="w-full sm:w-auto"
        >
          {canReroll ? '🔄 重选一次' : '重选已用完'}
        </Button>
      </div>
    </div>
  );
}

function PlayingPhase({
  meId,
  players,
  selectedCards,
  isOwner,
  onNextRound,
  loading,
}: {
  meId: number;
  players: Player[];
  selectedCards: Record<number, Card[]>;
  isOwner: boolean;
  onNextRound: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl sm:p-6">
        <h2 className="mb-1 text-center text-xl font-bold text-white">🀄 本局技能一览</h2>
        <p className="mb-5 text-center text-sm text-white/50">
          四人技能卡已全部展示；效果在真麻将桌上执行
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {players.map((p, idx) => {
            const cards = selectedCards[p.id] || [];
            const isMe = p.id === meId;
            const grad = PLAYER_GRADIENTS[idx % PLAYER_GRADIENTS.length];
            return (
              <div
                key={p.id}
                className={cn(
                  'rounded-2xl border p-3 sm:p-4',
                  isMe
                    ? 'border-pink-400/60 bg-pink-500/10'
                    : 'border-white/10 bg-black/20'
                )}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${grad} text-sm font-bold text-white`}
                  >
                    {p.nickname[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">
                      {p.nickname}
                      {p.isOwner ? ' 👑' : ''}
                      {isMe ? '（我）' : ''}
                    </div>
                    <div className="text-xs text-white/45">技能卡</div>
                  </div>
                </div>
                {cards.length > 0 ? (
                  <div className="space-y-2">
                    {cards.map((c) => (
                      <CardTile key={c.id} card={c} size="lg" disabled />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/45">未选到卡</p>
                )}
              </div>
            );
          })}
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
