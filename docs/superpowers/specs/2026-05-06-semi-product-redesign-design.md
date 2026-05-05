# Semi-Product Management Redesign

## Summary

Redesign semi-products (半成品) to be compositions of raw materials. Remove pricing, stock, threshold, and series fields. Add a drag-and-drop full-screen editor where users drag material cards into a composition pool with adjustable quantities.

## Data Model

### SemiProduct Schema (simplified)

```
code       String, unique, required   — 编号
name       String, required            — 名称
image      String                      — 图片路径
materials  Array of:
  material   ObjectId → Material       — 原材料引用
  quantity   Number, default 1, min 1  — 用量
```

**Removed fields:** `price`, `stock`, `stockAlertThreshold`, `series`, `components`, `sharedMaterials`, virtual `totalCost`.

## API Changes

### Routes (server/routes/semiProducts.js)

- **GET /api/semi-products** — list all, populate `materials.material`
- **GET /api/semi-products/:id** — single, populate `materials.material`
- **POST /api/semi-products** — create with `{ code, name, image, materials: [{ material: id, quantity }] }`
- **PUT /api/semi-products/:id** — update same shape
- **DELETE /api/semi-products/:id** — unchanged

Remove: series population, components/sharedMaterials population.

## Frontend

### List Page (`/semi-products`)

- Card grid (existing layout, no series grouping)
- Simplified card: image, code, name, material count badge (e.g. "5种原料")
- Click card → navigate to `/semi-products/:id/edit`
- "新增半成品" button → navigate to `/semi-products/new`

### Full-Screen Edit Page (`/semi-products/new` and `/semi-products/:id/edit`)

**Layout:**

```
┌──────────────────────────────────────────────┐
│  [< 返回]           保存按钮                  │
├──────────────────────────────────────────────┤
│  [图片上传]  [编号输入]  [名称输入]            │
├─────────────────────┬────────────────────────┤
│   原料库            │   组合池               │
│   [搜索框]          │                        │
│   ┌─────┐ ┌─────┐  │   ┌─────────────────┐  │
│   │原料A│ │原料B│  │   │原料C  数量: 3 ×│  │
│   └─────┘ └─────┘  │   └─────────────────┘  │
│   ┌─────┐ ┌─────┐  │   ┌─────────────────┐  │
│   │原料C│ │原料D│  │   │原料A  数量: 1 ×│  │
│   └─────┘ └─────┘  │   └─────────────────┘  │
│                     │                        │
└─────────────────────┴────────────────────────┘
```

**Left panel — 原料库:**
- Search input (by name)
- Grid of material mini-cards (image thumbnail, name, unit)
- All materials shown, draggable

**Right panel — 组合池:**
- Drop zone accepting materials from left panel
- Each entry: material info + quantity adjuster (+/- buttons or editable number) + delete button
- Items sortable by drag within the pool
- Drag duplicate → auto-merge (quantity +1)
- Quantity to 0 or click delete → remove from pool

### Drag-and-Drop

Uses existing `@dnd-kit/core` + `@dnd-kit/sortable`:
- Left panel items: `useDraggable`
- Right panel: `useDroppable` container + `SortableContext` for reordering within pool
- `DndContext` wraps the entire lower section
- `PointerSensor` with activation distance 4px (match Sidebar pattern)

## Interaction Rules

| Action | Result |
|--------|--------|
| Drag material from left to right | Add to pool with quantity 1 |
| Drag existing material again | Quantity +1 (merge) |
| Click +/- on pool item | Adjust quantity |
| Quantity reaches 0 or click × | Remove from pool |
| Drag within pool | Reorder display |
| Click 保存 | Validate (code + name required, pool can be empty), save via API |
| Click 返回 | Navigate back to list (warn if unsaved changes) |

## Files to Modify

### Server
- `server/models/SemiProduct.js` — simplify schema
- `server/routes/semiProducts.js` — simplify population

### Client
- `client/src/pages/SemiProducts.jsx` — simplify to list-only, add navigation
- `client/src/pages/SemiProductEdit.jsx` — **new file**, full-screen editor
- `client/src/lib/api.js` — no changes needed (existing CRUD suffices)
- `client/src/App.jsx` — add routes for `/semi-products/new` and `/semi-products/:id/edit`
