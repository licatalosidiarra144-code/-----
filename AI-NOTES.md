# AI 开发笔记

> 这个文件给 AI 看，记录项目特有的坑、约定、技术栈细节。
> 不是产品文档（看 [README.md](README.md)），是给"接手的 AI"快速对齐用的。

## 技术栈

- Next.js 16.2.9（App Router，Turbopack）
- React 19
- **Tailwind v4**（不是 v3！important 语法不同）
- 自己的 Button（在 `components/ui/button.tsx`，不是 shadcn）
- PostgreSQL（Drizzle ORM）+ 部署到腾讯云 + Cloudflare 隧道

## 玩法约定（2026-08）

- 只留**技能卡**，无装备卡 / 无使用次数
- 局型：`silver` 30% / `prismatic` 40% / `gold` 30%，严格分池
- 流程：`waiting → skill_picking → playing`
- 抽选：4 选 1，每人每局可 `skill-reroll` **1 次**（允许与上一轮重复）
- 卡库：`data/cards.json`（按《抽牌规则》导入，后台可改）

## PostgreSQL 迁移（生产）

若已有旧库，需要加重选计数字段：

```sql
ALTER TABLE card_draws
  ADD COLUMN IF NOT EXISTS rerolls_used integer NOT NULL DEFAULT 0;
```

Mock 模式不需要。

## ⚠️ Tailwind v4 重要语法

v4 的 important 修饰符从**前缀**改成**后缀**：

```tsx
// ❌ v3 写法（v4 不认，整条规则被忽略）
className="!bg-white/15"

// ✅ v4 写法
className="bg-white/15!"
```

如何判断是 v3 还是 v4：看 `package.json` 里的 `tailwindcss` 版本号。

## ⚠️ Button 是自己写的，不是 shadcn

位置：`components/ui/button.tsx`

4 个 variant：

| variant | 样式 | 适合 |
|---------|------|------|
| `primary` | 粉红渐变 `bg-gradient-to-r from-pink-600 to-rose-600` | 重要 CTA（慎用，太刺眼） |
| `secondary` | `bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm` | 磨砂玻璃风格 |
| `ghost` | `text-white/80 hover:bg-white/10` | 低调文字按钮 |
| `outline` | `border border-white/20 bg-white/5` | 描边按钮 |

**坑**：`cn()` 是简单拼接（不是 `tailwind-merge`），所以 `className` 里加的 `bg-xxx` 跟 variant 里的 `bg-xxx` **同优先级**，后写的不一定赢（看 CSS 加载顺序）。**改颜色首选换 variant**，别硬刚 `className`。

要微调，加在 `className` 里（最后拼接的，能覆盖前面的）。

## 背景层

首页 + 管理后台 + 游戏页（`/room/[roomId]`）都用了 `components/background-paths/FloatingPaths.tsx`（来自 `f:\projects\components\background-paths\BackgroundPaths.tsx` 的 `FloatingPaths` 单独导出）。

**父容器**：`relative min-h-screen overflow-hidden bg-slate-950 text-white`

**背景层**（z-index 是关键，错的会盖住内容）：
```tsx
{/* 流动曲线（两层反向，opacity 控制明暗） */}
<div className="pointer-events-none fixed inset-0 z-0 text-white/50">
  <FloatingPaths position={1} />
  <FloatingPaths position={-1} />
</div>
{/* 底色兜底（-z-10 永远在最底） */}
<div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950" />
{/* 游戏页额外加一个深绿 radial（保留"麻将桌"感觉） */}
<div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.08),_transparent_60%)]" />
```

**曲线明暗**（`text-white/X`）：
| 页面 | 透明度 | 备注 |
|------|--------|------|
| 首页 | `/50` | 跟后台/游戏页统一（之前 `/40` 偏淡） |
| 管理后台 | `/50` | 文字密，曲线要更明显（`/30` 试过太淡） |
| 游戏页 | `/50` | 同上 |
| 想再亮 | `/60` | 几乎不透明 |

## ⚠️ 文字对比度（深色背景上的白字）

旧的 `text-white/30` ~ `/40` 在流动曲线背景上**几乎看不见**，要拉到 `/55` 以上才清晰。

可用的层次（已用在首页，验证过）：

| 用途 | className |
|------|-----------|
| 主副标题 | `text-white/85` |
| 小字注释（紧贴标题下） | `text-white/65` |
| 页脚 | `text-white/55` |

**口诀**：深色背景上，**最低 `/55`**，副标题用 `/85`，主标题用渐变色。低于 `/50` 就"费劲"。

## Button 配色（验证过的搭配）

| 场景 | 搭配 |
|------|------|
| 重要 CTA | `variant="primary"`（粉红渐变） |
| 普通提交（推荐） | `variant="secondary"` + `className="w-full bg-white/15 hover:bg-white/25 border border-white/25 shadow-sm"` |
| 低调 | `variant="ghost"` |
| 描边 | `variant="outline"` |
