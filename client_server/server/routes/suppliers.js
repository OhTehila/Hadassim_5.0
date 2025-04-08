const express = require('express');
const router = express.Router();
const Supplier = require('../models/supplier');

// ניתוב רישום ספק
router.post('/register', (req, res) => {
  const { company_name, phone_number, representative_name, products } = req.body;

  // בדוק אם הספק כבר קיים במערכת
  Supplier.findOne({ company_name, phone_number })
      .then(existingSupplier => {
          if (existingSupplier) {
              return res.json({ success: false, message: 'אופס, אתה כבר רשום במערכת!' });
          }

          // אם הספק לא קיים, צור את הספק החדש
          const newSupplier = new Supplier({
              company_name,
              phone_number,
              representative_name,
              products
          });

          // שמור את הספק במונגוDB
          newSupplier.save()
              .then(() => res.json({ success: true, message: "Supplier registered successfully!" }))
              .catch(err => res.json({ success: false, message: "Error registering supplier", error: err }));
      })
      .catch(err => res.json({ success: false, message: "Error checking supplier", error: err }));
});

// ניתוב כניסת ספק
router.post('/login', (req, res) => {
    const { company_name, phone_number } = req.body;
  
    Supplier.findOne({ company_name, phone_number })
      .then(supplier => {
        if (!supplier) {
          return res.json({ success: false, message: 'הספק לא נמצא במערכת' });
        }
        res.json({ success: true, message: 'התחברת בהצלחה' , supplierId: supplier._id});
      })
      .catch(err => res.json({ success: false, message: 'Error logging in', error: err }));
  });
  
module.exports = router;
