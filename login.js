// Initialize Supabase
const supabaseUrl = 'https://hxkmxesehefhypywbuqz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4a214ZXNlaGVmaHlweXdidXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjMwODEsImV4cCI6MjA3MjgzOTA4MX0.SqEx7_5Mf1AXT1TbEy6gFl5bm2eFS8SITkWXcEJcxSM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const loginButton = document.getElementById('loginButton');
const loginText = document.getElementById('loginText');
const loginSpinner = document.getElementById('loginSpinner');
const errorAlert = document.getElementById('errorAlert');
const successAlert = document.getElementById('successAlert');
const forgotPasswordLink = document.getElementById('forgotPassword');
const registerLink = document.getElementById('registerLink');
const adminLoginLink = document.getElementById('adminLoginLink');

// Toggle password visibility
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle eye icon
    const eyeIcon = this.querySelector('i');
    eyeIcon.classList.toggle('fa-eye');
    eyeIcon.classList.toggle('fa-eye-slash');
});

// Handle form submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const email = emailInput.value;
    const password = passwordInput.value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate inputs
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Show loading state
    loginText.textContent = 'Signing in...';
    loginSpinner.style.display = 'inline-block';
    loginButton.disabled = true;
    
    try {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        // Success
        showSuccess('Login successful! Redirecting...');
        
        // Store user session if "Remember me" is checked
        if (rememberMe) {
            localStorage.setItem('agriConnectUser', JSON.stringify(data.user));
        } else {
            sessionStorage.setItem('agriConnectUser', JSON.stringify(data.user));
        }
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        showError(error.message);
    } finally {
        // Reset button state
        loginText.textContent = 'Sign In';
        loginSpinner.style.display = 'none';
        loginButton.disabled = false;
    }
});

// Forgot password handler
forgotPasswordLink.addEventListener('click', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value;
    if (!email) {
        showError('Please enter your email address first');
        return;
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html',
        });
        
        if (error) throw error;
        
        showSuccess('Password reset instructions sent to your email');
    } catch (error) {
        showError(error.message);
    }
});

// Register link handler
registerLink.addEventListener('click', function(e) {
    e.preventDefault();
    // Redirect to registration page
    window.location.href = 'register.html';
});

// Admin login link handler
adminLoginLink.addEventListener('click', function(e) {
    e.preventDefault();
    // Redirect to admin login page
    window.location.href = 'admin-login.html';
});

// Show error message
function showError(message) {
    errorAlert.textContent = message;
    errorAlert.style.display = 'block';
    successAlert.style.display = 'none';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorAlert.style.display = 'none';
    }, 5000);
}

// Show success message
function showSuccess(message) {
    successAlert.textContent = message;
    successAlert.style.display = 'block';
    errorAlert.style.display = 'none';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        successAlert.style.display = 'none';
    }, 5000);
}

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('agriConnectUser') || sessionStorage.getItem('agriConnectUser'));
    if (user) {
        // User is already logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
    }
    
    // Pre-fill email if available
    const savedEmail = localStorage.getItem('agriConnectEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
        document.getElementById('rememberMe').checked = true;
    }
});

// Save email if "Remember me" is checked
document.getElementById('rememberMe').addEventListener('change', function() {
    if (this.checked && emailInput.value) {
        localStorage.setItem('agriConnectEmail', emailInput.value);
    } else {
        localStorage.removeItem('agriConnectEmail');
    }
});