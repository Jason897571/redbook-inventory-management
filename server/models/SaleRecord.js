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
