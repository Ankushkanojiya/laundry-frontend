import { BASE_URL } from "./config.js";
import { getAdminAuthHeaders } from "./auth.js";

export async function loadStats() {
    console.log("loading admin dashboard stats");
    try {
        const response=await fetch(`${BASE_URL}/api/stats`,{
            method: "GET",
            headers: getAdminAuthHeaders()
        });

        const data=await response.json();

        document.getElementById('pending-count').textContent=data.pendingOrders;
        document.getElementById('business-revenue').textContent=`₹${data.businessRevenueToday.toFixed(2)}`;
        document.getElementById('daily-revenue').textContent=`₹${data.revenueToday.toFixed(2)}`;
    } catch (error) {
        console.error("failed to load stats",error);
    }
}

export async function loadDashboardPendingOrders(){
    console.log("loading pending orders");
    try {
        const today=new Date();
        const yesterday= new Date(today);
        yesterday.setDate(today.getDate-1);

        const dayBeforeYesterday = new Date(today);
        dayBeforeYesterday.setDate(today.getDate() - 2);

        // Format dates for API (YYYY-MM-DD)
        const startDate = dayBeforeYesterday.toISOString().split('T')[0];
        const endDate = yesterday.toISOString().split('T')[0];

        const response=await fetch(`${BASE_URL}/api/orders/filter?status=PENDING&startDate=${startDate}&endDate=${endDate}`,{
            method:"GET",
            headers:getAdminAuthHeaders()
        });

        if(!response.ok) throw new Error ("failed to load pending orders");
        const orders=await response.json();
        renderDashboardPendingOrders(orders);
    } catch (error) {
        console.log("Error loading dashboard pending orders",error);
        const tbody=document.querySelector('#dashboard-pending-orders tbody');
        if(tbody){
            tbody.innerHTML= `<tr><td colSpan="6" style="text-align:center;color:red;">Failed to load pending orders</td></tr>`;
        }
    }
}

function renderDashboardPendingOrders(orders){
    
    const tbody = document.querySelector('#dashboard-pending-orders tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">No pending orders from yesterday or the day before</td></tr>`;
        return;
    }
    orders.forEach(order => {
        window.updateOrderStatus = updateOrderStatus;
        tbody.innerHTML= `<tr>
            <td>#${order.id}</td>
            <td>${order.customerName}</td>
            <td>${order.totalClothes}</td>
            <td>₹${order.totalAmount}</td>
            <td>
                <button class="status-btn pending small" onClick="updateOrderStatus(${order.id},'IN_PROGRESS',false)">Start Order</button>
            </td>
        </tr>`
    });
}

export function initializeDashboard(){
    loadStats();
}