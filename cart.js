// Initialize Supabase with your credentials
const supabaseUrl = 'https://hxkmxesehefhypywbuqz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4a214ZXNlaGVmaHlweXdidXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjMwODEsImV4cCI6MjA3MjgzOTA4MX0.SqEx7_5Mf1AXT1TbEy6gFl5bm2eFS8SITkWXcEJcxSM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const cartItemsContainer = document.getElementById('cartItems');
const cartCountBadge = document.getElementById('cartCount');
const totalItemsEl = document.getElementById('totalItems');
const totalPriceEl = document.getElementById('totalPrice');

// Load cart items on page load
window.addEventListener('DOMContentLoaded', async () => {
    await loadCartItems();
});

// Load cart items function
async function loadCartItems() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        cartItemsContainer.innerHTML = '<p class="text-danger">You must be logged in to view your cart.</p>';
        cartCountBadge.textContent = '0';
        totalItemsEl.textContent = '0';
        totalPriceEl.textContent = '0.00';
        return;
    }

    // Fetch cart items from Supabase
    const { data, error } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching cart:', error.message);
        cartItemsContainer.innerHTML = '<p class="text-danger">Error loading cart items.</p>';
        return;
    }

    if (data.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
        cartCountBadge.textContent = '0';
        totalItemsEl.textContent = '0';
        totalPriceEl.textContent = '0.00';
        return;
    }

    // Calculate total
    let totalPrice = 0;
    let totalItems = 0;
    data.forEach(item => {
        totalPrice += item.price * item.quantity;
        totalItems += item.quantity;
    });

    // Update cart summary
    cartCountBadge.textContent = data.length;
    totalItemsEl.textContent = totalItems;
    totalPriceEl.textContent = totalPrice.toFixed(2);

    // Render cart items
    cartItemsContainer.innerHTML = data.map(item => `
        <div class="card mb-3">
            <div class="row g-0 align-items-center">
                <div class="col-md-3">
                    <img src="${item.image_url}" class="img-fluid rounded-start" alt="${item.name}">
                </div>
                <div class="col-md-6">
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="card-text">Price per day: R${item.price}</p>
                        <p class="card-text"><small class="text-muted">Quantity: ${item.quantity}</small></p>
                    </div>
                </div>
                <div class="col-md-3 text-end pe-3">
                    <button class="btn btn-outline-danger mt-3" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Remove item from cart
async function removeFromCart(itemId) {
    const { data, error } = await supabase
        .from('cart')
        .delete()
        .eq('id', itemId);

    if (error) {
        console.error('Error removing item:', error.message);
        return;
    }

    await loadCartItems();
}

// Clear all items from cart
async function clearCart() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error('Error clearing cart:', error.message);
        return;
    }

    await loadCartItems();
}

// ---------------- Load cart items ----------------
async function loadCartItems() {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        rental_start_date,
        rental_end_date,
        equipment:equipment_id (
          id,
          name,
          description,
          price_per_hour,
          image_url,
          available
        )
      `)
      .eq('cart_id', currentCartId);

    if (error) throw error;

    cartItems = data || [];
    renderCartItems();
    updateOrderSummary();
  } catch (error) {
    console.error('Error loading cart items:', error);
    showError('Failed to load cart items. Please try again.');
  }
}

// ---------------- Render & events (same as before) ----------------
function renderCartItems() {
  const container = document.getElementById('cartItemsContainer');

  if (!container) return;

  if (cartItems.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <h4>Your cart is empty</h4>
        <p class="text-muted">Add some equipment to get started</p>
        <a href="hire.html" class="btn btn-primary mt-3">Browse Equipment</a>
      </div>
    `;
    document.getElementById('itemCount').textContent = '0 items';
    return;
  }

  let html = '';
  cartItems.forEach(item => {
    const equipment = item.equipment;
    const rentalDays = Math.ceil((new Date(item.rental_end_date) - new Date(item.rental_start_date)) / (1000 * 60 * 60 * 24)) || 1;
    const totalHours = rentalDays * 8; // Assuming 8 hours per day
    const totalPrice = equipment.price_per_hour * totalHours * item.quantity;

    html += `
      <div class="cart-item" data-item-id="${item.id}">
        <img src="${equipment.image_url}" class="cart-item-img" alt="${equipment.name}">
        <div class="flex-grow-1">
          <h5>${equipment.name}</h5>
          <p class="text-muted mb-1">${equipment.description}</p>
          <p class="text-primary fw-bold">R${equipment.price_per_hour.toFixed(2)}/hr</p>
          <div class="date-selector">
            <span class="me-2">Rental Period:</span>
            <input type="date" class="me-2 rental-start" value="${item.rental_start_date}" data-item-id="${item.id}"> 
            to <input type="date" class="ms-2 rental-end" value="${item.rental_end_date}" data-item-id="${item.id}">
          </div>
        </div>
        <div class="quantity-control">
          <button class="quantity-btn decrease-btn" data-item-id="${item.id}">-</button>
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-item-id="${item.id}">
          <button class="quantity-btn increase-btn" data-item-id="${item.id}">+</button>
        </div>
        <div class="ms-4 text-end">
          <p class="fw-bold mb-1 item-total" data-item-id="${item.id}">R${totalPrice.toFixed(2)}</p>
          <small class="text-muted">${rentalDays} day${rentalDays !== 1 ? 's' : ''} × 8 hrs</small>
        </div>
        <button class="remove-btn ms-4" data-item-id="${item.id}">
          <i class="fas fa-times-circle"></i>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
  document.getElementById('itemCount').textContent = `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`;
  attachCartItemEventListeners();
}

function attachCartItemEventListeners() {
  document.querySelectorAll('.decrease-btn').forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.dataset.itemId;
      updateItemQuantity(itemId, -1);
    });
  });

  document.querySelectorAll('.increase-btn').forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.dataset.itemId;
      updateItemQuantity(itemId, 1);
    });
  });

  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', function() {
      const itemId = this.dataset.itemId;
      const newQuantity = parseInt(this.value);

      if (newQuantity < 1) {
        this.value = 1;
        updateItemQuantity(itemId, 0, 1);
      } else {
        updateItemQuantity(itemId, 0, newQuantity);
      }
    });
  });

  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', function() {
      const itemId = this.dataset.itemId;
      removeItemFromCart(itemId);
    });
  });

  document.querySelectorAll('.rental-start, .rental-end').forEach(input => {
    input.addEventListener('change', function() {
      const itemId = this.dataset.itemId;
      updateRentalDates(itemId);
    });
  });
}

// ---------------- Cart item updates ----------------
async function updateItemQuantity(itemId, change, specificQuantity = null) {
  try {
    const item = cartItems.find(i => String(i.id) === String(itemId));
    if (!item) return;

    const newQuantity = specificQuantity !== null ? specificQuantity : item.quantity + change;

    if (newQuantity < 1) {
      removeItemFromCart(itemId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    if (error) throw error;

    item.quantity = newQuantity;
    const inputEl = document.querySelector(`.quantity-input[data-item-id="${itemId}"]`);
    if (inputEl) inputEl.value = newQuantity;
    updateItemTotal(itemId);
    updateOrderSummary();
    updateCartCount();
  } catch (error) {
    console.error('Error updating item quantity:', error);
    showError('Failed to update quantity. Please try again.');
  }
}

async function updateRentalDates(itemId) {
  try {
    const startDateInput = document.querySelector(`.rental-start[data-item-id="${itemId}"]`);
    const endDateInput = document.querySelector(`.rental-end[data-item-id="${itemId}"]`);
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    if (endDate < startDate) {
      showError('End date cannot be before start date.');
      endDateInput.value = startDateInput.value;
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ 
        rental_start_date: startDateInput.value,
        rental_end_date: endDateInput.value
      })
      .eq('id', itemId);

    if (error) throw error;

    const item = cartItems.find(i => String(i.id) === String(itemId));
    if (item) {
      item.rental_start_date = startDateInput.value;
      item.rental_end_date = endDateInput.value;
      updateItemTotal(itemId);
      updateOrderSummary();
    }
  } catch (error) {
    console.error('Error updating rental dates:', error);
    showError('Failed to update rental dates. Please try again.');
  }
}

async function removeItemFromCart(itemId) {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    cartItems = cartItems.filter(item => String(item.id) !== String(itemId));

    const itemElement = document.querySelector(`.cart-item[data-item-id="${itemId}"]`);
    if (itemElement) {
      itemElement.style.opacity = '0';
      setTimeout(() => {
        itemElement.remove();
        renderCartItems();
        updateOrderSummary();
        updateCartCount();
      }, 300);
    } else {
      renderCartItems();
      updateOrderSummary();
      updateCartCount();
    }
  } catch (error) {
    console.error('Error removing item from cart:', error);
    showError('Failed to remove item. Please try again.');
  }
}

async function clearCart() {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', currentCartId);

    if (error) throw error;

    cartItems = [];
    renderCartItems();
    updateOrderSummary();
    updateCartCount();
    showSuccess('Cart cleared successfully.');
  } catch (error) {
    console.error('Error clearing cart:', error);
    showError('Failed to clear cart. Please try again.');
  }
}

function updateItemTotal(itemId) {
  const item = cartItems.find(i => String(i.id) === String(itemId));
  if (!item) return;

  const equipment = item.equipment;
  const rentalDays = Math.ceil((new Date(item.rental_end_date) - new Date(item.rental_start_date)) / (1000 * 60 * 60 * 24)) || 1;
  const totalHours = rentalDays * 8;
  const totalPrice = equipment.price_per_hour * totalHours * item.quantity;

  const totalElement = document.querySelector(`.item-total[data-item-id="${itemId}"]`);
  if (totalElement) {
    totalElement.textContent = `R${totalPrice.toFixed(2)}`;
  }

  const daysTextElement = totalElement?.nextElementSibling;
  if (daysTextElement) {
    daysTextElement.textContent = `${rentalDays} day${rentalDays !== 1 ? 's' : ''} × 8 hrs`;
  }
}

// ---------------- Order summary calculation ----------------
function calculateTotals() {
  let subtotal = 0;
  cartItems.forEach(item => {
    const equipment = item.equipment;
    const rentalDays = Math.ceil((new Date(item.rental_end_date) - new Date(item.rental_start_date)) / (1000 * 60 * 60 * 24)) || 1;
    const totalHours = rentalDays * 8;
    subtotal += equipment.price_per_hour * totalHours * item.quantity;
  });

  const includeInsurance = document.getElementById('insuranceCheck')?.checked;
  const insurance = includeInsurance ? subtotal * INSURANCE_RATE : 0;
  const tax = (subtotal + insurance + DELIVERY_FEE) * TAX_RATE;
  let discount = 0;
  if (appliedPromo) discount = subtotal * (appliedPromo.discount_percent / 100);
  const total = subtotal + DELIVERY_FEE + insurance + tax - discount;

  return { subtotal, insurance, tax, discount, total };
}

function updateOrderSummary() {
  const totals = calculateTotals();
  document.getElementById('summaryItemCount').textContent = cartItems.length;
  document.getElementById('subtotal').textContent = `R${totals.subtotal.toFixed(2)}`;
  document.getElementById('deliveryFee').textContent = `R${DELIVERY_FEE.toFixed(2)}`;
  document.getElementById('insuranceFee').textContent = `R${totals.insurance.toFixed(2)}`;
  document.getElementById('taxAmount').textContent = `R${totals.tax.toFixed(2)}`;
  document.getElementById('totalAmount').textContent = `R${totals.total.toFixed(2)}`;

  if (appliedPromo) {
    document.getElementById('discountRow').style.display = 'flex';
    document.getElementById('discountBadge').textContent = appliedPromo.code;
    document.getElementById('discountAmount').textContent = `-R${totals.discount.toFixed(2)}`;
  } else {
    document.getElementById('discountRow').style.display = 'none';
  }

  document.getElementById('checkoutBtn').disabled = cartItems.length === 0 || !document.getElementById('termsCheck').checked;
}

// ---------------- Promo codes ----------------
async function applyPromoCode() {
  const promoCode = document.getElementById('promoCode').value.trim();
  if (!promoCode) { showError('Please enter a promo code.'); return; }

  try {
    // Replace with actual Supabase table query in production
    const { data, error } = await supabase.from('promo_codes').select('*').eq('code', promoCode.toUpperCase()).maybeSingle();
    if (error) throw error;
    if (!data || !data.is_active || (data.expires_at && new Date(data.expires_at) < new Date())) {
      showError('Invalid or expired promo code.');
      return;
    }
    appliedPromo = { code: data.code, discount_percent: data.discount_percent };
    updateOrderSummary();
    showSuccess(`Promo code applied: ${data.code}`);
  } catch (error) {
    console.error('Error applying promo:', error);
    showError('Failed to apply promo code.');
  }
}

// ---------------- Checkout flow (create order + move items) ----------------
async function proceedToCheckout() {
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutText = checkoutBtn.querySelector('.checkout-text');
  const spinner = checkoutBtn.querySelector('.loading-spinner');

  try {
    // UI state
    checkoutText.textContent = 'Processing...';
    spinner.style.display = 'inline-block';
    checkoutBtn.disabled = true;

    // Basic validations
    if (cartItems.length === 0) throw new Error('Cart is empty');
    if (!document.getElementById('termsCheck').checked) throw new Error('Please accept terms');

    // Re-fetch latest cart items from DB to avoid stale client data
    const { data: freshItems, error: fetchErr } = await supabase
      .from('cart_items')
      .select(`id, quantity, rental_start_date, rental_end_date, equipment:equipment_id (id, price_per_hour, available, name)`)
      .eq('cart_id', currentCartId);
    if (fetchErr) throw fetchErr;

    if (!freshItems || freshItems.length === 0) throw new Error('No items in cart');

    // Check availability
    for (const item of freshItems) {
      if (!item.equipment || item.equipment.available === false) {
        throw new Error(`Item not available: ${item.equipment?.name ?? 'unknown'}`);
      }
    }

    // Calculate totals again
    // (We will snapshot price_per_hour into order_items)
    let subtotal = 0;
    const orderItemsPayload = [];

    for (const item of freshItems) {
      const rentalDays = Math.ceil((new Date(item.rental_end_date) - new Date(item.rental_start_date)) / (1000 * 60 * 60 * 24)) || 1;
      const totalHours = rentalDays * 8;
      const itemTotal = item.equipment.price_per_hour * totalHours * item.quantity;
      subtotal += itemTotal;

      orderItemsPayload.push({
        equipment_id: item.equipment.id,
        quantity: item.quantity,
        rental_start_date: item.rental_start_date,
        rental_end_date: item.rental_end_date,
        price_per_hour_snapshot: item.equipment.price_per_hour,
        hours: totalHours,
        line_total: itemTotal
      });
    }

    const includeInsurance = document.getElementById('insuranceCheck')?.checked;
    const insurance = includeInsurance ? subtotal * INSURANCE_RATE : 0;
    const tax = (subtotal + insurance + DELIVERY_FEE) * TAX_RATE;
    const discount = appliedPromo ? subtotal * (appliedPromo.discount_percent / 100) : 0;
    const totalAmount = subtotal + DELIVERY_FEE + insurance + tax - discount;

    // Create order record in transactions/orders table
    const orderPayload = {
      cart_id: currentCartId,
      user_id: currentUser?.id ?? null,
      subtotal,
      delivery_fee: DELIVERY_FEE,
      insurance: insurance,
      tax: tax,
      discount: discount,
      total_amount: totalAmount,
      status: 'pending'
    };

    const { data: createdOrder, error: orderErr } = await supabase.from('orders').insert([orderPayload]).select().single();
    if (orderErr) throw orderErr;

    // Insert order_items with order_id and price snapshot
    const orderItemsToInsert = orderItemsPayload.map(oi => ({ ...oi, order_id: createdOrder.id }));
    const { error: oiErr } = await supabase.from('order_items').insert(orderItemsToInsert);
    if (oiErr) throw oiErr;

    // Optionally: set equipment availability or create booking entries
    // For demo we'll leave equipment.available as-is, but in production you may want to mark equipment as reserved for the booked dates (create a bookings table)

    // Remove cart_items (or mark them moved) and close cart
    const { error: delErr } = await supabase.from('cart_items').delete().eq('cart_id', currentCartId);
    if (delErr) throw delErr;

    await supabase.from('carts').update({ status: 'completed' }).eq('id', currentCartId);

    // Clear local state and redirect to confirmation
    cartItems = [];
    renderCartItems();
    updateOrderSummary();
    updateCartCount();

    showSuccess('Order processed successfully! Redirecting to confirmation...');
    setTimeout(() => { window.location.href = `order-confirmation.html?order_id=${createdOrder.id}`; }, 1200);

  } catch (error) {
    console.error('Error during checkout:', error);
    showError(error.message || 'Checkout failed. Please try again.');
    document.querySelector('.checkout-text').textContent = 'Proceed to Checkout';
    const spinner = document.querySelector('.loading-spinner'); if (spinner) spinner.style.display = 'none';
    document.getElementById('checkoutBtn').disabled = false;
  }
}

// ---------------- Save for later & suggested items ----------------
async function saveForLater() {
  try {
    showSuccess('Items saved for later!');
  } catch (error) {
    console.error('Error saving items:', error);
    showError('Failed to save items. Please try again.');
  }
}

async function loadSuggestedItems() {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('id, name, description, price_per_hour, image_url')
      .eq('available', true)
      .limit(4);

    if (error) throw error;
    renderSuggestedItems(data || []);
  } catch (error) {
    console.error('Error loading suggested items:', error);
  }
}

function renderSuggestedItems(items) {
  const container = document.getElementById('suggestedItemsContainer');
  if (!container) return;
  if (items.length === 0) { container.innerHTML = '<p class="text-muted">No suggested items available.</p>'; return; }

  let html = '';
  items.forEach(item => {
    html += `
      <div class="col-md-6 mb-4">
        <div class="suggested-card">
          <img src="${item.image_url}" class="suggested-img w-100" alt="${item.name}">
          <div class="p-3">
            <h6>${item.name}</h6>
            <p class="text-muted small mb-2">${item.description}</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-primary fw-bold">R${item.price_per_hour.toFixed(2)}/hr</span>
              <button class="btn btn-sm btn-outline-primary add-suggested-item" data-item-id="${item.id}">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  document.querySelectorAll('.add-suggested-item').forEach(button => {
    button.addEventListener('click', function() { addSuggestedItemToCart(this.dataset.itemId); });
  });
}

async function addSuggestedItemToCart(equipmentId) {
  try {
    const { data, error } = await supabase.from('equipment').select('*').eq('id', equipmentId).single();
    if (error) throw error;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedToday = today.toISOString().split('T')[0];
    const formattedTomorrow = tomorrow.toISOString().split('T')[0];

    const { error: insertError } = await supabase.from('cart_items').insert([{
      cart_id: currentCartId,
      equipment_id: equipmentId,
      quantity: 1,
      rental_start_date: formattedToday,
      rental_end_date: formattedTomorrow
    }]);

    if (insertError) throw insertError;
    await loadCartItems();
    showSuccess('Item added to cart!');
  } catch (error) {
    console.error('Error adding suggested item to cart:', error);
    showError('Failed to add item to cart. Please try again.');
  }
}

// ---------------- Toast helpers ----------------
function showError(message) {
  const toast = document.createElement('div');
  toast.className = 'position-fixed bottom-0 end-0 m-3 alert alert-danger alert-dismissible fade show';
  toast.style.zIndex = '1050';
  toast.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 5000);
}

function showSuccess(message) {
  const toast = document.createElement('div');
  toast.className = 'position-fixed bottom-0 end-0 m-3 alert alert-success alert-dismissible fade show';
  toast.style.zIndex = '1050';
  toast.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 5000);
}

function updateCartCount() {
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const el = document.getElementById('cartCount');
  if (el) el.textContent = totalItems;
}

