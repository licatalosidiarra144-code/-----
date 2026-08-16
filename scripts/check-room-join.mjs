// 快速校验：中途退出后原昵称可重进（与 lib/room-join.ts 逻辑一致）
function decideJoin(opts) {
  const nick = opts.nickname.trim();
  if (!nick || nick.length > 32) {
    return { action: 'reject', error: '请输入昵称（1-32 字）', status: 400 };
  }
  const existing = opts.existingPlayers.find((p) => p.nickname === nick);
  if (existing) return { action: 'rejoin', player: existing };
  if (opts.roomStatus !== 'waiting') {
    return {
      action: 'reject',
      error: '游戏已开始，请用原来的昵称重新进入',
      status: 400,
    };
  }
  if (opts.playerCount >= 4) {
    return { action: 'reject', error: '房间已满（4人）', status: 400 };
  }
  return { action: 'create' };
}

const players = [
  { id: 1, nickname: '小明', isOwner: 1 },
  { id: 2, nickname: '小红', isOwner: 0 },
];

const cases = [
  {
    name: '游戏中原昵称重进',
    input: {
      roomStatus: 'skill_picking',
      playerCount: 4,
      nickname: '小明',
      existingPlayers: players,
    },
    expect: 'rejoin',
  },
  {
    name: '游戏中新昵称拒绝',
    input: {
      roomStatus: 'playing',
      playerCount: 4,
      nickname: '路人',
      existingPlayers: players,
    },
    expect: 'reject',
  },
  {
    name: '等待中新人可进',
    input: {
      roomStatus: 'waiting',
      playerCount: 2,
      nickname: '阿强',
      existingPlayers: players,
    },
    expect: 'create',
  },
  {
    name: '等待中原昵称也重进不占新席',
    input: {
      roomStatus: 'waiting',
      playerCount: 2,
      nickname: '小红',
      existingPlayers: players,
    },
    expect: 'rejoin',
  },
];

let failed = 0;
for (const c of cases) {
  const got = decideJoin(c.input).action;
  const ok = got === c.expect;
  console.log(`${ok ? 'OK' : 'FAIL'} ${c.name}: got=${got} expect=${c.expect}`);
  if (!ok) failed++;
}

if (failed) {
  console.error(`\n${failed} case(s) failed`);
  process.exit(1);
}
console.log('\nall passed');
