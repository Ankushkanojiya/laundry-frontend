import { BASE_URL } from "./config.js";
import {showMessage , showProfileMessage}from "./ui.js";
import { loadCustomerDashboard } from "./customerDashboard.js";

export function initCustomerAuth() {
    document.getElementById('register-customer-btn')?.addEventListener('click', registerCustomer);
    document.getElementById('login-customer-btn')?.addEventListener('click', loginCustomer);
    document.getElementById('submit-password-change-btn')?.addEventListener('click', submitPasswordChange);
    document.getElementById('logout-customer-btn')?.addEventListener('click', logoutCustomer);
    
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
            throw new Error("You are already registered. Please log in.");
        }

        const message=await response.text();
        showMessage(message, "success", "customer-auth-message");
        return true;
    }catch(error){
        showMessage("Contact your admin to registeration", "error", "customer-auth-message");
        console.error("Registration error:", error);
    }

}

export function isCustomerLoggedIn(){
    const customerToken=localStorage.getItem("customerToken");
    return !!customerToken;
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

        // document.getElementById("auth-section").classList.add("hidden");
        // document.getElementById("customer-dashboard").classList.remove("hidden");

        // loadCustomerDashboard(result.customerId)
        return true;
    } catch (error) {
        showMessage("An error occurred. Please try again.", "error", "customer-auth-message");
        return false;
    }
}

export function getCustomerAuthHeaders(){
    const customerToken=localStorage.getItem("customerToken");
    return{
        "Authorization": `Bearer ${customerToken}`,
        "Content-Type" : "application/json"
    }
}

export async function validateCustomerToken() {
    const token = localStorage.getItem("customerToken");
    const customerId = localStorage.getItem("customerId");
    
    if (!token || !customerId) {
        return false;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/api/payments/${customerId}/balance`, {
            method: "GET",
            headers: getCustomerAuthHeaders()
        });
        
        // If the request is successful, the token is valid
        return response.ok;
    } catch (error) {
        console.error("Token validation error:", error);
        return false;
    }
}

export async function submitPasswordChange() {
    console.log("Password change initiated");
    const old_password = document.getElementById('old_password').value.trim();
    const new_password = document.getElementById("new_password").value.trim();

    if (!old_password || !new_password) {
        showProfileMessage("Please fill both fields", "error");
        return;
    }

    if (new_password.length < 6) {
        showProfileMessage("New password must be at least 6 characters long", "error");
        return;
    }

    // Show loading message for 2 seconds
    showProfileMessage("Updating password...", "info");
    
    try {
        console.log("inside backend");
        const response = await fetch(`${BASE_URL}/api/customer-auth/me/changePassword`, {
            method: 'PATCH',
            headers: getCustomerAuthHeaders(),
            body: JSON.stringify({ oldPassword: old_password, newPassword: new_password })
        });

        const msg = await response.text();
        console.log(msg);

        if (response.ok) {
            // Show success toast message for 3 seconds
            showProfileMessage("Your password successfully changed! Please log in again.", "success");
            
            // Clear form fields immediately
            const oldPasswordField = document.getElementById("old_password");
            const newPasswordField = document.getElementById("new_password");
            if (oldPasswordField) oldPasswordField.value = "";
            if (newPasswordField) newPasswordField.value = "";

            // Wait 3 seconds before hiding the form so user can see the success message
            setTimeout(() => {
                const passwordForm = document.getElementById("password-change-form");
                const changePasswordBtn = document.getElementById("change-password-btn");
                
                if (passwordForm) passwordForm.classList.add("hidden");
                if (changePasswordBtn) changePasswordBtn.classList.remove("hidden");
                
                // Clear the success message after hiding the form
                const messageElement = document.getElementById("customer-profile-message");
                if (messageElement) {
                    messageElement.textContent = "";
                    messageElement.style.color = "";
                }
            }, 3000);
        } else {
            showProfileMessage(msg, "error");
        }
    } catch(RuntimeError) {
        showProfileMessage("An error occurred. Please try again.", "error");
    }
}
export function logoutCustomer() {
    localStorage.clear(); // Clears all admin and customer data
    window.location.reload();
}