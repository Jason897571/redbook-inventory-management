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
