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
