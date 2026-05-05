# LittleBeadsBeads 库存管理系统

小红书 (Xiaohongshu) 编织记号扣店铺的库存、成本和销售管理工具。

## 技术栈

- **后端**: Node.js + Express + Mongoose
- **前端**: React 19 + Vite 8 + TailwindCSS 4 + shadcn/ui (Radix UI)
- **数据库**: MongoDB
- **拖拽**: @dnd-kit (core + sortable)
- **图标**: Lucide React
- **主题**: Arco Design 风格暗色主题

## 功能

| 模块 | 功能说明 |
|------|---------|
| 📊 仪表盘 | 今日营收/利润、库存预警、最近销售 |
| 🧵 原料管理 | 原料 CRUD、进货入库、库存跟踪、分类搜索 |
| 🔩 半成品管理 | 拖拽原料组合成半成品，全屏编辑器 |
| 🛍️ 成品管理 | 拖拽半成品组合成产品，多图上传，成本/利润自动计算 |
| 📦 产品系列 | 拖拽产品归入系列，多对多关系 |
| 💰 销售记录 | 快速录入、自动扣库存、按周期汇总 |
| 📋 库存日志 | 所有库存变动记录 |
| ⚙️ 设置 | 店铺信息、佣金率、动态下拉选项管理 |

## 三层 BOM 架构

```
原料 (Material)  →  半成品 (SemiProduct)  →  成品 (Product)
                     原料 × 数量              半成品 × 数量
```

- **原料**: 基础材料（主珠子、配珠子、五金件、包材等），有单价和库存
- **半成品**: 由多种原料组合而成，无单独定价和库存
- **成品**: 由多种半成品组合而成，有定价、库存、多图、款式
- **系列**: 成品的分组容器，一个产品可属于多个系列

成本自动计算：成品总成本 = Σ(半成品用量 × 半成品原料成本)

## 拖拽编辑模式

半成品、成品、系列均采用统一的全屏拖拽编辑器：

```
┌─────────────────────┬────────────────────────┐
│   素材库（左）       │   组合池（右）          │
│   [搜索框]          │                        │
│   ┌─────┐ ┌─────┐  │   ┌─────────────────┐  │
│   │ A   │ │ B   │  │   │ C    数量/删除  │  │
│   └─────┘ └─────┘  │   └─────────────────┘  │
└─────────────────────┴────────────────────────┘
```

- 从左侧拖入素材到右侧组合池
- 重复拖入自动合并（半成品/成品数量+1，系列去重）
- 组合池内可拖拽排序
- 实时利润计算面板（成品编辑器）

## 快速开始

### 前置条件

- Node.js 18+
- MongoDB (本地或 Docker)

### 安装

```bash
# 克隆仓库
git clone <repo-url>
cd redbook-inventory-management

# 安装所有依赖
npm install --prefix server
npm install --prefix client

# 配置环境变量
cp .env.example .env
# 编辑 .env 设置 MongoDB 连接地址
```

### 初始化数据

```bash
node server/seed.js
```

### 启动开发服务器

```bash
# 终端 1: 启动后端
npm run dev --prefix server

# 终端 2: 启动前端
npm run dev --prefix client
```

前端访问 http://localhost:5173，后端 API 在 http://localhost:5000。

Vite 已配置代理，前端 `/api` 和 `/uploads` 请求自动转发到后端。

## 项目结构

```
redbook-inventory-management/
├── server/
│   ├── index.js              # Express 入口
│   ├── seed.js               # 默认设置初始化
│   ├── models/
│   │   ├── Settings.js       # 全局设置（单例）
│   │   ├── Material.js       # 原料
│   │   ├── SemiProduct.js    # 半成品（原料组合）
│   │   ├── Product.js        # 成品（半成品组合 + 利润虚拟字段）
│   │   ├── ProductSeries.js  # 产品系列（产品分组）
│   │   ├── SaleRecord.js     # 销售记录
│   │   └── StockLog.js       # 库存日志
│   ├── routes/
│   │   ├── settings.js       # 全局设置 CRUD
│   │   ├── materials.js      # 原料 CRUD + 进货
│   │   ├── semiProducts.js   # 半成品 CRUD
│   │   ├── products.js       # 成品 CRUD（深度关联查询）
│   │   ├── series.js         # 系列 CRUD
│   │   ├── sales.js          # 销售 CRUD + 自动成本计算
│   │   ├── stockLogs.js      # 库存日志查询
│   │   ├── dashboard.js      # 仪表盘聚合数据
│   │   └── upload.js         # 图片上传
│   └── middleware/
│       └── upload.js         # Multer 配置 (5MB, jpg/png/gif/webp)
├── client/
│   ├── src/
│   │   ├── main.jsx          # React 入口 (BrowserRouter)
│   │   ├── App.jsx           # 路由配置
│   │   ├── index.css         # 暗色主题 CSS 变量
│   │   ├── lib/
│   │   │   ├── api.js        # API 客户端
│   │   │   └── utils.js      # cn() 工具函数
│   │   ├── components/
│   │   │   ├── Layout.jsx    # 布局（侧边栏 + 内容）
│   │   │   ├── Sidebar.jsx   # 可折叠侧边栏（子菜单拖拽排序）
│   │   │   ├── ImageUpload.jsx      # 单图上传
│   │   │   ├── MultiImageUpload.jsx # 多图上传（拖拽排序，首图封面）
│   │   │   ├── TagManager.jsx       # 标签管理器
│   │   │   ├── StatsCard.jsx        # 统计卡片
│   │   │   ├── AlertList.jsx        # 库存预警列表
│   │   │   └── ui/           # shadcn/ui 基础组件 (10个)
│   │   └── pages/
│   │       ├── Dashboard.jsx       # 仪表盘
│   │       ├── Materials.jsx       # 原料管理
│   │       ├── SemiProducts.jsx    # 半成品列表
│   │       ├── SemiProductEdit.jsx # 半成品编辑（拖拽原料）
│   │       ├── Products.jsx        # 成品列表
│   │       ├── ProductEdit.jsx     # 成品编辑（拖拽半成品 + 利润面板）
│   │       ├── Series.jsx          # 系列列表
│   │       ├── SeriesEdit.jsx      # 系列编辑（拖拽产品）
│   │       ├── Sales.jsx           # 销售记录
│   │       ├── StockLogs.jsx       # 库存日志
│   │       └── SettingsPage.jsx    # 设置
│   └── vite.config.js
├── .env.example
└── package.json              # npm workspaces
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/PUT | `/api/settings` | 全局设置 |
| GET/POST | `/api/materials` | 原料列表（支持 category/search 过滤）/创建 |
| GET/PUT/DELETE | `/api/materials/:id` | 原料详情/更新/删除 |
| POST | `/api/materials/:id/stock` | 原料进货入库 |
| GET/POST | `/api/semi-products` | 半成品列表/创建 |
| GET/PUT/DELETE | `/api/semi-products/:id` | 半成品详情/更新/删除 |
| GET/POST | `/api/products` | 成品列表/创建（深度关联：半成品→原料 + 系列） |
| GET/PUT/DELETE | `/api/products/:id` | 成品详情/更新/删除 |
| GET/POST | `/api/series` | 系列列表（关联产品）/创建 |
| GET/PUT/DELETE | `/api/series/:id` | 系列详情/更新/删除 |
| GET/POST | `/api/sales` | 销售列表（支持 period 过滤）/创建（自动计算成本、扣库存） |
| DELETE | `/api/sales/:id` | 删除销售（恢复库存） |
| GET | `/api/sales/summary` | 销售汇总统计 |
| GET | `/api/stock-logs` | 库存日志（支持 type/changeType 过滤） |
| GET | `/api/dashboard` | 仪表盘聚合数据 |
| POST | `/api/upload` | 图片上传 (Multer, 5MB 限制) |

## 利润计算公式

```
半成品成本 = Σ(原料用量 × 原料单价)
成品总成本 = Σ(半成品用量 × 半成品成本)
毛利润     = 售价 - 总成本
佣金       = 毛利润 × 佣金率
净利润     = 毛利润 × (1 - 佣金率)
利润率     = 净利润 / 售价
```

默认平台佣金率: 5.7%

## License

MIT
