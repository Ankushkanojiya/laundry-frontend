import { BASE_URL } from './config.js';
import { getAdminAuthHeaders } from './auth.js';
import { formatDateTime } from './utils.js';

export function initCustomerPayments() {
    document.getElementById('customer-payments-table-body')?.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const {action,id}=button.dataset;
        switch(action){
            case 'verify':
                verifyPendingPayment(id,button);
                break;
            case 'downloadReceipt':
                downloadReceipt(id);
                break;
            case 'reject':
                rejectPendingPayment(id,button);
                break;
        }
    });
}

export async function customerPayments() {
    try {
        
        const response = await fetch(`${BASE_URL}/api/payments/pending`, {
            method: 'GET',
            headers: getAdminAuthHeaders()
        });
        const data=await response.json();
        renderCustomerPayments(data);
    } catch (error) {
        console.error("Error fetching customer payments:", error);
    }
}
function renderCustomerPayments(payments){
    const tbody=document.getElementById('customer-payments-table-body');
    tbody.innerHTML ='';

    if(!payments.length){
        tbody.innerHTML = `<tr class="no-data-row"><td colspan="6" style="text-align:center">No pending payments</td></tr>`;
        return;
    }

    payments.forEach(payment => {
        const row=document.createElement('tr');

        row.innerHTML = `
            <td>${payment.transactionId}</td>
            <td>${payment.customerName}</td>
            <td>₹${payment.amount.toFixed(2)}</td>
            <td>${formatDateTime(payment.timestamp)}</td>
            <td>
                <button data-action="verify"  data-id="${payment.transactionId}">Verify</button>
                <button data-action="reject"  data-id="${payment.transactionId}">Reject</button>
            </td>

        `;

        tbody.appendChild(row);
    });
}

async function verifyPendingPayment(pendingId,button){
    try {
        button.disabled=true;
        button.textContent='Verifying...';
        const response=await fetch(`${BASE_URL}/api/payments/${pendingId}/verify`,{
            method: "PATCH",
            headers: getAdminAuthHeaders()
        });

        if(!response.ok) throw new Error("failed to verify");
        const updated=await response.json();

        const row = button.closest("tr");
        row.innerHTML = `
            <td>${updated.transactionId}</td>
            <td>${updated.customerName}</td>
            <td>₹${updated.amount.toFixed(2)}</td>
            <td>${formatDateTime(updated.timestamp)}</td>
            <td>
                ✅ Verified
            </td>
        `;
        
    }catch (error) {
        
        button.disabled = false;
        button.textContent = "Verify";
    }
} 

async function downloadReceipt(transactionId){
    try{
        const response=await fetch(`${BASE_URL}/api/receipts/${transactionId}/download`,{
            method: "GET",
            headers: getAdminAuthHeaders()
        });

        if(!response.ok) throw new Error("Failed to download receipt");

        const blob=await response.blob();
        const url=window.URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url;
        a.download=`receipt_${transactionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

    }catch{
        console.log("failed to download receipt");
    }
}
async function rejectPendingPayment(pendingId,button){  
    try{
        button.disabled=true;
        button.textContent="Rejecting...";
        const response=await fetch(`${BASE_URL}/api/payments/${pendingId}/reject`,{
            method: "PATCH",
            headers: getAdminAuthHeaders()
        }); 

        if (!response.ok) throw new Error("Failed to reject");

        const updated = await response.json();

        const row = button.closest("tr");
        row.innerHTML = `
            <td>${updated.transactionId}</td>
            <td>${updated.customerName}</td>
            <td>₹${updated.amount.toFixed(2)}</td>
            <td>${formatDateTime(updated.timestamp)}</td>
            
            <td>Rejected ❌</td>
        `;
        
    }
    catch(error){
        console.log("Failed to reject payment", "error");
        button.disabled=false;
        button.textContent="Reject";
        
    }
}