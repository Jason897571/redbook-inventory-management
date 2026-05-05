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
