// הצגת טופס כניסת ספק קיים
function showLoginForm() {
    document.getElementById('welcomeTitle').style.display = 'none';
    document.getElementById("initialOptions").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
    document.querySelector('.backButton').style.display = 'inline';  
}

// הצגת טופס רישום ספק חדש
function showRegisterForm() {
    document.getElementById('welcomeTitle').style.display = 'none';
    document.getElementById("initialOptions").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
    document.querySelector('.backButton').style.display = 'inline';  
}

let productsArray = [];
//הוספת סחורה
function addProduct() {
    const name = document.getElementById('product_name');
    const price = document.getElementById('price_per_item');
    const minQty = document.getElementById('min_quantity');

    // רק אם השדות קיימים, נמשיך
    if (name.value && price.value && minQty.value) {
        productsArray.push({
            product_name: name.value,
            price_per_item: parseFloat(price.value),
            min_quantity: parseInt(minQty.value)
        });

        // איפוס השדות
        name.value = '';
        price.value = '';
        minQty.value = '';

        alert("המוצר נוסף בהצלחה!");
    } else {
        alert("נא למלא את כל השדות");
    }
}

// רישום ספק חדש
async function registerSupplier() {
    const company_name = document.getElementById('company_name').value;
    const phone_number = document.getElementById('phone_number').value;
    const representative_name = document.getElementById('representative_name').value;

    // בדיקה אם השדות על שם החברה, נציג ומספר טלפון מולאו
    if (!company_name || !phone_number || !representative_name) {
        alert('יש למלא את כל השדות: שם החברה, טלפון ונציג');
        return;
    }
    // בדיקה אם המשתמש הכניס לפחות סחורה
    if (productsArray.length === 0) {
        alert('יש להכניס לפחות סחורה אחת');
        return;
    }
    const supplierData = {
        company_name,
        phone_number,
        representative_name,
        products: productsArray // שולחים את כל המוצרים שנוספו
    };

    // שליחת POST לשרת
    try {
        const response = await fetch('http://localhost:3000/suppliers/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplierData)
        });

        if (!response.ok) throw new Error("שגיאה בהרשמה");
        alert("נרשמת בהצלחה!");
        window.location.href = 'index.html'; 
    } catch (err) {
        alert("שגיאה: " + err.message);
    }
}

// כניסת ספק קיים
async function loginSupplier(event) {
    event.preventDefault();  // מונע את הפעולה ברירת המחדל של שליחת הטופס
    const company_name = document.getElementById('company_name_login').value;
    const phone_number = document.getElementById('phone_number_login').value;

    if (!company_name || !phone_number) {
        alert('חובה למלא את כל השדות');
        return;
    }

    const loginData = {
        company_name,
        phone_number
    };

    try {
        const response = await fetch('http://localhost:3000/suppliers/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (result.success) {
            alert('התחברת בהצלחה');
            const supplierId = result.supplierId;
            localStorage.setItem('supplierId', supplierId);
            fetchOrders(supplierId);  
            window.location.href = 'orders.html';
        } else {
            alert('הספק לא נמצא במערכת');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('הייתה שגיאה בכניסה');
    }
}

// הוספת מאזין לאירוע של שליחת הטופס
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', loginSupplier);
    }
    const supplierId = localStorage.getItem('supplierId');
    if (supplierId) {
        if (window.location.pathname.includes('orders.html'))
        document.querySelector('.backButton').style.display = 'inline'; 
        fetchOrders(supplierId);
    } else {
        window.location.href = 'index.html';
    }
});

// הזמנות
async function fetchOrders(supplierId) {
    if (!supplierId) {
        alert("לא נמצא מזהה ספק, ודא שהתחברת כהלכה.");
        return; // Exit the function if the supplierId is invalid
    }

    const response = await fetch(`http://localhost:3000/orders/viewOrder/${supplierId}`);
    const orders = await response.json();
    const container = document.getElementById('ordersList');
    if (!container) {
        return;
    }

    if (orders.length === 0) {
        return;
    }

    // מיון ההזמנות כך שההזמנות בסטטוס "הושלמה" יופיעו קודם
    const waitingOrders = orders.filter(order => order.status === 'הושלמה');
    const completedOrders = orders.filter(order => order.status !== 'הושלמה');
    const sortedOrders = [...waitingOrders, ...completedOrders];

    container.innerHTML = ''; 

    if (waitingOrders.length > 0) {
        const newOrdersHeader = document.createElement('h3');
        newOrdersHeader.textContent = 'הזמנות חדשות';
        container.appendChild(newOrdersHeader);
    }

    sortedOrders.forEach(order => {
        const div = document.createElement('div');
        div.classList.add('order');

        let productTable = `
            <table border="1" style="border-collapse: collapse; margin-top: 10px; width: 100%;">
                <tr>
                    <th>שם המוצר</th>
                    <th>כמות</th>
                    <th>מחיר ליחידה</th>
                    <th>מחיר כולל</th>
                </tr>
        `;

        let totalAmount = 0;

        order.products.forEach(product => {
            totalAmount += product.total_price;

            productTable += `
                <tr>
                    <td>${product.product_name}</td>
                    <td>${product.quantity}</td>
                    <td>${(product.total_price / product.quantity).toFixed(2)} ₪</td>
                    <td>${product.total_price.toFixed(2)} ₪</td>
                </tr>
            `;
        });

        productTable += `</table>`;

        div.innerHTML = `
            <p><strong>שם הספק:</strong> ${order.supplier_id.company_name} (${order.supplier_id.representative_name})</p>
            ${productTable}
            <p><strong>סטטוס:</strong> <span>${order.status}</span></p>
            <p><strong>סה"כ לתשלום:</strong> ${totalAmount.toFixed(2)} ₪</p>
            ${order.status === 'בהמתנה' ? `<button onclick="approveOrder('${order._id}')">אשר הזמנה</button>` : ''}
        `;

        container.appendChild(div);
    });
}

async function approveOrder(orderId) {
    const response = await fetch(`http://localhost:3000/orders/approve/${orderId}`, {
        method: 'PUT'
    });

    const result = await response.json();
    if (result.success) {
        alert('ההזמנה אושרה!');
        const supplierId = localStorage.getItem('supplierId');
        fetchOrders(supplierId);
    } else {
        alert('שגיאה באישור ההזמנה');
    }
}