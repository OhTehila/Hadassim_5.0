const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    company_name: { type: String, required: true },
    products: [{ product_name: String, quantity: Number, total_price : Number}],
    status: { type: String, default: 'בהמתנה' }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
