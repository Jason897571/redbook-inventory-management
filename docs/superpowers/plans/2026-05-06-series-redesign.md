# Series Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign product series as simple containers grouping products via many-to-many drag-and-drop, with read-only series display on product views.

**Architecture:** ProductSeries gains `products: [ObjectId]` and drops `beadCategory`. Product gets a `series` virtual (reverse populate) for read-only display. Frontend replaces the dialog form with a full-screen editor following the same dnd pattern as ProductEdit/SemiProductEdit (left product library, right series pool, no quantities).

**Tech Stack:** MongoDB/Mongoose (virtuals + reverse populate), Express, React, @dnd-kit/core + @dnd-kit/sortable, Tailwind CSS, shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-05-06-series-redesign-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `server/models/ProductSeries.js` | Drop beadCategory, add products[] |
| Modify | `server/models/Product.js` | Add `series` virtual (reverse populate from ProductSeries.products) |
| Modify | `server/routes/series.js` | Populate products on GET responses |
| Modify | `server/routes/products.js` | Extend deepPopulate to include `series` virtual |
| Modify | `client/src/App.jsx` | Add `/series/new` and `/series/:id/edit` routes |
| Modify | `client/src/pages/Series.jsx` | Simplify to list-only with navigation |
| Create | `client/src/pages/SeriesEdit.jsx` | Full-screen editor with dnd product pool |
| Modify | `client/src/pages/ProductEdit.jsx` | Add read-only series chips section |

---

## Chunk 1: Server-Side Changes

### Task 1: Update ProductSeries Schema

**Files:**
- Modify: `server/models/ProductSeries.js`

- [ ] **Step 1: Replace the schema**

Replace the full content of `server/models/ProductSeries.js` with:

```javascript
const mongoose = require('mongoose');

const productSeriesSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

module.exports = mongoose.model('ProductSeries', productSeriesSchema);
```

Removed: `beadCategory`.
Added: `products` array of Product ObjectId refs.

- [ ] **Step 2: Verify model loads**

Run: `cd server && node -e "require('./models/ProductSeries'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/models/ProductSeries.js
git commit -m "refactor(model): drop beadCategory, add products[] to ProductSeries"
```

### Task 2: Add Series Virtual to Product Model

**Files:**
- Modify: `server/models/Product.js`

- [ ] **Step 1: Add virtual**

Add the following virtual to `server/models/Product.js` immediately after the `profitMargin` virtual (after line 42, before `module.exports`):

```javascript
productSchema.virtual('series', {
  ref: 'ProductSeries',
  localField: '_id',
  foreignField: 'products',
});
```

This is a reverse populate: when populated, Mongoose finds all `ProductSeries` documents whose `products` array contains the current Product's `_id`.

- [ ] **Step 2: Verify model loads**

Run: `cd server && node -e "require('./models/Product'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/models/Product.js
git commit -m "feat(model): add Product.series virtual reverse populate"
```

### Task 3: Update Series Routes

**Files:**
- Modify: `server/routes/series.js`

- [ ] **Step 1: Replace the routes file**

Replace the full content of `server/routes/series.js` with:

```javascript
const express = require('express');
const router = express.Router();
const ProductSeries = require('../models/ProductSeries');

const populateProducts = { path: 'products', select: 'code name images' };

router.get('/', async (req, res) => {
  try {
    const series = await ProductSeries.find()
      .populate(populateProducts)
      .sort({ name: 1 });
    res.json(series);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const series = await ProductSeries.findById(req.params.id)
      .populate(populateProducts);
    if (!series) return res.status(404).json({ error: 'Series not found' });
    res.json(series);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const series = await ProductSeries.create(req.body);
    const populated = await ProductSeries.findById(series._id).populate(populateProducts);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const series = await ProductSeries.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate(populateProducts);
    if (!series) return res.status(404).json({ error: 'Series not found' });
    res.json(series);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const series = await ProductSeries.findByIdAndDelete(req.params.id);
    if (!series) return res.status(404).json({ error: 'Series not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Verify routes load**

Run: `cd server && node -e "require('./routes/series'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/routes/series.js
git commit -m "refactor(routes): populate products on series endpoints"
```

### Task 4: Extend Product Routes Populate

**Files:**
- Modify: `server/routes/products.js`

- [ ] **Step 1: Add series to deepPopulate**

In `server/routes/products.js`, replace the `deepPopulate` constant (lines 5-7) with:

```javascript
const deepPopulate = [
  { path: 'semiProducts.semiProduct', populate: { path: 'materials.material' } },
  { path: 'series', select: 'name' },
];
```

This populates the `series` virtual added in Task 2 with each series's `name` only (enough for the read-only chip display).

- [ ] **Step 2: Verify routes load**

Run: `cd server && node -e "require('./routes/products'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/routes/products.js
git commit -m "feat(routes): populate series virtual on products"
```

---

## Chunk 2: Client Routing & List Page

### Task 5: Add SeriesEdit Routes

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Add SeriesEdit import and routes**

In `client/src/App.jsx`:

1. Add import after the `Series` import line:
```javascript
import SeriesEdit from './pages/SeriesEdit';
```

2. Add two new routes immediately after the existing `<Route path="/series" element={<Series />} />` line:
```jsx
<Route path="/series/new" element={<SeriesEdit />} />
<Route path="/series/:id/edit" element={<SeriesEdit />} />
```

- [ ] **Step 2: Create placeholder SeriesEdit**

Create `client/src/pages/SeriesEdit.jsx`:

```jsx
export default function SeriesEdit() {
  return <div>SeriesEdit placeholder</div>;
}
```

- [ ] **Step 3: Verify build**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx client/src/pages/SeriesEdit.jsx
git commit -m "feat: add series edit routes"
```

### Task 6: Simplify Series List Page

**Files:**
- Modify: `client/src/pages/Series.jsx`

- [ ] **Step 1: Replace the list page**

Replace the full content of `client/src/pages/Series.jsx` with:

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export default function Series() {
  const [seriesList, setSeriesList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSeries().then(setSeriesList);
  }, []);

  const deleteItem = async (e, id) => {
    e.stopPropagation();
    if (!confirm('确定删除此系列？')) return;
    await api.deleteSeries(id);
    setSeriesList((prev) => prev.filter((s) => s._id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">产品系列</h1>
        <Button onClick={() => navigate('/series/new')}>
          <Plus size={16} className="mr-1" />添加系列
        </Button>
      </div>

      {seriesList.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">暂无系列</p>
          <Button onClick={() => navigate('/series/new')} variant="outline">添加系列</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map((s) => (
            <div
              key={s._id}
              onClick={() => navigate(`/series/${s._id}/edit`)}
              className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="h-36 bg-muted">
                {s.image ? (
                  <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">📦</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{s.name}</h3>
                  <button
                    onClick={(e) => deleteItem(e, s._id)}
                    className="p-1 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded mt-2 inline-block">
                  {s.products?.length || 0} 个产品
                </span>
                {s.description && <p className="text-xs text-muted-foreground mt-2">{s.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Changes: removed `beadCategory` display, removed Dialog form, removed settings/Input/Label/Select/ImageUpload imports. Card click navigates to edit page. Shows product count badge.

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Series.jsx
git commit -m "refactor: simplify series list page, remove dialog and beadCategory"
```

---

## Chunk 3: Full-Screen Series Editor

### Task 7: Build SeriesEdit Page

**Files:**
- Modify: `client/src/pages/SeriesEdit.jsx`

- [ ] **Step 1: Write the full SeriesEdit component**

Replace `client/src/pages/SeriesEdit.jsx` with:

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';
import { ArrowLeft, X, GripVertical } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ── Draggable product card in left panel ── */
function DraggableProduct({ product }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `source-${product._id}`,
    data: { type: 'product', product },
  });
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };
  const cover = product.images?.[0];
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 p-2 bg-muted rounded-lg border border-border cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
    >
      <div className="w-8 h-8 bg-background rounded overflow-hidden flex-shrink-0">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground truncate">{product.name}</div>
        <div className="text-xs text-muted-foreground">{product.code}</div>
      </div>
    </div>
  );
}

/* ── Sortable pool item in right panel ── */
function PoolItem({ product, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `pool-${product._id}`,
    data: { type: 'pool-item' },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const cover = product.images?.[0];
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border group"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical size={14} />
      </button>
      <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{product.name}</div>
        <div className="text-xs text-muted-foreground">{product.code}</div>
      </div>
      <button
        onClick={() => onRemove(product._id)}
        className="text-muted-foreground hover:text-red-400 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* ── Drop zone wrapper ── */
function DropZone({ children, id }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 rounded-lg border-2 border-dashed p-4 transition-colors min-h-[300px] ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      {children}
    </div>
  );
}

/* ── Main page ── */
export default function SeriesEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState({ name: '', description: '', image: '' });
  const [pool, setPool] = useState([]); // [product, product, ...]
  const [allProducts, setAllProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    api.getProducts().then(setAllProducts);
    if (!isNew) {
      api.getSeries().then((list) => {
        const s = list.find((x) => x._id === id);
        if (s) {
          setForm({ name: s.name, description: s.description || '', image: s.image || '' });
          setPool((s.products || []).filter(Boolean));
        }
      });
    }
  }, [id, isNew]);

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const addToPool = (product) => {
    setPool((prev) => {
      if (prev.find((p) => p._id === product._id)) return prev; // dedupe
      return [...prev, product];
    });
    setDirty(true);
  };

  const removeFromPool = (productId) => {
    setPool((prev) => prev.filter((p) => p._id !== productId));
    setDirty(true);
  };

  const handleDragStart = ({ active }) => { setActiveDragId(active.id); };

  const handleDragEnd = ({ active, over }) => {
    setActiveDragId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith('source-') && (overId === 'pool-drop-zone' || overId.startsWith('pool-'))) {
      const productId = activeId.replace('source-', '');
      const product = allProducts.find((p) => p._id === productId);
      if (product) addToPool(product);
      return;
    }

    if (activeId.startsWith('pool-') && overId.startsWith('pool-')) {
      const oldIdx = pool.findIndex((p) => `pool-${p._id}` === activeId);
      const newIdx = pool.findIndex((p) => `pool-${p._id}` === overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        setPool((prev) => arrayMove(prev, oldIdx, newIdx));
        setDirty(true);
      }
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      products: pool.map((p) => p._id),
    };
    try {
      if (isNew) {
        await api.createSeries(payload);
      } else {
        await api.updateSeries(id, payload);
      }
      navigate('/series');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (dirty && !confirm('有未保存的更改，确定离开？')) return;
    navigate('/series');
  };

  const activeProduct = activeDragId?.startsWith('source-')
    ? allProducts.find((p) => p._id === activeDragId.replace('source-', ''))
    : null;

  const activePoolProduct = activeDragId?.startsWith('pool-')
    ? pool.find((p) => `pool-${p._id}` === activeDragId)
    : null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{isNew ? '添加系列' : '编辑系列'}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* Basic info */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="grid grid-cols-[200px_1fr] gap-4">
          <ImageUpload value={form.image} onChange={(url) => updateForm('image', url)} />
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">系列名称</Label>
              <Input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="如 春日花朵"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">描述</Label>
              <Input
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="简单描述"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drag and drop area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-[1fr_1fr] gap-4" style={{ minHeight: '400px' }}>
          {/* Left: Product library */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-3">产品库</h2>
            <Input
              placeholder="搜索产品..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredProducts.map((p) => (
                <DraggableProduct key={p._id} product={p} />
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">无匹配产品</p>
              )}
            </div>
          </div>

          {/* Right: Series product pool */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              系列产品池
              {pool.length > 0 && (
                <span className="text-muted-foreground font-normal ml-2">({pool.length}个产品)</span>
              )}
            </h2>
            <DropZone id="pool-drop-zone">
              {pool.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  从左侧拖入产品
                </div>
              ) : (
                <SortableContext
                  items={pool.map((p) => `pool-${p._id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {pool.map((product) => (
                      <PoolItem
                        key={product._id}
                        product={product}
                        onRemove={removeFromPool}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </DropZone>
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeProduct && (
            <div className="flex items-center gap-2 p-2 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-8 h-8 bg-muted rounded overflow-hidden flex-shrink-0">
                {activeProduct.images?.[0] ? (
                  <img src={activeProduct.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activeProduct.name}</span>
            </div>
          )}
          {activePoolProduct && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                {activePoolProduct.images?.[0] ? (
                  <img src={activePoolProduct.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activePoolProduct.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
```

This mirrors the SemiProductEdit/ProductEdit dnd pattern: left source library with `useDraggable`, right sortable pool with `useSortable`, DropZone wrapper with `useDroppable`, and DragOverlay for both source and pool drags. Differences: no quantity (just dedupe on duplicate drag), products fetched via `api.getProducts()`, pool stores products directly (not `{ semiProduct, quantity }` entries).

Note: loading the existing series uses `api.getSeries()` (filtered client-side) rather than introducing a new `api.getSeries(id)` method, since the existing api.js has only the list method. This avoids touching api.js for this task.

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/SeriesEdit.jsx
git commit -m "feat: add full-screen series editor with product drag-and-drop"
```

---

## Chunk 4: Read-Only Series Display on ProductEdit

### Task 8: Add Series Chips to ProductEdit

**Files:**
- Modify: `client/src/pages/ProductEdit.jsx`

- [ ] **Step 1: Add series state and rendering**

In `client/src/pages/ProductEdit.jsx`:

1. In the `useEffect` that loads an existing product (the `if (!isNew)` branch, around the `api.getProduct(id).then((p) => {...})` block), capture the populated `series` array. Add this state declaration alongside the others (near line 14):

```javascript
const [productSeries, setProductSeries] = useState([]);
```

2. Inside the existing `api.getProduct(id).then((p) => {...})` callback, after the existing `setPool(...)` call, append:

```javascript
setProductSeries(p.series || []);
```

3. In the JSX, immediately after the closing `</div>` of the basic info card (the one containing MultiImageUpload + form fields, before the `{/* Drag and drop area */}` comment), insert this read-only section:

```jsx
{!isNew && productSeries.length > 0 && (
  <div className="bg-card rounded-lg border border-border p-4 mb-6">
    <Label className="text-xs text-muted-foreground">所属系列</Label>
    <div className="flex flex-wrap gap-2 mt-2">
      {productSeries.map((s) => (
        <span
          key={s._id}
          className="px-3 py-1 rounded-full text-xs bg-muted border border-border text-muted-foreground"
        >
          {s.name}
        </span>
      ))}
    </div>
  </div>
)}
```

The block is hidden in `/products/new` mode (no `id` yet) and when the product belongs to no series.

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/ProductEdit.jsx
git commit -m "feat: show read-only series chips on product edit page"
```
