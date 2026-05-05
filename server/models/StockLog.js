const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['material', 'product'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetName: { type: String, default: '' },
  changeType: { type: String, required: true },
  quantity: { type: Number, required: true },
  note: { type: String, default: '' },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('StockLog', stockLogSchema);
