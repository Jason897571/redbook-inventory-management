const mongoose = require('mongoose');

const semiProductMaterialSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
}, { _id: false });

const semiProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: '' },
  materials: [semiProductMaterialSchema],
}, { timestamps: true });

module.exports = mongoose.model('SemiProduct', semiProductSchema);
