# Arco 企业暗色主题重构设计

**日期**: 2026-05-05
**状态**: 设计已确认，待实施

## 背景与问题

当前前端存在两个主要问题：

1. **下拉菜单不可见**：Shadcn/ui 的 Select 组件依赖 CSS 变量（如 `bg-popover`、`text-popover-foreground`、`bg-accent`），但 `client/src/index.css` 仅有一行 `@import "tailwindcss"`，未定义任何变量。导致下拉弹层背景色与页面背景几乎相同，用户看不到选项。
2. **设计风格不统一**：所有颜色硬编码在各组件的 Tailwind 类中（`bg-gray-950`、`bg-gray-900`、`border-gray-800` 等），缺少统一的 token 系统。同一类元素在不同页面颜色不一致（如 Select 触发器有 `bg-gray-800` 也有 `bg-gray-900`）。

## 设计目标

参考 Arco Design 企业暗色风格，建立完整的 CSS 变量主题系统，并将主色调从粉色统一为 Arco 蓝。

## 颜色系统

在 `client/src/index.css` 中定义完整的 Shadcn CSS 变量：

```css
@import "tailwindcss";

@layer base {
  :root, .dark {
    /* 背景层次 — page < card < popover，逐级提亮约 8% */
    --background: #17171a;          /* 页面底色 */
    --card: #1e1e22;                /* 卡片 / 侧边栏 */
    --popover: #2a2a2e;             /* 下拉菜单 / 弹窗 ← 解决核心问题 */
    --muted: #232326;               /* 输入框 / hover 底色 */

    /* 文字层次 */
    --foreground: #f0f1f5;          /* 主文字 */
    --card-foreground: #f0f1f5;
    --popover-foreground: #f0f1f5;
    --muted-foreground: #86909c;    /* 次要文字 */

    /* 主色调 — Arco 蓝 */
    --primary: #165DFF;
    --primary-foreground: #ffffff;
    --accent: rgba(22, 93, 255, 0.15);   /* 选中高亮底色 */
    --accent-foreground: #4080FF;

    /* 边框 */
    --border: #333338;
    --input: #333338;
    --ring: #165DFF;

    /* 功能色 */
    --destructive: #f53f3f;
    --destructive-foreground: #ffffff;

    /* 圆角 */
    --radius: 0.5rem;
  }

  @theme inline {
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-card: var(--card);
    --color-card-foreground: var(--card-foreground);
    --color-popover: var(--popover);
    --color-popover-foreground: var(--popover-foreground);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-accent: var(--accent);
    --color-accent-foreground: var(--accent-foreground);
    --color-border: var(--border);
    --color-input: var(--input);
    --color-ring: var(--ring);
    --color-destructive: var(--destructive);
    --color-destructive-foreground: var(--destructive-foreground);
  }
}
```

这套变量与 Shadcn/ui 的默认 token 名称完全对齐，可让所有 Shadcn 组件（Select、Dialog、Card、Input、Button 等）无需修改即可获得正确的暗色样式。

## 改造范围

### 基础组件（client/src/components/ui/）

- `select.jsx` — 移除依赖语义 token 后默认即可正确显示，无需大改
- `dialog.jsx` — 验证弹窗适配
- `card.jsx`、`input.jsx`、`button.jsx` — 验证适配，主色 default 变体使用 `bg-primary`

### 页面/布局组件

- `Layout.jsx` — `bg-gray-950 text-white` → `bg-background text-foreground`
- `Sidebar.jsx` — `bg-gray-900` → `bg-card`；品牌色 `text-pink-400` → `text-primary`；激活态 `border-blue-400` → `border-primary`，`bg-gray-800` → `bg-accent`
- `StatsCard.jsx` — `bg-gray-900 border-gray-800` → `bg-card border-border`
- `AlertList.jsx` — 同上
- `Dashboard.jsx`、`ProductDetail.jsx` 等所有页面 — 替换硬编码灰色为语义 token

### Select 用法清理

移除所有页面中 SelectTrigger 上的 `className="bg-gray-800 border-gray-700"` / `className="bg-gray-900 border-gray-700"` 覆盖，使用组件默认样式。涉及文件：
`Materials.jsx`, `Series.jsx`, `Products.jsx`, `ProductDetail.jsx`, `Sales.jsx`, `StockLogs.jsx`

## 设计原则

| 原则 | 实现 |
|------|------|
| 背景层次 | page → card → popover → muted，逐级提亮 |
| 边框统一 | 全部使用 `border-border`（#333338），不再 gray-700/800 混用 |
| 主色调 | Arco 蓝 #165DFF，用于按钮、链接、选中态、focus ring |
| 功能色 | 绿 #00b42a（利润/成功）、红 #f53f3f（警告/亏损）保持不变 |
| 弹层可见 | popover 比 card 再提亮一级 + 阴影，确保从背景中"浮"出来 |

## 不在范围

- 不引入新的设计库（如 Arco React 组件库本身）
- 不实现亮色主题切换
- 不修改业务逻辑、数据流或路由结构
- 不引入 ReactBits/MotionSites 风格的动画背景（避免对数据密集型管理界面造成干扰）
