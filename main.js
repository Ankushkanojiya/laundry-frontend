import * as auth from './assets/js/auth.js';
import * as ui from './assets/js/ui.js';
import { initializeDashboard } from './assets/js/adminDashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded. Application initializing...");
    
    // Check for existing login tokens and route accordingly
    const adminToken = localStorage.getItem("adminToken");
    const customerToken = localStorage.getItem("customerToken");

    if (adminToken) {
        // Show admin dashboard if logged in
        document.getElementById('auth-section').style.display = 'none';
        const adminDashboard = document.getElementById('admin-dashboard');
        adminDashboard.classList.remove('hidden');
        adminDashboard.style.display = 'block';
        initializeDashboard();
        ui.showDashboard();
    } else if (customerToken) {
        // Show customer dashboard if logged in
        // (Customer dashboard logic will be added in its own module later)
        console.log("Customer token found, customer dashboard will be loaded.");
    } else {
        // Show login page by default
        ui.hideAllSections();
        document.getElementById('auth-section').style.display = 'flex';
    }

    // Attach all event listeners
    attachEventListeners();
});

function attachEventListeners() {
    
    document.getElementById('login-button')?.addEventListener('click', auth.login);
    document.getElementById('logout-button')?.addEventListener('click', auth.logoutAdmin);
    
    
    document.querySelector('.sidebar-toggle')?.addEventListener('click', ui.toggleSidebar);
    document.getElementById('nav-dashboard')?.addEventListener('click', ui.showDashboard);
    document.getElementById('nav-add-customer')?.addEventListener('click', ui.showAddCustomer);
    document.getElementById('nav-take-order')?.addEventListener('click', ui.showTakeOrder);
    document.getElementById('nav-manage-customers')?.addEventListener('click', ui.showManageCustomers);
    document.getElementById('nav-show-orders')?.addEventListener('click', ui.showManageOrders);
    document.getElementById('nav-payments')?.addEventListener('click', ui.showPayments);
    document.getElementById('nav-customer-payments')?.addEventListener('click', ui.showCustomerPayments);
    document.getElementById('nav-insights')?.addEventListener('click', ui.showInsights);
}