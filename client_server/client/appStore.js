/////// בעל מכולת
async function loginGrocery(event) {
    event.preventDefault();  // מונע את הפעולה ברירת המחדל של שליחת הטופס
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    const res = await fetch('http://localhost:3000/orders/grocery/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
        alert('ברוך הבא למערכת הניהול!');
        document.getElementById('groceryLogin').style.display = 'none';
        document.getElementById('groceryDashboard').style.display = 'block';
        document.querySelector('.backButton').style.display = 'inline';
    } else {
        alert(data.message);
    }
}
// הוספת מאזין לאירוע של שליחת הטופס
document.addEventListener('DOMContentLoaded', function () {
    const groceryLogin = document.getElementById('groceryLogin');
    if (groceryLogin) {
        groceryLogin.addEventListener('submit', loginGrocery);
    }
    loadSuppliers(); // טוען את הספקים כשעמוד הדף נטען
    document.querySelector('.backButton').style.display = 'inline';
});

// טעינת ספקים ל-HTML
async function loadSuppliers() {
    const response = await fetch('http://localhost:3000/orders/suppliers');
    const suppliers = await response.json();

    const supplierSelect = document.getElementById('supplier');
    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier._id;
        option.textContent = supplier.company_name;
        supplierSelect.appendChild(option);
    });

}

// כאשר נבחר ספק, נטען את המוצרים שלו
document.getElementById('supplier').addEventListener('change', async function () {
    const supplierId = this.value;

    if (supplierId) {
        // שלח בקשה לשרת לקבלת המוצרים של הספק
        const response = await fetch(`http://localhost:3000/orders/supplier/${supplierId}`);
        if (response.ok) {
            const products = await response.json();
            displayProducts(products);
        } else {
            alert("שגיאה בטעינת המוצרים של הספק");
        }
    }
});

function displayProducts(products) {
    const productsTable = document.getElementById('productsTable');
    const productsBody = document.getElementById('productsBody');
    productsBody.innerHTML = '';  

    products.forEach(product => {
        const row = document.createElement('tr');
        row.dataset.productId = product._id;

        row.innerHTML = `
            <td class="productName">${product.product_name}</td>
            <td>₪${product.price_per_item}</td>
            <td>${product.min_quantity}</td>
            <td><input type="number" class="productQuantity" data-price="${product.price_per_item}" data-min="${product.min_quantity}" min="${product.min_quantity}" required></td>
            <td>
                <button class="orderProductButton">הזמן מוצר</button>
                <button class="notInterestedButton">בטל מוצר</button>
            </td>
        `;

        productsBody.appendChild(row);
    });

    productsTable.style.display = 'table';  
    document.getElementById('totalAmountContainer').style.display = 'block';  
    updateTotalAmount(); 

    // התנהגות כפתור "הזמן מוצר"
    document.querySelectorAll('.orderProductButton').forEach(button => {
        button.addEventListener('click', () => {
            const quantityInput = button.closest('tr').querySelector('.productQuantity');
            const quantity = parseInt(quantityInput.value);
            const minQuantity = parseInt(quantityInput.dataset.min);

            // בדיקה אם הכמות לא הוזנה או שהיא פחותה מהמינימום
            if (!quantity || quantity < minQuantity) {
                alert(`לא ניתן להזמין פחות מ-${minQuantity} יחידות מהמוצר ${button.closest('tr').querySelector('.productName').textContent}`);
                return;  
            }
            button.disabled = true;  // Disable the button after ordering the product
            quantityInput.disabled = true;  // Disable the quantity input to prevent changes after ordering
            updateTotalAmount();  
        });
    });

    // התנהגות כפתור הסר מוצר
    document.querySelectorAll('.notInterestedButton').forEach(button => {
        button.addEventListener('click', () => {
            button.disabled = true;  // Disable the button to prevent re-selection
            const quantityInput = button.closest('tr').querySelector('.productQuantity');
            quantityInput.value = 0;  
            quantityInput.disabled = true;  
            updateTotalAmount();  
        });
    });
}

function updateTotalAmount() {
    let totalAmount = 0;

    document.querySelectorAll('.productQuantity').forEach(input => {
        const quantity = parseInt(input.value);
        const price = parseFloat(input.dataset.price);
        if (quantity >= input.dataset.min) {
            totalAmount += quantity * price;
        }
    });

    document.getElementById('totalAmount').textContent = totalAmount.toFixed(2);  
    togglePlaceOrderButton(totalAmount);  // הצגת כפתור "בצע הזמנה" אם יש סכום לתשלום
}

function togglePlaceOrderButton(totalAmount) {
    const placeOrderButton = document.getElementById('placeOrderButton');
    if (totalAmount > 0) {
        placeOrderButton.style.display = 'inline-block';  
    } else {
        placeOrderButton.style.display = 'none';  
    }
}

document.getElementById('placeOrderButton').addEventListener('click', async function (event) {
    event.preventDefault();
    const supplierSelect = document.getElementById('supplier');
    const supplierId = document.getElementById('supplier').value;
    const companyName = supplierSelect.options[supplierSelect.selectedIndex].dataset.name;
    const products = [];
    let isValid = true;  // דגל לבדיקת תקינות ההזמנה

    document.querySelectorAll('.productQuantity').forEach(input => {
        if (input.disabled && input.value == 0) return;//אם הסרנו את המוצר
        const quantity = parseInt(input.value);
        const productRow = input.closest('tr');
        const productId = productRow.dataset.productId;
        const productName = productRow.querySelector('.productName').textContent;
        const productPrice = parseFloat(input.dataset.price);
        const minQuantity = parseInt(input.dataset.min);

        // אם הכמות לא הוזנה או שהיא פחותה מהמינימום
        if (!quantity || quantity < minQuantity) {
            alert(`לא ניתן להזמין פחות מ-${minQuantity} יחידות מהמוצר ${productName}`);
            isValid = false;  // אם יש בעיה בכמות, הדגל עובר לfalse
        }

        if (quantity >= input.dataset.min && quantity > 0) {
            const totalPrice = quantity * productPrice;
            products.push({
                product_id: productId,
                product_name: productName,
                quantity: quantity,
                total_price: totalPrice
            });
        }
    });

    if (isValid && products.length > 0) {
        const order = { supplier_id: supplierId, company_name: companyName, products };
        const response = await fetch('http://localhost:3000/orders/placeOrder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });

        if (response.ok) {
            alert("ההזמנה בוצעה בהצלחה!");
            resetOrderForm();
        } else {
            alert("אירעה שגיאה בעת ביצוע ההזמנה");
        }
    } else {
        alert("אנא הזן כמות נכונה להזמנה");
        return;
    }
});

function resetOrderForm() {
    document.getElementById('supplier').value = '';
    document.getElementById('productsTable').style.display = 'none';
    document.getElementById('productsBody').innerHTML = '';
    document.getElementById('totalAmountContainer').style.display = 'none';
    document.getElementById('totalAmount').textContent = '0';
    document.getElementById('placeOrderButton').style.display = 'none';
}

async function renderOrdersFromURL(url) {
    const res = await fetch(url);
    const orders = await res.json();

    const container = document.getElementById('ListOrders');
    container.innerHTML = '';  

    orders.forEach(order => {
        const div = document.createElement('div');
        div.classList.add('order');

        let totalAmount = 0;

        // בניית טבלת מוצרים
        let productTable = `
            <table border="1" style="border-collapse: collapse; margin-top: 10px; width: 100%;">
                <tr>
                    <th>שם המוצר</th>
                    <th>כמות</th>
                    <th>מחיר ליחידה</th>
                    <th>מחיר כולל</th>
                </tr>
        `;
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

        // פרטי הספק + סטטוס + סה"כ + כפתור אם צריך
        div.innerHTML = `
            <p><strong>שם הספק:</strong> ${order.supplier_id.company_name} (${order.supplier_id.representative_name})</p>
            ${productTable}
            <p><strong>סטטוס:</strong> <span>${order.status}</span></p>
            <p><strong>סה"כ לתשלום:</strong> ${totalAmount.toFixed(2)} ₪</p>
            ${order.status === 'בתהליך' ? `<button onclick="approveReceiptOrder('${order._id}')">אשר קבלת הזמנה</button>` : ''}
        `;

        container.appendChild(div);
    });
}

let activeButton = null; // משתנה לשמירת הכפתור שנבחר
function setActiveButton(buttonId) {
    if (activeButton) {
        activeButton.classList.remove('selected');
    }
    activeButton = document.getElementById(buttonId);
    activeButton.classList.add('selected');
}

// מציג הזמנות פעילות
function active() {
    setActiveButton('btnActive');
    renderOrdersFromURL('http://localhost:3000/orders/active');
}

// מציג את כל ההזמנות
function showAllOrders() {
    setActiveButton('btnAll');
    renderOrdersFromURL('http://localhost:3000/orders/loadOrder');
}

async function approveReceiptOrder(orderId) {
    const res = await fetch(`http://localhost:3000/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'הושלמה' })
    });

    const data = await res.json();

    if (res.ok) {
        alert('ההזמנה הושלמה!');
        active();  
    } else {
        alert(data.message);
    }
}
