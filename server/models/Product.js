const mongoose = require('mongoose');

const bomItemSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitCost: { type: Number, required: true, default: 0 },
}, { _id: false });

const componentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  materials: [bomItemSchema],
}, { _id: true });

const productSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  series: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSeries' },
  styles: { type: [String], default: [] },
  pieceCount: { type: Number, default: 1 },
  price: { type: Number, required: true, default: 0 },
  commissionRate: { type: Number, default: 0.057 },
  image: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  stockAlertThreshold: { type: Number, default: 5 },
  components: [componentSchema],
  sharedMaterials: [bomItemSchema],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('totalCost').get(function () {
  const componentsCost = (this.components || []).reduce((sum, comp) =>
    sum + comp.materials.reduce((s, item) => s + item.quantity * item.unitCost, 0), 0);
  const sharedCost = (this.sharedMaterials || []).reduce((sum, item) =>
    sum + item.quantity * item.unitCost, 0);
  return componentsCost + sharedCost;
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

module.exports = mongoose.model('Product', productSchema);
