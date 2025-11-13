import { BASE_URL } from './config.js';
import { getAdminAuthHeaders } from './auth.js';
import { showMessage, highlightCustomerSelect, highlightClothCountInput } from './ui.js';
import { loadStats } from './adminDashboard.js';
import { showConfirmDialog } from './dialogs.js';


let currentCustomerInModal = { id: null, name: null };


export function initOrders() {
    // --- Order Forms & Popups ---
    document.getElementById('submit-order-button')?.addEventListener('click', submitOrder);
    document.getElementById('close-popup-button')?.addEventListener('click', closeOrderPopup);
    document.getElementById('reset-order-button')?.addEventListener('click', resetOrderForm);
    document.getElementById('span-close-order-history')?.addEventListener('click', closeHistoryModal);
    document.getElementById('order-popup')?.addEventListener('click', (event) => {
        if (event.target.id === 'order-popup') {
            closeOrderPopup();
        }
    });

    // --- Manage Orders Filters ---
    document.getElementById('apply-filters-button')?.addEventListener('click', refreshOrders);
    document.getElementById('clear-filters-button')?.addEventListener('click', () => {
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-customer').value = '';
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        refreshOrders();
    });

    // --- Customer Order History Modal ---
    document.getElementById('close-history-modal')?.addEventListener('click', closeHistoryModal);

    // --- Listener for Main Orders Table ---
    const ordersTableBody = document.getElementById('orders-table-body');
    ordersTableBody?.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        if (action === 'update-status') {
            const orderId = button.dataset.id;
            const newStatus = button.dataset.status;
            updateOrderStatus(orderId, newStatus, false);
        }
    });

    // --- Listener for Customer Order History Modal Table ---
    const customerOrdersTableBody = document.getElementById('customer-orders-table-body');
    customerOrdersTableBody?.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        if (action === 'update-status-modal') {
            const orderId = button.dataset.id;
            const newStatus = button.dataset.status;
            updateOrderStatus(orderId, newStatus, true);
        }
    });
}

export async function loadCustomersForOrders() {
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

export async function submitOrder() {
    const customerSelect = document.getElementById('customer-select');
    const clothCountInput = document.getElementById('cloth-count');
    const serviceType = document.querySelector('input[name="serviceType"]:checked').value;

    // Validate customer selection
    if (!customerSelect.value) {
        showMessage('Please select a customer', 'error', 'order-message');
        highlightCustomerSelect();
        return;
    }

    // Validate cloth count
    if (!clothCountInput.value) {
        showMessage('Please enter cloth count', 'error', 'order-message');
        highlightClothCountInput();
        return;
    }

    // Validate cloth count is a positive number
    const clothCount = parseInt(clothCountInput.value);
    if (isNaN(clothCount) || clothCount <= 0) {
        showMessage('Cloth count must be a positive number', 'error', 'order-message');
        highlightClothCountInput();
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
        showMessage(error.message, 'error', 'order-message');
    }
}
export function showOrderPopup(order) {
    const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    document.getElementById('popup-order-id').textContent = order.id;
    document.getElementById('popup-customer-name').textContent = order.customerName;
    document.getElementById('popup-customer-phone').textContent = order.customerPhone;
    document.getElementById('popup-cloth-count').textContent = order.totalClothes;
    document.getElementById('popup-total-amount').textContent = `₹ ${order.totalAmount}`;
    document.getElementById('popup-order-date').textContent = orderDate;
    document.getElementById('popup-status').textContent = order.status;
    document.getElementById('order-popup').classList.remove('hidden');


}
document.getElementById("order-popup").addEventListener("click", function (e) {
    if (e.target === this) {
        closeOrderPopup();
    }
});

export function closeOrderPopup() {
    document.getElementById('order-popup').classList.add('hidden');
}

export function resetOrderForm() {
    document.getElementById('customer-select').value = '';
    document.getElementById('cloth-count').value = '';

    showMessage('', 'clear', 'order-message');
}

export function gatherFilterValues() {
    return {
        status: document.getElementById('filter-status').value,
        customerId: document.getElementById('filter-customer').value,
        startDate: document.getElementById('filter-start-date').value,
        endDate: document.getElementById('filter-end-date').value
    };
}


export async function applyFilters() {
    refreshOrders();
}
export async function clearFilters() {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-customer').value = '';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    refreshOrders();
}
export async function refreshOrders() {
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
        const tbody = document.getElementById('orders-table-body');
        tbody.innerHTML = '';

        if (orders.length === 0) {
            tbody.innerHTML = `<tr class="no-data-row"><td colspan="6" style="text-align:center">No orders found</td></tr>`;
            return;
        }

        orders.forEach(order => {

            let statusCell = '';
            switch (order.status) {
                case 'PENDING':
                    statusCell = `<button class="status-btn pending" data-action="update-status" data-id="${order.id}" data-status="IN_PROGRESS">Start</button>`;
                    break;
                case 'IN_PROGRESS':
                    statusCell = `<button class="status-btn in-progress" data-action="update-status" data-id="${order.id}" data-status="COMPLETED">Mark Complete</button>`;
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
                    <td><span class="customer-name-cell" title="${order.customerName}">${order.customerName}</span></td>
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

export async function updateOrderStatus(orderId, newStatus, isInModal = false) {
    console.log(`🔄 Updating order ${orderId} to status ${newStatus}, isInModal: ${isInModal}`);

    const confirmed = await showConfirmDialog(
        `Are you sure you want to change this order status to ${newStatus}?`,
        {
            title: 'Confirm Status Change',
            confirmText: 'Change Status',
            cancelText: 'Cancel',
            confirmClass: 'primary-button'
        }
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`${BASE_URL}/api/orders/${orderId}/status?newStatus=${newStatus}`, {
            method: 'PATCH',
            headers: getAdminAuthHeaders()
        });
        if (!response.ok) throw new Error('Status update failed');

        showMessage(`Status updated to ${newStatus}`, 'success');

        if (isInModal) {
            await viewOrders(currentCustomerInModal.id, currentCustomerInModal.name); // Refresh modal
        } else {
            await refreshOrders(); // Refresh main table
        }
        loadStats();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

export async function viewOrders(customerId, customerName) {
    try {
        console.log(`Viewing orders for customer ${customerId} - ${customerName}`);
        currentCustomerInModal = { id: customerId, name: customerName };
        document.getElementById('customer-order-history-name').textContent = customerName;


        const response = await fetch(`${BASE_URL}/api/orders/customer/${customerId}`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch customer orders");

        const orders = await response.json();
        renderCustomerOrders(orders);

        const modal = document.getElementById('customer-order-history');
        modal.classList.remove('hidden');
        modal.classList.add('modal--active');
    } catch (error) {
        showMessage(`Error loading history: ${error.message}`, 'error');
    }
}

function renderCustomerOrders(orders) {
    const tbody = document.getElementById('customer-orders-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `<tr class="no-data-row"><td colspan="5" style="text-align:center">No orders found for this customer.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        let actionButton = '';
        switch (order.status) {
            case 'PENDING':
                actionButton = `<button class="status-btn pending small" data-action="update-status-modal" data-id="${order.id}" data-status="IN_PROGRESS">Start</button>`;
                break;
            case 'IN_PROGRESS':
                actionButton = `<button class="status-btn in-progress small" data-action="update-status-modal" data-id="${order.id}" data-status="COMPLETED">Mark Complete</button>`;
                break;
            case 'COMPLETED':
                actionButton = `<span class="status-badge completed">Done</span>`;
                break;
        }
        const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        tbody.innerHTML += `
            <tr>
                <td>#${order.id}</td>
                <td>${orderDate}</td>
                <td>${order.totalClothes} items (₹${order.totalAmount})</td>
                <td><span class="status-badge ${order.status.toLowerCase()}">${order.status.replace('_', ' ')}</span></td>
                <td class="action-cell">${actionButton}</td>
            </tr>
        `;
    });
}

export function closeHistoryModal() {
    document.getElementById('customer-order-history')?.classList.add('hidden');
}

export async function populateCustomerFilter() {
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