// GET /api/admin/cards — 列出所有卡
// POST /api/admin/cards — 新增卡

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CARDS_FILE = path.join(process.cwd(), 'data', 'cards.json');

function readCardsFile() {
  const raw = fs.readFileSync(CARDS_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeCardsFile(data: { cards: any[] }) {
  fs.writeFileSync(CARDS_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export async function GET() {
  try {
    const data = readCardsFile();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const newCard = await req.json();
    // 必填字段校验
    if (!newCard.id || !newCard.name || !newCard.mode || !newCard.type) {
      return NextResponse.json(
        { error: 'id / name / mode / type 都是必填' },
        { status: 400 }
      );
    }
    if (!['gold', 'rainbow'].includes(newCard.mode)) {
      return NextResponse.json({ error: 'mode 必须是 gold 或 rainbow' }, { status: 400 });
    }
    if (!['skill', 'equipment'].includes(newCard.type)) {
      return NextResponse.json({ error: 'type 必须是 skill 或 equipment' }, { status: 400 });
    }

    const data = readCardsFile();
    if (data.cards.find((c: any) => c.id === newCard.id)) {
      return NextResponse.json({ error: `id "${newCard.id}" 已存在` }, { status: 400 });
    }

    // 补默认值
    const card = {
      uses: 0,
      imageUrl: '🃏',
      rarity: 'common',
      ...newCard,
    };
    data.cards.push(card);
    writeCardsFile(data);
    return NextResponse.json(card, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
