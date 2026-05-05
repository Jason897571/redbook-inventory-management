# LittleBeadsBeads 库存管理系统

小红书 (Xiaohongshu) 编织记号扣店铺的库存、成本和销售管理工具。

## 技术栈

- **后端**: Node.js + Express + Mongoose
- **前端**: React 19 + Vite + TailwindCSS 4 + shadcn/ui
- **数据库**: MongoDB
- **图标**: Lucide React

## 功能

| 模块 | 功能说明 |
|------|---------|
| 📊 仪表盘 | 今日营收/利润、库存预警、最近销售 |
| 🧵 材料管理 | 材料 CRUD、进货入库、库存跟踪 |
| 📦 产品系列 | 系列分组管理 |
| 🛍️ 产品管理 | BOM 材料清单、成本/利润自动计算 |
| 💰 销售记录 | 快速录入、自动扣库存、按周期汇总 |
| 📋 库存日志 | 所有库存变动记录 |
| ⚙️ 设置 | 店铺信息、动态下拉选项管理 |

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
│   ├── models/               # Mongoose 模型
│   │   ├── Settings.js       # 全局设置（单例）
│   │   ├── Material.js       # 材料
│   │   ├── ProductSeries.js  # 产品系列
│   │   ├── Product.js        # 产品（含 BOM）
│   │   ├── SaleRecord.js     # 销售记录
│   │   └── StockLog.js       # 库存日志
│   ├── routes/               # API 路由
│   │   ├── settings.js
│   │   ├── materials.js
│   │   ├── series.js
│   │   ├── products.js
│   │   ├── sales.js
│   │   ├── stockLogs.js
│   │   ├── dashboard.js
│   │   └── upload.js
│   └── middleware/
│       └── upload.js         # Multer 图片上传
├── client/
│   ├── src/
│   │   ├── main.jsx          # 应用入口
│   │   ├── App.jsx           # 路由配置
│   │   ├── lib/
│   │   │   ├── api.js        # API 客户端
│   │   │   └── utils.js      # 工具函数
│   │   ├── components/       # 共享组件
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TagManager.jsx
│   │   │   ├── ImageUpload.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── AlertList.jsx
│   │   │   └── ui/           # shadcn/ui 组件
│   │   └── pages/            # 页面
│   │       ├── Dashboard.jsx
│   │       ├── Materials.jsx
│   │       ├── Series.jsx
│   │       ├── Products.jsx
│   │       ├── ProductDetail.jsx
│   │       ├── Sales.jsx
│   │       ├── StockLogs.jsx
│   │       └── SettingsPage.jsx
│   └── vite.config.js
├── .env.example
└── package.json
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/PUT | `/api/settings` | 全局设置 |
| GET/POST | `/api/materials` | 材料列表/创建 |
| PUT/DELETE | `/api/materials/:id` | 材料更新/删除 |
| POST | `/api/materials/:id/stock-in` | 材料进货 |
| GET/POST | `/api/series` | 系列列表/创建 |
| PUT/DELETE | `/api/series/:id` | 系列更新/删除 |
| GET/POST | `/api/products` | 产品列表/创建 |
| GET/PUT/DELETE | `/api/products/:id` | 产品详情/更新/删除 |
| GET/POST | `/api/sales` | 销售列表/创建 |
| DELETE | `/api/sales/:id` | 删除销售（恢复库存） |
| GET | `/api/sales/summary` | 销售汇总 |
| GET | `/api/stock-logs` | 库存日志 |
| GET | `/api/dashboard` | 仪表盘数据 |
| POST | `/api/upload` | 图片上传 |

## 利润计算公式

```
总成本 = Σ(材料用量 × 材料单价)
毛利润 = 售价 - 总成本
净利润 = 毛利润 × (1 - 佣金率)
利润率 = 净利润 / 售价
```

默认平台佣金率: 5.7%
