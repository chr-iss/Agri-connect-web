// Initialize Supabase with your credentials
const supabaseUrl = 'https://hxkmxesehefhypywbuqz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4a214ZXNlaGVmaHlweXdidXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjMwODEsImV4cCI6MjA3MjgzOTA4MX0.SqEx7_5Mf1AXT1TbEy6gFl5bm2eFS8SITkWXcEJcxSM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let userData = null;
let dashboardData = {};

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuthStatus();

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('sidebarLogoutBtn').addEventListener('click', logout);

    await loadDashboardData();
});

// Check authentication status
async function checkAuthStatus() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (user) {
            userData = user;
            await loadUserProfile(user.id);
        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Auth error:', error);
        window.location.href = 'login.html';
    }
}

// Load user profile
async function loadUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;

        if (data) {
            const name = data.full_name || userData.email;
            document.getElementById('userName').textContent = name;
            document.getElementById('welcomeUserName').textContent = name;
            document.getElementById('greetingUserName').textContent = name;

            if (data.avatar_url) {
                document.getElementById('userAvatar').src = data.avatar_url;
                document.getElementById('userProfileImage').src = data.avatar_url;
            }
        }
    } catch (error) {
        console.error('Profile load error:', error);
    }
}

// Logout
async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// Load dashboard data dynamically
async function loadDashboardData() {
    try {
        // Active Rentals
        const { data: activeRentals, error: rentalsError } = await supabase
            .from('rentals')
            .select('*')
            .eq('user_id', userData.id)
            .eq('status', 'active');
        if (rentalsError) throw rentalsError;

        // Monthly Revenue (sum of completed rentals this month)
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const { data: revenueData, error: revenueError } = await supabase
            .from('rentals')
            .select('price')
            .eq('user_id', userData.id)
            .eq('status', 'completed')
            .gte('end_date', monthStart.toISOString());
        if (revenueError) throw revenueError;

        // Average Rating
        const { data: ratings, error: ratingError } = await supabase
            .from('equipment')
            .select('rating')
            .eq('user_id', userData.id);
        if (ratingError) throw ratingError;

        // Upcoming Bookings
        const now = new Date().toISOString();
        const { data: upcomingBookings, error: bookingsError } = await supabase
            .from('rentals')
            .select('*')
            .eq('user_id', userData.id)
            .gte('start_date', now);
        if (bookingsError) throw bookingsError;

        dashboardData = {
            activeRentals: activeRentals.length,
            monthlyRevenue: revenueData.reduce((sum, r) => sum + r.price, 0),
            averageRating: ratings.length ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : 0,
            upcomingBookings: upcomingBookings.length
        };

        updateStatsUI();
        await loadCharts();
        await loadRecentActivity();
        await loadPopularEquipment();

    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// Update stats cards
function updateStatsUI() {
    document.getElementById('statActiveRentals').textContent = dashboardData.activeRentals;
    document.getElementById('statMonthlyRevenue').textContent = `R${dashboardData.monthlyRevenue.toLocaleString()}`;
    document.getElementById('statAverageRating').textContent = dashboardData.averageRating;
    document.getElementById('statUpcomingBookings').textContent = dashboardData.upcomingBookings;

    document.getElementById('activeRentalsCount').textContent = dashboardData.activeRentals;
    document.getElementById('pendingRequestsCount').textContent = Math.ceil(dashboardData.activeRentals / 2);
    document.getElementById('monthlyRevenue').textContent = dashboardData.monthlyRevenue.toLocaleString();
}

// Load charts dynamically
async function loadCharts() {
    // Revenue Chart - last 12 months
    const revenueMonthly = await fetchRevenueLast12Months();

    new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
            labels: revenueMonthly.map(d => d.month),
            datasets: [{
                label: 'Monthly Revenue (R)',
                data: revenueMonthly.map(d => d.total),
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderColor: '#4CAF50',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: { responsive: true }
    });

    // Equipment Usage Chart
    const { data: equipmentUsage } = await supabase
        .from('equipment')
        .select('name,status');
    const counts = { Available: 0, Booked: 0, Maintenance: 0 };
    equipmentUsage.forEach(e => counts[e.status] = (counts[e.status] || 0) + 1);

    new Chart(document.getElementById('equipmentChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
            }]
        },
        options: { responsive: true }
    });
}

// Fetch revenue for last 12 months
async function fetchRevenueLast12Months() {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ year: d.getFullYear(), monthIndex: d.getMonth(), month: d.toLocaleString('default', { month: 'short' }) });
    }

    const revenueMonthly = await Promise.all(months.map(async m => {
        const start = new Date(m.year, m.monthIndex, 1).toISOString();
        const end = new Date(m.year, m.monthIndex + 1, 0, 23, 59, 59).toISOString();
        const { data, error } = await supabase
            .from('rentals')
            .select('price')
            .eq('user_id', userData.id)
            .eq('status', 'completed')
            .gte('end_date', start)
            .lte('end_date', end);
        if (error) console.error(error);
        const total = data ? data.reduce((sum, r) => sum + r.price, 0) : 0;
        return { month: m.month, total };
    }));

    return revenueMonthly;
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('user_id', userData.id)
            .order('created_at', { ascending: false })
            .limit(5);
        if (error) throw error;

        renderRecentActivity(data);
    } catch (error) {
        console.error('Recent activity load error:', error);
    }
}

// Render recent activity
function renderRecentActivity(activities) {
    const container = document.getElementById('recentActivityContainer');
    if (!activities.length) {
        container.innerHTML = `<p class="text-muted text-center py-4">No recent activity</p>`;
        return;
    }

    container.innerHTML = activities.map(a => `
        <div class="activity-item">
            <div class="activity-icon" style="background-color: #4CAF5020; color: #4CAF50;">
                <i class="fas fa-bell"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${a.title}</div>
                <p class="activity-desc">${a.description}</p>
                <div class="activity-time">${new Date(a.created_at).toLocaleString()}</div>
            </div>
        </div>
    `).join('') + `<div class="text-center mt-3"><a href="activities.html" class="btn btn-outline-primary">View All Activity</a></div>`;
}

// Load popular equipment
async function loadPopularEquipment() {
    try {
        const { data, error } = await supabase
            .from('equipment')
            .select('*')
            .order('rating', { ascending: false })
            .limit(4);
        if (error) throw error;

        renderPopularEquipment(data);
    } catch (error) {
        console.error('Popular equipment load error:', error);
    }
}

// Render popular equipment
function renderPopularEquipment(equipment) {
    const container = document.getElementById('popularEquipmentContainer');
    if (!equipment.length) {
        container.innerHTML = `<p class="text-muted text-center py-4">No equipment listed</p>`;
        return;
    }

    container.innerHTML = equipment.map(item => `
        <div class="col-md-6 mb-4">
            <div class="equipment-card">
                <div class="position-relative">
                    <img src="${item.image_url}" class="equipment-img w-100" alt="${item.name}">
                    <span class="status-badge badge bg-${item.status === 'Available' ? 'success' : item.status === 'Booked' ? 'warning' : 'secondary'}">${item.status}</span>
                </div>
                <div class="p-3">
                    <h5 class="mb-1">${item.name}</h5>
                    <p class="mb-2 text-muted">${item.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold">R${item.price.toLocaleString()}</span>
                        <span class="text-warning">${'★'.repeat(Math.floor(item.rating))}${item.rating % 1 >= 0.5 ? '½' : ''}</span>
                    </div>
                    <a href="hire.html?equipment=${item.id}" class="btn btn-primary btn-sm mt-2 w-100">Rent Now</a>
                </div>
            </div>
        </div>
    `).join('');
}
