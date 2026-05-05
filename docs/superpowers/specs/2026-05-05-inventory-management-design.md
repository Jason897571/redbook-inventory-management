# LittleBeadsBeads 小红书店铺管理系统 — 设计文档

## 概述

为小红书毛衣记号扣店铺 LittleBeadsBeads 构建的库存与成本管理系统。替代现有 Excel 管理方式，提供原材料管理、产品管理（含 BOM 材料清单）、成本/利润自动计算、库存追踪与报警、销售记录等功能。

## 技术栈

- **前端**: React + Vite + TailwindCSS + shadcn/ui
- **后端**: Node.js + Express + Mongoose
- **数据库**: MongoDB
- **图片存储**: 本地 uploads 目录
- **认证**: 暂无（单用户），架构预留扩展

## 项目结构

```
redbook-inventory-management/
├── client/                  # React 前端
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/           # 页面组件
│   │   ├── hooks/           # 自定义 hooks
│   │   ├── lib/             # 工具函数、API client
│   │   └── App.jsx
│   └── package.json
├── server/                  # Express 后端
│   ├── models/              # Mongoose models
│   ├── routes/              # API 路由
│   ├── middleware/           # 中间件（上传等）
│   ├── index.js             # 入口
│   └── package.json
└── package.json             # 根 package.json (workspace)
```

## 数据模型

### Settings（全局设置）

单文档集合，存储店铺配置和所有动态可配置选项。

| 字段 | 类型 | 说明 |
|------|------|------|
| shopName | String | 店铺名称 |
| defaultCommissionRate | Number | 默认平台佣金率 (0.057) |
| currency | String | 货币 (CNY) |
| materialCategories | [String] | 材料分类选项 |
| productStyles | [String] | 产品款式选项 |
| beadCategories | [String] | 珠子材质选项 |
| materialUnits | [String] | 材料单位选项 |
| stockChangeTypes | [String] | 库存变动类型选项 |

### Material（原材料）

| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 材料名称 |
| category | String | 分类（来自 Settings.materialCategories） |
| unitPrice | Number | 单价 |
| unitPriceFormula | String | 单价计算公式备注（如 "=13.2/20"） |
| unit | String | 单位（来自 Settings.materialUnits） |
| stock | Number | 当前库存 |
| stockAlertThreshold | Number | 库存报警阈值 |
| purchaseLink | String | 购买链接 |
| image | String | 图片路径 |
| notes | String | 备注 |

### ProductSeries（产品系列）

| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 系列名称（如"海鸥系列"） |
| description | String | 描述 |
| beadCategory | String | 珠子材质（来自 Settings.beadCategories） |
| image | String | 系列图片 |

### Product（产品/SKU）

| 字段 | 类型 | 说明 |
|------|------|------|
| code | String | 产品编号（如 C1, P1） |
| name | String | 产品全名 |
| series | ObjectId → ProductSeries | 所属系列 |
| styles | [String] | 款式列表（来自 Settings.productStyles） |
| pieceCount | Number | 几个装 |
| price | Number | 定价 |
| commissionRate | Number | 平台佣金率 |
| image | String | 产品图片 |
| stock | Number | 成品库存 |
| stockAlertThreshold | Number | 库存报警阈值 |
| materials | [{material: ObjectId → Material, quantity: Number, unitCost: Number}] | BOM 材料清单 |

虚拟字段（Mongoose virtuals / 前端计算）：
- `totalCost` = Σ(quantity × unitCost)
- `profit` = price - totalCost
- `netProfit` = profit × (1 - commissionRate)
- `profitMargin` = netProfit / price

### SaleRecord（销售记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| date | Date | 销售日期 |
| product | ObjectId → Product | 产品 |
| style | String | 售出款式 |
| quantity | Number | 数量 |
| salePrice | Number | 成交价 |
| cost | Number | 成本快照 |
| netProfit | Number | 净利润快照 |
| notes | String | 备注 |

录入销售时自动扣减成品库存并创建 StockLog。

### StockLog（库存变动日志）

| 字段 | 类型 | 说明 |
|------|------|------|
| type | String | "material" 或 "product" |
| targetId | ObjectId | 材料或产品 ID |
| targetName | String | 名称（冗余，方便查看） |
| changeType | String | 变动类型（来自 Settings.stockChangeTypes） |
| quantity | Number | 变动数量（正=增，负=减） |
| note | String | 备注 |
| date | Date | 日期 |

## 页面设计

### 1. 仪表盘（Dashboard）

- 统计卡片：今日销售额、今日净利润、库存报警数、产品总数
- 库存报警列表：低于阈值的材料和成品
- 最近销售记录

### 2. 原材料管理

- 表格视图，列：图片、名称、分类、单价、库存、状态（充足/进货！）、购买链接、操作
- 顶部：分类筛选标签（动态）+ 搜索 + 添加按钮
- 操作：编辑、快捷进货（弹窗输入数量）
- 进货操作自动增加库存 + 创建 StockLog

### 3. 产品系列

- 卡片式展示所有系列
- 创建/编辑系列（名称、材质、图片）

### 4. 产品管理

- 卡片视图，按系列分组展示
- 每张卡片：图片、名称、款式标签、定价、成本、净利润（率）、库存
- 点击进入产品详情/编辑页

### 5. 产品详情

- 左侧：基本信息 + BOM 材料清单表格（材料名、单价、用量、小计，可增删）
- 右侧：产品图片 + 利润计算面板（定价、总成本、毛利润、佣金、净利润、利润率）
- 利润面板实时随 BOM 变化更新

### 6. 销售记录

- 顶部：快速录入区（选产品 + 款式 + 数量 → 记录销售）
- 下方：销售历史表格，日期筛选（今天/本周/本月/全部）
- 底部汇总栏：合计销售额、合计净利润
- 录入时自动扣库存 + 记录日志 + 快照利润

### 7. 库存日志

- 表格展示所有库存变动记录
- 筛选：按类型（材料/产品）、变动类型

### 8. 设置

- 基本信息：店铺名称、默认佣金率
- 动态选项管理：标签式 UI，每个选项类别（产品款式、材料分类、珠子材质、材料单位、库存变动类型）独立管理，可添加/删除

## API 设计

RESTful API，前缀 `/api`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/PUT | /api/settings | 读取/更新全局设置 |
| CRUD | /api/materials | 原材料 CRUD |
| POST | /api/materials/:id/stock | 原材料进货（增加库存） |
| CRUD | /api/series | 产品系列 CRUD |
| CRUD | /api/products | 产品 CRUD |
| CRUD | /api/sales | 销售记录 CRUD |
| GET | /api/sales/summary | 销售汇总统计 |
| GET | /api/stock-logs | 库存日志查询 |
| GET | /api/dashboard | 仪表盘统计数据 |
| POST | /api/upload | 图片上传 |

## 关键业务逻辑

1. **成本计算**: Product.totalCost = Σ(materials[i].quantity × materials[i].unitCost)
2. **利润计算**: netProfit = (price - totalCost) × (1 - commissionRate)
3. **销售录入**: 创建 SaleRecord → 扣减 Product.stock → 创建 StockLog
4. **库存报警**: stock <= stockAlertThreshold 时标记为报警
5. **进货操作**: 增加 Material.stock → 创建 StockLog
