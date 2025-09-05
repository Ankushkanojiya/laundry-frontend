import { BASE_URL } from "./config.js";
import { showMessage } from "./ui.js";
import { loadCustomerDashboard } from "./customerDashboard.js";

export function initCustomerAuth() {
    document.getElementById('register-customer-btn')?.addEventListener('click', registerCustomer);
    document.getElementById('login-customer-btn')?.addEventListener('click', loginCustomer);
}

export async function registerCustomer() {
    console.log("Customer registration initiated");
    const phone=document.getElementById('customer-phone-register').value.trim();
    const password=document.getElementById('customer-password-register').value.trim();

    if (!phone || !password) {
        showMessage("Phone and password are required.", "error", "customer-auth-message");
        return;
    }
    if (!/^\d{10}$/.test(phone)) {
        showMessage("Please enter a valid 10-digit phone number.", "error", "customer-auth-message");
        return;
    }

    try{
        const response=await fetch(`${BASE_URL}/api/customer-auth/register`,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: phone, password: password })
        });

        if (!response.ok) {
            throw new Error("Contact your admin to registeration");
        }

        const message=await response.text();
        showMessage(message, "success", "customer-auth-message");
    }catch(error){
        showMessage("An error occurred. Please try again.", "error", "customer-auth-message");
        console.error("Registration error:", error);
    }

}

export async function loginCustomer(){
    console.log("Customer login initiated");
    const phone=document.getElementById('customer-phone-login').value.trim();
    const password=document.getElementById('customer-password-login').value.trim();
    if (!phone || !password) {
        showMessage("Phone and password are required.", "error", "customer-auth-message");
        return;
    }
    try {
        const response=await fetch(`${BASE_URL}/api/customer-auth/login`,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: phone, password: password })
        });
        if (!response.ok) {
            showMessage("Login failed. Please check your credentials.", "error", "customer-auth-message");
            return;
        }
        const result=await response.json();
        localStorage.setItem('customerToken',result.token);
        localStorage.setItem('customerId',result.customerId);
        localStorage.setItem('customerName',result.customerName);
        localStorage.setItem('customerPhone',phone);

        document.getElementById("auth-section").classList.add("hidden");
        document.getElementById("customer-dashboard").classList.remove("hidden");

        loadCustomerDashboard(result.customerId)
    } catch (error) {
        showMessage("An error occurred. Please try again.", "error", "customer-auth-message");
    }
}

export function getCustomerAuthHeaders(){
    const customerToken=localStorage.getItem("customerToken");
    return{
        "Authorization": `Bearer ${customerToken}`,
        "Content-Type" : "application/json"
    }
}

export function logoutCustomer() {
    localStorage.clear(); // Clears all admin and customer data
    window.location.reload();
}