const express = require('express');
const router = express.Router();
const SaleRecord = require('../models/SaleRecord');
const Product = require('../models/Product');
const Material = require('../models/Material');
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

    // Create stock log for product
    await StockLog.create({
      type: 'product',
      targetId: product._id,
      targetName: product.name,
      changeType: '销售扣减',
      quantity: -quantity,
      note: `销售 ${quantity} 单`,
    });

    // Deduct raw material stock based on BOM
    for (const entry of product.semiProducts || []) {
      const sp = entry.semiProduct;
      if (!sp || !sp.materials) continue;
      for (const matEntry of sp.materials) {
        const mat = matEntry.material;
        if (!mat) continue;
        const deduct = matEntry.quantity * entry.quantity * quantity;
        await Material.findByIdAndUpdate(mat._id, { $inc: { stock: -deduct } });
        await StockLog.create({
          type: 'material',
          targetId: mat._id,
          targetName: mat.name,
          changeType: '销售扣减',
          quantity: -deduct,
          note: `销售产品「${product.name}」× ${quantity}`,
        });
      }
    }

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
    const product = await Product.findById(sale.product)
      .populate({ path: 'semiProducts.semiProduct', populate: { path: 'materials.material' } });
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

      // Restore raw material stock
      for (const entry of product.semiProducts || []) {
        const sp = entry.semiProduct;
        if (!sp || !sp.materials) continue;
        for (const matEntry of sp.materials) {
          const mat = matEntry.material;
          if (!mat) continue;
          const restore = matEntry.quantity * entry.quantity * sale.quantity;
          await Material.findByIdAndUpdate(mat._id, { $inc: { stock: restore } });
          await StockLog.create({
            type: 'material',
            targetId: mat._id,
            targetName: mat.name,
            changeType: '调整',
            quantity: restore,
            note: `删除销售记录「${product.name}」，恢复原材料库存`,
          });
        }
      }
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
