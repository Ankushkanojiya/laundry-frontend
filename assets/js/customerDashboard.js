import { BASE_URL } from "./config.js";
import { getCustomerAuthHeaders } from "./customerAuth.js";
import { formatDateTime } from "./utils.js";
import { showInvoiceModal } from "./payments.js"
import { closeInvoiceModal, showCustomerPaymentModal } from "./payments.js"



export function initCustomerDashboard() {
    console.log('Attempting to find #customer-payment-body:', document.getElementById('customer-payment-body'));
    document.getElementById('customer-payment-body')?.addEventListener('click', (event) => {
        const button = event.target.closest('.view-invoice-btn');
        if (!button) return;

        const payment = {
            transactionId: button.dataset.transactionId,
            customerName: button.dataset.customerName,
            amount: parseFloat(button.dataset.amount),
            timestamp: button.dataset.timestamp
        };

        showInvoiceModal(payment);
    });
    document.getElementById('logout-customer-btn')?.addEventListener('click', logoutCustomer);
    document.getElementById('close-invoice-modal')?.addEventListener('click', closeInvoiceModal);


    document.addEventListener('customerPaymentSuccess', () => {
        console.log('Payment success event received, refreshing dashboard data...');
        const customerId = localStorage.getItem("customerId");
        if (customerId) {
            fetchCustomerBalance(customerId);
            fetchCustomerOrders(customerId);
            fetchCustomerPayments(customerId);
        }
    });
}
export async function fetchCustomerBalance(customerId) {
    try {
        const response = await fetch(`${BASE_URL}/api/payments/${customerId}/balance`, {
            method: "GET",
            headers: getCustomerAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch customer data");

        const rawBalance = await response.text();
        const balance = parseFloat(rawBalance);

        if (isNaN(balance)) {
            throw new Error("Invalid balance value");
        }

        const customerBalanceLabel = document.getElementById('customer-balance-label');
        const customerBalance = document.getElementById('customer-balance');

        if (balance < 0) {
            customerBalanceLabel.textContent = "Advance Balance:";
        } else {
            customerBalanceLabel.textContent = "Balance Due:";
        }

        const displayAmount = Math.abs(balance);
        customerBalance.textContent = `₹${displayAmount.toFixed(2)}`;
    } catch (error) {
        console.error("Error fetching customer data:", error);
        document.getElementById("customer-balance").textContent = "Error";
        return;
    }
}

export async function fetchCustomerOrders(customerId) {
    try {
        const response = await fetch(`${BASE_URL}/api/orders/customer/${customerId}`, {
            method: "GET",
            headers: getCustomerAuthHeaders()
        });
        if (!response.ok) throw new Error("Not able to fetch Orders");

        const orders = await response.json();
        const tbody = document.getElementById("customer-order-body");
        tbody.innerHTML = "";

        if (orders.length === 0) {
            tbody.innerHTML = `<tr class="no-data-row"><td colspan="5" style="text-align:center">No orders found</td></tr>`;
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
    } catch (error) {
        document.getElementById("customer-order-body").innerHTML = `<tr class="no-data-row"><td colspan="5" style="text-align:center">${error.message}</td></tr>`;
    }
}

export async function fetchCustomerPayments(customerId) {
    try {
        const response = await fetch(`${BASE_URL}/api/payments/${customerId}/history`, {
            method: "GET",
            headers: getCustomerAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch payment history");
        const payments = await response.json();
        const tbody = document.getElementById("customer-payment-body");
        tbody.innerHTML = "";

        if (payments.length === 0) {
            tbody.innerHTML = `<tr class="no-data-row"><td colspan="4" style="text-align:center">No payment history found</td></tr>`;
            return;
        }
        payments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        payments.forEach(txn => {
            tbody.innerHTML += `
                <tr>
                    <td>${txn.transactionId}</td>
                    <td>₹${txn.amount.toFixed(2)}</td>
                    <td>${formatDateTime(txn.timestamp)}</td>
                    <td>
                        <button 
                            class="view-invoice-btn" 
                            data-transaction-id="${txn.transactionId}" 
                            data-customer-name="${txn.customerName}" 
                            data-amount="${txn.amount}" 
                            data-timestamp="${txn.timestamp}"
                        >
                            View
                        </button>

            </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error fetching payment history:", error);
        document.getElementById("customer-payment-body").innerHTML = `<tr class="no-data-row"><td colspan="4" style="text-align:center">${error.message}</td></tr>`;
    }
}

function logoutCustomer() {
    localStorage.clear();
    location.reload();
}

export async function loadCustomerDashboard(customerId) {
    const name = localStorage.getItem("customerName");
    document.getElementById("customer-name-display").textContent = name;


    fetchCustomerBalance(customerId);
    fetchCustomerOrders(customerId);
    fetchCustomerPayments(customerId);

    const modalBtn = document.getElementById('show-customer-payment-modal');
    if (modalBtn) {
        modalBtn.removeEventListener('click', showCustomerPaymentModal);
        modalBtn.addEventListener('click', showCustomerPaymentModal);
    }
}

