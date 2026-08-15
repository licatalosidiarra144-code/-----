// pages/index/index.js
const api = require('../../utils/api');
const session = require('../../utils/session');

Page({
  data: {
    tab: 'create',       // 'create' | 'join'
    nickname: '',
    roomCode: '',
    canSubmit: false,
  },

  onLoad() {
    // 如果本地已有会话，允许用户选择是否继续
    const cached = session.load();
    if (cached && cached.roomCode) {
      wx.showModal({
        title: '检测到未结束的会话',
        content: `上次在房间 ${cached.roomCode}，昵称「${cached.nickname}」`,
        confirmText: '继续',
        cancelText: '重新开始',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({ url: `/pages/room/room?code=${cached.roomCode}` });
          } else {
            session.clear();
          }
        },
      });
    }
  },

  onTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab, roomCode: '' });
    this.refreshCanSubmit();
  },

  onNickname(e) {
    this.setData({ nickname: e.detail.value });
    this.refreshCanSubmit();
  },

  onRoomCode(e) {
    this.setData({ roomCode: e.detail.value.toUpperCase() });
    this.refreshCanSubmit();
  },

  refreshCanSubmit() {
    const { tab, nickname, roomCode } = this.data;
    const ok =
      nickname.trim().length > 0 &&
      nickname.length <= 32 &&
      (tab === 'create' || (roomCode.length >= 4 && roomCode.length <= 8));
    this.setData({ canSubmit: ok });
  },

  async onSubmit() {
    if (!this.data.canSubmit) return;
    const { tab, nickname, roomCode } = this.data;
    wx.showLoading({ title: '请稍候...' });
    try {
      let resp;
      let code;
      if (tab === 'create') {
        resp = await api.createRoom(nickname.trim());
        if (!resp || !resp.success) throw new Error('创建失败');
        code = resp.room.code;
        session.save({
          roomCode: code,
          playerId: resp.player.id,
          nickname: resp.player.nickname,
          isOwner: !!resp.player.isOwner,
        });
      } else {
        resp = await api.joinRoom(roomCode.trim(), nickname.trim());
        if (!resp || !resp.success) throw new Error('加入失败');
        code = roomCode.trim().toUpperCase();
        session.save({
          roomCode: code,
          playerId: resp.player.id,
          nickname: resp.player.nickname,
          isOwner: !!resp.player.isOwner,
        });
      }
      wx.hideLoading();
      wx.redirectTo({ url: `/pages/room/room?code=${code}` });
    } catch (e) {
      wx.hideLoading();
      // request.js 已弹过 toast，这里只 console
      console.warn(e);
    }
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/login/login' });
  },
});
