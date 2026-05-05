# Semi-Product Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign semi-products as material compositions with drag-and-drop editing, removing price/stock/series fields.

**Architecture:** Server-side simplifies SemiProduct schema to code/name/image/materials[]. Client replaces the dialog-based form with a full-screen editor page featuring @dnd-kit cross-container drag from a material library into a composition pool.

**Tech Stack:** MongoDB/Mongoose, Express, React, @dnd-kit/core + @dnd-kit/sortable, Tailwind CSS, shadcn/ui components.

**Spec:** `docs/superpowers/specs/2026-05-06-semi-product-redesign-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `server/models/SemiProduct.js` | Simplified schema: code, name, image, materials[] |
| Modify | `server/routes/semiProducts.js` | Simplified CRUD with materials.material population |
| Modify | `client/src/App.jsx` | Add routes for `/semi-products/new` and `/semi-products/:id/edit` |
| Modify | `client/src/pages/SemiProducts.jsx` | List-only page with simplified cards, navigation to edit page |
| Create | `client/src/pages/SemiProductEdit.jsx` | Full-screen editor with dnd-kit drag-and-drop |

---

## Chunk 1: Server-Side Changes

### Task 1: Simplify SemiProduct Schema

**Files:**
- Modify: `server/models/SemiProduct.js`

- [ ] **Step 1: Replace the entire SemiProduct model**

Replace the full content of `server/models/SemiProduct.js` with:

```javascript
const mongoose = require('mongoose');

const semiProductMaterialSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
}, { _id: false });

const semiProductSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  materials: [semiProductMaterialSchema],
}, { timestamps: true });

module.exports = mongoose.model('SemiProduct', semiProductSchema);
```

This removes: `price`, `stock`, `stockAlertThreshold`, `series`, `components`, `sharedMaterials`, `bomItemSchema`, `componentSchema`, virtual `totalCost`.

- [ ] **Step 2: Verify server starts**

Run: `cd server && node -e "require('./models/SemiProduct'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/models/SemiProduct.js
git commit -m "refactor(model): simplify SemiProduct schema to code/name/image/materials"
```

### Task 2: Simplify SemiProduct Routes

**Files:**
- Modify: `server/routes/semiProducts.js`

- [ ] **Step 1: Replace the routes file**

Replace the full content of `server/routes/semiProducts.js` with:

```javascript
const express = require('express');
const router = express.Router();
const SemiProduct = require('../models/SemiProduct');

router.get('/', async (req, res) => {
  try {
    const products = await SemiProduct.find()
      .populate('materials.material')
      .sort({ code: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await SemiProduct.findById(req.params.id)
      .populate('materials.material');
    if (!product) return res.status(404).json({ error: 'Semi-product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = await SemiProduct.create(req.body);
    const populated = await SemiProduct.findById(product._id)
      .populate('materials.material');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await SemiProduct.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('materials.material');
    if (!product) return res.status(404).json({ error: 'Semi-product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const product = await SemiProduct.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Semi-product not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

Changes: removed `?series=` filter, removed series/components/sharedMaterials population, only populates `materials.material`.

- [ ] **Step 2: Verify server starts**

Run: `cd server && node -e "require('./routes/semiProducts'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/routes/semiProducts.js
git commit -m "refactor(routes): simplify semi-products CRUD to match new schema"
```

---

## Chunk 2: Client Routing & List Page

### Task 3: Add New Routes in App.jsx

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Add the import and routes**

At the top of `client/src/App.jsx`, add the import after the existing `SemiProducts` import (line 8):

```javascript
import SemiProductEdit from './pages/SemiProductEdit';
```

Then add two routes after the existing `/semi-products` route (after line 22):

```jsx
<Route path="/semi-products/new" element={<SemiProductEdit />} />
<Route path="/semi-products/:id/edit" element={<SemiProductEdit />} />
```

Add them alongside the existing `/semi-products` route (React Router v6+ uses ranked matching, so order doesn't matter, but grouping them together is cleaner):

```jsx
<Route path="/semi-products" element={<SemiProducts />} />
<Route path="/semi-products/new" element={<SemiProductEdit />} />
<Route path="/semi-products/:id/edit" element={<SemiProductEdit />} />
```

- [ ] **Step 2: Create empty SemiProductEdit placeholder**

Create `client/src/pages/SemiProductEdit.jsx` with a minimal placeholder so the import doesn't break:

```jsx
export default function SemiProductEdit() {
  return <div>SemiProductEdit placeholder</div>;
}
```

- [ ] **Step 3: Verify the app compiles**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx client/src/pages/SemiProductEdit.jsx
git commit -m "feat: add routes for semi-product edit pages"
```

### Task 4: Simplify SemiProducts List Page

**Files:**
- Modify: `client/src/pages/SemiProducts.jsx`

- [ ] **Step 1: Rewrite the list page**

Replace the full content of `client/src/pages/SemiProducts.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

export default function SemiProducts() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSemiProducts().then(setProducts);
  }, []);

  const deleteItem = async (e, id) => {
    e.stopPropagation();
    if (!confirm('确定删除？')) return;
    await api.deleteSemiProduct(id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">半成品管理</h1>
        <Button onClick={() => navigate('/semi-products/new')}>
          <Plus size={16} className="mr-1" />添加半成品
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">暂无半成品</p>
          <Button onClick={() => navigate('/semi-products/new')} variant="outline">添加半成品</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/semi-products/${p._id}/edit`)}
              className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="h-32 bg-muted">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">🧶</div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{p.code}</span>
                  <Badge variant="secondary" className="text-xs">
                    {p.materials?.length || 0}种原料
                  </Badge>
                </div>
                <h3 className="font-medium text-foreground text-sm">{p.name}</h3>
                <div className="flex justify-end pt-1 border-t border-border">
                  <button
                    onClick={(e) => deleteItem(e, p._id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Changes from original:
- Removed: series grouping, series/settings fetches, Dialog form, price/stock display, series imports
- Added: `useNavigate`, click-to-edit, material count badge, delete button on card
- Cards now navigate to `/semi-products/:id/edit`

- [ ] **Step 2: Verify the app compiles**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/SemiProducts.jsx
git commit -m "refactor: simplify semi-products list page, remove price/stock/series"
```

---

## Chunk 3: Full-Screen Edit Page with Drag-and-Drop

### Task 5: Build SemiProductEdit Page

**Files:**
- Modify: `client/src/pages/SemiProductEdit.jsx`

This is the main feature — full-screen editor with dnd-kit drag-and-drop.

- [ ] **Step 1: Write the full SemiProductEdit component**

Replace `client/src/pages/SemiProductEdit.jsx` with:

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ImageUpload from '@/components/ImageUpload';
import { ArrowLeft, Plus, Minus, X, GripVertical } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ── Draggable material card in left panel ── */
function DraggableMaterial({ material }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `source-${material._id}`,
    data: { type: 'material', material },
  });
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 p-2 bg-muted rounded-lg border border-border cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
    >
      <div className="w-8 h-8 bg-background rounded overflow-hidden flex-shrink-0">
        {material.image ? (
          <img src={material.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground truncate">{material.name}</div>
        <div className="text-xs text-muted-foreground">{material.unit || '个'}</div>
      </div>
    </div>
  );
}

/* ── Sortable pool item in right panel ── */
function PoolItem({ entry, onQuantityChange, onRemove }) {
  const mat = entry.material;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `pool-${mat._id}`,
    data: { type: 'pool-item' },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
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
        {mat.image ? (
          <img src={mat.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{mat.name}</div>
        <div className="text-xs text-muted-foreground">{mat.category} · {mat.unit || '个'}</div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQuantityChange(mat._id, entry.quantity - 1)}
          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Minus size={12} />
        </button>
        <input
          type="number"
          min="1"
          value={entry.quantity}
          onChange={(e) => onQuantityChange(mat._id, parseInt(e.target.value) || 1)}
          className="w-12 text-center text-sm bg-transparent border border-border rounded px-1 py-0.5"
        />
        <button
          onClick={() => onQuantityChange(mat._id, entry.quantity + 1)}
          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
      <button
        onClick={() => onRemove(mat._id)}
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
      className={`flex-1 rounded-lg border-2 border-dashed p-4 transition-colors min-h-[200px] ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      {children}
    </div>
  );
}

/* ── Main page ── */
export default function SemiProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState({ code: '', name: '', image: '' });
  const [pool, setPool] = useState([]); // [{ material: {...}, quantity: number }]
  const [allMaterials, setAllMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    api.getMaterials().then(setAllMaterials);
    if (!isNew) {
      api.getSemiProduct(id).then((sp) => {
        setForm({ code: sp.code, name: sp.name, image: sp.image || '' });
        setPool(
          (sp.materials || [])
            .filter((m) => m.material)
            .map((m) => ({ material: m.material, quantity: m.quantity }))
        );
      });
    }
  }, [id, isNew]);

  const filteredMaterials = allMaterials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const addToPool = (material) => {
    setPool((prev) => {
      const existing = prev.find((e) => e.material._id === material._id);
      if (existing) {
        return prev.map((e) =>
          e.material._id === material._id ? { ...e, quantity: e.quantity + 1 } : e
        );
      }
      return [...prev, { material, quantity: 1 }];
    });
    setDirty(true);
  };

  const changeQuantity = (materialId, newQty) => {
    if (newQty < 1) {
      removeFromPool(materialId);
      return;
    }
    setPool((prev) =>
      prev.map((e) => (e.material._id === materialId ? { ...e, quantity: newQty } : e))
    );
    setDirty(true);
  };

  const removeFromPool = (materialId) => {
    setPool((prev) => prev.filter((e) => e.material._id !== materialId));
    setDirty(true);
  };

  const handleDragStart = ({ active }) => {
    setActiveDragId(active.id);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveDragId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Drag from source to pool drop zone
    if (activeId.startsWith('source-') && (overId === 'pool-drop-zone' || overId.startsWith('pool-'))) {
      const materialId = activeId.replace('source-', '');
      const material = allMaterials.find((m) => m._id === materialId);
      if (material) addToPool(material);
      return;
    }

    // Reorder within pool
    if (activeId.startsWith('pool-') && overId.startsWith('pool-')) {
      const oldIdx = pool.findIndex((e) => `pool-${e.material._id}` === activeId);
      const newIdx = pool.findIndex((e) => `pool-${e.material._id}` === overId);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        setPool((prev) => arrayMove(prev, oldIdx, newIdx));
        setDirty(true);
      }
    }
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      materials: pool.map((e) => ({ material: e.material._id, quantity: e.quantity })),
    };
    try {
      if (isNew) {
        await api.createSemiProduct(payload);
      } else {
        await api.updateSemiProduct(id, payload);
      }
      navigate('/semi-products');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (dirty && !confirm('有未保存的更改，确定离开？')) return;
    navigate('/semi-products');
  };

  const activeMaterial = activeDragId?.startsWith('source-')
    ? allMaterials.find((m) => m._id === activeDragId.replace('source-', ''))
    : null;

  const activePoolEntry = activeDragId?.startsWith('pool-')
    ? pool.find((e) => `pool-${e.material._id}` === activeDragId)
    : null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{isNew ? '添加半成品' : '编辑半成品'}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving || !form.code.trim() || !form.name.trim()}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* Basic info */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="grid grid-cols-[200px_1fr] gap-4">
          <ImageUpload value={form.image} onChange={(url) => updateForm('image', url)} />
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">编号</Label>
              <Input
                value={form.code}
                onChange={(e) => updateForm('code', e.target.value)}
                placeholder="如 SP-001"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">名称</Label>
              <Input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="半成品名称"
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
          {/* Left: Material library */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-3">原料库</h2>
            <Input
              placeholder="搜索原料..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            <div className="flex-1 overflow-y-auto space-y-2">
                {filteredMaterials.map((m) => (
                  <DraggableMaterial key={m._id} material={m} />
                ))}
              {filteredMaterials.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">无匹配原料</p>
              )}
            </div>
          </div>

          {/* Right: Composition pool */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              组合池
              {pool.length > 0 && (
                <span className="text-muted-foreground font-normal ml-2">({pool.length}种原料)</span>
              )}
            </h2>
            <DropZone id="pool-drop-zone">
              {pool.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  从左侧拖入原料
                </div>
              ) : (
                <SortableContext
                  items={pool.map((e) => `pool-${e.material._id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {pool.map((entry) => (
                      <PoolItem
                        key={entry.material._id}
                        entry={entry}
                        onQuantityChange={changeQuantity}
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
          {activeMaterial && (
            <div className="flex items-center gap-2 p-2 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-8 h-8 bg-muted rounded overflow-hidden flex-shrink-0">
                {activeMaterial.image ? (
                  <img src={activeMaterial.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activeMaterial.name}</span>
            </div>
          )}
          {activePoolEntry && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                {activePoolEntry.material.image ? (
                  <img src={activePoolEntry.material.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activePoolEntry.material.name}</span>
              <span className="text-xs text-muted-foreground">x{activePoolEntry.quantity}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
```

- [ ] **Step 2: Verify the app compiles**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Manual smoke test**

Run the dev server and test:
1. Navigate to `/semi-products` — should see card grid without price/stock
2. Click "添加半成品" — should go to `/semi-products/new`
3. Fill code + name, drag materials from left to right, adjust quantities
4. Save — should redirect to list showing the new item
5. Click the card — should go to edit page with materials loaded

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/SemiProductEdit.jsx
git commit -m "feat: add full-screen semi-product editor with drag-and-drop material composition"
```

---

## Chunk 4: Cleanup API Layer

### Task 6: Remove Unused API Parameters

**Files:**
- Modify: `client/src/lib/api.js`

- [ ] **Step 1: Simplify getSemiProducts**

In `client/src/lib/api.js`, replace the `getSemiProducts` method (lines 48-51):

```javascript
  getSemiProducts: () => request('/semi-products'),
```

This removes the unused `params` argument (series filter is gone).

- [ ] **Step 2: Commit**

```bash
git add client/src/lib/api.js
git commit -m "chore: simplify getSemiProducts API call, remove series filter param"
```
