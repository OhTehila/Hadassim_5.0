//סעיף בונוס
const mongoose = require('mongoose');

const goodsSchema = new mongoose.Schema({
    product_name: { type: String, required: true },
    current_quantity: { type: Number, default: 0 },
    min_required_quantity: { type: Number, required: true }
});

const Goods = mongoose.model('Goods', goodsSchema);
module.exports = Goods;