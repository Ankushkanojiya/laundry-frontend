import * as auth from './assets/js/auth.js';
import * as ui from './assets/js/ui.js';
import { initAdminDashboard } from './assets/js/adminDashboard.js';
import { initCustomers, refreshCustomers } from './assets/js/customers.js';
import * as customers from './assets/js/customers.js';
import { initOrders, closeHistoryModal } from './assets/js/orders.js';
import { initPayments } from './assets/js/payments.js';
import * as customerAuth from './assets/js/customerAuth.js';
import { initCustomerDashboard } from './assets/js/customerDashboard.js';
import { initCustomerPayments } from './assets/js/customerPayments.js';
import { initDialogs } from './assets/js/dialogs.js';
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM loaded. Application initializing...");

    customers.initCustomers();
    // initOrders();

    
    // Check for existing login tokens and route accordingly
    const adminToken = localStorage.getItem("adminToken");
    const customerToken = localStorage.getItem("customerToken");

    if (adminToken) {
        // Validate admin token before showing dashboard
        console.log("Admin token found, validating...");
        
        const { validateAdminToken } = await import('./assets/js/auth.js');
        const isValidAdminToken = await validateAdminToken();
        
        if (isValidAdminToken) {
            console.log("Admin token is valid, loading admin dashboard.");
            document.getElementById('auth-section').style.display = 'none';
            const adminDashboard = document.getElementById('admin-dashboard');
            adminDashboard.classList.remove('hidden');
            adminDashboard.style.display = 'block';
            initAdminDashboard();
            ui.showDashboard();
        } else {
            console.log("Admin token is invalid, clearing storage and showing login.");
            localStorage.clear();
            ui.hideAllSections();
            document.getElementById('auth-section').style.display = 'flex';
        }
    } else if (customerToken) {
        // Validate customer token before showing dashboard
        const customerId = localStorage.getItem("customerId");
        const customerName = localStorage.getItem("customerName");
        
        if (customerId && customerName) {
            console.log("Customer token found, validating...");
            
            // Import the validation function and validate token
            const { validateCustomerToken } = await import('./assets/js/customerAuth.js');
            const isValidToken = await validateCustomerToken();
            
            if (isValidToken) {
                console.log("Token is valid, loading customer dashboard.");
                document.getElementById("auth-section").classList.add("hidden");
                document.getElementById("customer-dashboard").classList.remove("hidden");
                
                // Import and load customer dashboard
                const { loadCustomerDashboard } = await import('./assets/js/customerDashboard.js');
                loadCustomerDashboard(customerId);
            } else {
                console.log("Token is invalid, clearing storage and showing login.");
                localStorage.clear();
                ui.hideAllSections();
                document.getElementById('auth-section').style.display = 'flex';
            }
        } else {
            // Token exists but missing user data, clear storage and show login
            localStorage.clear();
            ui.hideAllSections();
            document.getElementById('auth-section').style.display = 'flex';
        }
    } else {
        // Show login page by default
        ui.hideAllSections();
        document.getElementById('auth-section').style.display = 'flex';
    }


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

    document.getElementById('add-customer-btn')?.addEventListener('click', customers.addCustomer);
    document.getElementById('reset-btn')?.addEventListener('click', customers.resetForm);
    document.getElementById('span-close-edit-customer-modal')?.addEventListener('click', customers.closeEditCustomerModal);
    document.getElementById('close-edit-customer-modal')?.addEventListener('click', customers.closeEditCustomerModal);
    document.getElementById('update-customer-btn')?.addEventListener('click', customers.updateCustomer);
    document.getElementById('span-close-order-history')?.addEventListener('click', closeHistoryModal);

    initAdminDashboard();
    initCustomers();
    refreshCustomers();
    initOrders();
    initPayments();
    initCustomerDashboard();
    initCustomerPayments();
    initDialogs();


    //Customer Auth 
    document.getElementById('tab-admin')?.addEventListener('click', () => ui.showAuthTab('admin'));
    document.getElementById('tab-customer')?.addEventListener('click', () => ui.showAuthTab('customer'));
    
    //toggle between login and register forms
    document.getElementById('show-register-form-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        ui.toggleAuthMode('register');
    });
    document.getElementById('show-login-form-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        ui.toggleAuthMode('login');
    });

    

    document.getElementById('view-profile-btn')?.addEventListener('click', ui.showCustomerProfileSidebar);
    document.getElementById('close-customer-profile-sidebar')?.addEventListener('click', ui.closeCustomerProfileSidebar);
    document.getElementById('sidebar-overlay')?.addEventListener('click', ui.closeCustomerProfileSidebar);
    document.getElementById('change-password-btn')?.addEventListener('click', ui.showPasswordChangeForm);
    // document.getElementById('submit-password-change-btn')?.addEventListener('click', submitPasswordChange);
    document.getElementById('close-password-change-btn')?.addEventListener('click', ui.cancelPasswordChange);

    customerAuth.initCustomerAuth();
    


}