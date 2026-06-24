'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/utils';

// ============================================// 卡牌管理后台：增删改 30 张卡
// 数据存在 data/cards.json
// 访问需要 ADMIN_PASSWORD（存在 localStorage）
// ============================================

type CardType = 'skill' | 'equipment';
type Mode = 'gold' | 'rainbow';
type Rarity = 'common' | 'rare' | 'epic';

interface Card {
  id: string;
  mode: Mode;
  type: CardType;
  name: string;
  desc: string;
  uses: number;
  imageUrl: string;
  rarity?: Rarity;
}

const EMPTY_CARD: Card = {
  id: '',
  mode: 'gold',
  type: 'skill',
  name: '',
  desc: '',
  uses: 0,
  imageUrl: '🃏',
  rarity: 'common',
};

const PASS_KEY = 'mj_admin_pass';

// 共享的背景层（在主 return 和密码弹窗里都用）
function DarkBackground() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950" />
      <div className="pointer-events-none fixed top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none fixed top-1/2 left-1/2 -z-10 h-96 w-96 rounded-full bg-pink-600/15 blur-3xl" />
    </>
  );
}

export default function AdminCardsPage() {
  const [pass, setPass] = useState<string | null>(null);
  const [passInput, setPassInput] = useState('');
  const [passErr, setPassErr] = useState('');

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Card | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(PASS_KEY);
    if (saved) setPass(saved);
  }, []);

  async function load(p: string) {
    setLoading(true);
    const res = await fetch('/api/admin/cards', { cache: 'no-store' });
    const data = await res.json();
    setCards(data.cards || []);
    setLoading(false);
    void p;
  }

  useEffect(() => {
    if (pass) load(pass);
  }, [pass]);

  async function tryPass() {
    setPassErr('');
    const p = passInput.trim();
    if (!p) {
      setPassErr('请输入密码');
      return;
    }
    localStorage.setItem(PASS_KEY, p);
    setPass(p);
  }

  function logout() {
    localStorage.removeItem(PASS_KEY);
    setPass(null);
    setPassInput('');
  }

  async function save(card: Card) {
    const url = isNew
      ? '/api/admin/cards'
      : `/api/admin/cards/${encodeURIComponent(card.id)}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': pass || '',
      },
      body: JSON.stringify(card),
    });
    const data = await res.json();
    if (res.status === 401) {
      alert('密码错误或已失效，请重新输入');
      logout();
      return;
    }
    if (!res.ok) {
      alert(`保存失败：${data.error || '未知错误'}`);
      return;
    }
    setEditing(null);
    load(pass || '');
  }

  async function remove(card: Card) {
    if (!confirm(`确认删除「${card.name}」？此操作不可恢复。`)) return;
    const res = await fetch(`/api/admin/cards/${encodeURIComponent(card.id)}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Password': pass || '' },
    });
    const data = await res.json();
    if (res.status === 401) {
      alert('密码错误或已失效，请重新输入');
      logout();
      return;
    }
    if (!res.ok) {
      alert(`删除失败：${data.error || '未知错误'}`);
      return;
    }
    load(pass || '');
  }

  // ---- 未登录：显示密码框 ----
  if (!pass) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <DarkBackground />
        <div className="mx-auto max-w-md px-4 py-16">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <h1 className="mb-2 text-2xl font-bold text-white">🛠️ 卡牌管理后台</h1>
            <p className="mb-6 text-sm text-white/50">
              请输入管理员密码（.env 里的 ADMIN_PASSWORD）
            </p>
            <input
              type="password"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') tryPass();
              }}
              placeholder="管理员密码"
              autoFocus
              className="mb-3 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
            />
            {passErr && <p className="mb-3 text-xs text-pink-400">{passErr}</p>}
            <Button onClick={tryPass} disabled={!passInput.trim()} className="w-full">
              进入后台
            </Button>
            <div className="mt-4 text-center">
              <Link href="/" className="text-xs text-white/40 hover:text-white/70">
                ← 回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- 已登录：显示卡牌管理界面 ----
  const groups: { label: string; mode: Mode; type: CardType }[] = [
    { label: '🎴 金局 · 技能卡', mode: 'gold', type: 'skill' },
    { label: '🛠️ 金局 · 装备卡', mode: 'gold', type: 'equipment' },
    { label: '🌈 彩局 · 技能卡', mode: 'rainbow', type: 'skill' },
    { label: '💥 彩局 · 装备卡', mode: 'rainbow', type: 'equipment' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <DarkBackground />

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* 顶部 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🛠️ 卡牌管理</h1>
            <p className="mt-1 text-sm text-white/50">
              编辑 data/cards.json · 改完点保存即可生效
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditing({ ...EMPTY_CARD });
                setIsNew(true);
              }}
            >
              ➕ 新建卡牌
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              退出登录
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm">
                ← 回首页
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-white/50">加载中…</div>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => {
              const list = cards.filter((c) => c.mode === g.mode && c.type === g.type);
              return (
                <section key={g.label}>
                  <h2 className="mb-3 text-lg font-semibold text-white/90">
                    {g.label}
                    <span className="ml-2 text-sm font-normal text-white/40">
                      ({list.length} 张)
                    </span>
                  </h2>
                  {list.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-8 text-center text-sm text-white/40 backdrop-blur-sm">
                      这组还没卡，点右上"新建卡牌"加一张
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {list.map((c) => (
                        <CardRow
                          key={c.id}
                          card={c}
                          onEdit={() => {
                            setEditing({ ...c });
                            setIsNew(false);
                          }}
                          onDelete={() => remove(c)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* 编辑弹窗 */}
        {editing && (
          <CardEditor
            card={editing}
            isNew={isNew}
            onChange={setEditing}
            onSave={() => save(editing)}
            onCancel={() => setEditing(null)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// 单卡卡片（列表里的行）
// ============================================

function CardRow({
  card,
  onEdit,
  onDelete,
}: {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // 稀有度：暗色背景上的发光边框
  const rarityClass = {
    common: 'border-white/15',
    rare: 'border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.25)]',
    epic: 'border-fuchsia-400/60 shadow-[0_0_16px_rgba(232,121,249,0.3)]',
  }[card.rarity || 'common'];
  return (
    <div
      className={cn(
        'rounded-xl border-2 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10',
        rarityClass
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-4xl drop-shadow">{card.imageUrl}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate font-bold text-white">{card.name}</div>
            {card.type === 'equipment' && (
              <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-xs text-orange-300">
                ×{card.uses}
              </span>
            )}
            {card.rarity === 'rare' && (
              <span className="text-xs text-cyan-300">稀有</span>
            )}
            {card.rarity === 'epic' && (
              <span className="text-xs text-fuchsia-300">史诗</span>
            )}
          </div>
          <div className="mt-1 text-xs font-mono text-white/40">{card.id}</div>
          <div className="mt-1 line-clamp-2 text-sm text-white/60">{card.desc}</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          ✏️ 编辑
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          🗑️ 删除
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 编辑弹窗
// ============================================

function CardEditor({
  card,
  isNew,
  onChange,
  onSave,
  onCancel,
}: {
  card: Card;
  isNew: boolean;
  onChange: (c: Card) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold text-white">
          {isNew ? '➕ 新建卡牌' : `✏️ 编辑：${card.name}`}
        </h3>
        <div className="space-y-3">
          <Field label="id（唯一标识，新建后不能改）">
            <input
              type="text"
              value={card.id}
              disabled={!isNew}
              onChange={(e) => onChange({ ...card, id: e.target.value })}
              placeholder="比如：gold-skill-07"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder-white/30 disabled:bg-white/5 disabled:opacity-50 focus:border-pink-400 focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="金/彩局">
              <select
                value={card.mode}
                onChange={(e) => onChange({ ...card, mode: e.target.value as Mode })}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-pink-400 focus:outline-none"
              >
                <option value="gold" className="bg-slate-900">🎴 金局</option>
                <option value="rainbow" className="bg-slate-900">🌈 彩局</option>
              </select>
            </Field>
            <Field label="类型">
              <select
                value={card.type}
                onChange={(e) => onChange({ ...card, type: e.target.value as CardType })}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-pink-400 focus:outline-none"
              >
                <option value="skill" className="bg-slate-900">技能卡</option>
                <option value="equipment" className="bg-slate-900">装备卡</option>
              </select>
            </Field>
          </div>

          <Field label="名字">
            <input
              type="text"
              value={card.name}
              onChange={(e) => onChange({ ...card, name: e.target.value })}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-pink-400 focus:outline-none"
            />
          </Field>

          <Field label="效果描述">
            <textarea
              value={card.desc}
              onChange={(e) => onChange({ ...card, desc: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-pink-400 focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="emoji / 图">
              <input
                type="text"
                value={card.imageUrl}
                onChange={(e) => onChange({ ...card, imageUrl: e.target.value })}
                maxLength={4}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-center text-2xl focus:border-pink-400 focus:outline-none"
              />
            </Field>
            <Field label="使用次数">
              <input
                type="number"
                min={0}
                max={99}
                value={card.uses}
                onChange={(e) => onChange({ ...card, uses: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-pink-400 focus:outline-none"
              />
            </Field>
            <Field label="稀有度">
              <select
                value={card.rarity || 'common'}
                onChange={(e) => onChange({ ...card, rarity: e.target.value as Rarity })}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-pink-400 focus:outline-none"
              >
                <option value="common" className="bg-slate-900">普通</option>
                <option value="rare" className="bg-slate-900">稀有</option>
                <option value="epic" className="bg-slate-900">史诗</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button variant="primary" onClick={onSave}>
            💾 保存
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-white/60">{label}</label>
      {children}
    </div>
  );
}