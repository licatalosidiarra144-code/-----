// pages/admin/cards/cards.js
const api = require('../../../utils/api');

const STORAGE_KEY = 'mj_admin_pass';

function getPassword() {
  return wx.getStorageSync(STORAGE_KEY) || '';
}

Page({
  data: {
    cards: [],
    editing: false,
    form: {
      id: '',
      _isEdit: false,
      name: '',
      desc: '',
      mode: 'silver',
      modeIndex: 0,
    },
  },

  onShow() {
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  async refresh() {
    try {
      const resp = await api.listCards();
      const list = Array.isArray(resp) ? resp : (resp.cards || []);
      this.setData({ cards: list });
    } catch (e) {
      // 401 → request.js 已清 session，回登录
      wx.redirectTo({ url: '/pages/admin/login/login' });
    }
  },

  onAdd() {
    this.setData({
      editing: true,
      form: { id: '', _isEdit: false, name: '', desc: '', mode: 'silver', modeIndex: 0 },
    });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    const card = this.data.cards.find((c) => c.id === id);
    if (!card) return;
    const modes = ['silver', 'prismatic', 'gold'];
    this.setData({
      editing: true,
      form: {
        id: card.id,
        _isEdit: true,
        name: card.name || '',
        desc: card.desc || '',
        mode: card.mode || 'silver',
        modeIndex: modes.indexOf(card.mode),
      },
    });
  },

  onFormInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}`]: e.detail.value });
  },

  onFormModeChange(e) {
    const idx = parseInt(e.detail.value, 10);
    const modes = ['silver', 'prismatic', 'gold'];
    this.setData({ 'form.mode': modes[idx], 'form.modeIndex': idx });
  },

  onModalClose() {
    this.setData({ editing: false });
  },

  noop() {},

  async onSave() {
    const f = this.data.form;
    if (!f.id || !f.name) {
      wx.showToast({ title: 'ID 和名称必填', icon: 'none' });
      return;
    }
    const password = getPassword();
    if (!password) {
      wx.redirectTo({ url: '/pages/admin/login/login' });
      return;
    }
    const payload = {
      id: f.id,
      mode: f.mode,
      type: 'skill',
      name: f.name,
      desc: f.desc,
      uses: 0,
    };
    try {
      if (f._isEdit) {
        await api.adminUpdate(f.id, payload, password);
      } else {
        await api.adminAdd(payload, password);
      }
      wx.showToast({ title: '已保存', icon: 'success' });
      this.setData({ editing: false });
      this.refresh();
    } catch (e) {
      // request.js 已弹过 toast
    }
  },

  async onDelete(e) {
    const id = e.currentTarget.dataset.id;
    const ok = await new Promise((resolve) => {
      wx.showModal({
        title: '确认删除',
        content: `删除卡牌「${id}」？`,
        success: (res) => resolve(res.confirm),
      });
    });
    if (!ok) return;
    const password = getPassword();
    if (!password) {
      wx.redirectTo({ url: '/pages/admin/login/login' });
      return;
    }
    try {
      await api.adminDelete(id, password);
      wx.showToast({ title: '已删除', icon: 'success' });
      this.refresh();
    } catch (e) {}
  },

  onLogout() {
    wx.removeStorageSync(STORAGE_KEY);
    wx.redirectTo({ url: '/pages/admin/login/login' });
  },
});
