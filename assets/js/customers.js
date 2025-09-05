import { BASE_URL } from './config.js';
import {showMessage,highlightDuplicatePhone} from './ui.js';
import { getAdminAuthHeaders } from './auth.js';
import { viewOrders } from './orders.js';
import { viewTransactions } from './payments.js';


let currentCustomerId = null;

export function initCustomers() {
    
    const tableBody = document.getElementById('customers-table-body');
    tableBody?.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

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
        }
    });

    // Listeners for the "Add Customer" form
    document.getElementById('add-customer-button')?.addEventListener('click', addCustomer);

    // Listeners for the "Edit Customer" modal
    document.getElementById('update-customer-btn')?.addEventListener('click', updateCustomer);
    document.getElementById('span-close-edit-modal')?.addEventListener('click', closeEditCustomerModal);
    document.getElementById('cancel-edit-modal-btn')?.addEventListener('click', closeEditCustomerModal);
    document.getElementById('delete-customer-btn')?.addEventListener('click', () => {
        const id = getCurrentCustomerId();
        deleteCustomer(id);
    });
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
                        <button class="view-orders-btn" data-action="view-orders" data-id="${customer.id}" data-name="${customer.name}" title="View Orders">
                            Orders
                        </button>
                        <button class="view-orders-btn" data-action="view-transactions" data-id="${customer.id}" data-name="${customer.name}" title="View Transactions">
                            Transactions
                        </button>
                        <button class="edit-btn" data-action="edit" data-id="${customer.id}" title="Edit Customer">
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


export async function addCustomer(){
    const name=document.getElementById('customer-name').value.trim();
    const phone=document.getElementById('customer-phone').value.trim();

    if(!name || !phone){
        showMessage('Please fill all fields', 'error');
        return;
    }
    if(!/[A-Za-z]/.test(name)){
        showMessage('Name must contain letters','error');
        return;
    }
    if(!/^\d{10}$/.test(phone)){
        showMessage('Phone must be 10 digits','error');
        return;
    }

    try {
        const response=await fetch(`${BASE_URL}/api/customers`,{
            method: 'POST',
            headers: getAdminAuthHeaders(),
            body: JSON.stringify({name,phoneNumber:phone})
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
    showMessage('', 'clear');
    
}