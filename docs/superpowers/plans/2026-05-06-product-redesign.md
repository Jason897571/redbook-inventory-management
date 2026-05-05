# Product Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign products as compositions of semi-products with drag-and-drop editing, multi-image uploads, and auto-calculated profit from semi-product material costs.

**Architecture:** Server simplifies Product schema to code/name/styles/price/commissionRate/stock/threshold/images/semiProducts[]. Cost virtuals traverse semiProduct→materials→unitPrice. Client replaces dialog+detail with a single full-screen editor (same dnd pattern as SemiProductEdit). New MultiImageUpload component handles sortable multi-image.

**Tech Stack:** MongoDB/Mongoose, Express, React, @dnd-kit/core + @dnd-kit/sortable, Tailwind CSS, shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-05-06-product-redesign-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `server/models/Product.js` | Simplified schema with semiProducts[], rewritten cost virtuals |
| Modify | `server/routes/products.js` | Deep populate semiProducts→materials.material |
| Modify | `server/routes/sales.js` | Update cost calculation to use semiProducts path |
| Modify | `client/src/App.jsx` | Replace `/products/:id` with `/products/new` + `/products/:id/edit`, remove ProductDetail |
| Modify | `client/src/pages/Products.jsx` | Simplified list, no series grouping, navigate to edit |
| Create | `client/src/pages/ProductEdit.jsx` | Full-screen editor with dnd semi-product pool + profit panel |
| Create | `client/src/components/MultiImageUpload.jsx` | Multi-image upload with drag-to-reorder |
| Delete | `client/src/pages/ProductDetail.jsx` | Replaced by ProductEdit |
| Modify | `client/src/lib/api.js` | Simplify getProducts |

---

## Chunk 1: Server-Side Changes

### Task 1: Rewrite Product Schema

**Files:**
- Modify: `server/models/Product.js`

- [ ] **Step 1: Replace the entire Product model**

Replace the full content of `server/models/Product.js` with:

```javascript
const mongoose = require('mongoose');

const productSemiProductSchema = new mongoose.Schema({
  semiProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'SemiProduct', required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  styles: { type: [String], default: [] },
  price: { type: Number, required: true, default: 0 },
  commissionRate: { type: Number, default: 0.057 },
  images: { type: [String], default: [] },
  stock: { type: Number, default: 0 },
  stockAlertThreshold: { type: Number, default: 5 },
  semiProducts: [productSemiProductSchema],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('totalCost').get(function () {
  return (this.semiProducts || []).reduce((sum, entry) => {
    const sp = entry.semiProduct;
    if (!sp || !sp.materials) return sum;
    const spCost = (sp.materials || []).reduce((s, m) => {
      const unitPrice = m.material?.unitPrice || 0;
      return s + m.quantity * unitPrice;
    }, 0);
    return sum + spCost * entry.quantity;
  }, 0);
});

productSchema.virtual('profit').get(function () {
  return this.price - this.totalCost;
});

productSchema.virtual('netProfit').get(function () {
  return this.profit * (1 - this.commissionRate);
});

productSchema.virtual('profitMargin').get(function () {
  return this.price > 0 ? this.netProfit / this.price : 0;
});

module.exports = mongoose.model('Product', productSchema);
```

Removed: `series`, `pieceCount`, `image` (singular), `components`, `sharedMaterials`, `bomItemSchema`, `componentSchema`.
Added: `images` (array), `semiProducts` array with `semiProduct` ref + `quantity`.
Rewritten: `totalCost` virtual traverses semiProduct→materials→material.unitPrice.

- [ ] **Step 2: Verify model loads**

Run: `cd server && node -e "require('./models/Product'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/models/Product.js
git commit -m "refactor(model): rewrite Product schema with semiProducts composition and multi-image"
```

### Task 2: Simplify Product Routes

**Files:**
- Modify: `server/routes/products.js`

- [ ] **Step 1: Replace the routes file**

Replace the full content of `server/routes/products.js` with:

```javascript
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

const deepPopulate = [
  { path: 'semiProducts.semiProduct', populate: { path: 'materials.material' } },
];

router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
      .populate(deepPopulate)
      .sort({ code: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate(deepPopulate);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    const populated = await Product.findById(product._id)
      .populate(deepPopulate);
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate(deepPopulate);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Verify routes load**

Run: `cd server && node -e "require('./routes/products'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/routes/products.js
git commit -m "refactor(routes): deep populate semiProducts→materials for products"
```

### Task 3: Update Sales Route Cost Calculation

**Files:**
- Modify: `server/routes/sales.js`

- [ ] **Step 1: Update the POST handler**

In `server/routes/sales.js`, replace the POST route (lines 58-104) with:

```javascript
// Create sale — auto deduct stock + create log
router.post('/', async (req, res) => {
  try {
    const { product: productId, style, quantity, notes } = req.body;
    const product = await Product.findById(productId)
      .populate({ path: 'semiProducts.semiProduct', populate: { path: 'materials.material' } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Calculate cost from semiProducts → materials
    const totalCost = (product.semiProducts || []).reduce((sum, entry) => {
      const sp = entry.semiProduct;
      if (!sp || !sp.materials) return sum;
      const spCost = (sp.materials || []).reduce((s, m) => {
        const unitPrice = m.material?.unitPrice || 0;
        return s + m.quantity * unitPrice;
      }, 0);
      return sum + spCost * entry.quantity;
    }, 0);
    const netProfit = (product.price - totalCost) * (1 - product.commissionRate);

    const sale = await SaleRecord.create({
      product: productId,
      style: style || '',
      quantity,
      salePrice: product.price,
      cost: totalCost,
      netProfit,
      notes: notes || '',
    });

    // Deduct product stock
    product.stock -= quantity;
    await product.save();

    // Create stock log
    await StockLog.create({
      type: 'product',
      targetId: product._id,
      targetName: product.name,
      changeType: '销售扣减',
      quantity: -quantity,
      note: `销售 ${quantity} 单`,
    });

    const populated = await SaleRecord.findById(sale._id).populate('product');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
```

Key changes from original:
- Lines 62-73: replaced `components`/`sharedMaterials` cost logic with `semiProducts→materials` traversal
- Cost now reads live `material.unitPrice` instead of snapshot `unitCost` from old BOM — this is intentional; costs always reflect current material prices

- [ ] **Step 2: Verify routes load**

Run: `cd server && node -e "require('./routes/sales'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add server/routes/sales.js
git commit -m "fix(sales): update cost calculation to use semiProducts material chain"
```

---

## Chunk 2: MultiImageUpload Component

### Task 4: Create MultiImageUpload Component

**Files:**
- Create: `client/src/components/MultiImageUpload.jsx`

- [ ] **Step 1: Write the component**

Create `client/src/components/MultiImageUpload.jsx`:

```jsx
import { useRef } from 'react';
import { api } from '@/lib/api';
import { Upload, X, Star } from 'lucide-react';
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableImage({ url, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: url,
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
      {...attributes}
      {...listeners}
      className="relative w-24 h-24 rounded-lg border border-border overflow-hidden cursor-grab active:cursor-grabbing group"
    >
      <img src={url} alt="" className="w-full h-full object-cover" />
      {index === 0 && (
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded px-1 py-0.5 text-[10px] flex items-center gap-0.5">
          <Star size={8} /> 封面
        </div>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(url); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={10} />
      </button>
    </div>
  );
}

export default function MultiImageUpload({ value = [], onChange }) {
  const inputRef = useRef();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { url } = await api.uploadImage(file);
    onChange([...value, url]);
    e.target.value = '';
  };

  const handleRemove = (url) => {
    onChange(value.filter((v) => v !== url));
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = value.indexOf(String(active.id));
    const newIndex = value.indexOf(String(over.id));
    onChange(arrayMove(value, oldIndex, newIndex));
  };

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={value} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-2">
            {value.map((url, i) => (
              <SortableImage key={url} url={url} index={i} onRemove={handleRemove} />
            ))}
            <div
              onClick={() => inputRef.current.click()}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors text-muted-foreground"
            >
              <Upload size={20} className="mb-1" />
              <span className="text-[10px]">添加图片</span>
            </div>
          </div>
        </SortableContext>
      </DndContext>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/components/MultiImageUpload.jsx
git commit -m "feat: add MultiImageUpload component with drag-to-reorder"
```

---

## Chunk 3: Client Routing & List Page

### Task 5: Update Routes in App.jsx

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Update imports and routes**

In `client/src/App.jsx`:

1. Remove the `ProductDetail` import (line 7):
```javascript
// DELETE: import ProductDetail from './pages/ProductDetail';
```

2. Add the `ProductEdit` import after the Products import:
```javascript
import ProductEdit from './pages/ProductEdit';
```

3. Replace the `/products/:id` route with two new routes. The routes section should look like:
```jsx
<Route path="/products" element={<Products />} />
<Route path="/products/new" element={<ProductEdit />} />
<Route path="/products/:id/edit" element={<ProductEdit />} />
```

- [ ] **Step 2: Create placeholder ProductEdit**

Create `client/src/pages/ProductEdit.jsx`:

```jsx
export default function ProductEdit() {
  return <div>ProductEdit placeholder</div>;
}
```

- [ ] **Step 3: Delete ProductDetail.jsx**

```bash
git rm client/src/pages/ProductDetail.jsx
```

- [ ] **Step 4: Verify build**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
git add client/src/App.jsx client/src/pages/ProductEdit.jsx
git commit -m "feat: add product edit routes, remove ProductDetail page"
```

### Task 6: Simplify Products List Page

**Files:**
- Modify: `client/src/pages/Products.jsx`

- [ ] **Step 1: Replace the list page**

Replace the full content of `client/src/pages/Products.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getProducts().then(setProducts);
  }, []);

  const deleteItem = async (e, id) => {
    e.stopPropagation();
    if (!confirm('确定删除？')) return;
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">成品管理</h1>
        <Button onClick={() => navigate('/products/new')}>
          <Plus size={16} className="mr-1" />添加产品
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">暂无产品</p>
          <Button onClick={() => navigate('/products/new')} variant="outline">添加产品</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const isLow = p.stock <= p.stockAlertThreshold;
            const coverImage = p.images?.[0] || p.image;
            return (
              <div
                key={p._id}
                onClick={() => navigate(`/products/${p._id}/edit`)}
                className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="h-32 bg-muted">
                  {coverImage ? (
                    <img src={coverImage} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">🧶</div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{p.code}</span>
                    <span className={`text-xs ${isLow ? 'text-red-400' : 'text-muted-foreground'}`}>库存: {p.stock}</span>
                  </div>
                  <h3 className="font-medium text-foreground text-sm">{p.name}</h3>
                  {p.styles?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.styles.map((s) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                    <span className="text-muted-foreground">¥{p.price}</span>
                    <span className="text-green-400">净利 ¥{p.netProfit?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => deleteItem(e, p._id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

Changes: removed series grouping/fetching, Dialog form, series/settings imports. Added navigation to edit page. Uses `images[0]` as cover with fallback to legacy `image` field. Kept stock/price/profit display. Added delete button.

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Products.jsx
git commit -m "refactor: simplify products list page, remove series grouping and dialog"
```

---

## Chunk 4: Full-Screen Product Editor

### Task 7: Build ProductEdit Page

**Files:**
- Modify: `client/src/pages/ProductEdit.jsx`

- [ ] **Step 1: Write the full ProductEdit component**

Replace `client/src/pages/ProductEdit.jsx` with:

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MultiImageUpload from '@/components/MultiImageUpload';
import { ArrowLeft, Plus, Minus, X, GripVertical } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ── Draggable semi-product card in left panel ── */
function DraggableSemiProduct({ sp }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `source-${sp._id}`,
    data: { type: 'semi-product', sp },
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
        {sp.image ? (
          <img src={sp.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground truncate">{sp.name}</div>
        <div className="text-xs text-muted-foreground">{sp.code} · {sp.materials?.length || 0}种原料</div>
      </div>
    </div>
  );
}

/* ── Sortable pool item in right panel ── */
function PoolItem({ entry, onQuantityChange, onRemove }) {
  const sp = entry.semiProduct;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `pool-${sp._id}`,
    data: { type: 'pool-item' },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  // Calculate this semi-product's material cost
  const spCost = (sp.materials || []).reduce((s, m) => {
    return s + m.quantity * (m.material?.unitPrice || 0);
  }, 0);
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
        {sp.image ? (
          <img src={sp.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{sp.name}</div>
        <div className="text-xs text-muted-foreground">{sp.code} · 成本 ¥{spCost.toFixed(2)}</div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQuantityChange(sp._id, entry.quantity - 1)}
          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Minus size={12} />
        </button>
        <input
          type="number"
          min="1"
          value={entry.quantity}
          onChange={(e) => onQuantityChange(sp._id, parseInt(e.target.value) || 1)}
          className="w-12 text-center text-sm bg-transparent border border-border rounded px-1 py-0.5"
        />
        <button
          onClick={() => onQuantityChange(sp._id, entry.quantity + 1)}
          className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
      <button
        onClick={() => onRemove(sp._id)}
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

/* ── Profit calculation panel ── */
function ProfitPanel({ pool, price, commissionRate }) {
  const totalCost = pool.reduce((sum, entry) => {
    const sp = entry.semiProduct;
    const spCost = (sp.materials || []).reduce((s, m) => {
      return s + m.quantity * (m.material?.unitPrice || 0);
    }, 0);
    return sum + spCost * entry.quantity;
  }, 0);
  const profit = price - totalCost;
  const commission = profit * commissionRate;
  const netProfit = profit * (1 - commissionRate);
  const profitMargin = price > 0 ? (netProfit / price * 100) : 0;

  return (
    <div className="bg-card rounded-lg border border-border p-4 mt-4">
      <h3 className="font-semibold text-sm text-foreground mb-3">利润计算</h3>
      <div className="space-y-2 text-sm">
        {pool.map((entry) => {
          const sp = entry.semiProduct;
          const spCost = (sp.materials || []).reduce((s, m) => s + m.quantity * (m.material?.unitPrice || 0), 0);
          return (
            <div key={sp._id} className="flex justify-between text-muted-foreground">
              <span>{sp.name} ×{entry.quantity}</span>
              <span>¥{(spCost * entry.quantity).toFixed(2)}</span>
            </div>
          );
        })}
        {pool.length > 0 && (
          <>
            <div className="flex justify-between font-medium border-t border-border pt-2">
              <span className="text-foreground">总成本</span>
              <span className="text-red-400">-¥{totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">定价</span>
              <span>¥{price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">毛利润</span>
              <span>¥{profit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">佣金 ({(commissionRate * 100).toFixed(1)}%)</span>
              <span className="text-red-400">-¥{commission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-border pt-2">
              <span className="text-foreground">净利润</span>
              <span className={netProfit >= 0 ? 'text-green-400' : 'text-red-400'}>¥{netProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">利润率</span>
              <span className={profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}>{profitMargin.toFixed(1)}%</span>
            </div>
          </>
        )}
        {pool.length === 0 && (
          <p className="text-muted-foreground text-xs text-center py-2">添加半成品后自动计算</p>
        )}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState({
    code: '', name: '', styles: [], price: 0, commissionRate: 0.057,
    stock: 0, stockAlertThreshold: 5, images: [],
  });
  const [pool, setPool] = useState([]); // [{ semiProduct: {...}, quantity }]
  const [allSemiProducts, setAllSemiProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [search, setSearch] = useState('');
  const [customStyle, setCustomStyle] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    Promise.all([api.getSemiProducts(), api.getSettings()]).then(([sps, sets]) => {
      setAllSemiProducts(sps);
      setSettings(sets);
      if (isNew && sets?.defaultCommissionRate) {
        setForm((prev) => ({ ...prev, commissionRate: sets.defaultCommissionRate }));
      }
    });
    if (!isNew) {
      api.getProduct(id).then((p) => {
        setForm({
          code: p.code, name: p.name, styles: p.styles || [],
          price: p.price, commissionRate: p.commissionRate,
          stock: p.stock, stockAlertThreshold: p.stockAlertThreshold,
          images: p.images || (p.image ? [p.image] : []),
        });
        setPool(
          (p.semiProducts || [])
            .filter((e) => e.semiProduct)
            .map((e) => ({ semiProduct: e.semiProduct, quantity: e.quantity }))
        );
      });
    }
  }, [id, isNew]);

  const filteredSemiProducts = allSemiProducts.filter((sp) =>
    sp.name.toLowerCase().includes(search.toLowerCase()) ||
    sp.code.toLowerCase().includes(search.toLowerCase())
  );

  const productStyles = settings?.productStyles || [];

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const toggleStyle = (style) => {
    const styles = form.styles.includes(style)
      ? form.styles.filter((s) => s !== style)
      : [...form.styles, style];
    updateForm('styles', styles);
  };

  const addCustomStyle = () => {
    const s = customStyle.trim();
    if (!s || form.styles.includes(s)) return;
    updateForm('styles', [...form.styles, s]);
    setCustomStyle('');
  };

  const removeStyle = (style) => {
    updateForm('styles', form.styles.filter((s) => s !== style));
  };

  const addToPool = (sp) => {
    setPool((prev) => {
      const existing = prev.find((e) => e.semiProduct._id === sp._id);
      if (existing) {
        return prev.map((e) =>
          e.semiProduct._id === sp._id ? { ...e, quantity: e.quantity + 1 } : e
        );
      }
      return [...prev, { semiProduct: sp, quantity: 1 }];
    });
    setDirty(true);
  };

  const changeQuantity = (spId, newQty) => {
    if (newQty < 1) { removeFromPool(spId); return; }
    setPool((prev) =>
      prev.map((e) => (e.semiProduct._id === spId ? { ...e, quantity: newQty } : e))
    );
    setDirty(true);
  };

  const removeFromPool = (spId) => {
    setPool((prev) => prev.filter((e) => e.semiProduct._id !== spId));
    setDirty(true);
  };

  const handleDragStart = ({ active }) => { setActiveDragId(active.id); };

  const handleDragEnd = ({ active, over }) => {
    setActiveDragId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith('source-') && (overId === 'pool-drop-zone' || overId.startsWith('pool-'))) {
      const spId = activeId.replace('source-', '');
      const sp = allSemiProducts.find((s) => s._id === spId);
      if (sp) addToPool(sp);
      return;
    }

    if (activeId.startsWith('pool-') && overId.startsWith('pool-')) {
      const oldIdx = pool.findIndex((e) => `pool-${e.semiProduct._id}` === activeId);
      const newIdx = pool.findIndex((e) => `pool-${e.semiProduct._id}` === overId);
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
      semiProducts: pool.map((e) => ({ semiProduct: e.semiProduct._id, quantity: e.quantity })),
    };
    try {
      if (isNew) {
        await api.createProduct(payload);
      } else {
        await api.updateProduct(id, payload);
      }
      navigate('/products');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (dirty && !confirm('有未保存的更改，确定离开？')) return;
    navigate('/products');
  };

  const activeSp = activeDragId?.startsWith('source-')
    ? allSemiProducts.find((s) => s._id === activeDragId.replace('source-', ''))
    : null;

  const activePoolEntry = activeDragId?.startsWith('pool-')
    ? pool.find((e) => `pool-${e.semiProduct._id}` === activeDragId)
    : null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{isNew ? '添加产品' : '编辑产品'}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving || !form.code.trim() || !form.name.trim()}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* Basic info */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6 space-y-4">
        <MultiImageUpload value={form.images} onChange={(imgs) => updateForm('images', imgs)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">产品编号</Label>
            <Input value={form.code} onChange={(e) => updateForm('code', e.target.value)} placeholder="如 P-001" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">产品名称</Label>
            <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="产品名称" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">款式</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {productStyles.map((s) => (
              <button
                key={s}
                onClick={() => toggleStyle(s)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  form.styles.includes(s)
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-muted border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {s}
              </button>
            ))}
            {form.styles.filter((s) => !productStyles.includes(s)).map((s) => (
              <span key={s} className="px-3 py-1 rounded-full text-xs border bg-primary border-primary text-primary-foreground inline-flex items-center gap-1">
                {s}
                <button onClick={() => removeStyle(s)} className="hover:text-red-200"><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomStyle()}
              placeholder="自定义款式，回车添加"
              className="w-48 text-xs"
            />
            <Button size="sm" variant="outline" onClick={addCustomStyle} className="text-xs h-8">添加</Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">定价 (¥)</Label>
            <Input type="number" step="0.1" value={form.price} onChange={(e) => updateForm('price', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">佣金率 (%)</Label>
            <Input type="number" step="0.1" value={(form.commissionRate * 100).toFixed(1)} onChange={(e) => updateForm('commissionRate', parseFloat(e.target.value) / 100)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">库存</Label>
            <Input type="number" value={form.stock} onChange={(e) => updateForm('stock', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">报警阈值</Label>
            <Input type="number" value={form.stockAlertThreshold} onChange={(e) => updateForm('stockAlertThreshold', parseInt(e.target.value) || 0)} />
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
          {/* Left: Semi-product library */}
          <div className="bg-card rounded-lg border border-border p-4 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-3">半成品库</h2>
            <Input
              placeholder="搜索半成品..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-3"
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredSemiProducts.map((sp) => (
                <DraggableSemiProduct key={sp._id} sp={sp} />
              ))}
              {filteredSemiProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">无匹配半成品</p>
              )}
            </div>
          </div>

          {/* Right: Composition pool + profit */}
          <div className="flex flex-col">
            <div className="bg-card rounded-lg border border-border p-4 flex flex-col flex-1">
              <h2 className="text-sm font-semibold text-foreground mb-3">
                组合池
                {pool.length > 0 && (
                  <span className="text-muted-foreground font-normal ml-2">({pool.length}种半成品)</span>
                )}
              </h2>
              <DropZone id="pool-drop-zone">
                {pool.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    从左侧拖入半成品
                  </div>
                ) : (
                  <SortableContext
                    items={pool.map((e) => `pool-${e.semiProduct._id}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {pool.map((entry) => (
                        <PoolItem
                          key={entry.semiProduct._id}
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
            <ProfitPanel pool={pool} price={form.price} commissionRate={form.commissionRate} />
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeSp && (
            <div className="flex items-center gap-2 p-2 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-8 h-8 bg-muted rounded overflow-hidden flex-shrink-0">
                {activeSp.image ? (
                  <img src={activeSp.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activeSp.name}</span>
            </div>
          )}
          {activePoolEntry && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-primary shadow-lg">
              <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                {activePoolEntry.semiProduct.image ? (
                  <img src={activePoolEntry.semiProduct.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">无</div>
                )}
              </div>
              <span className="text-sm font-medium">{activePoolEntry.semiProduct.name}</span>
              <span className="text-xs text-muted-foreground">x{activePoolEntry.quantity}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd client && npx vite build 2>&1 | tail -5`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/ProductEdit.jsx
git commit -m "feat: add full-screen product editor with semi-product drag-and-drop and profit calculation"
```

---

## Chunk 5: API Cleanup

### Task 8: Simplify getProducts API Call

**Files:**
- Modify: `client/src/lib/api.js`

- [ ] **Step 1: Simplify getProducts**

In `client/src/lib/api.js`, replace the `getProducts` method (lines 38-41):

```javascript
  getProducts: () => request('/products'),
```

This removes the unused `params` argument (series filter is gone).

- [ ] **Step 2: Commit**

```bash
git add client/src/lib/api.js
git commit -m "chore: simplify getProducts API call, remove series filter param"
```
