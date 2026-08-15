// pages/admin/login/login.js
const api = require('../../../utils/api');

const STORAGE_KEY = 'mj_admin_pass';

Page({
  data: {
    password: '',
  },

  onLoad() {
    const cached = wx.getStorageSync(STORAGE_KEY);
    if (cached) {
      // 直接尝试用上次密码调一次 GET，验证有效性
      this.tryLogin(cached, /*silent*/ true);
    }
  },

  onInput(e) {
    this.setData({ password: e.detail.value });
  },

  onSubmit() {
    const p = this.data.password;
    if (!p) return;
    this.tryLogin(p, false);
  },

  async tryLogin(password, silent) {
    try {
      // GET /api/admin/cards 是公开的；用它来确认密码存在即可（不真正校验）
      // 真正校验发生在第一次 PUT/POST 时
      await api.listCards();
      if (silent) {
        wx.setStorageSync(STORAGE_KEY, password);
        wx.redirectTo({ url: '/pages/admin/cards/cards' });
        return;
      }
      // 非 silent：把密码存到 storage 后跳后台
      wx.setStorageSync(STORAGE_KEY, password);
      wx.redirectTo({ url: '/pages/admin/cards/cards' });
    } catch (e) {
      if (!silent) {
        wx.showToast({ title: '登录失败，请检查网络', icon: 'none' });
      }
    }
  },
});
