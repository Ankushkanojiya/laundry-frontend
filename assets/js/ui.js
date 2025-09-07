import { loadStats, loadDashboardPendingOrders } from './adminDashboard.js';
import {refreshCustomers} from './customers.js';
import { loadCustomersForOrders , populateCustomerFilter,refreshOrders} from './orders.js';
import { refreshPayments } from './payments.js';
import { customerPayments } from './customerPayments.js';
import { loadInsights } from './insights.js';

export function showMessage(message, type = 'info', elementId = 'action-message') {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.textContent = message;
    element.className = type;

    // Auto-clear success messages after 3 seconds for better UX.
    if (type === 'success') {
        setTimeout(() => {
            if (element.textContent === message) {
                element.textContent = '';
                element.className = '';
            }
        }, 3000);
    }
}

function highlightInputError(elementId) {
    const inputElement = document.getElementById(elementId);
    if (!inputElement) return;

    inputElement.classList.add('input-error');

    // Clear error after 3 seconds
    setTimeout(() => {
        inputElement.classList.remove('input-error');
    }, 3000);
}

export const highlightDuplicatePhone = () => highlightInputError('customer-phone');
export const highlightCustomerSelect = () => highlightInputError('customer-select');
export const highlightClothCountInput = () => highlightInputError('cloth-count');

export function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.classList.toggle('active');
}

export function closeSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.classList.remove('active');
}

export function hideAllSections() {
    const sections = [
        'stats-cards',
        'add-customer-section',
        'take-order-section',
        'manage-customers-section',
        'manage-order-section',
        'payments-section',
        'customer-payment-section',
        'insights-section'
    ];

    // Hide all sections
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('hidden');
            section.style.display = 'none';
        }
    });

    // Also hide the dashboard pending table section
    const dashboardTableSection = document.getElementById('dashboard-pending-table-section');
    if (dashboardTableSection) {
        dashboardTableSection.classList.add('hidden');
        dashboardTableSection.style.display = 'none';
    }

    // Close all open modals and popups
    const modalsAndPopups = [
        'order-popup',
        'edit-customer-modal',
        'customer-order-history',
        'payment-modal',
        'payment-transaction-history',
        'invoice-modal'
    ];
    
    modalsAndPopups.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('modal--active');
        }
    });

    // Remove active state from all nav buttons
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(button => {
        button.classList.remove('active');
    });
}


function setActiveNavItem(activeItemText) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        // Clean the text content to remove emojis and extra whitespace for a reliable match.
        const itemText = item.textContent.replace(/[^\x20-\x7E]/g, '').trim();
        if (itemText === activeItemText) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Helper function to show a section and set its nav button active
export function showSection(sectionId, navText) {
    
    hideAllSections();

    // Show the selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
        section.style.display = sectionId === 'stats-cards' ? 'grid' : 'block';
    }

    // If showing dashboard (stats-cards), also show the pending orders table section
    if (sectionId === 'stats-cards') {
        const dashboardTableSection = document.getElementById('dashboard-pending-table-section');
        console.log("🔍 Dashboard table section found:", !!dashboardTableSection);
        if (dashboardTableSection) {
            dashboardTableSection.classList.remove('hidden');
            dashboardTableSection.style.display = 'block';
            console.log("✅ Dashboard table section is now visible");
        } else {
            console.error("❌ Dashboard table section not found!");
        }
    }

    // Make sure main content is visible
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'block';
    }

    // Set active state on the sidebar button
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const itemContent = item.textContent.trim();
        const itemText = itemContent.replace(/[^\x20-\x7E]/g, '').trim(); // Remove emojis and keep only printable ASCII
        const buttonText = navText.trim();

        if (itemText === buttonText) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    closeSidebar();
}

export function showDashboard() {
    showSection('stats-cards', 'Dashboard');
    loadStats();
    loadDashboardPendingOrders();
}

export function showTakeOrder() {
    showSection('take-order-section', 'Take Order');
    loadCustomersForOrders();
}

export function showAddCustomer() {
    showSection('add-customer-section', 'Add Customer');
}

export function showManageCustomers() {
    showSection('manage-customers-section', 'Manage Customers');
    refreshCustomers();
}

export async function showManageOrders() {
    showSection('manage-order-section', 'Show Orders');
    await populateCustomerFilter();
    await refreshOrders();
}

export function showPayments() {
    showSection('payments-section', 'Payments');
    refreshPayments();
}

export function showCustomerPayments() {
    showSection('customer-payment-section', 'Customer Payments');
    customerPayments();
}

export function showInsights() {
    showSection('insights-section', 'Insights');
    loadInsights();
}

// This function handles switching between the Admin and Customer forms.
export function showAuthTab(type) {
    const adminForm = document.getElementById('admin-form');
    const customerForm = document.getElementById('customer-form');
    const adminTab = document.getElementById('tab-admin');
    const customerTab = document.getElementById('tab-customer');

    if (type === 'admin') {
        adminForm.classList.remove('hidden');
        customerForm.classList.add('hidden');
        adminTab.classList.add('active-tab');
        customerTab.classList.remove('active-tab');
    } else {
        customerForm.classList.remove('hidden');
        adminForm.classList.add('hidden');
        customerTab.classList.add('active-tab');
        adminTab.classList.remove('active-tab');
        toggleAuthMode('login'); // Default to login view
    }
}

// This function handles toggling between Login and Register inside the Customer form.
export function toggleAuthMode(mode) {
    const loginSection = document.getElementById('customer-login-section');
    const registerSection = document.getElementById('customer-register-section');

    if (mode === 'login') {
        loginSection.classList.remove('hidden');
        registerSection.classList.add('hidden');
    } else {
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    }
    showMessage('', 'clear', 'customer-auth-message');
}

export function showCustomerProfileSidebar() {
    const sidebar = document.getElementById("customer-profile-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar || !overlay) return;

    sidebar.classList.remove("hidden");
    overlay.classList.remove("hidden");

    requestAnimationFrame(() => sidebar.classList.add("active"));

    document.getElementById("profile-customer-name").textContent = localStorage.getItem("customerName") || "N/A";
    document.getElementById("profile-customer-phone").textContent = localStorage.getItem("customerPhone") || "N/A";

    cancelPasswordChange(); // Reset form to default state
}

export function closeCustomerProfileSidebar() {
    const sidebar = document.getElementById("customer-profile-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (!sidebar || !overlay) return;

    sidebar.classList.remove("active");
    overlay.classList.add("hidden");

    setTimeout(() => sidebar.classList.add("hidden"), 300);
}

export function showPasswordChangeForm() {
    document.getElementById("password-change-form")?.classList.remove("hidden");
    document.getElementById("change-password-btn")?.classList.add("hidden");
}

export function cancelPasswordChange() {
    const form = document.getElementById("password-change-form");
    if (form) {
        form.classList.add("hidden");
         
    }
    document.getElementById("change-password-btn")?.classList.remove("hidden");
    showMessage('', 'clear', "customer-profile-message");
    const messageBox = document.getElementById("customer-profile-message");
    if (messageBox) {
        messageBox.textContent = "";
        messageBox.className = "message"; 
    }
}

export function showProfileMessage(message, type = "error") {
    const messageBox = document.getElementById('customer-profile-message');
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.style.color = type === "success" ? "green" : "red";
}