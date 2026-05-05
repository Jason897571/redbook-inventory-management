const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shopName: { type: String, default: 'LittleBeadsBeads' },
  defaultCommissionRate: { type: Number, default: 0.057 },
  currency: { type: String, default: 'CNY' },
  materialCategories: { type: [String], default: ['主珠子', '配珠子', '五金件', '包材'] },
  productStyles: { type: [String], default: ['通用款', '龙虾扣款', '棒针款'] },
  beadCategories: { type: [String], default: ['陶瓷', '捷克', '塑料'] },
  materialUnits: { type: [String], default: ['个', '包', '盒', '米', '张', '条'] },
  stockChangeTypes: { type: [String], default: ['进货', '出库', '调整', '销售扣减'] },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
