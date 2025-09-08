// Initialize Supabase with your credentials
const supabaseUrl = 'https://hxkmxesehefhypywbuqz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4a214ZXNlaGVmaHlweXdidXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjMwODEsImV4cCI6MjA3MjgzOTA4MX0.SqEx7_5Mf1AXT1TbEy6gFl5bm2eFS8SITkWXcEJcxSM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const registerForm = document.getElementById('registerForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const cellphoneInput = document.getElementById('cellphone');
const addressInput = document.getElementById('address');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const registerButton = document.getElementById('registerButton');
const registerText = document.getElementById('registerText');
const registerSpinner = document.getElementById('registerSpinner');
const errorAlert = document.getElementById('errorAlert');
const successAlert = document.getElementById('successAlert');
const passwordStrengthBar = document.getElementById('passwordStrengthBar');
const passwordFeedback = document.getElementById('passwordFeedback');
const confirmPasswordFeedback = document.getElementById('confirmPasswordFeedback');

// Password requirements elements
const lengthReq = document.getElementById('lengthReq');
const lowercaseReq = document.getElementById('lowercaseReq');
const uppercaseReq = document.getElementById('uppercaseReq');
const numberReq = document.getElementById('numberReq');
const specialReq = document.getElementById('specialReq');

// Toggle password visibility
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle eye icon
    const eyeIcon = this.querySelector('i');
    eyeIcon.classList.toggle('fa-eye');
    eyeIcon.classList.toggle('fa-eye-slash');
});

// Toggle confirm password visibility
toggleConfirmPassword.addEventListener('click', function() {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
    
    // Toggle eye icon
    const eyeIcon = this.querySelector('i');
    eyeIcon.classList.toggle('fa-eye');
    eyeIcon.classList.toggle('fa-eye-slash');
});

// Validate password strength
passwordInput.addEventListener('input', function() {
    const password = this.value;
    checkPasswordStrength(password);
    validateConfirmPassword();
});

// Validate confirm password
confirmPasswordInput.addEventListener('input', validateConfirmPassword);

// Validate cellphone format
cellphoneInput.addEventListener('input', function() {
    const cellphone = this.value;
    
    // Basic validation for South African numbers (can be adjusted for other regions)
    if (cellphone && !/^0[0-9]{9}$/.test(cellphone)) {
        this.setCustomValidity('Please enter a valid cellphone number (e.g., 0123456789)');
    } else {
        this.setCustomValidity('');
    }
});

// Handle form submission
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form values
    const fullName = fullNameInput.value;
    const email = emailInput.value;
    const cellphone = cellphoneInput.value;
    const address = addressInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validate inputs
    if (!fullName || !email || !cellphone || !address || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    // Validate password strength
    const strength = checkPasswordStrength(password);
    if (strength < 3) {
        showError('Please choose a stronger password');
        return;
    }
    
    // Show loading state
    registerText.textContent = 'Creating account...';
    registerSpinner.style.display = 'inline-block';
    registerButton.disabled = true;
    
    try {
        // Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    cellphone: cellphone,
                    address: address
                }
            }
        });
        
        if (authError) {
            throw authError;
        }
        
        // If successful, insert user data into the users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([
                {
                    id: authData.user.id,
                    email: email,
                    name: fullName,
                    cellphone: cellphone,
                    address: address,
                    password: password // Note: In a real app, you wouldn't store plain text passwords
                }
            ]);
        
        if (userError) {
            throw userError;
        }
        
        // Success
        showSuccess('Account created successfully! Please check your email to verify your account.');
        
        // Clear form
        registerForm.reset();
        resetPasswordRequirements();
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
        
    } catch (error) {
        showError(error.message);
    } finally {
        // Reset button state
        registerText.textContent = 'Create Account';
        registerSpinner.style.display = 'none';
        registerButton.disabled = false;
    }
});

// Check password strength
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = '';
    
    // Reset requirements
    resetPasswordRequirements();
    
    // Check password length
    if (password.length >= 8) {
        strength += 1;
        showRequirementValid(lengthReq);
    } else {
        showRequirementInvalid(lengthReq);
    }
    
    // Check for lowercase letters
    if (/[a-z]/.test(password)) {
        strength += 1;
        showRequirementValid(lowercaseReq);
    } else {
        showRequirementInvalid(lowercaseReq);
    }
    
    // Check for uppercase letters
    if (/[A-Z]/.test(password)) {
        strength += 1;
        showRequirementValid(uppercaseReq);
    } else {
        showRequirementInvalid(uppercaseReq);
    }
    
    // Check for numbers
    if (/[0-9]/.test(password)) {
        strength += 1;
        showRequirementValid(numberReq);
    } else {
        showRequirementInvalid(numberReq);
    }
    
    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) {
        strength += 1;
        showRequirementValid(specialReq);
    } else {
        showRequirementInvalid(specialReq);
    }
    
    // Update strength bar
    const strengthPercent = (strength / 5) * 100;
    passwordStrengthBar.style.width = strengthPercent + '%';
    
    // Set color based on strength
    if (strength <= 2) {
        passwordStrengthBar.className = 'progress-bar bg-danger';
        feedback = 'Weak password';
    } else if (strength <= 4) {
        passwordStrengthBar.className = 'progress-bar bg-warning';
        feedback = 'Medium strength password';
    } else {
        passwordStrengthBar.className = 'progress-bar bg-success';
        feedback = 'Strong password';
    }
    
    passwordFeedback.textContent = feedback;
    return strength;
}

// Validate confirm password
function validateConfirmPassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordFeedback.textContent = 'Passwords do not match';
        confirmPasswordFeedback.className = 'password-feedback text-danger';
        confirmPasswordInput.setCustomValidity('Passwords do not match');
    } else if (confirmPassword) {
        confirmPasswordFeedback.textContent = 'Passwords match';
        confirmPasswordFeedback.className = 'password-feedback text-success';
        confirmPasswordInput.setCustomValidity('');
    } else {
        confirmPasswordFeedback.textContent = '';
        confirmPasswordInput.setCustomValidity('');
    }
}

// Show requirement as valid
function showRequirementValid(element) {
    const validIcon = element.querySelector('.fa-check-circle.valid');
    const invalidIcon = element.querySelector('.fa-times-circle.invalid');
    validIcon.style.display = 'inline';
    invalidIcon.style.display = 'none';
    element.className = 'requirement valid';
}

// Show requirement as invalid
function showRequirementInvalid(element) {
    const validIcon = element.querySelector('.fa-check-circle.valid');
    const invalidIcon = element.querySelector('.fa-times-circle.invalid');
    validIcon.style.display = 'none';
    invalidIcon.style.display = 'inline';
    element.className = 'requirement invalid';
}

// Reset password requirements
function resetPasswordRequirements() {
    passwordStrengthBar.style.width = '0%';
    passwordStrengthBar.className = 'progress-bar';
    passwordFeedback.textContent = '';
    
    const requirements = [lengthReq, lowercaseReq, uppercaseReq, numberReq, specialReq];
    requirements.forEach(req => {
        const validIcon = req.querySelector('.fa-check-circle.valid');
        const invalidIcon = req.querySelector('.fa-times-circle.invalid');
        validIcon.style.display = 'none';
        invalidIcon.style.display = 'none';
        req.className = 'requirement';
    });
}

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