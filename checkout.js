// Initialize Supabase with your credentials
const supabaseUrl = 'https://hxkmxesehefhypywbuqz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4a214ZXNlaGVmaHlweXdidXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjMwODEsImV4cCI6MjA3MjgzOTA4MX0.SqEx7_5Mf1AXT1TbEy6gFl5bm2eFS8SITkWXcEJcxSM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// DOM references
const orderSummaryEl = document.querySelector(".cart-summary");
const completeOrderBtn = document.getElementById("completeOrder");

// 2. Get current user
async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error fetching user:", error.message);
    return null;
  }
  return user;
}

// 3. Fetch and render cart items
async function renderOrderSummary() {
  const user = await getUser();
  if (!user) {
    orderSummaryEl.innerHTML = "<p class='text-danger'>Please log in to continue checkout.</p>";
    return;
  }

  const { data: cartItems, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      quantity,
      rental_start_date,
      rental_end_date,
      equipment:equipment_id (
        id,
        name,
        price_per_hour
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching cart items:", error.message);
    return;
  }

  if (!cartItems || cartItems.length === 0) {
    orderSummaryEl.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  let total = 0;
  let summaryHtml = "<h5 class='mb-3'>Order Summary</h5><ul class='list-group mb-3'>";

  cartItems.forEach(item => {
    const start = new Date(item.rental_start_date);
    const end = new Date(item.rental_end_date);
    const hours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));

    const lineTotal = item.quantity * item.equipment.price_per_hour * hours;
    total += lineTotal;

    summaryHtml += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        ${item.quantity} × ${item.equipment.name} <small>(${hours}h)</small>
        <span>R${lineTotal.toFixed(2)}</span>
      </li>
    `;
  });

  summaryHtml += `
    <li class="list-group-item d-flex justify-content-between">
      <strong>Total</strong>
      <strong>R${total.toFixed(2)}</strong>
    </li>
  </ul>`;

  orderSummaryEl.innerHTML = summaryHtml;
}

// 4. Handle complete order
async function completeOrder() {
  const user = await getUser();
  if (!user) {
    alert("You must log in first.");
    return;
  }

  // Fetch cart items again to ensure accuracy
  const { data: cartItems, error: fetchError } = await supabase
    .from("cart_items")
    .select(`
      id,
      quantity,
      rental_start_date,
      rental_end_date,
      equipment:equipment_id (
        id,
        price_per_hour
      )
    `)
    .eq("user_id", user.id);

  if (fetchError || !cartItems.length) {
    alert("Error: your cart is empty or could not be fetched.");
    return;
  }

  // Insert into orders table
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([{ user_id: user.id, status: "pending", created_at: new Date() }])
    .select()
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError.message);
    alert("Could not create order.");
    return;
  }

  // Insert order items
  const orderItems = cartItems.map(item => ({
    order_id: order.id,
    equipment_id: item.equipment.id,
    quantity: item.quantity,
    rental_start_date: item.rental_start_date,
    rental_end_date: item.rental_end_date,
    price_per_hour: item.equipment.price_per_hour
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    console.error("Error inserting order items:", itemsError.message);
    alert("Could not complete order items.");
    return;
  }

  // Clear cart
  const { error: clearError } = await supabase.from("cart_items").delete().eq("user_id", user.id);
  if (clearError) {
    console.error("Error clearing cart:", clearError.message);
  }

  alert("✅ Order placed successfully!");
  window.location.href = "confirmation.html"; // redirect to confirmation page
}

// Event listeners
document.addEventListener("DOMContentLoaded", renderOrderSummary);
completeOrderBtn.addEventListener("click", (e) => {
  e.preventDefault();
  completeOrder();
});
