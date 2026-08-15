// utils/api.js
// 所有后端接口的统一调用入口
//
// 后端规范：
//   - 房间读 / 创建 / 加入：可在头部携带 X-Player-Id + X-Room-Code；后端会自动匹配
//   - 房间写：必须带 X-Player-Id + X-Room-Code，否则 401
//   - 卡牌后台：写操作带 X-Admin-Password 头（读取 GET 是公开）

const { request } = require('./request');

// ========= 房间 =========
function createRoom(nickname) {
  return request('/api/room', 'POST', { nickname });
}

function joinRoom(code, nickname) {
  return request(`/api/room/${code}/join`, 'POST', { nickname });
}

function getRoom(code) {
  return request(`/api/room/${code}`, 'GET');
}

function startGame(code) {
  return request(`/api/room/${code}/start`, 'POST');
}

function nextRound(code) {
  return request(`/api/room/${code}/next-round`, 'POST');
}

function pickSkill(code, cardId) {
  return request(`/api/room/${code}/skill-pick`, 'POST', { cardId });
}

function rerollSkill(code) {
  return request(`/api/room/${code}/skill-reroll`, 'POST');
}

// ========= 后台卡牌 =========
function listCards() {
  return request('/api/admin/cards', 'GET');
}

function adminAdd(card, password) {
  return request('/api/admin/cards', 'POST', card, { 'X-Admin-Password': password });
}

function adminUpdate(id, card, password) {
  return request(`/api/admin/cards/${id}`, 'PUT', card, { 'X-Admin-Password': password });
}

function adminDelete(id, password) {
  return request(`/api/admin/cards/${id}`, 'DELETE', undefined, { 'X-Admin-Password': password });
}

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  startGame,
  nextRound,
  pickSkill,
  rerollSkill,
  listCards,
  adminAdd,
  adminUpdate,
  adminDelete,
};
