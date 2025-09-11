// Simple counter animation for stats
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start) + "+";
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Check if user is logged in and update UI accordingly
function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem('agriConnectUser') || sessionStorage.getItem('agriConnectUser'));
    if (user) {
        // Change login/register buttons to profile button
        const authButtons = document.querySelector('.navbar .d-flex');
        authButtons.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
                    <i class="fas fa-user me-1"></i> My Account
                </button>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="dashboard.html">Dashboard</a></li>
                    <li><a class="dropdown-item" href="profile.html">Profile</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logoutButton">Logout</a></li>
                </ul>
            </div>
        `;
        
        // Add logout functionality
        document.getElementById('logoutButton').addEventListener('click', function() {
            localStorage.removeItem('agriConnectUser');
            sessionStorage.removeItem('agriConnectUser');
            window.location.reload();
        });
    }
}

// Start animations when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    checkAuthStatus();
    
    // Animate stats counters
    setTimeout(() => {
        animateValue("equipmentCount", 0, 250, 2000);
        animateValue("farmersCount", 0, 5000, 2000);
        animateValue("produceCount", 0, 120, 2000);
        animateValue("locationsCount", 0, 25, 2000);
    }, 500);
});