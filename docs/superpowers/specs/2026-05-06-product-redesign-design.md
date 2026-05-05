# Product Management Redesign

## Summary

Redesign products (成品) as compositions of semi-products. Remove series/pieceCount/BOM fields. Add drag-and-drop semi-product composition pool (same pattern as semi-product editor), multi-image upload with drag-to-reorder, and auto-calculated profit from semi-product material costs.

## Data Model

### Product Schema (simplified)

```
code                String, unique, required    — 产品编号
name                String, required             — 产品名称
styles              [String], default []         — 款式（预定义 + 自由输入）
price               Number, required, default 0  — 定价
commissionRate      Number, default 0.057        — 佣金率
stock               Number, default 0            — 库存
stockAlertThreshold Number, default 5            — 报警阈值
images              [String], default []         — 多图（第一张为封面）
semiProducts        Array of:
  semiProduct         ObjectId → SemiProduct      — 半成品引用
  quantity            Number, default 1, min 1    — 用量
```

**Removed fields:** `series`, `pieceCount`, `image` (replaced by `images`), `components`, `sharedMaterials`, `bomItemSchema`, `componentSchema`.

**Virtual fields (rewritten):**
- `totalCost` — sum of each semiProduct's material costs × quantity in this product
- `profit` = price - totalCost
- `netProfit` = profit × (1 - commissionRate)
- `profitMargin` = netProfit / price

Virtual `totalCost` requires deep population: `semiProducts.semiProduct` → `materials.material` to read each material's `unitPrice`.

## API Changes

### Routes (server/routes/products.js)

- **GET /api/products** — list all, deep populate `semiProducts.semiProduct` + nested `materials.material`
- **GET /api/products/:id** — single, same deep populate
- **POST /api/products** — create with `{ code, name, styles, price, commissionRate, stock, stockAlertThreshold, images, semiProducts: [{ semiProduct: id, quantity }] }`
- **PUT /api/products/:id** — update same shape
- **DELETE /api/products/:id** — unchanged

Remove: series query filter, series/components/sharedMaterials population.

### Routes (server/routes/sales.js)

Update cost calculation in POST `/api/sales` (lines 62-73):
- Deep populate `product.semiProducts.semiProduct` → `materials.material`
- Calculate totalCost by iterating semiProducts, summing each semi-product's material costs × semi-product quantity
- Rest of profit formula unchanged: `netProfit = (price - totalCost) * (1 - commissionRate)`

## Frontend

### List Page (`/products`)

- Card grid (no series grouping)
- Simplified card: cover image (images[0]), code, name, style badges, stock, price, net profit
- Click card → navigate to `/products/:id/edit`
- "添加产品" button → navigate to `/products/new`

### Full-Screen Edit Page (`/products/new` and `/products/:id/edit`)

**Layout:**

```
┌──────────────────────────────────────────────┐
│  [< 返回]              保存按钮              │
├──────────────────────────────────────────────┤
│  [多图上传区 - 拖拽排序，第一张为封面]        │
│  [编号] [名称] [款式标签: 预定义+自由输入]    │
│  [定价] [佣金率%] [库存] [报警阈值]          │
├─────────────────────┬────────────────────────┤
│   半成品库          │   组合池               │
│   [搜索框]          │                        │
│   ┌─────┐ ┌─────┐  │   ┌─────────────────┐  │
│   │SP-A │ │SP-B │  │   │SP-C  数量: 2  ×│  │
│   └─────┘ └─────┘  │   └─────────────────┘  │
│                     │                        │
│                     ├────────────────────────┤
│                     │   利润计算面板         │
│                     │   总成本 / 毛利 / 佣金 │
│                     │   净利润 / 利润率      │
│                     └────────────────────────┘
└─────────────────────┴────────────────────────┘
```

**Multi-image upload area:**
- Grid of image thumbnails, draggable to reorder (@dnd-kit/sortable)
- First image marked as cover
- Click "+" to add, each image has delete button

**Left panel — 半成品库:**
- Search input (by name)
- List of semi-product mini-cards (image, code, name, material count)
- Draggable to right panel

**Right panel — 组合池:**
- Drop zone + sortable pool (same pattern as SemiProductEdit)
- Each entry: semi-product info + quantity +/- + delete
- Drag duplicate → auto-merge (quantity +1)

**Profit calculation panel (below pool):**
- Lists each semi-product's cost contribution
- Total cost = sum of all
- Gross profit = price - total cost
- Commission = gross profit × rate
- Net profit = gross profit - commission
- Profit margin = net profit / price

### Styles Input

- Show pill buttons from `settings.productStyles` (multi-select toggle)
- Additional free-text input to add custom styles
- Custom styles appear as removable pills

## Files to Modify

### Server
- `server/models/Product.js` — rewrite schema, rewrite virtual cost computation
- `server/routes/products.js` — simplify population to semiProducts chain
- `server/routes/sales.js` — update cost calculation to use semiProducts path

### Client
- `client/src/App.jsx` — replace `/products/:id` route with `/products/:id/edit` and `/products/new`, remove ProductDetail import
- `client/src/pages/Products.jsx` — simplify to list-only, no series grouping, navigate to edit
- `client/src/pages/ProductEdit.jsx` — **new file**, full-screen editor with dnd
- `client/src/pages/ProductDetail.jsx` — **delete**
- `client/src/components/MultiImageUpload.jsx` — **new file**, multi-image with drag-to-reorder
- `client/src/lib/api.js` — simplify getProducts
