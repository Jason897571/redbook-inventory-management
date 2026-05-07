const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

const Settings = require('../models/Settings');
const Material = require('../models/Material');
const SemiProduct = require('../models/SemiProduct');
const Product = require('../models/Product');
const ProductSeries = require('../models/ProductSeries');
const SaleRecord = require('../models/SaleRecord');
const StockLog = require('../models/StockLog');

router.get('/', async (req, res) => {
  try {
    const [settings, materials, semiProducts, products, productSeries, saleRecords, stockLogs] = await Promise.all([
      Settings.find().lean(),
      Material.find().lean(),
      SemiProduct.find().lean(),
      Product.find().lean(),
      ProductSeries.find().lean(),
      SaleRecord.find().lean(),
      StockLog.find().lean(),
    ]);

    const data = {
      exportVersion: 1,
      exportDate: new Date().toISOString(),
      collections: {
        settings,
        materials,
        semiProducts,
        products,
        productSeries,
        saleRecords,
        stockLogs,
      },
    };

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="export-${Date.now()}.zip"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    // Add data.json
    archive.append(JSON.stringify(data, null, 2), { name: 'data.json' });

    // Add uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    }

    await archive.finalize();
  } catch (err) {
    console.error('Export error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: '导出失败: ' + err.message });
    }
  }
});

module.exports = router;
