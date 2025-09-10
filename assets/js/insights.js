import { BASE_URL } from "./config.js";
import { getAdminAuthHeaders } from "./auth.js";
import { showMessage } from "./ui.js";

export async function loadInsights() {
    try {
        const response = await fetch(`${BASE_URL}/api/insights`, {
            method: "GET",
            headers: getAdminAuthHeaders()
        });

        if (!response.ok) throw new Error("failed to load insights");

        const data = await response.json();
        console.log("insights ", data);

        document.getElementById("total-orders").textContent = data.totalOrders;
        document.getElementById("total-customers").textContent = data.totalCustomers;
        document.getElementById("total-revenue").textContent = `₹${data.totalRevenue.toFixed(2)}`;

        const topCustomersBody = document.getElementById("top-customers-body");
        if (topCustomersBody) {
            topCustomersBody.innerHTML = ""; 
            if (!data.topCustomers || data.topCustomers.length === 0) {
                topCustomersBody.innerHTML = `<tr><td colspan="2" class="no-data-cell">No top customers found.</td></tr>`;
            } else {
                data.topCustomers.forEach(c => {
                    topCustomersBody.innerHTML += `
                    <tr>
                        <td>${c.name}</td>
                        <td>₹${c.totalPaid.toFixed(2)}</td>
                    </tr>
                `;
                });
            }
        }

       
        const dueCustomersBody = document.getElementById("due-customers-body");
        if (dueCustomersBody) {
            dueCustomersBody.innerHTML = ""; 
            if (!data.customersWithDue || data.customersWithDue.length === 0) {
                dueCustomersBody.innerHTML = `<tr><td colspan="2" class="no-data-cell">No customers with due payments.</td></tr>`;
            } else {
                data.customersWithDue.forEach(c => {
                    dueCustomersBody.innerHTML += `
                    <tr>
                        <td>${c.name}</td>
                        <td>₹${c.balance.toFixed(2)}</td>
                    </tr>
                `;
                });
            }
        }
    }catch(error){
        showMessage("Could not load insights. Please try again.", "error");
        console.error("Error fetching insights:", error);
    }
}