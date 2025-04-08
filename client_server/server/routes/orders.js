const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Supplier = require('../models/supplier');

// צפייה בהזמנות קיימות
router.get('/viewOrder/:supplierId', async (req, res) => {
    try {
        const supplierId = req.params.supplierId; 
        let orders;

        if (supplierId) {
            // אם יש supplier_id, מציגים רק את ההזמנות של הספק
            orders = await Order.find({ 'supplier_id': supplierId }).populate('supplier_id');
        } else {
            console.log('לא נמצא supplier_id, מציגים את כל ההזמנות');
            orders = await Order.find().populate('supplier_id');
        }

        res.status(200).send(orders);
    } catch (err) {
        console.error('Error retrieving orders:', err);  
        res.status(500).send({ message: 'Error retrieving orders', error: err });
    }
});

//אישור הזמנה
router.put('/approve/:id', (req, res) => {
    const orderId = req.params.id;

    Order.findByIdAndUpdate(orderId, { status: 'בתהליך' }, { new: true })
        .then(updatedOrder => {
            if (!updatedOrder) return res.status(404).json({ success: false, message: 'ההזמנה לא נמצאה' });
            res.json({ success: true, message: 'ההזמנה אושרה', order: updatedOrder });
        })
        .catch(err => res.status(500).json({ success: false, message: 'שגיאה באישור ההזמנה', error: err }));
});

///////////////////////////////////////////////בעל מכולת
router.post('/grocery/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '6568980') {
      res.send({ success: true, message: 'כניסה הצליחה' });
    } else {
      res.status(401).send({ success: false, message: 'שם משתמש או סיסמה שגויים' });
    }
  });
  
// הוספת הזמנה חדשה
router.post('/placeOrder', async (req, res) => {
    const { supplier_id, products, status} = req.body;

    try {
        // בודקים אם הספק קיים
        const supplier = await Supplier.findById(supplier_id);
        if (!supplier) {
            return res.status(404).json({ message: 'הספק לא נמצא במערכת' });
        }

        // בדיקה אם הכמות של כל מוצר עומדת במינימום
        for (const product of products) {
            const productData = supplier.products.find(p => p._id.toString() === product.product_id);

            if (!productData) {
                return res.status(400).json({ message: `המוצר ${product.product_name} לא נמצא בספק` });
            }

            if (product.quantity < productData.min_quantity) {
                return res.status(400).json({
                    message: `לא ניתן להזמין פחות מ-${productData.min_quantity} יחידות מהמוצר ${productData.name}`
                });
            }
        }

        // יצירת ההזמנה החדשה
        const newOrder = new Order({
            supplier_id,
            company_name: supplier.company_name,
            products,  
            status: status || 'בהמתנה'
        });

        await newOrder.save();  

        res.json({ message: 'ההזמנה בוצעה בהצלחה!', order: newOrder });
    } catch (error) {
        console.error('שגיאה בהזמנת סחורה:', error);
        res.status(500).json({ message: 'שגיאה בהזמנת סחורה', error });
    }
});

// Endpoint לשליפת כל הספקים
router.get('/suppliers', async (req, res) => {
    try {
        const suppliers = await Supplier.find();  // שליפת כל הספקים
        if (!suppliers) {
            return res.status(404).json({ message: 'לא נמצאו ספקים' });
        }
        res.json(suppliers);  // מחזיר את הספקים ללקוח
    } catch (error) {
        console.error('שגיאה בשליפת הספקים:', error);  
        res.status(500).json({ message: 'שגיאה בשליפת הספקים', error });
    }
});

//טען מוצרים לפי ספק
router.get('/supplier/:id', async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        res.json(supplier.products);
    } catch (err) {
        res.status(500).json({ message: 'שגיאה בטעינת מוצרים של הספק', error: err });
    }
});

// הזמנות פעילות בלבד
router.get('/active', async (req, res) => {
    try {
        const activeOrders = await Order.find({
            status: { $in: ['בהמתנה', 'בתהליך'] }
        }).populate('supplier_id');
        res.json(activeOrders);
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בשליפת הזמנות פעילות' });
    }
});

// טעינת כל ההזמנות
router.get('/loadOrder', async (req, res) => {
    try {
        const orders = await Order.find().populate('supplier_id', 'company_name representative_name');  // מביא את כל ההזמנות וממלא את פרטי הספק
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בטעינת הזמנות', error });
    }
});

// אישור קבלת הזמנה
router.put('/:orderId', async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'הזמנה לא נמצאה' });
        }

        // עדכון סטטוס ההזמנה ל"הושלמה"
        order.status = 'הושלמה';
        await order.save();  
        res.json({ message: 'ההזמנה הושלמה!', order });
    } catch (error) {
        res.status(500).json({ message: 'שגיאה בעדכון ההזמנה', error });
    }
});

module.exports = router;
