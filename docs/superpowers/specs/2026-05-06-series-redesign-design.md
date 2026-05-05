# Product Series Redesign

## Summary

Redesign product series (产品系列) as simple containers that group products via many-to-many drag-and-drop. Remove `beadCategory`. Replace dialog form with full-screen edit page that drags products from a library into a series's product pool. Product list and edit pages display series membership read-only.

## Data Model

### ProductSeries Schema

```
name        String, required
description String, default ''
image       String, default ''         — 封面
products    [ObjectId → Product]       — 包含的成品
```

**Removed:** `beadCategory`.
**Added:** `products` array.

### Product Schema (additive)

Add a virtual reverse-populate field for read-only display:

```javascript
productSchema.virtual('series', {
  ref: 'ProductSeries',
  localField: '_id',
  foreignField: 'products',
});
```

No physical field added to Product. The virtual is populated on demand in product routes.

## API Changes

### Routes (server/routes/series.js)

- **GET /api/series** — list all, populate `products` (selecting code, name, images for compact display), sort by name
- **GET /api/series/:id** — single, populate products
- **POST /api/series** — create with `{ name, description, image, products: [id, id, ...] }`
- **PUT /api/series/:id** — update same shape
- **DELETE /api/series/:id** — unchanged

### Routes (server/routes/products.js)

Extend deep populate to include the series virtual:

```javascript
const deepPopulate = [
  { path: 'semiProducts.semiProduct', populate: { path: 'materials.material' } },
  { path: 'series', select: 'name' },
];
```

## Frontend

### List Page (`/series`)

- Card grid: cover, name, product count badge ("N个产品"), description snippet
- Click card → `/series/:id/edit`
- "添加系列" button → `/series/new`
- Delete button on hover (with confirm)

### Full-Screen Edit Page (`/series/new` and `/series/:id/edit`)

**Layout:**

```
┌──────────────────────────────────────────────┐
│  [< 返回]              [保存按钮]            │
├──────────────────────────────────────────────┤
│  [封面] [名称]                               │
│         [描述]                               │
├─────────────────────┬────────────────────────┤
│   产品库            │   系列产品池           │
│   [搜索框]          │                        │
│   ┌────────┐        │   ┌────────────────┐   │
│   │P-001   │        │   │P-005      ×    │   │
│   └────────┘        │   └────────────────┘   │
│                     │                        │
└─────────────────────┴────────────────────────┘
```

**Basic info section:**
- ImageUpload for cover
- Name input (required)
- Description textarea/input

**Left panel — 产品库:**
- Search input (filters by name + code)
- List of product mini-cards (cover from `images[0]`, code, name)
- Each card draggable (uses `useDraggable`, same pattern as ProductEdit's semi-product library)

**Right panel — 系列产品池:**
- Drop zone wrapper + sortable pool (same pattern as ProductEdit)
- Each pool entry shows product cover + code + name + remove button
- No quantity input (containment only)
- Drag duplicate → no-op (silently dedupe — entry already exists)
- Pool items draggable for reorder within pool
- DragOverlay for both source and pool drag

**Save:**
- Sends `{ name, description, image, products: pool.map(p => p._id) }`
- Navigates back to `/series` on success

**Unsaved changes guard:** confirm dialog on back navigation if dirty.

### Product Display (read-only)

**Products list (`/products`):**
- (Optional) small "·N系列" muted text on card if `p.series?.length > 0`

**ProductEdit (`/products/:id/edit`):**
- Below the page title (or in the basic info section), render read-only chips: "所属系列: [系列A] [系列B]"
- Chips are non-interactive (no toggle, no delete) — purely informational
- Hidden in `/products/new` mode (no series until saved & added from series page)

## Files to Modify

### Server
- `server/models/ProductSeries.js` — drop `beadCategory`, add `products: [ObjectId]`
- `server/models/Product.js` — add `series` virtual (reverse populate)
- `server/routes/series.js` — populate products
- `server/routes/products.js` — extend deep populate with series virtual

### Client
- `client/src/App.jsx` — add `/series/new` and `/series/:id/edit` routes
- `client/src/pages/Series.jsx` — simplify to list-only with navigation
- `client/src/pages/SeriesEdit.jsx` — **new file**, full-screen editor with dnd
- `client/src/pages/ProductEdit.jsx` — add read-only series chips section
- `client/src/pages/Products.jsx` — (optional) add series count badge to cards

## Migration Notes

- Existing series will lose `beadCategory` data on next save (silently dropped).
- Existing series start with empty `products` array. The old `Product.series` field was already removed in the prior product redesign, so there is nothing to migrate from. Users will repopulate series via the new drag-and-drop UI.
