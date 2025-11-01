import { BASE_URL } from './config.js';
import { showMessage, highlightDuplicatePhone } from './ui.js';
import { getAdminAuthHeaders } from './auth.js';
import { viewOrders } from './orders.js';
import { viewTransactions } from './payments.js';
import { showConfirmDialog } from './dialogs.js';


let currentCustomerId = null;

export function initCustomers() {
    console.log('Initializing customers module...');

    const tableBody = document.getElementById('customers-table-body');
    
    // Handle row clicks to show action options
    tableBody?.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (button) {
            // Handle button clicks
            const { action, id, name } = button.dataset;
            switch (action) {
                case 'edit':
                    editCustomer(id);
                    break;
                case 'view-orders':
                    viewOrders(id, name);
                    break;
                case 'view-transactions':
                    viewTransactions(id, name);
                    break;
                case 'close-actions':
                    hideCustomerActions();
                    break;
            }
            return;
        }

        // Handle row clicks to show actions
        const row = event.target.closest('tr');
        if (row && !row.classList.contains('no-data-row')) {
            const customerId = row.dataset.customerId;
            const customerName = row.dataset.customerName;
            if (customerId && customerName) {
                showCustomerActions(row, customerId, customerName);
            }
        }
    });

    // Close actions when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('#customers-table')) {
            hideCustomerActions();
        }
    });

    // Listeners for the "Add Customer" form
    document.getElementById('add-customer-button')?.addEventListener('click', addCustomer);

    // Remove existing event listeners to prevent duplicates
    const updateBtn = document.getElementById('update-customer-btn');
    const spanCloseBtn = document.getElementById('span-close-edit-modal');
    const cancelBtn = document.getElementById('cancel-edit-modal-btn');
    const deleteBtn = document.getElementById('delete-customer-btn');

    // Remove existing listeners by cloning and replacing elements
    if (updateBtn) {
        const newUpdateBtn = updateBtn.cloneNode(true);
        updateBtn.parentNode.replaceChild(newUpdateBtn, updateBtn);
        newUpdateBtn.addEventListener('click', updateCustomer);
    }

    if (spanCloseBtn) {
        const newSpanCloseBtn = spanCloseBtn.cloneNode(true);
        spanCloseBtn.parentNode.replaceChild(newSpanCloseBtn, spanCloseBtn);
        newSpanCloseBtn.addEventListener('click', closeEditCustomerModal);
    }

    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', closeEditCustomerModal);
    }

    if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        newDeleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = getCurrentCustomerId();
            console.log('Delete button clicked for customer ID:', id);
            if (id) {
                deleteCustomer(id);
            }
        });
    }

    console.log('Customers module initialized');
}
export function getCurrentCustomerId() {
    return currentCustomerId;
}

export async function refreshCustomers() {
    try {
        const response = await fetch(`${BASE_URL}/api/customers`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to load customers');

        const customers = await response.json();
        const tableBody = document.querySelector('#customers-table-body');
        
        // Hide any existing actions first
        hideCustomerActions();
        
        if (customers.length === 0) {
            tableBody.innerHTML = `<tr class="no-data-row"><td colspan="3" style="text-align:center">No Customers found</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = customers.map(customer => `
            <tr class="customer-row" data-customer-id="${customer.id}" data-customer-name="${customer.name}" style="cursor: pointer;">
                <td>#${customer.id}</td>
                <td>${customer.name}</td>
                <td>${customer.phoneNumber}</td>
            </tr>
        `).join('');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Show action buttons when customer row is clicked
function showCustomerActions(row, customerId, customerName) {
    // Hide any existing actions first
    hideCustomerActions();
    
    // Get phone number from the row
    const phoneNumber = row.cells[2].textContent;
    
    // Add active state to clicked row
    row.classList.add('customer-row-active');
    
    // Create actions row
    const actionsRow = document.createElement('tr');
    actionsRow.classList.add('customer-actions-row');
    actionsRow.innerHTML = `
        <td colspan="3" class="customer-actions-cell" data-phone="📱 ${phoneNumber}">
            <div class="customer-action-buttons">
                <button class="view-orders-btn" data-action="view-orders" data-id="${customerId}" data-name="${customerName}">
                    📋 Orders
                </button>
                <button class="view-invoice-btn" data-action="view-transactions" data-id="${customerId}" data-name="${customerName}">
                    💳 Transactions
                </button>
                <button class="edit-btn" data-action="edit" data-id="${customerId}">
                    ✏️ Edit
                </button>
                <button class="close-actions-btn" data-action="close-actions">
                    ✕ Close
                </button>
            </div>
        </td>
    `;
    
    // Insert actions row after the clicked row
    row.parentNode.insertBefore(actionsRow, row.nextSibling);
}

// Hide customer actions
function hideCustomerActions() {
    // Remove active state from all rows
    document.querySelectorAll('.customer-row-active').forEach(row => {
        row.classList.remove('customer-row-active');
    });
    
    // Remove all action rows
    document.querySelectorAll('.customer-actions-row').forEach(row => {
        row.remove();
    });
}


export async function addCustomer() {
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
            body: JSON.stringify({ name, phoneNumber: phone })
        });
        console.log("Status:", response.status);

        const responseData = await response.json();
        console.log("Response body:", responseData);
        
        if (!response.ok) {
            const errorMessage = new Error(responseData.error || 'Failed to add customer');
            errorMessage.status = response.status;
            throw errorMessage;
        }
        
        showMessage('Customer added successfully', 'success');
        resetForm();
        await refreshCustomers();
        
    } catch (errorMessage) {
        if(errorMessage.status === 409){
            showMessage('This phone number is already exist.', 'error');
            highlightDuplicatePhone(phone);
        }
        else{
            showMessage(errorMessage.message || 'An error occurred', 'error');
        }

    }

}

// <!--   Edit customer  ✍️✍️✍️-->

export async function editCustomer(id) {
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
export async function updateCustomer() {
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

export async function deleteCustomer(id) {
    console.log("Attempting to delete customer ID:", id);
    const confirmed = await showConfirmDialog(
        'Are you sure you want to delete this customer? This action cannot be undone.',
        {
            title: 'Delete Customer',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmClass: 'danger-button'
        }
    );
    console.log("Confirmation result:", confirmed);

    if (!confirmed) return;
    console.log("Confirmed deletion of customer ID:", id);
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


//  Cancel Edit ❌❌❌
export function closeEditCustomerModal() {
    const modal = document.getElementById('edit-customer-modal');
    modal.classList.add('hidden');
    modal.classList.remove('modal--active');
    currentCustomerId = null;
    showMessage('', 'clear', 'edit-customer-message');
}

//  Reset form
export function resetForm() {
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
    setTimeout(() => showMessage('', 'clear'), 3000);

}