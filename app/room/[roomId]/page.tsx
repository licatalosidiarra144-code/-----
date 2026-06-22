'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { CardTile } from '@/components/card/card-tile';
import { type Card } from '@/lib/cards';

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
    currentMode: 'gold' | 'rainbow' | null;
    round: number;
    ownerId: string;
  };
  players: Player[];
  draws: Record<number, { skill?: { cards: Card[]; selectedId?: string }; equipment?: { cards: Card[]; selectedIds: string[] } }>;
  selectedCards: Record<number, Card[]>;
  cardUses: Record<number, Record<string, number>>;
}

interface Me {
  id: number;
  nickname: string;
  isOwner: boolean;
}

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
  const [playerView, setPlayerView] = useState<Player | null>(null); // 点别人头像看
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // 当前页面的 origin（用于拼二维码链接）
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // 邀请好友（显示二维码）+ 加入弹窗
  const [inviteOpen, setInviteOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinNick, setJoinNick] = useState('');
  const [joinErr, setJoinErr] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // 加载我的身份
  useEffect(() => {
    const stored = sessionStorage.getItem(`player_${roomId}`);
    if (stored) setMe(JSON.parse(stored));
  }, [roomId]);

  // 扫码进入（URL 带 ?join=1 且我还没加入）→ 弹加入框
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
      sessionStorage.setItem(`player_${roomId}`, JSON.stringify(d.player));
      setMe(d.player);
      setJoinOpen(false);
      setJoinNick('');
      // 把 ?join=1 从地址栏去掉，看着清爽
      window.history.replaceState({}, '', `/room/${roomId}`);
    } catch {
      setJoinErr('网络错误，请重试');
    } finally {
      setJoinLoading(false);
    }
  }

  // 轮询房间状态（每 1.5 秒）
  useEffect(() => {
    if (!roomId) return;
    function fetchRoom() {
      fetch(`/api/room/${roomId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setData(d);
          else setError(d.error || '房间加载失败');
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
        body: JSON.stringify({ ownerId: data?.room.ownerId }),
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
        body: JSON.stringify({ playerId: me.id, cardId }),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error);
    } finally {
      setActionLoading(false);
    }
  }

  async function pickEquipment(cardIds: string[]) {
    if (!me) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/room/${roomId}/equipment-pick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: me.id, cardIds }),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error);
    } finally {
      setActionLoading(false);
    }
  }

  async function useCard(cardId: string) {
    if (!me) return;
    if (!confirm('确认使用这张装备卡？剩余次数会减 1')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/room/${roomId}/use-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: me.id, cardId }),
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
        body: JSON.stringify({ ownerId: data?.room.ownerId }),
      });
      const d = await res.json();
      if (!res.ok) alert(d.error);
    } finally {
      setActionLoading(false);
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

  if (!data || !me) {
    return (
      <div className="mx-auto max-w-2xl p-12 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  const myDraw = data.draws[me.id];
  const mySelectedCards = data.selectedCards[me.id] || [];
  const mySkillSelected = myDraw?.skill?.selectedId;
  const myEquipmentSelectedIds = myDraw?.equipment?.selectedIds || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 顶部信息条 */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">房间码</div>
            <div className="flex items-baseline gap-2">
              <div className="font-mono text-2xl font-bold text-red-600">
                {data.room.code}
              </div>
              {data.room.status === 'waiting' && data.players.length < 4 && (
                <button
                  onClick={() => setInviteOpen(true)}
                  className="rounded-md border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:border-red-500 hover:text-red-600"
                >
                  📱 邀请
                </button>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">状态</div>
            <div className="text-lg font-semibold">{statusLabel(data.room.status)}</div>
            {data.room.round > 0 && (
              <div className="text-xs text-gray-500">第 {data.room.round} 局</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">人数</div>
            <div className="text-lg font-semibold">
              {data.players.length} / 4
            </div>
          </div>
        </div>
        {data.room.currentMode && (
          <div className="mt-3 text-center text-lg font-bold">
            {data.room.currentMode === 'gold' ? '🎴 金局（道具赛）' : '🌈 彩局（OP 大招局）'}
          </div>
        )}
      </div>

      {/* 玩家列表 */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-700">玩家</div>
        <div className="grid grid-cols-4 gap-3">
          {data.players.map((p) => {
            const pDraw = data.draws[p.id];
            const skillDone = pDraw?.skill?.selectedId;
            const equipDone = pDraw?.equipment?.selectedIds.length === 3;
            return (
              <button
                key={p.id}
                onClick={() => setPlayerView(p)}
                className="flex flex-col items-center rounded-lg border border-gray-200 p-2 hover:border-red-500"
              >
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-orange-400 text-lg text-white">
                  {p.nickname[0]}
                  {p.isOwner && (
                    <span className="absolute -right-1 -top-1 text-sm">👑</span>
                  )}
                </div>
                <div className="mt-1 text-xs font-medium">{p.nickname}</div>
                <div className="mt-0.5 text-xs">
                  {data.room.status === 'waiting' ? (
                    <span className="text-gray-400">等待中</span>
                  ) : skillDone && equipDone ? (
                    <span className="text-green-600">已就绪 ✓</span>
                  ) : skillDone ? (
                    <span className="text-blue-600">等装备</span>
                  ) : (
                    <span className="text-orange-600">选技能中</span>
                  )}
                </div>
              </button>
            );
          })}
          {Array.from({ length: 4 - data.players.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex flex-col items-center rounded-lg border-2 border-dashed border-gray-200 p-2"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                ?
              </div>
              <div className="mt-1 text-xs text-gray-400">空位</div>
            </div>
          ))}
        </div>
      </div>

      {/* 主内容区 */}
      {data.room.status === 'waiting' && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          {me.isOwner ? (
            <>
              <p className="mb-2 text-lg">等齐 4 人后，房主点这里开始</p>
              <p className="mb-6 text-sm text-gray-500">
                系统会随机选"金局"或"彩局"
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
            <p className="text-lg text-gray-500">等房主开始游戏...</p>
          )}
        </div>
      )}

      {data.room.status === 'skill_picking' && myDraw?.skill && (
        <SkillPickPhase
          me={me}
          cards={myDraw.skill.cards}
          selectedId={mySkillSelected}
          allPlayersReady={data.players.every(
            (p) => data.draws[p.id]?.skill?.selectedId
          )}
          onPick={pickSkill}
          loading={actionLoading}
        />
      )}

      {data.room.status === 'equipment_picking' && myDraw?.equipment && (
        <EquipmentPickPhase
          me={me}
          cards={myDraw.equipment.cards}
          selectedIds={myEquipmentSelectedIds}
          allPlayersReady={data.players.every(
            (p) => data.draws[p.id]?.equipment?.selectedIds.length === 3
          )}
          onPick={pickEquipment}
          loading={actionLoading}
        />
      )}

      {data.room.status === 'playing' && (
        <PlayingPhase
          me={me}
          mySelectedCards={mySelectedCards}
          cardUses={data.cardUses[me.id] || {}}
          isOwner={me.isOwner}
          onUseCard={useCard}
          onNextRound={nextRound}
          loading={actionLoading}
        />
      )}

      {/* 玩家详情弹窗 */}
      {playerView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPlayerView(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {playerView.nickname} 的卡
                {playerView.isOwner && ' 👑'}
              </h3>
              <button
                onClick={() => setPlayerView(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data.selectedCards[playerView.id] || []).map((c) => (
                <div key={c.id} className="text-xs">
                  <CardTile card={c} size="sm" disabled gray={c.type === 'equipment' && c.uses === 0} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 邀请弹窗（显示二维码） */}
      {inviteOpen && origin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setInviteOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold">📱 扫码加入</h3>
              <button
                onClick={() => setInviteOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              让好友用微信 / 浏览器扫这个码进房间
            </p>
            <div className="flex justify-center rounded-xl bg-gray-50 p-4">
              <QRCodeSVG
                value={`${origin}/room/${roomId}?join=1`}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="mt-4 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600">
              <div className="mb-1 text-gray-400">或复制链接发给好友：</div>
              <div className="break-all font-mono text-left">
                {`${origin}/room/${roomId}?join=1`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 扫码进入弹窗 */}
      {joinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold">🀄 加入房间</h3>
            <p className="mb-4 text-sm text-gray-500">
              房间码：
              <span className="font-mono font-bold text-red-600">
                {roomId}
              </span>
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
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
            {joinErr && (
              <p className="mb-3 text-xs text-red-600">{joinErr}</p>
            )}
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
      )}
    </div>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    waiting: '⏳ 等待中',
    skill_picking: '🎯 选技能卡',
    equipment_picking: '⚔️ 选装备卡',
    playing: '🀄 游戏中',
    finished: '🏁 已结束',
  };
  return map[status] || status;
}

function SkillPickPhase({
  me,
  cards,
  selectedId,
  allPlayersReady,
  onPick,
  loading,
}: {
  me: Me;
  cards: Card[];
  selectedId?: string;
  allPlayersReady: boolean;
  onPick: (cardId: string) => void;
  loading: boolean;
}) {
  if (selectedId) {
    const card = cards.find((c) => c.id === selectedId);
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="mb-2 text-lg">✅ 你已选：</p>
        {card && (
          <div className="flex justify-center">
            <CardTile card={card} selected disabled />
          </div>
        )}
        <p className="mt-4 text-sm text-gray-500">
          {allPlayersReady ? '所有人选完了，进入下一环节...' : '等其他人选完...'}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-center text-xl font-bold">🎯 选 1 张技能卡（4 选 1）</h2>
      <p className="mb-6 text-center text-sm text-gray-500">
        技能卡是永久被动效果，跟你的装备卡配合使用
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {cards.map((c) => (
          <CardTile
            key={c.id}
            card={c}
            onClick={() => onPick(c.id)}
            disabled={loading}
          />
        ))}
      </div>
    </div>
  );
}

function EquipmentPickPhase({
  me,
  cards,
  selectedIds,
  allPlayersReady,
  onPick,
  loading,
}: {
  me: Me;
  cards: Card[];
  selectedIds: string[];
  allPlayersReady: boolean;
  onPick: (cardIds: string[]) => void;
  loading: boolean;
}) {
  const [picked, setPicked] = useState<string[]>(selectedIds);

  function toggle(id: string) {
    if (picked.includes(id)) {
      setPicked(picked.filter((x) => x !== id));
    } else if (picked.length < 3) {
      setPicked([...picked, id]);
    }
  }

  if (selectedIds.length === 3) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="mb-2 text-lg">✅ 你已选 3 张装备卡</p>
        <p className="mt-4 text-sm text-gray-500">
          {allPlayersReady ? '所有人选完了，进入游戏...' : '等其他人选完...'}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {selectedIds.map((id) => {
            const c = cards.find((x) => x.id === id);
            return c ? <CardTile key={id} card={c} size="sm" selected disabled /> : null;
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-center text-xl font-bold">⚔️ 选 3 张装备卡（5 选 3）</h2>
      <p className="mb-6 text-center text-sm text-gray-500">
        装备卡有使用次数限制，用完变灰
      </p>
      <div className="mb-6 flex flex-wrap justify-center gap-4">
        {cards.map((c) => (
          <CardTile
            key={c.id}
            card={c}
            selected={picked.includes(c.id)}
            onClick={() => toggle(c.id)}
            disabled={loading}
          />
        ))}
      </div>
      <div className="text-center">
        <p className="mb-3 text-sm">
          已选 <span className="font-bold text-red-600">{picked.length}</span> / 3
        </p>
        <Button
          onClick={() => onPick(picked)}
          disabled={picked.length !== 3 || loading}
        >
          确认选择
        </Button>
      </div>
    </div>
  );
}

function PlayingPhase({
  me,
  mySelectedCards,
  cardUses,
  isOwner,
  onUseCard,
  onNextRound,
  loading,
}: {
  me: Me;
  mySelectedCards: Card[];
  cardUses: Record<string, number>;
  isOwner: boolean;
  onUseCard: (cardId: string) => void;
  onNextRound: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-center text-xl font-bold">🀄 你的卡组</h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          点装备卡的"使用"按钮 → 剩余次数 -1（自己 + 其他人都能看到变灰）
        </p>

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">技能卡（永久）</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {mySelectedCards
              .filter((c) => c.type === 'skill')
              .map((c) => (
                <CardTile key={c.id} card={c} selected disabled />
              ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">装备卡（可使用）</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {mySelectedCards
              .filter((c) => c.type === 'equipment')
              .map((c) => {
                const remaining = cardUses[c.id] ?? c.uses;
                return (
                  <div key={c.id} className="flex flex-col items-center">
                    <CardTile card={c} gray={remaining <= 0} />
                    <button
                      onClick={() => onUseCard(c.id)}
                      disabled={loading || remaining <= 0}
                      className="mt-2 rounded-md bg-red-600 px-4 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      使用（剩 {remaining}/{c.uses}）
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-center">
          <p className="mb-2 text-sm text-yellow-800">这一局麻将打完了？</p>
          <Button onClick={onNextRound} disabled={loading} variant="outline">
            🎲 开下一局
          </Button>
        </div>
      )}
    </div>
  );
}
