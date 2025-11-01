import { BASE_URL } from './config.js';
import { getAdminAuthHeaders, getHeaders } from './auth.js';
import { showMessage } from './ui.js';
import { viewOrders } from './orders.js';
import { loadStats } from './adminDashboard.js';
import { formatDateTime } from './utils.js';
import { getCustomerAuthHeaders } from './customerAuth.js';
// import { fetchCustomerBalance, fetchCustomerOrders, fetchCustomerPayments } from './customerDashboard.js';
import { showConfirm, showAlert } from './dialogs.js';



let whoIsPaying = "";
let paymentCustomerId = null;
let paymentCustomerName = "";
let paymentBalance = 0;
let currentCustomerBalance = 0;

export function initPayments() {
  console.log('Initializing payments module...');

  // Use event delegation for dynamically created buttons in tables
  const paymentsTable = document.querySelector('#payments-table tbody');
  if (paymentsTable) {
    // Remove existing listeners to prevent duplicates
    paymentsTable.removeEventListener('click', handlePaymentsTableClick);
    paymentsTable.addEventListener('click', handlePaymentsTableClick);
  } else {
    console.warn('Payments table tbody not found');
  }

  const transactionTable = document.querySelector('#transaction-table tbody');
  if (transactionTable) {
    // Remove existing listeners to prevent duplicates
    transactionTable.removeEventListener('click', handleTransactionTableClick);
    transactionTable.addEventListener('click', handleTransactionTableClick);
  } else {
    console.warn('Transaction table tbody not found');
  }



  // Static button event listeners with error checking
  const processPaymentBtn = document.getElementById('process-payment-btn');
  if (processPaymentBtn) {
    processPaymentBtn.removeEventListener('click', processPayment);
    processPaymentBtn.addEventListener('click', processPayment);
    console.log('Process payment button listener added');
  } else {
    console.warn('Process payment button not found');
  }

  const closePaymentModalBtn = document.getElementById('close-payment-modal');
  if (closePaymentModalBtn) {
    closePaymentModalBtn.removeEventListener('click', closePaymentModal);
    closePaymentModalBtn.addEventListener('click', closePaymentModal);
  } else {
    console.warn('Close payment modal button not found');
  }

  const spanClosePaymentModalBtn = document.getElementById('span-close-payment-modal');
  if (spanClosePaymentModalBtn) {
    spanClosePaymentModalBtn.removeEventListener('click', closePaymentModal);
    spanClosePaymentModalBtn.addEventListener('click', closePaymentModal);
  } else {
    console.warn('Span close payment modal button not found');
  }

  const closeInvoiceModalBtn = document.getElementById('close-invoice-modal');
  if (closeInvoiceModalBtn) {
    closeInvoiceModalBtn.removeEventListener('click', closeInvoiceModal);
    closeInvoiceModalBtn.addEventListener('click', closeInvoiceModal);
  } else {
    console.warn('Close invoice modal button not found');
  }

  const closeTransactionModalBtn = document.getElementById('close-transaction-modal');
  if (closeTransactionModalBtn) {
    closeTransactionModalBtn.removeEventListener('click', closeTransactionModal);
    closeTransactionModalBtn.addEventListener('click', closeTransactionModal);
  } else {
    console.warn('Close transaction modal button not found');
  }

  const showCustomerPaymentModalBtn = document.getElementById('show-customer-payment-modal');
  if (showCustomerPaymentModalBtn) {
    console.log('Found show-customer-payment-modal button:', showCustomerPaymentModalBtn);
    showCustomerPaymentModalBtn.removeEventListener('click', showCustomerPaymentModal);
    showCustomerPaymentModalBtn.addEventListener('click', (e) => {
      console.log('Show customer payment modal button clicked!', e);
      e.preventDefault();
      e.stopPropagation();
      showCustomerPaymentModal();
    });
    console.log('Show customer payment modal button listener added');
  } else {
    console.warn('Show customer payment modal button not found');
  }

  console.log('Payments module initialization complete');


}

// Separate event handler for payments table clicks
function handlePaymentsTableClick(event) {
  const button = event.target.closest('button');
  if (!button) return;

  console.log('Payments table button clicked:', button.dataset);
  const { action, id, name, balance } = button.dataset;

  switch (action) {
    case 'view-orders': {
      console.log('View orders clicked for customer:', id, name);
      viewOrders(id, name);
      break;
    }
    case 'pay': {
      console.log('Pay button clicked for customer:', id, name, 'balance:', balance);
      showPaymentModal(id, name, balance);
      break;
    }
    default:
      console.warn('Unknown action:', action);
  }
}

// Separate event handler for transaction table clicks
function handleTransactionTableClick(event) {
  const button = event.target.closest('.view-invoice-btn');
  if (!button) return;

  console.log('Transaction table button clicked:', button.dataset);
  const payment = {
    transactionId: button.dataset.transactionId,
    customerName: button.dataset.customerName,
    amount: parseFloat(button.dataset.amount),
    timestamp: button.dataset.timestamp
  };

  showInvoiceModal(payment);
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
      <tr class="no-data-row">
        <td colspan="5" style="text-align:center">${data ? 'No pending payments found' : 'Failed to load data'}</td>
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
          class="view-orders-btn"
          data-action="view-orders" 
          data-id="${a.customerId}" 
          data-name="${a.customerName}">
          View Orders
        </button>
      </td>
      <td>
        <button 
          class="pay-btn"
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
  console.log('showPaymentModal called with:', { customerId, customerName, balance });
  whoIsPaying = "admin";
  paymentCustomerId = customerId;
  paymentCustomerName = customerName;
  paymentBalance = parseFloat(balance);

  const paymentCustomerNameEl = document.getElementById('payment-customer-name');
  const paymentTotalDueEl = document.getElementById('payment-total-due');
  const paymentAmountEl = document.getElementById('payment-amount');
  const modal = document.getElementById('payment-modal');

  if (!paymentCustomerNameEl || !paymentTotalDueEl || !paymentAmountEl || !modal) {
    console.error('Payment modal elements not found:', {
      paymentCustomerNameEl: !!paymentCustomerNameEl,
      paymentTotalDueEl: !!paymentTotalDueEl,
      paymentAmountEl: !!paymentAmountEl,
      modal: !!modal
    });
    return;
  }

  paymentCustomerNameEl.textContent = customerName;
  paymentTotalDueEl.textContent = `₹${paymentBalance.toFixed(2)}`;
  paymentAmountEl.value = '';
  showMessage('', 'clear', 'payment-message');

  // Set avatar initials and accessibility
  if (typeof setPaymentAvatar === 'function') setPaymentAvatar(customerName);

  // Add quick amounts for admin flow too
  const existingQuickAdmin = document.getElementById('payment-quick-amounts');
  if (existingQuickAdmin) existingQuickAdmin.remove();
  const quickAmountsAdmin = [100, 250, 500];
  const fullAmtAdmin = Math.ceil(paymentBalance);
  const quickHtmlAdmin = `
    <div id="payment-quick-amounts" class="payment-quick-amounts" role="group" aria-label="Quick amount selectors">
      ${quickAmountsAdmin.map(a => `<button type="button" class="quick-amt" data-amt="${a}">₹${a}</button>`).join('')}
      <button type="button" class="quick-amt quick-full" data-amt="${fullAmtAdmin}">Full</button>
    </div>
  `;
  paymentAmountEl.insertAdjacentHTML('beforebegin', quickHtmlAdmin);
  const quickContainerAdmin = document.getElementById('payment-quick-amounts');
  if (quickContainerAdmin) {
    quickContainerAdmin.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.quick-amt');
      if (!btn) return;
      // toggle active state
      quickContainerAdmin.querySelectorAll('.quick-amt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.dataset.amt;
      paymentAmountEl.value = parseFloat(val).toFixed(2);
      paymentAmountEl.focus();
      paymentAmountEl.select();
    });
  }

  modal.classList.remove('hidden');
  modal.classList.add('modal--active');
  console.log('Payment modal shown successfully');
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
    // Disable the submit button and show spinner to indicate progress
    const processBtn = document.getElementById('process-payment-btn');
    if (processBtn) {
      processBtn.disabled = true;
      processBtn.dataset.origHtml = processBtn.innerHTML;
      processBtn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span>Processing...`;
    }

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

      // Give the user a clear, friendly handoff when redirecting to UPI
      showMessage('Opening UPI app — please complete the payment and return to confirm.', 'info');
      // Small visual cue before redirecting
      await new Promise(res => setTimeout(res, 600));
      launchUpiIntent(amount);

      setTimeout(async () => {
        const confirmed = await showConfirm(
          "Did you complete the UPI payment?",
          "Payment Confirmation"
        );

        if (confirmed) {
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
  finally {
    // Restore the button state
    const processBtnFinal = document.getElementById('process-payment-btn');
    if (processBtnFinal) {
      processBtnFinal.disabled = false;
      if (processBtnFinal.dataset && processBtnFinal.dataset.origHtml) {
        processBtnFinal.innerHTML = processBtnFinal.dataset.origHtml;
        delete processBtnFinal.dataset.origHtml;
      }
    }
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

    // fetchCustomerBalance(localStorage.getItem("customerId"));
    // fetchCustomerOrders(localStorage.getItem("customerId"));
    // fetchCustomerPayments(localStorage.getItem("customerId"));
     document.dispatchEvent(new CustomEvent('customerPaymentSuccess'));

    closePaymentModal();
  } catch (err) {
    console.error(err);
    showMessage("Failed to record payment. Please try again.", "error");
  }
}
export async function showCustomerPaymentModal() {
  console.log("Showing customer payment modal");
  whoIsPaying = "customer";
  paymentCustomerId = localStorage.getItem("customerId");
  paymentCustomerName = localStorage.getItem("customerName");

  console.log("Customer payment details:", {
    paymentCustomerId,
    paymentCustomerName
  });

  // Check if customer is logged in
  if (!paymentCustomerId || !paymentCustomerName) {
    console.error("Customer not logged in properly");
    showMessage("Please log in to make payments", "error");
    return;
  }

  // Fetch the current balance
  try {
    const response = await fetch(`${BASE_URL}/api/payments/${paymentCustomerId}/balance`, {
      method: "GET",
      headers: getCustomerAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch balance");

    const balance = parseFloat(await response.text());
    paymentBalance = balance;

    console.log("Customer balance fetched:", balance);

    // Verify all modal elements exist
    const paymentCustomerNameEl = document.getElementById("payment-customer-name");
    const paymentTotalDueEl = document.getElementById("payment-total-due");
    const paymentAmountEl = document.getElementById("payment-amount");
    const modal = document.getElementById("payment-modal");

    if (!paymentCustomerNameEl || !paymentTotalDueEl || !paymentAmountEl || !modal) {
      console.error('Customer payment modal elements not found:', {
        paymentCustomerNameEl: !!paymentCustomerNameEl,
        paymentTotalDueEl: !!paymentTotalDueEl,
        paymentAmountEl: !!paymentAmountEl,
        modal: !!modal
      });
      showMessage("Payment modal not available", "error");
      return;
    }

    paymentCustomerNameEl.textContent = paymentCustomerName;
    paymentTotalDueEl.textContent = `₹${balance.toFixed(2)}`;
    paymentAmountEl.value = "";

    // Clear any previous messages
    showMessage('', 'clear', 'payment-message');

    // Remove any existing quick-amount buttons (avoid duplicates)
    const existingQuick = document.getElementById('payment-quick-amounts');
    if (existingQuick) existingQuick.remove();

    // Insert quick-amount shortcuts to improve UX
    const quickAmounts = [100, 250, 500];
    const fullAmount = Math.ceil(balance);
    const quickHtml = `
      <div id="payment-quick-amounts" class="payment-quick-amounts" role="group" aria-label="Quick amount selectors">
        ${quickAmounts.map(a => `<button type="button" class="quick-amt" data-amt="${a}">₹${a}</button>`).join('')}
        <button type="button" class="quick-amt quick-full" data-amt="${fullAmount}">Full</button>
      </div>
    `;
    // Place quick amounts right above the amount input for visibility
    paymentAmountEl.insertAdjacentHTML('beforebegin', quickHtml);

    // Wire up quick-amount clicks
    const quickContainer = document.getElementById('payment-quick-amounts');
    if (quickContainer) {
      quickContainer.addEventListener('click', (ev) => {
        const btn = ev.target.closest('.quick-amt');
        if (!btn) return;
        const val = btn.dataset.amt;
        paymentAmountEl.value = parseFloat(val).toFixed(2);
        paymentAmountEl.focus();
        paymentAmountEl.select();
      });
    }

    // Accessibility: describe the input for screen readers
    paymentAmountEl.setAttribute('aria-label', `Enter amount to pay for ${paymentCustomerName}`);

    // Focus the amount input and select current text if any
    setTimeout(() => {
      paymentAmountEl.focus();
      paymentAmountEl.select();
    }, 120);

    // Show modal with proper classes for animation and visibility
    modal.classList.remove("hidden");
    modal.classList.add("modal--active");
    attachPaymentModalListeners();
    console.log("Customer payment modal shown successfully");
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
        await showAlert("Failed to download receipt. Please try again.", "Download Error");
      }
    }
  }

  console.log("Download link");
  modal.classList.remove("hidden");
  modal.classList.add("modal--active");
}
export function closeInvoiceModal() {
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
    <tr class="no-data-row"><td colspan="4" style="text-align:center">No pending payments found</td></tr>
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
                    data-transaction-id="${tData.transactionId}" 
                    data-customer-name="${tData.customerName}" 
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
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('modal--active');
  }

  // Remove quick amount shortcuts and keyboard handlers to avoid duplicates
  const quick = document.getElementById('payment-quick-amounts');
  if (quick) quick.remove();

  const amountInput = document.getElementById('payment-amount');
  if (amountInput && typeof handleAmountKeydown === 'function') {
    amountInput.removeEventListener('keydown', handleAmountKeydown);
  }
}

function closeTransactionModal() {
  const modal = document.getElementById('payment-transaction-history');
  modal.classList.add('hidden');
  modal.classList.remove('modal--active');
}




function attachPaymentModalListeners() {
  const processPaymentBtn = document.getElementById('process-payment-btn');
  if (processPaymentBtn) {
    processPaymentBtn.removeEventListener('click', processPayment);
    processPaymentBtn.addEventListener('click', processPayment);
  }

  const closePaymentModalBtn = document.getElementById('close-payment-modal');
  if (closePaymentModalBtn) {
    closePaymentModalBtn.removeEventListener('click', closePaymentModal);
    closePaymentModalBtn.addEventListener('click', closePaymentModal);
  }

  // Submit on Enter key from the amount input for faster flow
  const amountInput = document.getElementById('payment-amount');
  if (amountInput) {
    // ensure we don't add duplicate handlers
    amountInput.removeEventListener('keydown', handleAmountKeydown);
    amountInput.addEventListener('keydown', handleAmountKeydown);
  }
}

// small helper for Enter-to-submit behavior
function handleAmountKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    processPayment();
  }
}

// helper to render avatar initials in modal
function setPaymentAvatar(name) {
  try {
    const avatar = document.getElementById('payment-avatar');
    if (!avatar) return;
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    let initials = '';
    if (parts.length === 0) initials = '👤';
    else if (parts.length === 1) initials = parts[0].slice(0,2).toUpperCase();
    else initials = (parts[0][0] + parts[1][0]).toUpperCase();
    avatar.textContent = initials;
  } catch (err) {
    console.warn('setPaymentAvatar failed', err);
  }
}
