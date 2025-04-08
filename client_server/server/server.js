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

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
