import { BASE_URL } from './config.js';
import { getAdminAuthHeaders, getHeaders } from './auth.js';
import { showMessage } from './ui.js';
import { viewOrders } from './orders.js';
import { loadStats } from './adminDashboard.js';
import { formatDateTime } from './utils.js';
import { getCustomerAuthHeaders } from './customerAuth.js';
import {fetchCustomerBalance, fetchCustomerOrders, fetchCustomerPayments } from './customerDashboard.js';



let whoIsPaying = "";
let paymentCustomerId = null;
let paymentCustomerName = "";
let paymentBalance = 0;
let currentCustomerBalance = 0;

export function initPayments() {
  document.querySelector('#payments-table tbody')?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const { action, customerId, customerName, balance } = button.dataset;
    switch (action) {
      case 'view-orders': {
        const customerId = button.dataset.id;
        const customerName = button.dataset.name;
        viewOrders(customerId, customerName);
        break;
      }
      case 'pay': {
        const customerId = button.dataset.id;
        const customerName = button.dataset.name;
        const balance = button.dataset.balance;
        showPaymentModal(customerId, customerName, balance);
        break;
      }
      
    }

  });

  document.querySelector('#transaction-table tbody')?.addEventListener('click', (event) => {
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

  document.getElementById('process-payment-btn')?.addEventListener('click', processPayment);
  document.getElementById('close-payment-modal')?.addEventListener('click', closePaymentModal);
  document.getElementById('span-close-payment-modal')?.addEventListener('click', closePaymentModal);
  document.getElementById('close-invoice-modal')?.addEventListener('click', closeInvoiceModal);
  document.getElementById('close-transaction-modal')?.addEventListener('click', closeTransactionModal);
  document.getElementById('show-customer-payment-modal')?.addEventListener('click', showCustomerPaymentModal);
}

export async function refreshPayments() {
  try {
    console.log("fetching payment data");
    const response = await fetch(`${BASE_URL}/api/payments`, {
      method: "GET",
      headers: getAdminAuthHeaders()
    });

    if (!response.ok) throw new Error("failed to get details in response");
    const data = await response.json();
    console.log("Received data", data);
    renderPaymentSummary(data);
  } catch (error) {
    showMessage("Something went wrong", "error");
  }
}
export async function renderPaymentSummary(data) {
  const tbody = document.querySelector('#payments-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">
          ${data ? 'No pending payments found' : 'Failed to load data'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(a => `
    <tr>
      <td>${a.customerId}</td>
      <td>${a.customerName}</td>
      <td>₹${a.balance.toFixed(2)}</td>
      <td>
        <button 
          data-action="view-orders" 
          data-id="${a.customerId}" 
          data-name="${a.customerName}">
          View Orders
        </button>
      </td>
      <td>
        <button 
          data-action="pay" 
          data-id="${a.customerId}" 
          data-name="${a.customerName}" 
          data-balance="${a.balance}">
          Pay
        </button>
      </td>
    </tr>
  `).join('');
}

function showPaymentModal(customerId, customerName, balance) {
  whoIsPaying = "admin";
  paymentCustomerId = customerId;
  paymentCustomerName = customerName;
  paymentBalance = parseFloat(balance);

  document.getElementById('payment-customer-name').textContent = customerName;
  document.getElementById('payment-total-due').textContent = `₹${paymentBalance.toFixed(2)}`;
  document.getElementById('payment-amount').value = '';
  showMessage('', 'clear', 'payment-message');

  const modal = document.getElementById('payment-modal');
  modal.classList.remove('hidden');
  modal.classList.add('modal--active');
}



// const paymentMessage = document.getElementById('payment-message');
async function processPayment() {
  const amountInput = document.getElementById('payment-amount');
  const amount = parseFloat(amountInput.value);
  const balance = paymentBalance;
  const customerId = paymentCustomerId;

  if (isNaN(amount) || amount <= 0) {
    showMessage('Please enter a valid positive amount', 'error', 'payment-message');
    amountInput.focus();
    return;
  }
  if (amount > paymentBalance) {
    showMessage(`Amount cannot exceed the due balance of ₹${paymentBalance.toFixed(2)}`, 'error', 'payment-message');
    amountInput.focus();
    return;
  }

  try {
    if (whoIsPaying === "admin") {
      const response = await fetch(`${BASE_URL}/api/payments`, {
        method: "POST",
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          customerId: paymentCustomerId,
          amount: amount
        }),
      });

      if (!response.ok) throw new Error("admin payment failed");
      showMessage(`Payment of ₹${amount} recorded!`, 'success');
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
        showMessage("Please enter a valid amount", "error");
        return;
      }

      if (amount > balance) {
        showMessage(`Amount cannot exceed ₹${balance.toFixed(2)}`, 'error');
        amountInput.focus();
        return;
      }

      launchUpiIntent(amount);

      setTimeout(() => {
        if (confirm("Did you complete the UPI payment?")) {
          sendPendingPayment(amount);
        } else {
          showMessage("Payment not recorded. Please try again.", "error");
        }
      }, 5000);


    } else {
      throw new Error("Unknown payment context");
    }
  } catch (error) {
    showMessage(error.message, 'error', 'payment-message');
    return;
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
      headers: getCustomerAuthHeaders(),
      body: JSON.stringify({ amount: amount })
    });

    if (!response.ok) throw new Error("Customer payment failed");

    const savedPayment = await response.json();

    showMessage(`Payment of ₹${amount.toFixed(2)} recorded! Waiting for admin verification.`, "success");

    console.log("🧾 Saved pending payment:", savedPayment);

    fetchCustomerBalance(localStorage.getItem("customerId"));
    fetchCustomerOrders(localStorage.getItem("customerId"));
    fetchCustomerPayments(localStorage.getItem("customerId"));

    closePaymentModal();
  } catch (err) {
    console.error(err);
    showMessage("Failed to record payment. Please try again.", "error");
  }
}
export async function showCustomerPaymentModal() {
  whoIsPaying = "customer";
  paymentCustomerId = localStorage.getItem("customerId");
  paymentCustomerName = localStorage.getItem("customerName");

  // Fetch the current balance
  try {
    const response = await fetch(`${BASE_URL}/api/payments/${paymentCustomerId}/balance`, {
      method: "GET",
      headers: getCustomerAuthHeaders()
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


export function showInvoiceModal(payment) {
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
    downloadLink.onclick = async (e) => {
      e.preventDefault();
      const url = `${BASE_URL}/api/receipts/${transactionId}/download`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: getHeaders(),
        });

        if (!response.ok) throw new Error("Failed to fetch receipt");

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `receipt_${payment.transactionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(downloadUrl);


      } catch (error) {
        console.error("❌ Error downloading receipt:", error);
        alert("Failed to download receipt. Please try again.");
      }
    }
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
export async function viewTransactions(customerId, customerName) {
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

export async function showTransactionHistory(transactionData) {


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
                class="view-invoice-btn" 
                    data-transactionId="${tData.transactionId}" 
                    data-customerName="${tData.customerName}" 
                    data-amount="${tData.amount}" 
                    data-timestamp="${tData.timestamp}"
                >
                View
                </button>

            </td>
        </tr>
    `;
  }).join('');


}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.classList.add('hidden');
    modal.classList.remove('modal--active');
}

function closeTransactionModal() {
  const modal = document.getElementById('payment-transaction-history');
  modal.classList.add('hidden');
  modal.classList.remove('modal--active');
}


