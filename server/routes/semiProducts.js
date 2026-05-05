const express = require('express');
const router = express.Router();
const SemiProduct = require('../models/SemiProduct');

router.get('/', async (req, res) => {
  try {
    const { series } = req.query;
    const filter = {};
    if (series) filter.series = series;
    const products = await SemiProduct.find(filter)
      .populate('series')
      .populate('components.materials.material')
      .populate('sharedMaterials.material')
      .sort({ code: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await SemiProduct.findById(req.params.id)
      .populate('series')
      .populate('components.materials.material')
      .populate('sharedMaterials.material');
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
      .populate('series')
      .populate('components.materials.material')
      .populate('sharedMaterials.material');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const product = await SemiProduct.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('series')
      .populate('components.materials.material')
      .populate('sharedMaterials.material');
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
