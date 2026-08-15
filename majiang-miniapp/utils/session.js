// utils/session.js
// 把当前会话写到 wx.storage
//
// 字段：
//   roomCode   当前房间码（6 位）
//   playerId   玩家 DB 主键
//   nickname   昵称
//   isOwner    是否房主
//
// 警告：这些值存到 wx.storage 是明文 JSON。
// 安全性由后端的 DB 校验兜底（lib/session-header.ts）。

const KEY = 'mj_room';

function save(session) {
  wx.setStorageSync(KEY, session);
}

function load() {
  try {
    return wx.getStorageSync(KEY) || null;
  } catch (e) {
    return null;
  }
}

function clear() {
  try { wx.removeStorageSync(KEY); } catch (e) {}
}

module.exports = { KEY, save, load, clear };
