# LittleBeadsBeads 库存管理系统 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack inventory and cost management web app for a Xiaohongshu stitch marker store, replacing the current Excel workflow.

**Architecture:** React + Vite frontend communicating with an Express + Mongoose REST API backend. MongoDB stores 6 collections (Settings, Material, ProductSeries, Product, SaleRecord, StockLog). Images stored locally in `server/uploads/`.

**Tech Stack:** React 18, Vite, TailwindCSS, shadcn/ui, React Router, Express, Mongoose, Multer, MongoDB

**Spec:** `docs/superpowers/specs/2026-05-05-inventory-management-design.md`

---

## File Structure

```
redbook-inventory-management/
├── package.json                          # Root workspace config
├── .env.example                          # Environment variable template
│
├── server/
│   ├── package.json
│   ├── index.js                          # Express entry point, DB connection, middleware
│   ├── models/
│   │   ├── Settings.js                   # Settings singleton model
│   │   ├── Material.js                   # Material model
│   │   ├── ProductSeries.js              # ProductSeries model
│   │   ├── Product.js                    # Product model with BOM + virtuals
│   │   ├── SaleRecord.js                 # SaleRecord model
│   │   └── StockLog.js                   # StockLog model
│   ├── routes/
│   │   ├── settings.js                   # GET/PUT /api/settings
│   │   ├── materials.js                  # CRUD /api/materials + POST /:id/stock
│   │   ├── series.js                     # CRUD /api/series
│   │   ├── products.js                   # CRUD /api/products
│   │   ├── sales.js                      # CRUD /api/sales + GET /summary
│   │   ├── stockLogs.js                  # GET /api/stock-logs
│   │   ├── dashboard.js                  # GET /api/dashboard
│   │   └── upload.js                     # POST /api/upload
│   ├── middleware/
│   │   └── upload.js                     # Multer config for image uploads
│   ├── seed.js                           # Seed script with default Settings data
│   └── uploads/                          # Image storage directory (gitignored)
│
├── client/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js                    # Vite config with API proxy
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── components.json                   # shadcn/ui config
│   └── src/
│       ├── main.jsx                      # React entry point
│       ├── App.jsx                       # Router + Layout
│       ├── lib/
│       │   ├── utils.js                  # shadcn cn() utility
│       │   └── api.js                    # Fetch wrapper for API calls
│       ├── components/
│       │   ├── ui/                       # shadcn/ui components (auto-generated)
│       │   ├── Layout.jsx                # Sidebar + main content layout
│       │   ├── Sidebar.jsx               # Navigation sidebar
│       │   ├── StatsCard.jsx             # Dashboard stat card
│       │   ├── AlertList.jsx             # Stock alert list
│       │   ├── ImageUpload.jsx           # Image upload component
│       │   └── TagManager.jsx            # Tag add/delete component (for Settings)
│       └── pages/
│           ├── Dashboard.jsx             # Dashboard page
│           ├── Materials.jsx             # Material list + CRUD
│           ├── Series.jsx                # Product series list + CRUD
│           ├── Products.jsx              # Product list (card view, grouped by series)
│           ├── ProductDetail.jsx         # Product detail + BOM editor
│           ├── Sales.jsx                 # Sales recording + history
│           ├── StockLogs.jsx             # Stock log viewer
│           └── SettingsPage.jsx          # Settings management
```

---

## Chunk 1: Project Scaffolding & Backend Foundation

### Task 1: Initialize monorepo and server project

**Files:**
- Create: `package.json`
- Create: `server/package.json`
- Create: `server/index.js`
- Create: `.env.example`

- [ ] **Step 1: Create root package.json with workspaces**

```json
{
  "name": "redbook-inventory-management",
  "private": true,
  "workspaces": ["server", "client"]
}
```

- [ ] **Step 2: Initialize server package.json and install dependencies**

```bash
cd server
npm init -y
npm install express mongoose cors dotenv multer
npm install -D nodemon
```

Add to `server/package.json` scripts:
```json
{
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js"
  }
}
```

- [ ] **Step 3: Create .env.example**

```
MONGODB_URI=mongodb://localhost:27017/littlebeadsbeads
PORT=5000
```

- [ ] **Step 4: Create server/index.js**

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/littlebeadsbeads')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes will be added here
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

- [ ] **Step 5: Create uploads directory and update .gitignore**

```bash
mkdir -p server/uploads
```

Add to `.gitignore`:
```
server/uploads/*
!server/uploads/.gitkeep
```

Create `server/uploads/.gitkeep` (empty file).

- [ ] **Step 6: Test server starts**

```bash
cd server && npm run dev
```

Verify: `curl http://localhost:5000/api/health` returns `{"status":"ok"}`.
Stop the server.

- [ ] **Step 7: Commit**

```bash
git add package.json server/ .env.example .gitignore
git commit -m "feat: initialize server with Express + Mongoose"
```

---

### Task 2: Create all Mongoose models

**Files:**
- Create: `server/models/Settings.js`
- Create: `server/models/Material.js`
- Create: `server/models/ProductSeries.js`
- Create: `server/models/Product.js`
- Create: `server/models/SaleRecord.js`
- Create: `server/models/StockLog.js`

- [ ] **Step 1: Create Settings model**

```javascript
// server/models/Settings.js
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shopName: { type: String, default: 'LittleBeadsBeads' },
  defaultCommissionRate: { type: Number, default: 0.057 },
  currency: { type: String, default: 'CNY' },
  materialCategories: { type: [String], default: ['主珠子', '配珠子', '五金件', '包材'] },
  productStyles: { type: [String], default: ['通用款', '龙虾扣款', '棒针款'] },
  beadCategories: { type: [String], default: ['陶瓷', '捷克', '塑料'] },
  materialUnits: { type: [String], default: ['个', '包', '盒', '米', '张', '条'] },
  stockChangeTypes: { type: [String], default: ['进货', '出库', '调整', '销售扣减'] },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
```

- [ ] **Step 2: Create Material model**

```javascript
// server/models/Material.js
const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  unitPrice: { type: Number, required: true, default: 0 },
  unitPriceFormula: { type: String, default: '' },
  unit: { type: String, default: '个' },
  stock: { type: Number, default: 0 },
  stockAlertThreshold: { type: Number, default: 10 },
  purchaseLink: { type: String, default: '' },
  image: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
```

- [ ] **Step 3: Create ProductSeries model**

```javascript
// server/models/ProductSeries.js
const mongoose = require('mongoose');

const productSeriesSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  beadCategory: { type: String, default: '' },
  image: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ProductSeries', productSeriesSchema);
```

- [ ] **Step 4: Create Product model with BOM and virtuals**

```javascript
// server/models/Product.js
const mongoose = require('mongoose');

const bomItemSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitCost: { type: Number, required: true, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  series: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSeries' },
  styles: { type: [String], default: [] },
  pieceCount: { type: Number, default: 1 },
  price: { type: Number, required: true, default: 0 },
  commissionRate: { type: Number, default: 0.057 },
  image: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  stockAlertThreshold: { type: Number, default: 5 },
  materials: [bomItemSchema],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('totalCost').get(function () {
  return this.materials.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
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

- [ ] **Step 5: Create SaleRecord model**

```javascript
// server/models/SaleRecord.js
const mongoose = require('mongoose');

const saleRecordSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  style: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 1 },
  salePrice: { type: Number, required: true },
  cost: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('SaleRecord', saleRecordSchema);
```

- [ ] **Step 6: Create StockLog model**

```javascript
// server/models/StockLog.js
const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['material', 'product'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetName: { type: String, default: '' },
  changeType: { type: String, required: true },
  quantity: { type: Number, required: true },
  note: { type: String, default: '' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('StockLog', stockLogSchema);
```

- [ ] **Step 7: Commit**

```bash
git add server/models/
git commit -m "feat: add all Mongoose models (Settings, Material, Product, etc.)"
```

---

### Task 3: Create all API routes

**Files:**
- Create: `server/routes/settings.js`
- Create: `server/routes/materials.js`
- Create: `server/routes/series.js`
- Create: `server/routes/products.js`
- Create: `server/routes/sales.js`
- Create: `server/routes/stockLogs.js`
- Create: `server/routes/dashboard.js`
- Create: `server/routes/upload.js`
- Create: `server/middleware/upload.js`
- Modify: `server/index.js` (register routes)

- [ ] **Step 1: Create upload middleware**

```javascript
// server/middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

module.exports = upload;
```

- [ ] **Step 2: Create settings route**

```javascript
// server/routes/settings.js
const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Get settings (create default if not exists)
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 3: Create materials route**

```javascript
// server/routes/materials.js
const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const StockLog = require('../models/StockLog');

// List all materials
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const materials = await Material.find(filter).sort({ category: 1, name: 1 });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single material
router.get('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create material
router.post('/', async (req, res) => {
  try {
    const material = await Material.create(req.body);
    res.status(201).json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update material
router.put('/:id', async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete material
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock in (add stock)
router.post('/:id/stock', async (req, res) => {
  try {
    const { quantity, note } = req.body;
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });

    material.stock += quantity;
    await material.save();

    await StockLog.create({
      type: 'material',
      targetId: material._id,
      targetName: material.name,
      changeType: '进货',
      quantity,
      note: note || '',
    });

    res.json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 4: Create series route**

```javascript
// server/routes/series.js
const express = require('express');
const router = express.Router();
const ProductSeries = require('../models/ProductSeries');

router.get('/', async (req, res) => {
  try {
    const series = await ProductSeries.find().sort({ name: 1 });
    res.json(series);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const series = await ProductSeries.findById(req.params.id);
    if (!series) return res.status(404).json({ error: 'Series not found' });
    res.json(series);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const series = await ProductSeries.create(req.body);
    res.status(201).json(series);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const series = await ProductSeries.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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

- [ ] **Step 5: Create products route**

```javascript
// server/routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  try {
    const { series } = req.query;
    const filter = {};
    if (series) filter.series = series;
    const products = await Product.find(filter)
      .populate('series')
      .populate('materials.material')
      .sort({ code: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('series')
      .populate('materials.material');
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
      .populate('series')
      .populate('materials.material');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('series')
      .populate('materials.material');
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

- [ ] **Step 6: Create sales route with auto stock deduction**

```javascript
// server/routes/sales.js
const express = require('express');
const router = express.Router();
const SaleRecord = require('../models/SaleRecord');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');

router.get('/', async (req, res) => {
  try {
    const { period } = req.query;
    const filter = {};
    const now = new Date();
    if (period === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filter.date = { $gte: start };
    } else if (period === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      filter.date = { $gte: start };
    } else if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.date = { $gte: start };
    }
    const sales = await SaleRecord.find(filter)
      .populate('product')
      .sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const { period } = req.query;
    const filter = {};
    const now = new Date();
    if (period === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filter.date = { $gte: start };
    } else if (period === 'week') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      filter.date = { $gte: start };
    } else if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.date = { $gte: start };
    }
    const sales = await SaleRecord.find(filter);
    const totalRevenue = sales.reduce((sum, s) => sum + s.salePrice * s.quantity, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.netProfit * s.quantity, 0);
    const totalOrders = sales.length;
    res.json({ totalRevenue, totalProfit, totalOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create sale — auto deduct stock + create log
router.post('/', async (req, res) => {
  try {
    const { product: productId, style, quantity, notes } = req.body;
    const product = await Product.findById(productId)
      .populate('materials.material');
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Calculate cost snapshot
    const totalCost = product.materials.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
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

router.delete('/:id', async (req, res) => {
  try {
    const sale = await SaleRecord.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    // Restore product stock
    const product = await Product.findById(sale.product);
    if (product) {
      product.stock += sale.quantity;
      await product.save();
      await StockLog.create({
        type: 'product',
        targetId: product._id,
        targetName: product.name,
        changeType: '调整',
        quantity: sale.quantity,
        note: `删除销售记录，恢复库存`,
      });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 7: Create stockLogs route**

```javascript
// server/routes/stockLogs.js
const express = require('express');
const router = express.Router();
const StockLog = require('../models/StockLog');

router.get('/', async (req, res) => {
  try {
    const { type, changeType } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (changeType) filter.changeType = changeType;
    const logs = await StockLog.find(filter).sort({ date: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 8: Create dashboard route**

```javascript
// server/routes/dashboard.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Material = require('../models/Material');
const SaleRecord = require('../models/SaleRecord');

router.get('/', async (req, res) => {
  try {
    // Today's sales
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySales = await SaleRecord.find({ date: { $gte: todayStart } });
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.salePrice * s.quantity, 0);
    const todayProfit = todaySales.reduce((sum, s) => sum + s.netProfit * s.quantity, 0);

    // Stock alerts
    const materialAlerts = await Material.find({ $expr: { $lte: ['$stock', '$stockAlertThreshold'] } });
    const productAlerts = await Product.find({ $expr: { $lte: ['$stock', '$stockAlertThreshold'] } });

    // Total products
    const productCount = await Product.countDocuments();

    // Recent sales
    const recentSales = await SaleRecord.find()
      .populate('product')
      .sort({ date: -1 })
      .limit(10);

    res.json({
      todayRevenue,
      todayProfit,
      alertCount: materialAlerts.length + productAlerts.length,
      materialAlerts,
      productAlerts,
      productCount,
      recentSales,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 9: Create upload route**

```javascript
// server/routes/upload.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

module.exports = router;
```

- [ ] **Step 10: Register all routes in server/index.js**

Add before the `app.listen` line in `server/index.js`:

```javascript
app.use('/api/settings', require('./routes/settings'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/series', require('./routes/series'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/stock-logs', require('./routes/stockLogs'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upload', require('./routes/upload'));
```

- [ ] **Step 11: Create seed script**

```javascript
// server/seed.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Settings = require('./models/Settings');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/littlebeadsbeads');
  const existing = await Settings.findOne();
  if (!existing) {
    await Settings.create({});
    console.log('Default settings created');
  } else {
    console.log('Settings already exist');
  }
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
```

Add to `server/package.json` scripts: `"seed": "node seed.js"`

- [ ] **Step 12: Test API endpoints manually**

Start server, run a few curl commands to verify routes work:
```bash
curl http://localhost:5000/api/settings
curl http://localhost:5000/api/materials
curl http://localhost:5000/api/dashboard
```

- [ ] **Step 13: Commit**

```bash
git add server/
git commit -m "feat: add all API routes (settings, materials, products, sales, dashboard)"
```

---

## Chunk 2: Frontend Scaffolding & Layout

### Task 4: Initialize React + Vite + TailwindCSS + shadcn/ui

**Files:**
- Create: `client/` (entire Vite project)
- Create: `client/vite.config.js`

- [ ] **Step 1: Scaffold Vite React project**

```bash
cd /path/to/project
npm create vite@latest client -- --template react
cd client
npm install
```

- [ ] **Step 2: Install and configure TailwindCSS**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Replace `client/src/index.css` with:
```css
@import "tailwindcss";
```

Add Tailwind plugin to `client/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
})
```

- [ ] **Step 3: Install shadcn/ui and initialize**

```bash
npx shadcn@latest init
```

Select: New York style, Zinc color, CSS variables: yes. This creates `components.json` and `client/src/lib/utils.js`.

Then add the components we need:

```bash
npx shadcn@latest add button input dialog table card badge select tabs textarea label
```

- [ ] **Step 4: Install additional dependencies**

```bash
npm install react-router-dom lucide-react
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Open browser, confirm Vite React app loads.

- [ ] **Step 6: Commit**

```bash
git add client/
git commit -m "feat: scaffold React + Vite + TailwindCSS + shadcn/ui frontend"
```

---

### Task 5: Create Layout, Sidebar, and Router

**Files:**
- Create: `client/src/lib/api.js`
- Create: `client/src/components/Layout.jsx`
- Create: `client/src/components/Sidebar.jsx`
- Modify: `client/src/App.jsx`
- Modify: `client/src/main.jsx`

- [ ] **Step 1: Create API client**

```javascript
// client/src/lib/api.js
const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Materials
  getMaterials: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/materials${query ? '?' + query : ''}`);
  },
  getMaterial: (id) => request(`/materials/${id}`),
  createMaterial: (data) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id, data) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id) => request(`/materials/${id}`, { method: 'DELETE' }),
  stockInMaterial: (id, data) => request(`/materials/${id}/stock`, { method: 'POST', body: JSON.stringify(data) }),

  // Series
  getSeries: () => request('/series'),
  createSeries: (data) => request('/series', { method: 'POST', body: JSON.stringify(data) }),
  updateSeries: (id, data) => request(`/series/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSeries: (id) => request(`/series/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? '?' + query : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Sales
  getSales: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales${query ? '?' + query : ''}`);
  },
  getSalesSummary: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales/summary${query ? '?' + query : ''}`);
  },
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  deleteSale: (id) => request(`/sales/${id}`, { method: 'DELETE' }),

  // Stock Logs
  getStockLogs: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/stock-logs${query ? '?' + query : ''}`);
  },

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Upload
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${BASE}/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
};
```

- [ ] **Step 2: Create Sidebar component**

```jsx
// client/src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, Gift, ShoppingCart, ClipboardList, Settings
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/materials', icon: Package, label: '原材料管理' },
  { to: '/series', icon: Tags, label: '产品系列' },
  { to: '/products', icon: Gift, label: '产品管理' },
  { to: '/sales', icon: ShoppingCart, label: '销售记录' },
  { to: '/stock-logs', icon: ClipboardList, label: '库存日志' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen">
      <div className="p-4 text-pink-400 font-bold text-lg">🧶 LittleBeads</div>
      <nav className="flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white border-l-3 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create Layout component**

```jsx
// client/src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Create placeholder pages**

Create these files with simple placeholder content:

```jsx
// client/src/pages/Dashboard.jsx
export default function Dashboard() {
  return <div><h1 className="text-xl font-bold">仪表盘</h1></div>;
}
```

Create the same pattern for: `Materials.jsx`, `Series.jsx`, `Products.jsx`, `ProductDetail.jsx`, `Sales.jsx`, `StockLogs.jsx`, `SettingsPage.jsx` — each with their own title.

- [ ] **Step 5: Set up App.jsx with routing**

```jsx
// client/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Materials from './pages/Materials';
import Series from './pages/Series';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Sales from './pages/Sales';
import StockLogs from './pages/StockLogs';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/series" element={<Series />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/stock-logs" element={<StockLogs />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 6: Update main.jsx**

```jsx
// client/src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 7: Clean up unused Vite default files**

Remove `client/src/App.css` and any default Vite boilerplate (logo SVGs, etc.).

- [ ] **Step 8: Test layout renders with navigation**

```bash
# Terminal 1: start server
cd server && npm run dev
# Terminal 2: start client
cd client && npm run dev
```

Verify sidebar renders, navigation works between placeholder pages.

- [ ] **Step 9: Commit**

```bash
git add client/
git commit -m "feat: add Layout, Sidebar, routing, and API client"
```

---

## Chunk 3: Settings & Materials Pages

### Task 6: Build Settings page

**Files:**
- Create: `client/src/components/TagManager.jsx`
- Modify: `client/src/pages/SettingsPage.jsx`

- [ ] **Step 1: Create TagManager component**

Reusable component for managing dynamic tag lists (add/remove). Used for all the Settings option arrays.

```jsx
// client/src/components/TagManager.jsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function TagManager({ label, tags, onChange }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (tag) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">{label}</label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs"
          >
            {tag}
            <button onClick={() => removeTag(tag)} className="text-gray-500 hover:text-red-400">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTag()}
          placeholder={`添加${label}...`}
          className="bg-gray-800 border-gray-700 text-sm"
        />
        <Button onClick={addTag} size="sm">添加</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build SettingsPage**

```jsx
// client/src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import TagManager from '@/components/TagManager';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getSettings().then(setSettings); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="text-gray-400">加载中...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-6">设置</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 space-y-4">
          <h2 className="font-semibold">基本信息</h2>
          <div>
            <Label className="text-gray-400 text-xs">店铺名称</Label>
            <Input value={settings.shopName} onChange={(e) => setSettings({ ...settings, shopName: e.target.value })} className="bg-gray-800 border-gray-700" />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">默认平台佣金率 (%)</Label>
            <Input type="number" step="0.1" value={(settings.defaultCommissionRate * 100).toFixed(1)} onChange={(e) => setSettings({ ...settings, defaultCommissionRate: parseFloat(e.target.value) / 100 })} className="bg-gray-800 border-gray-700" />
          </div>
        </div>

        {/* Dynamic Options */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 space-y-6">
          <h2 className="font-semibold">动态选项</h2>
          <TagManager label="产品款式" tags={settings.productStyles || []} onChange={(v) => setSettings({ ...settings, productStyles: v })} />
          <TagManager label="材料分类" tags={settings.materialCategories || []} onChange={(v) => setSettings({ ...settings, materialCategories: v })} />
          <TagManager label="珠子材质" tags={settings.beadCategories || []} onChange={(v) => setSettings({ ...settings, beadCategories: v })} />
          <TagManager label="材料单位" tags={settings.materialUnits || []} onChange={(v) => setSettings({ ...settings, materialUnits: v })} />
          <TagManager label="库存变动类型" tags={settings.stockChangeTypes || []} onChange={(v) => setSettings({ ...settings, stockChangeTypes: v })} />
        </div>
      </div>
      <div className="mt-6">
        <Button onClick={save} disabled={saving}>{saving ? '保存中...' : '保存设置'}</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Test Settings page**

Verify: loads settings from API, tag add/remove works, save persists.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/TagManager.jsx client/src/pages/SettingsPage.jsx
git commit -m "feat: add Settings page with dynamic tag management"
```

---

### Task 7: Build Materials page

**Files:**
- Create: `client/src/components/ImageUpload.jsx`
- Modify: `client/src/pages/Materials.jsx`

- [ ] **Step 1: Create ImageUpload component**

```jsx
// client/src/components/ImageUpload.jsx
import { useRef } from 'react';
import { api } from '@/lib/api';
import { Upload } from 'lucide-react';

export default function ImageUpload({ value, onChange }) {
  const inputRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { url } = await api.uploadImage(file);
    onChange(url);
  };

  return (
    <div
      className="relative w-full h-32 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center cursor-pointer overflow-hidden"
      onClick={() => inputRef.current.click()}
    >
      {value ? (
        <img src={value} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="text-gray-500 text-center">
          <Upload size={24} className="mx-auto mb-1" />
          <span className="text-xs">点击上传</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
```

- [ ] **Step 2: Build Materials page**

Full implementation with: category filter tabs, search, table, add/edit dialog, stock-in dialog.

```jsx
// client/src/pages/Materials.jsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ImageUpload from '@/components/ImageUpload';
import { Plus, ExternalLink } from 'lucide-react';

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [settings, setSettings] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [stockInItem, setStockInItem] = useState(null);
  const [stockQty, setStockQty] = useState('');
  const [stockNote, setStockNote] = useState('');

  const load = async () => {
    const params = {};
    if (filter) params.category = filter;
    if (search) params.search = search;
    const [mats, sets] = await Promise.all([api.getMaterials(params), api.getSettings()]);
    setMaterials(mats);
    setSettings(sets);
  };

  useEffect(() => { load(); }, [filter, search]);

  const openNew = () => {
    setEditItem({
      name: '', category: '', unitPrice: 0, unitPriceFormula: '', unit: '个',
      stock: 0, stockAlertThreshold: 10, purchaseLink: '', image: '', notes: '',
    });
    setShowForm(true);
  };

  const openEdit = (m) => { setEditItem({ ...m }); setShowForm(true); };

  const saveItem = async () => {
    if (editItem._id) {
      await api.updateMaterial(editItem._id, editItem);
    } else {
      await api.createMaterial(editItem);
    }
    setShowForm(false);
    setEditItem(null);
    load();
  };

  const deleteItem = async (id) => {
    if (!confirm('确定删除？')) return;
    await api.deleteMaterial(id);
    load();
  };

  const doStockIn = async () => {
    await api.stockInMaterial(stockInItem._id, { quantity: Number(stockQty), note: stockNote });
    setStockInItem(null);
    setStockQty('');
    setStockNote('');
    load();
  };

  const categories = settings?.materialCategories || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">原材料管理</h1>
        <Button onClick={openNew}><Plus size={16} className="mr-1" />添加材料</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button variant={filter === '' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('')}>全部</Button>
        {categories.map((c) => (
          <Button key={c} variant={filter === c ? 'default' : 'outline'} size="sm" onClick={() => setFilter(c)}>{c}</Button>
        ))}
        <Input placeholder="搜索材料名称..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 bg-gray-900 border-gray-700 text-sm ml-auto" />
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs">
              <th className="p-3 text-left">图片</th>
              <th className="p-3 text-left">名称</th>
              <th className="p-3 text-left">分类</th>
              <th className="p-3 text-right">单价</th>
              <th className="p-3 text-right">库存</th>
              <th className="p-3 text-center">状态</th>
              <th className="p-3 text-left">购买链接</th>
              <th className="p-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => {
              const isLow = m.stock <= m.stockAlertThreshold;
              return (
                <tr key={m._id} className={`border-t border-gray-800 ${isLow ? 'bg-red-950/20' : ''}`}>
                  <td className="p-3">
                    <div className="w-9 h-9 bg-gray-800 rounded overflow-hidden">
                      {m.image ? <img src={m.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">无</div>}
                    </div>
                  </td>
                  <td className="p-3 text-white">{m.name}</td>
                  <td className="p-3"><Badge variant="secondary">{m.category}</Badge></td>
                  <td className="p-3 text-right">¥{m.unitPrice.toFixed(4)}</td>
                  <td className={`p-3 text-right font-medium ${isLow ? 'text-red-400' : ''}`}>{m.stock}</td>
                  <td className="p-3 text-center">
                    {isLow ? <span className="text-red-400 text-xs">⚠ 进货！</span> : <span className="text-green-400 text-xs">✓ 充足</span>}
                  </td>
                  <td className="p-3">
                    {m.purchaseLink && (
                      <a href={m.purchaseLink} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1 text-xs">
                        链接 <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                  <td className="p-3 text-center space-x-2 text-xs">
                    <button onClick={() => openEdit(m)} className="text-blue-400 hover:underline">编辑</button>
                    <button onClick={() => setStockInItem(m)} className={isLow ? 'text-yellow-400 hover:underline' : 'text-gray-500 hover:underline'}>进货</button>
                    <button onClick={() => deleteItem(m._id)} className="text-red-400 hover:underline">删除</button>
                  </td>
                </tr>
              );
            })}
            {materials.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-gray-500">暂无材料</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-lg">
          <DialogHeader><DialogTitle>{editItem?._id ? '编辑材料' : '添加材料'}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-3">
              <ImageUpload value={editItem.image} onChange={(url) => setEditItem({ ...editItem, image: url })} />
              <div><Label className="text-xs text-gray-400">名称</Label><Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} className="bg-gray-800 border-gray-700" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-400">分类</Label>
                  <Select value={editItem.category} onValueChange={(v) => setEditItem({ ...editItem, category: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue placeholder="选择分类" /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-400">单位</Label>
                  <Select value={editItem.unit} onValueChange={(v) => setEditItem({ ...editItem, unit: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
                    <SelectContent>{(settings?.materialUnits || []).map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-gray-400">单价</Label><Input type="number" step="0.0001" value={editItem.unitPrice} onChange={(e) => setEditItem({ ...editItem, unitPrice: parseFloat(e.target.value) || 0 })} className="bg-gray-800 border-gray-700" /></div>
                <div><Label className="text-xs text-gray-400">单价公式</Label><Input value={editItem.unitPriceFormula} onChange={(e) => setEditItem({ ...editItem, unitPriceFormula: e.target.value })} placeholder="如 =13.2/20" className="bg-gray-800 border-gray-700" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-gray-400">库存</Label><Input type="number" value={editItem.stock} onChange={(e) => setEditItem({ ...editItem, stock: parseInt(e.target.value) || 0 })} className="bg-gray-800 border-gray-700" /></div>
                <div><Label className="text-xs text-gray-400">报警阈值</Label><Input type="number" value={editItem.stockAlertThreshold} onChange={(e) => setEditItem({ ...editItem, stockAlertThreshold: parseInt(e.target.value) || 0 })} className="bg-gray-800 border-gray-700" /></div>
              </div>
              <div><Label className="text-xs text-gray-400">购买链接</Label><Input value={editItem.purchaseLink} onChange={(e) => setEditItem({ ...editItem, purchaseLink: e.target.value })} className="bg-gray-800 border-gray-700" /></div>
              <div><Label className="text-xs text-gray-400">备注</Label><Input value={editItem.notes} onChange={(e) => setEditItem({ ...editItem, notes: e.target.value })} className="bg-gray-800 border-gray-700" /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveItem}>保存</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock In Dialog */}
      <Dialog open={!!stockInItem} onOpenChange={() => setStockInItem(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-sm">
          <DialogHeader><DialogTitle>进货 — {stockInItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs text-gray-400">进货数量</Label><Input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} className="bg-gray-800 border-gray-700" /></div>
            <div><Label className="text-xs text-gray-400">备注</Label><Input value={stockNote} onChange={(e) => setStockNote(e.target.value)} placeholder="如 1688进货" className="bg-gray-800 border-gray-700" /></div>
          </div>
          <DialogFooter><Button onClick={doStockIn} disabled={!stockQty}>确认进货</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 3: Test Materials page**

Verify: category filter tabs, search, add new material with image, edit, stock-in, delete.

- [ ] **Step 4: Commit**

```bash
git add client/src/
git commit -m "feat: add Materials page and ImageUpload component"
```

---

## Chunk 4: Series, Products, and Product Detail Pages

### Task 8: Build Series page

**Files:**
- Modify: `client/src/pages/Series.jsx`

- [ ] **Step 1: Build Series page with card view + CRUD dialogs**

Card grid showing each series with image, name, bead category. Add/edit/delete via dialog. Uses ImageUpload component. Select for beadCategory from settings.

- [ ] **Step 2: Test Series page**

Verify: add series with image, edit, delete, bead category dropdown shows values from settings.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Series.jsx
git commit -m "feat: add Series page with card view and CRUD"
```

---

### Task 9: Build Products page

**Files:**
- Modify: `client/src/pages/Products.jsx`

- [ ] **Step 1: Build Products page with cards grouped by series**

Fetch all products (populated with series), group by `series._id`. For each group: show series name + bead category header, then product cards. Each card shows: image, name, style badges, price, totalCost, netProfit (with %), stock. Click navigates to `/products/:id`. Add product button opens a create dialog.

Create dialog fields: code, name, series (select), styles (multi-select checkboxes from settings), pieceCount, price, commissionRate (default from settings), stockAlertThreshold, image.

- [ ] **Step 2: Test Products page**

Verify: cards grouped by series, clicking card navigates to detail, create product.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Products.jsx
git commit -m "feat: add Products page with card view grouped by series"
```

---

### Task 10: Build Product Detail page with BOM editor

**Files:**
- Modify: `client/src/pages/ProductDetail.jsx`

- [ ] **Step 1: Build ProductDetail page**

Layout: left side has product info form + BOM table, right side has image + profit calculator.

Product info section: code, name, series, styles, pieceCount, price, commissionRate — all editable fields.

BOM table: columns (Material name, Unit price, Quantity, Subtotal, Remove button). "Add material" button opens a dropdown to select from all materials, sets quantity default to 1, unitCost from material's unitPrice.

Right panel: product image (ImageUpload), profit calculator that auto-updates:
- 定价: price
- 总成本: Σ(quantity × unitCost) calculated from BOM
- 毛利润: price - totalCost
- 佣金: profit × commissionRate
- 净利润: profit × (1 - commissionRate)
- 利润率: netProfit / price × 100%

Save button persists all changes.

- [ ] **Step 2: Test Product Detail page**

Verify: add/remove BOM items, profit panel updates in real time, save persists.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/ProductDetail.jsx
git commit -m "feat: add ProductDetail page with BOM editor and profit calculator"
```

---

## Chunk 5: Sales, Stock Logs, Dashboard

### Task 11: Build Sales page

**Files:**
- Modify: `client/src/pages/Sales.jsx`

- [ ] **Step 1: Build Sales page**

Top section: quick add form — product select (shows all products), style select (filtered by selected product's styles), quantity input, "记录销售" button.

Bottom section: sales history table with period filter tabs (today/week/month/all). Columns: date, product name, style, quantity, sale price, cost, net profit, delete button.

Footer: summary bar showing total revenue and total net profit for current filter.

On create: calls `api.createSale()`, refreshes list. On delete: calls `api.deleteSale()`, refreshes.

- [ ] **Step 2: Test Sales page**

Verify: create sale → product stock decreases, filter tabs work, delete sale → stock restored, summary totals correct.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Sales.jsx
git commit -m "feat: add Sales page with quick entry and history"
```

---

### Task 12: Build Stock Logs page

**Files:**
- Modify: `client/src/pages/StockLogs.jsx`

- [ ] **Step 1: Build StockLogs page**

Filter bar: type select (all/material/product) + changeType select (all + from settings). Table columns: date, type badge, target name, change type, quantity (green if positive, red if negative), note.

- [ ] **Step 2: Test Stock Logs page**

Verify: logs from material stock-in and sales appear, filters work.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/StockLogs.jsx
git commit -m "feat: add Stock Logs page with filters"
```

---

### Task 13: Build Dashboard page

**Files:**
- Create: `client/src/components/StatsCard.jsx`
- Create: `client/src/components/AlertList.jsx`
- Modify: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Create StatsCard component**

```jsx
// client/src/components/StatsCard.jsx
export default function StatsCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex-1 min-w-[140px]">
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create AlertList component**

Displays list of items below threshold. Each row: red dot + name + "剩余 N" + threshold.

- [ ] **Step 3: Build Dashboard page**

Fetches `/api/dashboard`. Shows:
1. Stats cards row: today revenue, today profit, alert count, product count
2. Alert list (material + product alerts combined)
3. Recent sales table (last 10)

- [ ] **Step 4: Test Dashboard page**

Verify: stats show correct data, alerts display for low-stock items, recent sales populated.

- [ ] **Step 5: Commit**

```bash
git add client/src/
git commit -m "feat: add Dashboard with stats, alerts, and recent sales"
```

---

## Chunk 6: Final Polish

### Task 14: End-to-end verification and cleanup

- [ ] **Step 1: Start both servers, verify all pages work**

```bash
# Terminal 1
cd server && npm run dev
# Terminal 2
cd client && npm run dev
```

Walk through every page: Dashboard → Materials → Series → Products → Product Detail → Sales → Stock Logs → Settings.

- [ ] **Step 2: Verify business logic flow**

1. Add a material in Materials page
2. Create a series in Series page
3. Create a product in Products page with BOM referencing the material
4. Verify profit calculation in Product Detail
5. Record a sale in Sales page → check stock decrements
6. Check Stock Logs for the auto-created log entry
7. Check Dashboard reflects the sale and any alerts

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete inventory management system v1"
```
