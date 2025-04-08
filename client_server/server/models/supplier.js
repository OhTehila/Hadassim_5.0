const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    company_name: { type: String, required: true },
    phone_number: { type: String, required: true },
    representative_name: { type: String, required: true },
    products: [{ product_name: String, price_per_item: Number, min_quantity: Number }]
});

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
