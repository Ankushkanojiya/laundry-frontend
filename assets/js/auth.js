import { BASE_URL } from './config.js';
import {showMessage} from './ui.js';
import {initializeDashboard} from './adminDashboard.js';
import {showDashboard} from './ui.js'

export async function login() {
    console.log("login initiated");
    const username = document.getElementById('username').value.trim();
    const password=document.getElementById('password').value.trim();

    if (!username || !password) {
        showMessage("Username and password required","error",'login-message');
        return;
    }

    try {
        const response=await fetch(`${BASE_URL}/api/admin/auth/login`,{
            method:"POST",
            headers:{ "Content-Type" : "application/json"},
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if(!response.ok) throw new Error("Login failed - Incorrect username or password");
        const result= await response.json();
        localStorage.setItem('adminToken',result.token);

        // if login successful show admin dashboard
        document.getElementById('auth-section').style.display="none";
        const adminDashboard=document.getElementById('admin-dashboard');
        adminDashboard.classList.remove("hidden");
        adminDashboard.style.display="block";

        initializeDashboard();
        showDashboard();
    } catch (error) {
        showMessage(error.message, 'error', 'login-message');
        console.error('Login error:', error);
    }
}

export function logoutAdmin(){
    try{
    localStorage.removeItem('adminToken');
    localStorage.removeItem('sidebarCollapsed');
    window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
        window.location.reload();   
    }
}


export function getAdminAuthHeaders(){
    const adminToken=localStorage.getItem("adminToken");
    return{
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json"
    }
}

export function getCustomerAuthHeaders(){
    const customerToken=localStorage.getItem("customerToken");
    return{
        "Authorization": `Bearer ${customerToken}`,
        "Content-Type" : "application/json"
    }
}

export function getHeaders(){
    const getToken=localStorage.getItem("adminToken")||localStorage.getItem("customerToken");
    if(!getToken) throw new Error("No authentication token found");
    return{
        "Authorization" : `Bearer ${getToken}`,
        "Content-Type" : "application/json"
    }
}
