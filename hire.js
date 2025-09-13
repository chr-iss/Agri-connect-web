// Initialize Supabase with your credentials
const supabaseUrl = 'https://hxkmxesehefhypywbuqz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4a214ZXNlaGVmaHlweXdidXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjMwODEsImV4cCI6MjA3MjgzOTA4MX0.SqEx7_5Mf1AXT1TbEy6gFl5bm2eFS8SITkWXcEJcxSM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Equipment data (in a real app, this would come from Supabase)

// Cart functionality
let cart = [];

// DOM Elements
const equipmentGrid = document.getElementById('equipmentGrid');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const totalAmount = document.getElementById('totalAmount');
const checkoutBtn = document.getElementById('checkoutBtn');
const cartCount = document.getElementById('cartCount');

// Load equipment on page load
document.addEventListener('DOMContentLoaded', function() {
    renderEquipment(equipmentData);
    updateCartUI();
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('agriConnectUser') || sessionStorage.getItem('agriConnectUser'));
    if (user) {
        // Change login/register buttons to profile button
        const authButtons = document.querySelector('.navbar .d-flex');
        authButtons.innerHTML = `
            <a href="cart.html" class="btn btn-outline-light position-relative me-3">
                <i class="fas fa-shopping-cart"></i>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cartCount">${cart.length}</span>
            </a>
            <div class="dropdown">
                <button class="btn btn-outline-light dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown">
                    <i class="fas fa-user me-1"></i> My Account
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
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
    
    // Add event listeners for filters
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // Add event listeners for view toggles
    document.getElementById('gridView').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('listView').classList.remove('active');
        equipmentGrid.className = 'row';
    });
    
    document.getElementById('listView').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('gridView').classList.remove('active');
        equipmentGrid.className = 'row row-cols-1';
    });
});

// Render equipment cards
function renderEquipment(equipment) {
    equipmentGrid.innerHTML = '';
    
    equipment.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';
        
        col.innerHTML = `
            <div class="card">
                <div class="position-relative">
                    <img src="${item.image}" class="card-img-top equipment-img" alt="${item.name}">
                    <span class="price-tag">R${item.price}/hr</span>
                    ${item.available ? 
                        '<span class="badge bg-success badge-availability">Available</span>' : 
                        '<span class="badge bg-danger badge-availability">Unavailable</span>'
                    }
                </div>
                <div class="card-body">
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text">${item.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        ${item.available ? 
                            `<button class="btn btn-primary add-to-cart" data-id="${item.id}">
                                <i class="fas fa-cart-plus me-1"></i> Add to Cart
                            </button>` :
                            `<button class="btn btn-secondary" disabled>
                                <i class="fas fa-times-circle me-1"></i> Not Available
                            </button>`
                        }
                        <a href="equipment-details.html?id=${item.id}" class="btn btn-outline-primary">
                            <i class="fas fa-info-circle me-1"></i> Details
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        equipmentGrid.appendChild(col);
    });
    
    // Add event listeners to Add to Cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const equipmentId = parseInt(this.getAttribute('data-id'));
            addToCart(equipmentId);
        });
    });
    
    // Update equipment count
    document.getElementById('equipmentCount').textContent = `Showing ${equipment.length} items`;
}

// Add item to cart
function addToCart(equipmentId) {
    const equipment = equipmentData.find(item => item.id === equipmentId);
    
    if (equipment) {
        // Check if already in cart
        const existingItem = cart.find(item => item.id === equipmentId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: equipment.id,
                name: equipment.name,
                price: equipment.price,
                image: equipment.image,
                quantity: 1
            });
        }
        
        updateCartUI();
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'position-fixed bottom-0 end-0 p-3';
        toast.style.zIndex = '11';
        toast.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    <strong class="me-auto">Added to Cart</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${equipment.name} has been added to your cart.
                </div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Update cart UI
function updateCartUI() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-muted">Your cart is empty</p>';
        cartTotal.style.display = 'none';
        checkoutBtn.style.display = 'none';
    } else {
        cartItems.innerHTML = '';
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">R${item.price}/hr</small>
                    </div>
                    <div class="quantity-control">
                        <button class="quantity-btn decrease-quantity" data-id="${item.id}">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
                        <button class="quantity-btn increase-quantity" data-id="${item.id}">+</button>
                    </div>
                </div>
            `;
            
            cartItems.appendChild(cartItem);
        });
        
        totalAmount.textContent = `R${total.toFixed(2)}`;
        cartTotal.style.display = 'block';
        checkoutBtn.style.display = 'block';
        
        // Add event listeners to quantity buttons
        document.querySelectorAll('.increase-quantity').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                changeQuantity(id, 1);
            });
        });
        
        document.querySelectorAll('.decrease-quantity').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                changeQuantity(id, -1);
            });
        });
        
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const newQuantity = parseInt(this.value) || 1;
                
                if (newQuantity < 1) {
                    this.value = 1;
                    return;
                }
                
                const item = cart.find(item => item.id === id);
                if (item) {
                    item.quantity = newQuantity;
                    updateCartUI();
                }
            });
        });
    }
    
    // Update cart count in navbar
    cartCount.textContent = cart.length;
}

// Change item quantity
function changeQuantity(equipmentId, change) {
    const item = cart.find(item => item.id === equipmentId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity < 1) {
            // Remove item if quantity is 0
            cart = cart.filter(item => item.id !== equipmentId);
        }
        
        updateCartUI();
    }
}

// Apply filters
function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const price = document.getElementById('priceFilter').value;
    const availability = document.getElementById('availabilityFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    let filteredEquipment = [...equipmentData];
    
    // Apply category filter
    if (category !== 'all') {
        filteredEquipment = filteredEquipment.filter(item => item.category === category);
    }
    
    // Apply price filter
    if (price !== 'all') {
        if (price === '0-500') {
            filteredEquipment = filteredEquipment.filter(item => item.price <= 500);
        } else if (price === '500-1000') {
            filteredEquipment = filteredEquipment.filter(item => item.price > 500 && item.price <= 1000);
        } else if (price === '1000-1500') {
            filteredEquipment = filteredEquipment.filter(item => item.price > 1000 && item.price <= 1500);
        } else if (price === '1500+') {
            filteredEquipment = filteredEquipment.filter(item => item.price > 1500);
        }
    }
    
    // Apply availability filter
    if (availability !== 'all') {
        filteredEquipment = filteredEquipment.filter(item => item.available === true);
    }
    
    // Apply sorting
    if (sortBy === 'name') {
        filteredEquipment.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-low') {
        filteredEquipment.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
        filteredEquipment.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
        // Assuming newer items have higher IDs
        filteredEquipment.sort((a, b) => b.id - a.id);
    }
    
    renderEquipment(filteredEquipment);
}

// Clear filters
function clearFilters() {
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('priceFilter').value = 'all';
    document.getElementById('availabilityFilter').value = 'all';
    document.getElementById('sortBy').value = 'name';
    
    renderEquipment(equipmentData);
}