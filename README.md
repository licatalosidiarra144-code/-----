# 麻将抽卡器 💌

> 📅 项目状态：MVP 跑通 + **已部署到腾讯云** + **扫码加入** + **卡牌管理后台**

4 人一桌，扫一个房间码进来，系统随机选"金局/彩局"，抽技能卡 + 装备卡，真打麻将时装备卡点"使用"变灰。

## 🚀 启动

```bash
npm install
npm run dev
```

打开 http://localhost:3000

没数据库也能跑（Mock 模式）。要接 PostgreSQL 就复制 `.env.example` → `.env` 填上 `DATABASE_URL`。

## 🎮 怎么玩

1. 房主打开首页 → 输昵称 → 创建房间 → 拿到 6 位房间码
2. 其他人 → 输房间码 + 昵称 → 加入；**或者扫房主分享的二维码**直接进
3. 4 人齐 → 房主点"开始"
4. 系统随机金/彩局
5. 第一轮：每人 4 张技能卡（4 选 1）
6. 第二轮：每人 5 张装备卡（5 选 3）
7. 展示页：看自己的卡 / 点别人头像看 / 装备卡"使用"变灰
8. 房主点"开下一局"

## ✨ 主要功能

- 🀄 **4 人房间 + 房间码**（6 位字符，扫码加入）
- 📱 **二维码邀请**（`qrcode.react`，手机扫直接进）
- 🎴 **金局 / 彩局** 系统随机选模式
- 🎯 **技能卡 + 装备卡** 两轮抽卡
- 🛠️ **卡牌管理后台** `/admin/cards`（增删改所有卡，存 `data/cards.json`）
- 👀 **查看别人卡组**（点玩家头像）

## 📦 技术栈

- Next.js 16 + TypeScript + Tailwind
- PostgreSQL（drizzle-orm，可选，未设置时走 Mock）
- qrcode.react（二维码）

## 📂 目录结构

```
麻将抽卡器/
├── app/
│   ├── page.tsx                      首页（创建/加入房间）
│   ├── room/[roomId]/page.tsx        房间页（4 阶段 UI + 扫码）
│   ├── admin/cards/page.tsx          卡牌管理后台
│   └── api/                          所有 API 路由
├── components/
│   ├── ui/                           Button / Input
│   ├── card/card-tile.tsx            卡牌组件
│   └── layout/                       Layout
├── lib/
│   ├── cards/index.ts                卡牌加载（带缓存）
│   ├── db/                           Drizzle schema + Mock
│   └── auth/                         Session
├── data/
│   └── cards.json                    30 张卡（管理后台编辑）
├── next.config.ts
├── drizzle.config.ts
└── .env.example
```

## 🚢 部署

参考项目根目录部署流程（PM2 + tar 上传）。关键步骤：
1. `tar -czf --exclude=node_modules --exclude=.next` 打包
2. scp 到服务器 `/home/ubuntu/`
3. 服务器解压到项目目录
4. `npm install && npm run build`
5. `pm2 restart`

## 🛠️ 卡牌编辑

- **后台界面**：访问 `/admin/cards`，可视化增删改
- **直接改文件**：编辑 `data/cards.json`，改完自动生效（带缓存）

字段：`id / mode(gold|rainbow) / type(skill|equipment) / name / desc / uses / imageUrl / rarity`