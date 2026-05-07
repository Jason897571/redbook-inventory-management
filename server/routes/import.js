const express = require('express');
const router = express.Router();
const multer = require('multer');
const unzipper = require('unzipper');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const Settings = require('../models/Settings');
const Material = require('../models/Material');
const SemiProduct = require('../models/SemiProduct');
const Product = require('../models/Product');
const ProductSeries = require('../models/ProductSeries');
const SaleRecord = require('../models/SaleRecord');
const StockLog = require('../models/StockLog');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传 zip 文件' });
  }

  try {
    const directory = await unzipper.Open.buffer(req.file.buffer);

    // Find and parse data.json
    const dataEntry = directory.files.find(f => f.path === 'data.json');
    if (!dataEntry) {
      return res.status(400).json({ error: 'zip 文件中未找到 data.json' });
    }
    const dataBuffer = await dataEntry.buffer();
    const data = JSON.parse(dataBuffer.toString());
    const collections = data.collections;

    if (!collections) {
      return res.status(400).json({ error: 'data.json 格式无效' });
    }

    // Extract image files to uploads/
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const imageFiles = directory.files.filter(f => f.path.startsWith('uploads/') && f.type === 'File');
    for (const file of imageFiles) {
      const filename = path.basename(file.path);
      const destPath = path.join(uploadsDir, filename);
      const content = await file.buffer();
      fs.writeFileSync(destPath, content);
    }

    // Build ObjectId mapping: old ID -> new ID
    const idMap = new Map();

    function mapId(oldId) {
      if (!oldId) return oldId;
      const key = oldId.toString();
      if (!idMap.has(key)) {
        idMap.set(key, new mongoose.Types.ObjectId());
      }
      return idMap.get(key);
    }

    // Pre-generate new IDs for all documents
    for (const collName of ['settings', 'materials', 'semiProducts', 'products', 'productSeries', 'saleRecords', 'stockLogs']) {
      for (const doc of (collections[collName] || [])) {
        if (doc._id) mapId(doc._id);
      }
    }

    // Clear all existing data
    await Promise.all([
      Settings.deleteMany({}),
      Material.deleteMany({}),
      SemiProduct.deleteMany({}),
      Product.deleteMany({}),
      ProductSeries.deleteMany({}),
      SaleRecord.deleteMany({}),
      StockLog.deleteMany({}),
    ]);

    // Insert in dependency order

    // 1. Settings
    if (collections.settings?.length) {
      for (const doc of collections.settings) {
        const newDoc = { ...doc, _id: mapId(doc._id) };
        delete newDoc.__v;
        await Settings.create(newDoc);
      }
    }

    // 2. Materials (no references)
    if (collections.materials?.length) {
      const docs = collections.materials.map(doc => {
        const newDoc = { ...doc, _id: mapId(doc._id) };
        delete newDoc.__v;
        return newDoc;
      });
      await Material.insertMany(docs);
    }

    // 3. SemiProducts (references materials)
    if (collections.semiProducts?.length) {
      const docs = collections.semiProducts.map(doc => {
        const newDoc = {
          ...doc,
          _id: mapId(doc._id),
          materials: (doc.materials || []).map(m => ({
            ...m,
            _id: m._id ? mapId(m._id) : new mongoose.Types.ObjectId(),
            material: mapId(m.material),
          })),
        };
        delete newDoc.__v;
        return newDoc;
      });
      await SemiProduct.insertMany(docs);
    }

    // 4. Products (references semiProducts)
    if (collections.products?.length) {
      const docs = collections.products.map(doc => {
        const newDoc = {
          ...doc,
          _id: mapId(doc._id),
          semiProducts: (doc.semiProducts || []).map(sp => ({
            ...sp,
            _id: sp._id ? mapId(sp._id) : new mongoose.Types.ObjectId(),
            semiProduct: mapId(sp.semiProduct),
          })),
        };
        delete newDoc.__v;
        return newDoc;
      });
      await Product.insertMany(docs);
    }

    // 5. ProductSeries (references products)
    if (collections.productSeries?.length) {
      const docs = collections.productSeries.map(doc => {
        const newDoc = {
          ...doc,
          _id: mapId(doc._id),
          products: (doc.products || []).map(pid => mapId(pid)),
        };
        delete newDoc.__v;
        return newDoc;
      });
      await ProductSeries.insertMany(docs);
    }

    // 6. SaleRecords (references products)
    if (collections.saleRecords?.length) {
      const docs = collections.saleRecords.map(doc => {
        const newDoc = {
          ...doc,
          _id: mapId(doc._id),
          product: mapId(doc.product),
        };
        delete newDoc.__v;
        return newDoc;
      });
      await SaleRecord.insertMany(docs);
    }

    // 7. StockLogs (polymorphic targetId)
    if (collections.stockLogs?.length) {
      const docs = collections.stockLogs.map(doc => {
        const newDoc = {
          ...doc,
          _id: mapId(doc._id),
          targetId: mapId(doc.targetId),
        };
        delete newDoc.__v;
        return newDoc;
      });
      await StockLog.insertMany(docs);
    }

    res.json({
      message: '导入成功',
      stats: {
        settings: collections.settings?.length || 0,
        materials: collections.materials?.length || 0,
        semiProducts: collections.semiProducts?.length || 0,
        products: collections.products?.length || 0,
        productSeries: collections.productSeries?.length || 0,
        saleRecords: collections.saleRecords?.length || 0,
        stockLogs: collections.stockLogs?.length || 0,
        images: imageFiles.length,
      },
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: '导入失败: ' + err.message });
  }
});

module.exports = router;
