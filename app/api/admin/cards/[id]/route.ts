// GET    /api/admin/cards/[id] — 查单卡
// PUT    /api/admin/cards/[id] — 改单卡
// DELETE /api/admin/cards/[id] — 删单卡

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkAdminPassword } from '@/lib/admin-auth';

const CARDS_FILE = path.join(process.cwd(), 'data', 'cards.json');

function readCardsFile() {
  const raw = fs.readFileSync(CARDS_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeCardsFile(data: { cards: any[] }) {
  fs.writeFileSync(CARDS_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = readCardsFile();
    const card = data.cards.find((c: any) => c.id === id);
    if (!card) {
      return NextResponse.json({ error: `id "${id}" 不存在` }, { status: 404 });
    }
    return NextResponse.json(card);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminPassword(req)) {
    return NextResponse.json({ error: '需要管理员密码' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const updates = await req.json();
    const data = readCardsFile();
    const idx = data.cards.findIndex((c: any) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: `id "${id}" 不存在` }, { status: 404 });
    }
    // 保留 id 不变；其他字段被 updates 覆盖
    data.cards[idx] = { ...data.cards[idx], ...updates, id };
    writeCardsFile(data);
    return NextResponse.json(data.cards[idx]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminPassword(req)) {
    return NextResponse.json({ error: '需要管理员密码' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const data = readCardsFile();
    const idx = data.cards.findIndex((c: any) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: `id "${id}" 不存在` }, { status: 404 });
    }
    const removed = data.cards.splice(idx, 1)[0];
    writeCardsFile(data);
    return NextResponse.json({ ok: true, removed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}