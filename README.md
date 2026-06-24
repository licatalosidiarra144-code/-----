# 麻将抽卡器 💌

> 📅 项目状态：MVP 跑通 + **已部署到腾讯云**（`http://1.14.154.250`）+ **扫码加入** + **卡牌管理后台（带密码）**

4 人一桌，扫一个房间码进来，系统随机选"金局/彩局"，抽技能卡 + 装备卡，真打麻将时装备卡点"使用"变灰。

## 🎮 怎么玩（生产环境）

直接在浏览器打开：**`http://1.14.154.250`**

1. 房主打开 → 输昵称 → 创建房间 → 拿到 6 位房间码
2. 其他人 → 输房间码 + 昵称 → 加入
3. 4 人齐 → 房主点"开始"
4. 系统随机金/彩局
5. 第一轮：每人 4 张技能卡（4 选 1）
6. 第二轮：每人 5 张装备卡（5 选 3）
7. 展示页：看自己的卡 / 点别人头像看 / 装备卡"使用"变灰
8. 房主点"开下一局"

> ⚠️ 服务器用 HTTP（无 HTTPS），所以**微信扫码进不去**。手机用浏览器（Chrome / Safari / UC）输 IP 或扫码都行。

## 🚀 本地启动

```bash
npm install
npm run dev
```

打开 http://localhost:3000

没数据库也能跑（Mock 模式）。要接 PostgreSQL 就复制 `.env.example` → `.env` 填上 `DATABASE_URL`。

## ✨ 主要功能

- 🀄 **4 人房间 + 房间码**（6 位字符，扫码加入）
- 🔐 **Cookie 会话**（HttpOnly，玩家身份防伪造）
- 🛡️ **后台密码**（`/admin/cards` 改卡要密码）
- 📱 **二维码邀请**（`qrcode.react`）
- 🎴 **金局 / 彩局** 系统随机选模式
- 🎯 **技能卡 + 装备卡** 两轮抽卡
- 🛠️ **卡牌管理后台** `/admin/cards`（增删改所有卡，存 `data/cards.json`）
- 👀 **查看别人卡组**（点玩家头像）
- 💾 **PostgreSQL 持久化**（PM2 重启不丢房间）

## 🔐 安全说明

- 玩家身份用 **HttpOnly Cookie** 存在服务端，浏览器 JS 拿不到，请求时自动带过去
- 所有写操作（开始游戏 / 选卡 / 使用 / 开下一局）都从 cookie 读 playerId/ownerId，**不再信请求体**
- 后台 `/admin/cards` 写操作需要 `.env` 里 `ADMIN_PASSWORD`，前端输一次记住在 localStorage
- 没 HTTPS 也能防伪造（前提是别人拿不到你的浏览器 cookie），但不防中间人窃听

## 🚢 部署

部署在腾讯云 Lighthouse（Ubuntu + Node 22 + PM2 + PostgreSQL + Nginx）。

**首次部署**（服务器已装好 Node / PM2 / Nginx / PostgreSQL 后）：

```bash
# 1. 拉代码
cd /var/www
git clone https://github.com/licatalosidiarra144-code/-----.git majiang
cd majiang

# 2. 写 .env（必填三项，其他可选）
cat > .env <<EOF
DATABASE_URL="postgresql://majiang:majiang2026@127.0.0.1:5432/majiang"
NEXT_PUBLIC_APP_URL="http://1.14.154.250"
ADMIN_PASSWORD="改成你的密码"
COOKIE_SECURE="0"
EOF

# 3. 装依赖 + 建表 + 编译 + 启动
npm install
npx drizzle-kit push    # 问 Do you want to push? → y
npm run build
pm2 start npm --name majiang -- run start
pm2 save
pm2 startup

# 4. Nginx 反代（一次性）
cat > /etc/nginx/sites-available/majiang <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    client_max_body_size 10m;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/majiang /etc/nginx/sites-enabled/majiang
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 5. 腾讯云控制台 → 实例 → 安全组 → 放通 80 端口
```

**以后改代码部署**：

```bash
cd /var/www/majiang
git pull && npm run build && pm2 restart majiang
```

**常用运维命令**：

```bash
pm2 status                   # 看进程
pm2 logs majiang --lines 50  # 看日志
pm2 restart majiang          # 重启
```

## 📦 技术栈

- Next.js 16 + TypeScript + Tailwind
- PostgreSQL（drizzle-orm，没设置 `DATABASE_URL` 时走 Mock 内存模式）
- qrcode.react（二维码）
- PM2（生产进程管理）
- Nginx（反向代理）

## 📂 目录结构

```
麻将抽卡器/
├── app/
│   ├── page.tsx                      首页（创建/加入房间）
│   ├── room/[roomId]/page.tsx        房间页（4 阶段 UI + 扫码）
│   ├── admin/cards/page.tsx          卡牌管理后台（带密码）
│   └── api/                          所有 API 路由
├── components/
│   ├── ui/                           Button / Input
│   ├── card/card-tile.tsx            卡牌组件
│   └── layout/                       Layout
├── lib/
│   ├── session.ts                    Cookie 会话（新增）
│   ├── admin-auth.ts                 后台密码校验（新增）
│   ├── cards/index.ts                卡牌加载（带缓存）
│   ├── db/                           Drizzle schema + Mock
│   └── room/code.ts                  房间码生成
├── data/
│   └── cards.json                    30 张卡（管理后台编辑）
├── next.config.ts
├── drizzle.config.ts
└── .env.example
```

## 🛠️ 卡牌编辑

- **后台界面**：访问 `/admin/cards`，输 `.env` 里 `ADMIN_PASSWORD` 进去，可视化增删改
- **直接改文件**：编辑 `data/cards.json`，改完自动生效（带缓存）

字段：`id / mode(gold|rainbow) / type(skill|equipment) / name / desc / uses / imageUrl / rarity`