// pages/room/room.js
const api = require('../../utils/api');
const session = require('../../utils/session');

// 服务端返回的房间对象大致为：
// { success, room:{ code, status, currentMode, round }, players:[{id,nickname,isOwner}],
//   draws: { [playerId]: { cardIds:[...], selectedCardId, rerollsUsed } },
//   selectedCards: { [playerId]: {id,name,mode,desc} },
//   me: { id, nickname, isOwner } | null }

Page({
  data: {
    code: '',
    me: { id: 0, nickname: '', isOwner: false },
    status: 'waiting',         // waiting | skill_picking | playing | finished
    currentMode: '',
    round: 0,
    players: [],
    myDraw: null,
    mySelectedCard: null,
    otherSelectedCards: [],
    modeLabel: '',
  },

  _pollTimer: null,
  _lastRaw: '',

  onLoad(query) {
    const code = (query.code || '').toUpperCase();
    if (!code) {
      wx.showToast({ title: '房间码缺失', icon: 'none' });
      wx.navigateBack();
      return;
    }
    // 兜底：从 storage 拉会话；如果没有就让用户重进
    const cached = session.load();
    if (!cached || cached.roomCode !== code) {
      wx.showModal({
        title: '会话失效',
        content: '请重新加入房间',
        showCancel: false,
        success: () => {
          wx.redirectTo({ url: `/pages/index/index` });
        },
      });
      return;
    }
    this.setData({
      code,
      me: {
        id: cached.playerId,
        nickname: cached.nickname,
        isOwner: !!cached.isOwner,
      },
    });
    // 首屏拉一次
    this.fetchRoom();
    // 起轮询
    this._pollTimer = setInterval(() => this.fetchRoom(), 1500);
  },

  onShow() {
    // 从后台回来时立即拉一次
    if (this.data.code) this.fetchRoom();
  },

  onUnload() {
    if (this._pollTimer) clearInterval(this._pollTimer);
  },

  async fetchRoom() {
    const code = this.data.code;
    if (!code) return;
    try {
      const resp = await api.getRoom(code);
      // 简单 diff 防频繁 setData
      const sig = JSON.stringify({ s: resp.success ? 1 : 0, st: resp.room && resp.room.status });
      if (sig === this._lastRaw) return; // 状态没变就跳过（但 players/draws 还是 update 吧）
      this._lastRaw = sig;
      this.applyRoom(resp);
    } catch (e) {
      // 已经弹过 toast 就静默
    }
  },

  applyRoom(resp) {
    if (!resp || !resp.success) return;
    const room = resp.room;
    const players = resp.players || [];
    const draws = resp.draws || {};
    const selectedCards = resp.selectedCards || {};
    const me = resp.me || this.data.me;

    const myDraw = draws[me.id] || null;

    const mySelectedCard = myDraw && myDraw.selectedCardId
      ? (this.findCardById(myDraw.cardDetails || [], myDraw.selectedCardId) ||
         selectedCards[me.id] ||
         null)
      : null;

    // 其他人选卡（用于 playing 阶段查看）
    const otherSelectedCards = players
      .filter((p) => p.id !== me.id)
      .map((p) => ({
        playerId: p.id,
        nickname: p.nickname,
        isOwner: !!p.isOwner,
        card: selectedCards[p.id] || null,
      }));

    const modeLabel = this.modeLabel(room.currentMode);

    this.setData({
      status: room.status,
      currentMode: room.currentMode || '',
      round: room.round || 0,
      players,
      me,
      myDraw,
      mySelectedCard,
      otherSelectedCards,
      modeLabel,
    });
  },

  findCardById(list, id) {
    for (const c of list) if (c.id === id) return c;
    return null;
  },

  modeLabel(m) {
    if (m === 'silver') return '白银局';
    if (m === 'prismatic') return '棱彩局';
    if (m === 'gold') return '黄金局';
    return '';
  },

  async onStart() {
    try {
      await api.startGame(this.data.code);
      this.fetchRoom();
    } catch (e) {}
  },

  async onNextRound() {
    try {
      await api.nextRound(this.data.code);
      this.fetchRoom();
    } catch (e) {}
  },

  async onPickSkill(e) {
    const cardId = e.currentTarget.dataset.cardid;
    if (!cardId) return;
    try {
      await api.pickSkill(this.data.code, cardId);
      this.fetchRoom();
    } catch (e) {}
  },

  async onReroll() {
    try {
      await api.rerollSkill(this.data.code);
      this.fetchRoom();
    } catch (e) {}
  },
});
