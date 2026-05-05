const mongoose = require('mongoose');

const productSemiProductSchema = new mongoose.Schema({
  semiProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'SemiProduct', required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  styles: { type: [String], default: [] },
  price: { type: Number, required: true, default: 0 },
  commissionRate: { type: Number, default: 0.057 },
  images: { type: [String], default: [] },
  stock: { type: Number, default: 0 },
  stockAlertThreshold: { type: Number, default: 5 },
  semiProducts: [productSemiProductSchema],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('totalCost').get(function () {
  return (this.semiProducts || []).reduce((sum, entry) => {
    const sp = entry.semiProduct;
    if (!sp || !sp.materials) return sum;
    const spCost = (sp.materials || []).reduce((s, m) => {
      const unitPrice = m.material?.unitPrice || 0;
      return s + m.quantity * unitPrice;
    }, 0);
    return sum + spCost * entry.quantity;
  }, 0);
});

productSchema.virtual('profit').get(function () {
  return this.price - this.totalCost;
});

productSchema.virtual('netProfit').get(function () {
  return this.profit * (1 - this.commissionRate);
});

productSchema.virtual('profitMargin').get(function () {
  return this.price > 0 ? this.netProfit / this.price : 0;
});

productSchema.virtual('series', {
  ref: 'ProductSeries',
  localField: '_id',
  foreignField: 'products',
});

module.exports = mongoose.model('Product', productSchema);
