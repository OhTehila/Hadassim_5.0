const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const supplierRoutes = require('./routes/suppliers');
const orderRoutes = require('./routes/orders');
const path = require('path');

const app = express();
const uri = "mongodb+srv://ohtehila65:Os1g9dGdyAho9RvJ@cluster0.n7gaf1m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// חיבור למונגוDB
mongoose.connect(uri, {
    //useNewUrlParser: true,
    //useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.log('Error connecting to MongoDB:', err));

// הגדרת express להשתמש ב-bodyParser
app.use(bodyParser.json());

// משרת את קבצי ה-HTML מהתיקייה client
app.use(express.static(path.join(__dirname, '../client')));

// ניתוב ברירת מחדל שיטעין את index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

// הגדרת נתיבים עבור הספקים וההזמנות
app.use('/suppliers', supplierRoutes);
app.use('/orders', orderRoutes);
////////////////////////////סעיף בונוס
const Goods = require('./models/goods'); 
const Order = require('./models/order');
const Supplier = require('./models/supplier');
app.use(express.json());
// הוספת סחורה חדשה למלאי
const addProduct = async () => {
    const product = new Goods({
        product_name: 'שוקולד',
        current_quantity: 6,
        min_required_quantity: 5
    });
    
    try {
        await product.save();
        console.log('Product added successfully');
    } catch (err) {
        console.error('Error adding product:', err);
    }
};
addProduct();

app.post('/api/sales', async (req, res) => {
    const { products } = req.body;

    for (const saleProduct of products) {
        const { product_name, quantity } = saleProduct;

        // עדכון כמות במלאי
        const good = await Goods.findOne({ product_name });
        if (!good) continue;

        good.current_quantity -= quantity;
        await good.save();

        // אם ירד מתחת למינימום, חפש את הספק הכי זול לכל מוצר
        if (good.current_quantity < good.min_required_quantity) {
            // חפש את כל הספקים שמספקים את המוצר
            const suppliers = await Supplier.find({ "products.product_name": product_name });

            // מיין את הספקים לפי מחיר (הספק הכי זול ראשון)
            const sortedSuppliers = suppliers.sort((a, b) => {
                const priceA = a.products.find(p => p.product_name === product_name).price_per_item;
                const priceB = b.products.find(p => p.product_name === product_name).price_per_item;
                return priceA - priceB;
            });

            // בחר את הספק עם המחיר הזול ביותר
            const supplier = sortedSuppliers[0];

            if (supplier) {
                const productDetails = supplier.products.find(p => p.product_name === product_name);

                const order = new Order({
                    supplier_id: supplier._id,
                    company_name: supplier.company_name,
                    products: [{
                        product_name,
                        quantity: productDetails.min_quantity,
                        total_price: productDetails.price_per_item * productDetails.min_quantity
                    }]
                });

                await order.save();
                console.log(`בוצעה הזמנה אוטומטית למוצר: ${product_name} מספק: ${supplier.company_name}`);
            } else {
                console.warn(`אין ספק עבור המוצר: ${product_name}`);
            }
        }
    }

    res.json({ success: true });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
