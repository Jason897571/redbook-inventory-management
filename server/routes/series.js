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
