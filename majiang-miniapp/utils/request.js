// utils/request.js
// 封装 wx.request：自动注入 baseURL + 鉴权 Header + 错误处理

const BASE = 'https://entrance-vault-tried-yen.trycloudflare.com';

function getSession() {
  try {
    return wx.getStorageSync('mj_room') || null;
  } catch (e) {
    return null;
  }
}

function clearSession() {
  try { wx.removeStorageSync('mj_room'); } catch (e) {}
}

/**
 * 统一请求方法
 * @param {string} urlPath  例：'/api/room'
 * @param {string} method   'GET' | 'POST' | 'PUT' | 'DELETE'
 * @param {object} data     请求体（GET 时拼到查询串）
 * @param {object} extraHeaders 可选附加头（如 X-Admin-Password）
 */
function request(urlPath, method, data, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const session = getSession();
    const header = {
      'Content-Type': 'application/json',
      ...(session && session.playerId ? { 'X-Player-Id': String(session.playerId) } : {}),
      ...(session && session.roomCode ? { 'X-Room-Code': session.roomCode } : {}),
      ...extraHeaders,
    };

    const finalUrl = BASE + urlPath;

    wx.request({
      url: finalUrl,
      method,
      data,
      header,
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 401) {
          clearSession();
          wx.showToast({ title: '会话已失效，请重新加入', icon: 'none' });
          return reject(new Error(res.data && res.data.error ? res.data.error : '未授权'));
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const msg = res.data && res.data.error ? res.data.error : `HTTP ${res.statusCode}`;
          wx.showToast({ title: msg, icon: 'none' });
          return reject(new Error(msg));
        }
        resolve(res.data);
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        reject(err || new Error('网络错误'));
      },
    });
  });
}

module.exports = { request, BASE, clearSession };
