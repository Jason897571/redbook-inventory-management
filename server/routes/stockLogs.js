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
