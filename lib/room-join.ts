// 加入 / 重进房间的决策（纯函数，便于单测）

export type ExistingPlayer = {
  id: number;
  nickname: string;
  isOwner: number | boolean;
};

export type JoinDecision =
  | { action: 'rejoin'; player: ExistingPlayer }
  | { action: 'create' }
  | { action: 'reject'; error: string; status: number };

/**
 * 中途退出后用原昵称可重进（恢复会话，不新建席位）。
 * 新玩家仅在 waiting 且未满时可加入。
 */
export function decideJoin(opts: {
  roomStatus: string;
  playerCount: number;
  nickname: string;
  existingPlayers: ExistingPlayer[];
}): JoinDecision {
  const nick = opts.nickname.trim();
  if (!nick || nick.length > 32) {
    return { action: 'reject', error: '请输入昵称（1-32 字）', status: 400 };
  }

  const existing = opts.existingPlayers.find((p) => p.nickname === nick);
  if (existing) {
    return { action: 'rejoin', player: existing };
  }

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
