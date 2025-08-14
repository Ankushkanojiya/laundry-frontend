
//   Login  🔒
const BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:8080"
  : "https://laundry-app-management.onrender.com";



// Debug function to help track navigation
function debugNav(sectionId, navText) {
    console.group('Navigation Debug');
    console.log('Section ID:', sectionId);
    console.log('Nav Text:', navText);
    const section = document.getElementById(sectionId);
    console.log('Section found:', !!section);
    const navItems = document.querySelectorAll('.admin-sidebar .nav-item');
    console.log('Nav items found:', navItems.length);
    navItems.forEach(item => {
        const text = item.textContent.replace(/[\u{1F300}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|\s+/gu, ' ').trim();
        console.log('Nav item text:', text, text === navText ? '(MATCH)' : '');
    });
    console.groupEnd();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded. Waiting for login...");

    // Initialize sections as hidden
    const sections = [
        'stats-cards',
        'add-customer-section',
        'take-order-section',
        'manage-customers-section',
        'manage-order-section',
        'payments-section',
        'customer-payment-section',
        'insights-section'
    ];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('hidden');
            section.style.display = 'none';
        }
    });

    const token = localStorage.getItem("customerToken");
    console.log(token);

    if (token) {
        const customerId = localStorage.getItem("customerId");
        const customerName = localStorage.getItem("customerName");

        if (customerId && customerName) {
            document.getElementById("auth-section").classList.add("hidden");
            document.getElementById("customer-dashboard").classList.remove("hidden");
            loadCustomerDashboard(customerId);
        } else {
            localStorage.clear();
        }
    }

    // Initialize mobile navigation state
    const adminNav = document.querySelector('.admin-nav');
    if (adminNav) {
        // Enable horizontal scrolling for mobile
        adminNav.addEventListener('scroll', () => {
            const isStart = adminNav.scrollLeft === 0;
            const isEnd = adminNav.scrollLeft + adminNav.clientWidth === adminNav.scrollWidth;
            
            adminNav.classList.toggle('at-start', isStart);
            adminNav.classList.toggle('at-end', isEnd);
        });
    }
});

function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {

    const modal = document.getElementById("invoice-modal");
    const invoiceDiv = document.getElementById("invoice-content");

    if (!modal || !invoiceDiv) {
        console.error("invoice modal structure missing in DOM!");
    }


});


let whoIsPaying = "";
let paymentCustomerId = null;
let paymentCustomerName = "";
let paymentBalance = 0;
let currentCustomerBalance = 0;

async function loadStats() {
    console.log("📊 loadStats() called...");
    try {
        const response = await fetch(`${BASE_URL}/api/stats`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });
        const data = await response.json();

        document.getElementById('pending-count').textContent = data.pendingOrders;
        document.getElementById('business-revenue').textContent = `₹${data.businessRevenueToday.toFixed(2)}`;
        document.getElementById('daily-revenue').textContent = `₹${data.revenueToday.toFixed(2)}`;

    } catch (error) {
        console.error("Something Going wrong", error);
    }
}

function showTab(type) {
    const adminTab = document.getElementById('tab-admin');
    const customerTab = document.getElementById('tab-customer');
    const adminForm = document.getElementById('admin-form');
    const customerForm = document.getElementById('customer-form');

    if (type === 'admin') {
        adminForm.classList.remove('hidden');
        customerForm.classList.add('hidden');
        adminTab.classList.add('active-tab');
        customerTab.classList.remove('active-tab');
    } else {
        customerForm.classList.remove('hidden');
        adminForm.classList.add('hidden');
        customerTab.classList.add('active-tab');
        adminTab.classList.remove('active-tab');
        // Show login section by default when switching to customer tab
        toggleAuthMode('login');
    }
}

function toggleAuthMode(mode) {
    const loginSection = document.getElementById('customer-login-section');
    const registerSection = document.getElementById('customer-register-section');
    
    if (mode === 'login') {
        loginSection.classList.remove('hidden');
        registerSection.classList.add('hidden');
    } else {
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    }
    
    // Clear any existing messages
    document.getElementById('customer-auth-message').textContent = '';
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

let paymentMode = "";
// Login function
async function login() {
    console.log("Login initiated....");
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        document.getElementById("login-message").textContent = "Username and password required";
        return;
    }

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
        const response = await fetch(`${BASE_URL}/api/admin/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        const result=await response.json();
        localStorage.setItem('adminToken', result.token);

        if (!response.ok) {
            throw new Error('Login failed - Incorrect username or password ' + response.status);
        }

        // Only execute if login is successful
        // Hide auth section and show admin dashboard
        document.getElementById('auth-section').style.display = 'none';
        const adminDashboard = document.getElementById('admin-dashboard');
        adminDashboard.classList.remove('hidden');
        adminDashboard.style.display = 'block';

        // Initialize the dashboard with default view
        initializeDashboard();

        // Initialize sidebar state
        const sidebar = document.getElementById('admin-sidebar');
        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }

        loadStats();
        populateCustomerFilter();

        // Add showDashboard function if it doesn't exist
        if (typeof showDashboard !== 'function') {
            window.showDashboard = function() {
                hideAllSections();
                const mainContent = document.getElementById('main-content');
                mainContent.style.display = 'block';
                
                const statsCards = document.getElementById('stats-cards');
                statsCards.classList.remove('hidden');
                statsCards.style.display = 'grid';
                
                setActiveNavItem('Dashboard');
                loadStats(); // Refresh dashboard stats
                closeSidebar(); // Close sidebar after navigation
            }
        }


        hideAllSections(); // Hide all sections initially
        await refreshCustomers();
    } catch (error) {
        showMessage(error.message, 'error', 'login-message');
        console.error('Login error:', error);
    }
}

function getAdminAuthHeaders(){
    const tokenForAdmin=localStorage.getItem('adminToken');
    return {
        'Authorization': `Bearer ${tokenForAdmin}`,
        'Content-Type': 'application/json'
    };
}
async function logoutAdmin() {
    try {
        await fetch(`${BASE_URL}/logout`, {
            method: "POST",
            credentials: "include"
        });

        // Hide all sections
        const sectionsToHide = [
            "admin-dashboard",
            "customer-dashboard",
            "stats-cards",
            "manage-customers-section",
            "manage-order-section",
            "payments-section",
            "customer-payment-section",
            "insights-section",
            "add-customer-section",
            "take-order-section"
        ];

        sectionsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.classList.contains('hidden')) {
                    // Already hidden
                } else {
                    element.classList.add('hidden');
                }
            }
        });

        // Hide any open modals
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
        
        // Show auth section properly
        const authSection = document.getElementById("auth-section");
        authSection.style.display = "flex";
        document.getElementById("admin-form").classList.remove("hidden");
        document.getElementById("customer-form").classList.add("hidden");
        
        // Reset form fields
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        document.getElementById("login-message").textContent = "";
        
        // Reset active tab
        document.getElementById("tab-admin").classList.add("active-tab");
        document.getElementById("tab-customer").classList.remove("active-tab");

        // Clear any stored data
        localStorage.removeItem('sidebarCollapsed');
        localStorage.removeItem('adminToken');
        
    } catch (error) {
        console.error('Logout failed:', error);
        // Still attempt to show login screen even if logout request fails
        document.getElementById("auth-section").style.display = "flex";
    }
}


//  <!--    Add new customer  🧑➕➕➕-->
async function addCustomer() {

    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();


    if (!name || !phone) {
        showMessage('Please fill all fields', 'error');
        return;
    }
    if (!/[A-Za-z]/.test(name)) {
        showMessage('Name must contain letters', 'error');
        return;
    }

    if (!/^\d{10}$/.test(phone)) {
        showMessage('Phone must be 10 digits', 'error');
        return;
    }
    try {
        const response = await fetch(`${BASE_URL}/api/customers`, {
            method: 'POST',
            headers: getAdminAuthHeaders(),
            body: JSON.stringify({ name, phoneNumber: phone }),
            
        });

        const responseData = await response.text()

        if (!response.ok) {
            if (response.status === 400 && responseData.includes("already exists")) {
                showMessage("The number is already exists", 'error');
                highlightDuplicatePhone();
                console.warn("Handled 400 error");
                return;
            }
            throw new Error(responseData || 'Failed to add customer');


        }
        showMessage('Customer added successfully', 'success');
        resetForm();
        await refreshCustomers();
    } catch (error) {
        if (error.message.includes("already exists")) {
            showMessage('Phone number already registered!', 'error');
            highlightDuplicatePhone();
        } else {
            showMessage(error.message, 'error');
        }
    }
}
function highlightDuplicatePhone() {
    const phoneInput = document.getElementById('customer-phone');
    phoneInput.classList.add('input-error');


    // Clear error after 3 seconds
    setTimeout(() => {
        phoneInput.classList.remove('input-error');
    }, 3000);
}

// <!--   Edit customer  ✍️✍️✍️-->
let currentCustomerId = null;
async function editCustomer(id) {
    try {
        showMessage('', 'clear', 'edit-customer-message');
        const response = await fetch(`${BASE_URL}/api/customers/${id}`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch customer');

        const customer = await response.json();
        document.getElementById('edit-customer-name').value = customer.name;
        document.getElementById('edit-customer-phone').value = customer.phoneNumber;
        currentCustomerId = id;

        // Show the modal
        const modal = document.getElementById('edit-customer-modal');
        modal.classList.remove('hidden');
        modal.classList.add('modal--active');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// <!--   Update customer 🛠️🛠️🛠️🛠️🛠️🛠️  -->
async function updateCustomer() {
    const name = document.getElementById('edit-customer-name').value.trim();
    const phone = document.getElementById('edit-customer-phone').value.trim();
    try {
        const response = await fetch(`${BASE_URL}/api/customers/${currentCustomerId}`, {
            method: 'PUT',
            headers: getAdminAuthHeaders(),
            body: JSON.stringify({ name, phoneNumber: phone }),
            
        });

        if (!response.ok) {
            throw new Error('Failed to update customer');
        }

        showMessage('Customer updated successfully', 'success', 'edit-customer-message');
        setTimeout(() => {
            closeEditCustomerModal();
            refreshCustomers();
        }, 2000);


    } catch (error) {
        showMessage(error.message, 'error', 'edit-customer-message');
    }
}

// Delete customer  ️🗑️🗑️🗑️
async function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${BASE_URL}/api/customers/${id}`, {
            method: 'DELETE',
            headers: getAdminAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to delete customer');
        }

        showMessage('Customer deleted successfully', 'success');
        closeEditCustomerModal();
        await refreshCustomers();
        loadStats();
    } catch (error) {
        showMessage(error.message, 'error', 'edit-customer-message');
    }
}

//  Refresh customer list 🔄🔄🔄🔄

async function refreshCustomers() {
    try {
        const response = await fetch(`${BASE_URL}/api/customers`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to load customers');

        const customers = await response.json();
        const tableBody = document.querySelector('#customers-table-body');
        if (customers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center">No Customers found</td></tr>`;
            return;
        }
        tableBody.innerHTML = customers.map(customer => `
            <tr>
                <td>#${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.phoneNumber}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewOrders(${customer.id}, '${customer.name}')" class="view-orders-btn" title="View Orders">
                            Orders
                        </button>
                        <button onClick="viewTransactions(${customer.id}, '${customer.name}')" class="view-orders-btn" title="View Transactions">
                            Transactions
                        </button>
                        <button onclick="editCustomer(${customer.id})" class="edit-btn" title="Edit Customer">
                            ✏️ Edit
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

//  Cancel Edit ❌❌❌
function closeEditCustomerModal() {
    const modal = document.getElementById('edit-customer-modal');
    modal.classList.add('hidden');
    modal.classList.remove('modal--active');
    currentCustomerId = null;
    showMessage('', 'clear', 'edit-customer-message');
}

//  Reset form
function resetForm() {
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
}

//   Show status message
function showMessage(message, type = 'info', elementId = 'action-message') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = type;

    // Auto-clear success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.textContent = '';
            element.className = '';
        }, 3000);
    }
}


function closeSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.classList.remove('active');
}

function showDashboard() {
    showSection('stats-cards', 'Dashboard');
    loadStats(); // Refresh dashboard stats
}

function showTakeOrder() {
    showSection('take-order-section', 'Take Order');
    loadCustomersForOrder(); // Load customers in dropdown
}

//  populate the customer in Take order
async function loadCustomersForOrder() {
    try {
        const response = await fetch(`${BASE_URL}/api/customers`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });
        const customers = await response.json();
        const select = document.getElementById('customer-select', '');

        select.innerHTML = '<option value="">Select Customer</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (${customer.phoneNumber})`;
            select.appendChild(option);
        });
    } catch (error) {
        showMessage('Failed to load customers', 'error');
    }
}
//  Submit the order ☑️☑️
async function submitOrder() {
    const customerSelect = document.getElementById('customer-select');
    const clothCountInput = document.getElementById('cloth-count');
    const serviceType = document.querySelector('input[name="serviceType"]:checked').value;

    if (!customerSelect.value || !clothCountInput.value) {
        showMessage('Please select customer and enter cloth count', 'error');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/orders`, {
            method: 'POST',
            headers: getAdminAuthHeaders(),
            body: JSON.stringify({
                customerId: parseInt(customerSelect.value),
                totalClothes: parseInt(clothCountInput.value),
                serviceType: serviceType
            }),
            
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create order');
        }

        const order = await response.json();
        showOrderPopup(order);
        resetOrderForm();
        loadStats();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}
//  Receipt 🧾🧾🧾
function showOrderPopup(order) {
    const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    document.getElementById('popup-order-id').textContent = order.id;
    document.getElementById('popup-customer-name').textContent = order.customerName;
    document.getElementById('popup-customer-phone').textContent = order.customerPhone;
    document.getElementById('popup-cloth-count').textContent = order.totalClothes;
    document.getElementById('popup-total-amount').textContent = order.totalAmount;
    document.getElementById('popup-order-date').textContent = orderDate;
    document.getElementById('popup-status').textContent = order.status;
    document.getElementById('order-popup').classList.remove('hidden');
}

function closeOrderPopup() {
    document.getElementById('order-popup').classList.add('hidden');
}

function resetOrderForm() {
    document.getElementById('customer-select').value = '';
    document.getElementById('cloth-count').value = '';
}


function addNavigationButtons() {
    const nav = document.createElement('div');
    nav.innerHTML = `
            <div class="navigation">
                <button onclick="showCustomerManagement()">Manage Customers</button>
                <button onclick="showTakeOrder()">Take Order</button>
            </div>
        `;
    document.getElementById('admin-dashboard').prepend(nav);
}

function showCustomerManagement() {
    document.getElementById('order-section').classList.add('hidden');
    document.getElementById('customer-table').classList.remove('hidden');
}

function showAddCustomer() {
    showSection('add-customer-section', 'Add Customer');
}

function showManageCustomers() {
    showSection('manage-customers-section', 'Manage Customers');
    refreshCustomers();
}

function setActiveNavItem(activeItem) {
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // Add active class to the clicked item
    navItems.forEach(item => {
        if (item.textContent.trim() === activeItem) {
            item.classList.add('active');
        }
    });
}

function setActiveNavButton(buttonText) {
    // Remove active class from all nav items
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(button => button.classList.remove('active'));
    
    // Find and activate the button with matching text
    navButtons.forEach(button => {
        if (button.textContent.trim() === buttonText) {
            button.classList.add('active');
        }
    });
}

function hideAllSections() {
    const sections = [
        'stats-cards',
        'add-customer-section',
        'take-order-section',
        'manage-customers-section',
        'manage-order-section',
        'payments-section',
        'customer-payment-section',
        'insights-section'
    ];
    
    // Hide all sections
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('hidden');
            section.style.display = 'none';
        }
    });

    // Remove active state from all nav buttons
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(button => {
        button.classList.remove('active');
    });
}

async function showManageOrders() {
    showSection('manage-order-section', 'Show Orders');
    await populateCustomerFilter();
    await refreshOrders();
}



function gatherFilterValues() {
    return {
        status: document.getElementById('filter-status').value,
        customerId: document.getElementById('filter-customer').value,
        startDate: document.getElementById('filter-start-date').value,
        endDate: document.getElementById('filter-end-date').value
    };
}

async function applyFilters() {
    refreshOrders();
}
async function clearFilters() {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-customer').value = '';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    refreshOrders();
}
async function refreshOrders() {
    try {

        const filters = gatherFilterValues();

        // this is something new which converts objects into array of [key,value]
        const cleanFilters = Object.fromEntries(
            Object.entries(filters).filter(([_, v]) => v !== '' && v !== null)
        );



        const response = await fetch(`${BASE_URL}/api/orders/filter?${new URLSearchParams(cleanFilters)}`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to load orders');

        const orders = await response.json();
        const tbody = document.querySelector('#orders-table tbody');
        tbody.innerHTML = '';

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">No orders found</td></tr>`;
            return;
        }

        orders.forEach(order => {

            let statusCell;
            switch (order.status) {
                case 'PENDING':
                    statusCell = `
                        <button class="status-btn pending"
                                onclick="updateStatus(${order.id}, 'IN_PROGRESS')">
                            Start
                        </button>`;
                    break;
                case 'IN_PROGRESS':
                    statusCell = `
                        <button class="status-btn in-progress"
                                onclick="updateStatus(${order.id}, 'COMPLETED')">
                            Mark Complete
                        </button>`;
                    break;
                case 'COMPLETED':
                    statusCell = `<span class="status-badge completed">Done</span>`;
                    break;
                default:
                    statusCell = order.status;
            }

            // Format date
            const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            // Create table 
            tbody.innerHTML += `
                <tr>
                    <td>#${order.id}</td>
                    <td>${order.customerName}</td>
                    <td>${order.totalClothes} items (₹${order.totalAmount})</td>
                    <td>${orderDate}</td>
                    <td class="status-cell">
                        <span class="status-badge ${order.status.toLowerCase()}">
                            ${order.status.replace('_', ' ')}
                        </span>
                    </td>
                    <td class="action-cell">
                        ${statusCell}
                    </td>
                </tr>
            `;
        });

        loadStats();

    } catch (error) {
        console.error('Order refresh failed:', error);
        showMessage('Failed to load orders: ' + error.message, 'error');
    }
}

// Status update function
async function updateStatus(orderId, newStatus) {
    await updateOrderStatus(orderId, newStatus, false);
    // if (!confirm(`Change order status to ${newStatus}?`)) return;

    try {
        const response = await fetch(
            `${BASE_URL}/api/orders/${orderId}/status?newStatus=${newStatus}`,
            {
                method: 'PATCH',
                headers: getAdminAuthHeaders()
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Status update failed');
        }

        showMessage(`Status updated to ${newStatus}`, 'success');
        await refreshOrders();

    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function populateCustomerFilter() {
    try {
        const response = await fetch(`${BASE_URL}/api/customers`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });

        if (!response.ok) throw new Error("Customer not found");
        const customers = await response.json();

        const select = document.getElementById('filter-customer', '');

        select.innerHTML = '<option value="">Select customer</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (${customer.phoneNumber})`;
            select.appendChild(option);
        });
    } catch (error) {
        showMessage("failed to load customer", 'error');
    }
}

let currentCustomerInModal = {
    id: null,
    name: null
};

async function viewOrders(customerId, customerName) {
    try {
        console.log('Opening history for:', customerName);
        currentCustomerInModal = { id: customerId, name: customerName };
        document.getElementById('customer-order-history-name').textContent = customerName;

        const modal = document.getElementById('customer-order-history');
        modal.classList.remove('hidden');
        modal.classList.add('modal--active');

        const response = await fetch(`${BASE_URL}/api/orders/customer/${customerId}`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch");

        const orders = await response.json();
        renderCustomerOrders(orders)
    } catch (error) {
        showMessage(`Error loading history: ${error.message}`, 'error');
        closeHistory();
    }
}


function renderCustomerOrders(orders) {
    const tbody = document.querySelector('#customer-orders-table tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="5" style="text-align:center">No orders found</td>
        </tr>`;
        return;
    }



    orders.forEach(order => {
        // Generate status action button based on order status
        let actionButton = '';
        switch (order.status) {
            case 'PENDING':
                actionButton = `
                    <button class="status-btn pending small"
                            onclick="updateOrderStatus(${order.id}, 'IN_PROGRESS', true)">
                        Start
                    </button>`;
                break;
            case 'IN_PROGRESS':
                actionButton = `
                    <button class="status-btn in-progress small"
                            onclick="updateOrderStatus(${order.id}, 'COMPLETED', true)">
                        Mark Complete
                    </button>`;
                break;
            case 'COMPLETED':
                actionButton = `<span class="status-badge completed">Done</span>`;
                break;
            default:
                actionButton = '';
        }

        const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        tbody.innerHTML += `
            <tr class="history-order-row">
                <td>#${order.id}</td>
                <td>${orderDate}</td>
                <td>${order.totalClothes} items (₹${order.totalAmount})</td>
                <td>
                    <span class="status-badge ${order.status.toLowerCase()}">
                        ${order.status.replace('_', ' ')}
                    </span>
                </td>
                
                <td class="action-cell">${actionButton}</td>
            </tr>
        `;
    });
    loadStats();
}

async function updateOrderStatus(orderId, newStatus, isInModal = false) {
    if (!confirm(`Change order status to ${newStatus}?`)) return;

    try {
        const response = await fetch(
            `${BASE_URL}/api/orders/${orderId}/status?newStatus=${newStatus}`,
            {
                method: 'PATCH',
                headers: getAdminAuthHeaders()
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Status update failed');
        }

        showMessage(`Status updated to ${newStatus}`, 'success');


        if (isInModal && currentCustomerInModal.id) {
            // Refresh modal view
            await viewOrders(currentCustomerInModal.id, currentCustomerInModal.name);
        } else {
            // Refresh main orders table
            await refreshOrders();
        }

    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function closeHistory() {
    const modal = document.getElementById('customer-order-history');
    modal.classList.add('hidden');
    modal.classList.remove('modal--active');

}


// Helper function to show a section and set its nav button active
function showSection(sectionId, navText) {
    debugNav(sectionId, navText); // Add debugging
    hideAllSections();
    
    // Show the selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
        section.style.display = sectionId === 'stats-cards' ? 'grid' : 'block';
    }
    
    // Make sure main content is visible
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
    
    // Set active state on the sidebar button
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const itemContent = item.textContent.trim();
        const itemText = itemContent.replace(/[^\x20-\x7E]/g, '').trim(); // Remove emojis and keep only printable ASCII
        const buttonText = navText.trim();
        
        if (itemText === buttonText) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    closeSidebar();
}

function showPayments() {
    showSection('payments-section', 'Payments');
    refreshPayments();
}

// Called after successful login to set up initial dashboard state
function initializeDashboard() {
    const sections = {
        'stats-cards': 'Dashboard',
        'add-customer-section': 'Add Customer',
        'take-order-section': 'Take Order',
        'manage-customers-section': 'Manage Customers',
        'manage-order-section': 'Show Orders',
        'payments-section': 'Payments',
        'insights-section': 'Insights',
        'customer-payment-section': 'Customer Payments'
    };

    // Show dashboard initially
    showSection('stats-cards', sections['stats-cards']);
    loadStats();
    populateCustomerFilter();
}

async function refreshPayments() {
    try {
        console.log("Fetching payment data...");
        const response = await fetch(`${BASE_URL}/api/payments`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });
        console.log("Response status:", response.status);
        if (!response.ok) throw new Error("Failed to fetch the payments");
        const data = await response.json();
        console.log("Received data:", data);

        renderPaymentSummary(data);
    } catch (error) {
        showMessage("Something went wrong", "error");
    }
}


function renderPaymentSummary(data) {
    const tbody = document.querySelector('#payments-table tbody');
    tbody.innerHTML = '';

    console.log("Rendering data:", data);

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    ${data ? "No pending payments found" : "Failed to load data"}
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(account => {
        tbody.innerHTML += `
            <tr>
                <td>${account.customerId}</td>
                <td>${account.customerName}</td>
                <td>₹${account.balance.toFixed(2)}</td>
                <td>
                    <button onclick="viewOrders(${account.customerId},'${account.customerName}')">
                        View Orders
                    </button>
                </td>
                <td>
                    <button onclick="showPaymentModal(
                        ${account.customerId}, 
                        '${account.customerName}', 
                        ${account.balance}
                    )">
                        Pay
                    </button>
                </td>
            </tr>
        `;
    });
}






// Show payment modal
function showPaymentModal(customerId, customerName, balance) {
    whoIsPaying = "admin";
    paymentCustomerId = customerId;
    paymentCustomerName = customerName;
    paymentBalance = balance;


    // Update modal UI
    document.getElementById('payment-customer-name').textContent = customerName;
    document.getElementById('payment-total-due').textContent = `₹${balance.toFixed(2)}`;
    document.getElementById('payment-amount').value = '';

    // Show modal
    const modal = document.getElementById('payment-modal');
    modal.classList.remove('hidden');
    modal.classList.add('modal--active');
}

async function showCustomerPaymentModal() {
    whoIsPaying = "customer";
    paymentCustomerId = localStorage.getItem("customerId");
    paymentCustomerName = localStorage.getItem("customerName");

    // Fetch the current balance
    try {
        const response = await fetch(`${BASE_URL}/api/payments/${paymentCustomerId}/balance`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch balance");
        
        const balance = parseFloat(await response.text());
        paymentBalance = balance;

        document.getElementById("payment-customer-name").textContent = paymentCustomerName;
        document.getElementById("payment-total-due").textContent = `₹${balance.toFixed(2)}`;
        document.getElementById("payment-amount").value = "";
        
        // Show modal with proper classes for animation and visibility
        const modal = document.getElementById("payment-modal");
        modal.classList.remove("hidden");
        modal.classList.add("modal--active");
    } catch (error) {
        console.error("Error fetching balance:", error);
        showMessage("Failed to load payment details", "error");
    }
}

// Close modal
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.classList.add('hidden');
    modal.classList.remove('modal--active');
}



// Process payment
const paymentMessage = document.getElementById('payment-message');
async function processPayment() {
    const amountInput = document.getElementById('payment-amount');

    const amount = parseFloat(amountInput.value);
    const balance = paymentBalance;
    const customerId = paymentCustomerId;
    paymentMessage.textContent = '0';
    paymentMessage.className = 'payment-message';

    // Validation
    if (isNaN(amount) || amount <= 0) {
        showPaymentMessage('Please enter a valid positive amount', 'error');
        amountInput.focus();
        return;
    }

    if (amount > balance) {
        showPaymentMessage(`Amount cannot exceed ₹${balance.toFixed(2)}`, 'error');
        amountInput.focus();
        return;
    }

    try {

        // Call admin API
        if (whoIsPaying === "admin") {
            console.log("enter the process");
            const response = await fetch(`${BASE_URL}/api/payments`, {
                method: "POST",
                headers: getAdminAuthHeaders(),
                body: JSON.stringify({
                    customerId: paymentCustomerId,
                    amount: amount
                }),
                
            });

            if (!response.ok) throw new Error("Admin payment failed");
            console.log("enter the invoice"); //this line get printed on console after that error is still same

            showPaymentMessage(`Payment of ₹${amount} recorded!`, 'success');
            let savedPayment = await response.json();
            console.log("🧾 Showing invoice modal for:", savedPayment);
            showInvoiceModal(savedPayment);
            refreshPayments();
            loadStats();

            setTimeout(() => {
                closePaymentModal();
            }, 2000);


        } else if (whoIsPaying === "customer") {
            const amount = parseFloat(document.getElementById("payment-amount").value);

            if (isNaN(amount) || amount <= 0) {
                showPaymentMessage("Please enter a valid amount", "error");
                return;
            }

            if (amount > balance) {
                showPaymentMessage(`Amount cannot exceed ₹${balance.toFixed(2)}`, 'error');
                amountInput.focus();
                return;
            }

            launchUpiIntent(amount);

            setTimeout(() => {
                if (confirm("Did you complete the UPI payment?")) {
                    sendPendingPayment(amount);
                } else {
                    showPaymentMessage("Payment not recorded. Please try again.", "error");
                }
            }, 5000);
            

        } else {
            throw new Error("Unknown payment context");
        }


    } catch (error) {
        showPaymentMessage(`Payment failed: ${error.message}`, 'error');
        console.log(error.message);
    }
}

function launchUpiIntent(amount) {
    
    const txnRef = "TXN" + Date.now(); 

    const upiLink = `upi://pay` +
        `?pa=9619723090@okbizaxis` +  
        `&pn=Sanjay Power Laundry` +                        
        `&tr=${txnRef}` +                 
        `&txnId=${txnRef}` +               
        `&am=${amount}` +                 
        `&cu=INR`;                        

    console.log("Generated UPI Link:", upiLink);
    window.location.href = upiLink; 
}



async function sendPendingPayment(amount) {
    try {
        const response = await fetch(`${BASE_URL}/api/payments/pending`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ amount: amount })
        });

        if (!response.ok) throw new Error("Customer payment failed");

        const savedPayment = await response.json();

        showPaymentMessage(`Payment of ₹${amount.toFixed(2)} recorded! Waiting for admin verification.`, "success");

        console.log("🧾 Saved pending payment:", savedPayment);

        fetchCustomerBalance(localStorage.getItem("customerId"));
        fetchCustomerOrders(localStorage.getItem("customerId"));
        fetchCustomerPayments(localStorage.getItem("customerId"));

        closePaymentModal();
    } catch (err) {
        console.error(err);
        showPaymentMessage("Failed to record payment. Please try again.", "error");
    }
}

console.log("About to show invoice...");
console.log("Invoice modal exists?", document.getElementById("invoice-modal"));
console.log("Invoice content exists?", document.getElementById("invoice-content"));

function showInvoiceModal(payment) {
    console.log("🧾 Showing invoice modal for:", payment);

    const invoiceDiv = document.getElementById("invoice-content");
    const modal = document.getElementById("invoice-modal");
    const downloadLink = document.getElementById("download-receipt");
    if (!invoiceDiv || !modal || !downloadLink) {
        console.error("❌ invoice-content, invoice-modal or download-receipt not in DOM");
        return;
    }
    const date = new Date(payment.timestamp).toLocaleString('en-IN', {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true
    });

    const transactionId = payment.transactionId;
    const customerName = payment.customerName;
    const amount = payment.amount;

    invoiceDiv.innerHTML = `
        <p><strong>Receipt No:</strong> #${transactionId}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Amount Paid:</strong> ₹${amount}</p>
        
    `;
    console.log("printed the innerhtml");
    if (downloadLink) {
        downloadLink.href = `${BASE_URL}/api/receipts/${payment.transactionId}/download`;
        downloadLink.setAttribute("download", `receipt_${payment.transactionId}.pdf`);
    }

    console.log("Download link");
    modal.classList.remove("hidden");
    modal.classList.add("modal--active");
}
function closeInvoiceModal() {
    const modal = document.getElementById("invoice-modal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("modal--active");
    }
}



function showPaymentMessage(message, type) {
    paymentMessage.textContent = message;
    paymentMessage.className = `payment-message ${type}`;

    // Auto-hide after 4 seconds
    setTimeout(() => {
        paymentMessage.textContent = '';
        paymentMessage.className = 'payment-message';
    }, 4000);
}

async function viewTransactions(customerId, customerName) {
    try {
        console.log("Opening transaction history for ", customerName, customerId);

        document.getElementById('transaction-customer-name').textContent = customerName;
        const modal = document.getElementById('payment-transaction-history');
        modal.classList.remove('hidden');
        modal.classList.add('modal--active');
        const response = await fetch(`${BASE_URL}/api/payments/${customerId}/history`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });

        const transactionData = await response.json();
        showTransactionHistory(transactionData);
    } catch (error) {
        showMessage("Something went wrong", "error");
    }
}

async function showTransactionHistory(transactionData) {


    const tbody = document.querySelector('#transaction-table tbody');
    tbody.innerHTML = '';

    if (transactionData === 0) {
        tbody.innerHTML = `
        <tr>
            <td colspan="4" class="no-data">No pending payments found</td>
        </tr>
        `;
        return;
    }

    transactionData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    tbody.innerHTML = transactionData.map(tData => {

        const timeDateStamp = formatDateTime(tData.timestamp);

        return `
        <tr>
            <td>${tData.transactionId}</td>
            <td>${tData.amount.toFixed(2)}</td>
            <td>${timeDateStamp}</td>
            <td>
               <button 
                class="view-btn" 
                onclick='showInvoiceModal({
                    transactionId: ${tData.transactionId}, 
                    customerName: "${tData.customerName}", 
                    amount: ${tData.amount}, 
                    timestamp: "${tData.timestamp}"
                })'>
                View
                </button>

            </td>
        </tr>
    `;
    }).join('');


}

function closeTransactionModal() {
    const modal = document.getElementById('payment-transaction-history');
    modal.classList.add('hidden');
    modal.classList.remove('modal--active');
}


function getAuthHeaders() {
    const token = localStorage.getItem("customerToken");
    return {
        "Content-type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


async function registerCustomer() {

    const phone = document.getElementById('customer-phone-register').value.trim();
    const password = document.getElementById('customer-password-register').value.trim();

    if (!phone || !password) {
        showCustomerAuthMessage("please fill both fields", "error");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/customer-auth/register`, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone, password: password }),
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Contact your admin to registration");
        }

        const message = await response.text();
        showCustomerAuthMessage(message, "success");

    } catch (error) {
        showCustomerAuthMessage(error.message, "failed registration");
    }

}

async function loginCustomer() {
    const phone = document.getElementById('customer-phone-login').value.trim();
    const password = document.getElementById('customer-password-login').value.trim();


    if (!phone || !password) {
        showCustomerAuthMessage("Please enter phone and password", "error");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/customer-auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: phone, password: password }),

        });

        if (!response.ok) {
            throw new Error("Login failed");
        }

        const result = await response.json();
        showCustomerAuthMessage("Login successful!", "success");
        localStorage.setItem("customerToken", result.token)
        localStorage.setItem("customerId", result.customerId);
        localStorage.setItem("customerName", result.customerName);
        localStorage.setItem("customerPhone", phone); // Store the phone number used for login


        document.getElementById("auth-section").classList.add("hidden");
        document.getElementById("customer-dashboard").classList.remove("hidden");

        loadCustomerDashboard(result.customerId)



    } catch (err) {
        showCustomerAuthMessage(err.message, "error");
    }

}

function loadCustomerDashboard(customerId) {

    const name = localStorage.getItem("customerName");
    document.getElementById("customer-name-display").textContent = name;

    fetchCustomerBalance(customerId);
    fetchCustomerOrders(customerId);
    fetchCustomerPayments(customerId);
}



async function fetchCustomerBalance(customerId) {
    try {
        const response = await fetch(`${BASE_URL}/api/payments/${customerId}/balance`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch balance");

        const balance = parseFloat(await response.text());
        
        const display = document.getElementById("customer-balance");
        display.textContent = balance.toFixed(2);

    } catch (err) {
        console.error("Error fetching balance:", err.message);
        document.getElementById("customer-balance").textContent = "Error";
    }
}


async function fetchCustomerOrders(customerId) {
    try {
        const response = await fetch(`${BASE_URL}/api/orders/customer/${customerId}`, {
            method: "GET",
            headers: getAuthHeaders()

        });
        if (!response.ok) throw new Error("Failed to fetch orders");

        const orders = await response.json();
        const tbody = document.getElementById("customer-order-body");
        tbody.innerHTML = "";

        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5">No orders found</td></tr>`;
            return;
        }


        for (const order of orders) {
            const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${orderDate}</td>
                <td>${order.serviceType}</td>
                <td>${order.totalClothes}</td>
                <td>₹${order.totalAmount}</td>
                <td>${order.status}</td>
            `;
            tbody.appendChild(row);
        }
    } catch (err) {
        document.getElementById("customer-order-body").innerHTML = `<tr><td colspan="5">${err.message}</td></tr>`;
    }
}

async function fetchCustomerPayments(customerId) {
    try {
        const response = await fetch(`${BASE_URL}/api/payments/${customerId}/history`, {
            method: "GET",
            headers: getAuthHeaders()

        });
        if (!response.ok) throw new Error("Failed to fetch payments");

        const payments = await response.json();
        const tbody = document.getElementById("customer-payment-body");
        tbody.innerHTML = "";

        if (payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3">No payments found</td></tr>`;
            return;
        }

        payments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));


        for (const txn of payments) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${txn.transactionId}</td>
                <td>₹${txn.amount}</td>
                <td>${formatDateTime(txn.timestamp)}</td>
                <td>
                <button 
                class="view-btn" 
                onclick='showInvoiceModal({
                    transactionId: ${txn.transactionId}, 
                    customerName: "${txn.customerName}", 
                    amount: ${txn.amount}, 
                    timestamp: "${txn.timestamp}"
                })'>
                View
                </button>
                </td>
            `;
            tbody.appendChild(row);
        }
    } catch (err) {
        document.getElementById("customer-payment-body").innerHTML = `<tr><td colspan="3">${err.message}</td></tr>`;
    }
}




function showCustomerAuthMessage(msg, type) {
    const el = document.getElementById("customer-auth-message");
    el.textContent = msg;
    el.className = type;
}

function logoutCustomer() {
    try {
        // Clear all stored customer data
        localStorage.clear();

        // Hide all sections that might be open
        const sectionsToHide = [
            "customer-dashboard",
            "customer-profile-sidebar",
            "sidebar-overlay",
            "payment-modal",
            "payment-transaction-history",
            "customer-order-history"
        ];

        sectionsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('hidden');
                // Also remove active class if it exists (for sidebar)
                element.classList.remove('active');
            }
        });

        // Reset all customer related data
        document.getElementById("customer-balance").textContent = "0";
        document.getElementById("customer-order-body").innerHTML = "";
        document.getElementById("customer-payment-body").innerHTML = "";
        
        // Show auth section properly
        const authSection = document.getElementById("auth-section");
        authSection.classList.remove("hidden");
        authSection.style.display = "flex";
        
        // Switch to customer tab and show login form
        showTab("customer");
        toggleAuthMode('login');

        // Clear any form fields
        document.getElementById("customer-phone-login").value = "";
        document.getElementById("customer-password-login").value = "";
        document.getElementById("customer-auth-message").textContent = "";
        
    } catch (error) {
        console.error('Logout error:', error);
        // Still attempt to show login screen
        document.getElementById("auth-section").style.display = "flex";
    }
}



function showCustomerProfile() {
    const sidebar = document.getElementById("customer-profile-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    
    // First make sidebar visible but still off-screen
    sidebar.classList.remove("hidden");
    overlay.classList.remove("hidden");
    
    // Force a reflow to ensure the visibility change is applied
    sidebar.offsetHeight;
    
    // Then trigger the slide-in animation
    requestAnimationFrame(() => {
        sidebar.classList.add("active");
    });
    
    // Load customer information
    const customerName = localStorage.getItem("customerName");
    const customerPhone = localStorage.getItem("customerPhone");
    
    // Display customer information with fallbacks
    const nameElement = document.getElementById("profile-customer-name");
    const phoneElement = document.getElementById("profile-customer-phone");
    
    if (nameElement) {
        nameElement.textContent = customerName || "Not available";
    }
    if (phoneElement) {
        phoneElement.textContent = customerPhone || "Not available";
    }
    
    // Hide password change form initially
    const passwordForm = document.getElementById("password-change-form");
    const changePasswordBtn = document.getElementById("change-password-btn");
    
    if (passwordForm) passwordForm.classList.add("hidden");
    if (changePasswordBtn) changePasswordBtn.classList.remove("hidden");
    
    // Clear any previous messages and form values
    const messageElement = document.getElementById("customer-profile-message");
    if (messageElement) {
        messageElement.textContent = "";
    }
    
    const oldPasswordField = document.getElementById("old_password");
    const newPasswordField = document.getElementById("new_password");
    if (oldPasswordField) oldPasswordField.value = "";
    if (newPasswordField) newPasswordField.value = "";
}

function closeCustomerProfileSidebar() {
    const sidebar = document.getElementById("customer-profile-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    
    if (sidebar) {
        // Start the slide-out animation
        sidebar.classList.remove("active");
        
        // Hide overlay immediately
        if (overlay) overlay.classList.add("hidden");
        
        // Wait for animation to complete before fully hiding
        setTimeout(() => {
            sidebar.classList.add("hidden");
        }, 300); // Match the CSS transition duration
    }
    
    // Reset sidebar state
    const passwordForm = document.getElementById("password-change-form");
    const changePasswordBtn = document.getElementById("change-password-btn");
    
    if (passwordForm) passwordForm.classList.add("hidden");
    if (changePasswordBtn) changePasswordBtn.classList.remove("hidden");
    
    // Clear form values
    const oldPasswordField = document.getElementById("old_password");
    const newPasswordField = document.getElementById("new_password");
    if (oldPasswordField) oldPasswordField.value = "";
    if (newPasswordField) newPasswordField.value = "";
    
    // Clear any messages
    const messageElement = document.getElementById("customer-profile-message");
    if (messageElement) {
        messageElement.textContent = "";
    }
}

function showPasswordChangeForm() {
    const passwordForm = document.getElementById("password-change-form");
    const changePasswordBtn = document.getElementById("change-password-btn");
    
    if (passwordForm) passwordForm.classList.remove("hidden");
    if (changePasswordBtn) changePasswordBtn.classList.add("hidden");
}

function cancelPasswordChange() {
    const passwordForm = document.getElementById("password-change-form");
    const changePasswordBtn = document.getElementById("change-password-btn");
    
    if (passwordForm) passwordForm.classList.add("hidden");
    if (changePasswordBtn) changePasswordBtn.classList.remove("hidden");
    
    // Clear form values
    const oldPasswordField = document.getElementById("old_password");
    const newPasswordField = document.getElementById("new_password");
    if (oldPasswordField) oldPasswordField.value = "";
    if (newPasswordField) newPasswordField.value = "";
    
    // Clear any messages
    const messageElement = document.getElementById("customer-profile-message");
    if (messageElement) {
        messageElement.textContent = "";
    }
}

async function submitPasswordChange() {
    const old_password = document.getElementById('old_password').value.trim();
    const new_password = document.getElementById("new_password").value.trim();

    if (!old_password || !new_password) {
        showProfileMessage("Please fill both fields", "error");
        return;
    }

    if (new_password.length < 6) {
        showProfileMessage("New password must be at least 6 characters long", "error");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/customer-auth/me/changePassword`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ oldPassword: old_password, newPassword: new_password })
        });

        const msg = await response.text();
        showProfileMessage(msg, response.ok ? "success" : "error");

        if (response.ok) {
            // Clear form and hide password change section
            const oldPasswordField = document.getElementById("old_password");
            const newPasswordField = document.getElementById("new_password");
            const passwordForm = document.getElementById("password-change-form");
            const changePasswordBtn = document.getElementById("change-password-btn");
            
            if (oldPasswordField) oldPasswordField.value = "";
            if (newPasswordField) newPasswordField.value = "";
            if (passwordForm) passwordForm.classList.add("hidden");
            if (changePasswordBtn) changePasswordBtn.classList.remove("hidden");
            
            setTimeout(() => {
                const messageElement = document.getElementById("customer-profile-message");
                if (messageElement) {
                    messageElement.textContent = "";
                }
            }, 3000);
        }
    } catch (error) {
        showProfileMessage("Something went wrong", "error");
    }
}

function showProfileMessage(message, type = "error") {
    const messageBox = document.getElementById("customer-profile-message");
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.style.color = type === "success" ? "green" : "red";
}

function showInsights() {
    showSection('insights-section', 'Insights');
    document.getElementById("insights-section").classList.remove("hidden");
    loadInsights();
}


async function loadInsights() {
    try {
        const response = await fetch(`${BASE_URL}/api/insights`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        })

        if (!response.ok) {
            console.error("failed to load insights");
            return;
        }

        const data = await response.json();
        console.log("insights:", data);


        document.getElementById("total-customers").textContent = data.totalCustomers;
        document.getElementById("total-revenue").textContent = `₹${data.totalRevenue.toFixed(2)}`;

        const topBody = document.getElementById("top-customers-body");
        topBody.innerHTML = "";

        if (!data.topCustomers || data.topCustomers.length === 0) {
            topBody.innerHTML = `<tr><td colspan="2">No top customers found</td></tr>`;
        }
        
        data.topCustomers.forEach(c => {
            topBody.innerHTML += `
            <tr>
            <td>${c.name}</td>
            <td>${c.totalPaid.toFixed(2)}</td>
            </tr>`;
        });

        const dueBody = document.getElementById("due-customers-body");
        
        dueBody.innerHTML = "";
        if(data.customersWithDue.length===0){
            dueBody.innerHTML = `<tr><td colspan="2">No customers with due payments found</td></tr>`;
            return;
        }
        data.customersWithDue.forEach(c => {
            dueBody.innerHTML += `
                <tr>
                    <td>${c.name}</td>
                    <td>₹${c.balance.toFixed(2)}</td>
                </tr>
            `;
        });


    } catch (error) {
        console.error("error fetching insights", error);
    }
}

async function showCustomerPayments() {
    showSection('customer-payment-section', 'Customer Payments');
    customerPayments();
}

async function customerPayments() {
    try {
        const response = await fetch(`${BASE_URL}/api/payments/pending`, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        const data = await response.json();
        renderCustomerPayments(data);
    } catch (error) {
        console.error("falied to load paymetns", error);
    }
}
function renderCustomerPayments(payments) {
    const tbody = document.querySelector('#customer-payments-table tbody');
    tbody.innerHTML = '';

    if (!payments.length) {
        tbody.innerHTML = `<tr><td colspan="6">No pending payments</td></tr>`;
        return;
    }

    payments.forEach(payment => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${payment.transactionId}</td>
            <td>${payment.customerName}</td>
            <td>₹${payment.amount.toFixed(2)}</td>
            <td>${formatDateTime(payment.timestamp)}</td>
            <td>${payment.status}</td>
            <td>
                <button onclick="verifyPendingPayment(${payment.transactionId}, this)">Verify</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

async function verifyPendingPayment(pendingId, button) {
    try {
        button.disabled = true;
        button.textContent = "Verifying...";

        const response = await fetch(`${BASE_URL}/api/payments/${pendingId}/verify`, {
            method: "PATCH",
            headers: getAdminAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to verify");

        const updated = await response.json();

        const row = button.closest("tr");
        row.innerHTML = `
            <td>${updated.transactionId}</td>
            <td>${updated.customerName}</td>
            <td>₹${updated.amount.toFixed(2)}</td>
            <td>${formatDateTime(updated.timestamp)}</td>
            <td>${updated.status}</td>
            <td><a class="download-btn" href="${BASE_URL}/api/receipts/${updated.transactionId}/download" target="_blank">Download 📄</a></td>
        `;

        showMessage("Verified and receipt generated ✅", "success");
    } catch (error) {
        showMessage("Verification failed ❌", "error");
        button.disabled = false;
        button.textContent = "Verify";
    }
}

