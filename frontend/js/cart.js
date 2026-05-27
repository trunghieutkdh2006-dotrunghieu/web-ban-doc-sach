// ==================== CONSTANTS ====================
const CART_KEY = "shoppingCart";
const CART_HISTORY_KEY = "cartHistory";
const SAVED_CARTS_KEY = "savedCarts";
const VALID_COUPONS = {
  TAIEBOOK10: 0.1,
  SALE20: 0.2,
  FREEDEL: 30000,
};
let appliedCoupon = null;


// ==================== CART FUNCTIONS ====================
function getCart() {
  try {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  localStorage.setItem("cart_last_update", new Date().toISOString());
  renderCart();
}

function formatPrice(price) {
  if (!price && price !== 0) return "0đ";
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "đ";
}

function getBookImage(item) {
  if (!item.image || item.image === "undefined") {
    return "https://via.placeholder.com/200x250?text=No+Image";
  }
  return item.image;
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function updateQuantity(id, change) {
  let cart = getCart();
  const index = cart.findIndex(item => item.id === id);
  if (index !== -1) {
    const newQty = (cart[index].quantity || 1) + change;
    if (newQty <= 0) {
      cart.splice(index, 1);
      Swal.fire({ icon: "success", title: "Đã xóa", text: "Sản phẩm đã được xóa khỏi giỏ hàng", timer: 1500, showConfirmButton: false });
    } else {
      cart[index].quantity = newQty;
    }
    saveCart(cart);
  }
}

function removeItem(id) {
  Swal.fire({
    title: "Xóa sản phẩm?",
    text: "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e53e3e",
    cancelButtonColor: "#718096",
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
  }).then((result) => {
    if (result.isConfirmed) {
      let cart = getCart();
      cart = cart.filter(item => item.id !== id);
      saveCart(cart);
      Swal.fire({ icon: "success", title: "Đã xóa!", timer: 1200, showConfirmButton: false });
    }
  });
}

function clearCart() {
  const cart = getCart();
  if (!cart.length) { Swal.fire({ icon: "info", title: "Giỏ hàng đã trống" }); return; }
  Swal.fire({
    title: "Xóa toàn bộ giỏ hàng?",
    text: "Hành động này sẽ xóa hết sản phẩm trong giỏ.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#e53e3e",
    cancelButtonColor: "#718096",
    confirmButtonText: "Xóa tất cả",
    cancelButtonText: "Hủy",
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem(CART_KEY);
      appliedCoupon = null;
      renderCart();
      Swal.fire({ icon: "success", title: "Đã xóa giỏ hàng", timer: 1200, showConfirmButton: false });
    }
  });
}

function calculateTotals() {
  const cart = getCart();
  let subtotal = 0;
  cart.forEach(item => { subtotal += (item.price || 0) * (item.quantity || 1); });
  let discount = 0;
  if (appliedCoupon && VALID_COUPONS[appliedCoupon]) {
    const val = VALID_COUPONS[appliedCoupon];
    discount = val < 1 ? subtotal * val : val;
  }
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}

function applyCoupon() {
  const input = document.getElementById("coupon-input");
  const code = input.value.trim().toUpperCase();
  if (!code) { Swal.fire({ icon: "warning", title: "Nhập mã giảm giá" }); return; }
  if (!VALID_COUPONS[code]) { Swal.fire({ icon: "error", title: "Mã không hợp lệ" }); return; }
  appliedCoupon = code;
  Swal.fire({ icon: "success", title: "Áp dụng thành công", text: `Mã ${code} đã được áp dụng` });
  renderCart();
}

// ==================== RENDER CART ====================
function renderCart() {
  const cart = getCart();
  const container = document.getElementById("cart-items-list");
  const subtotalSpan = document.getElementById("subtotal");
  const discountSpan = document.getElementById("discount-amount");
  const totalSpan = document.getElementById("cart-total");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart" style="font-size:80px;color:#cbd5e1;margin-bottom:20px;"></i>
        <h3 style="font-size:24px;color:#1e293b;margin-bottom:12px;">🛒 Giỏ hàng trống</h3>
        <p style="font-size:16px;color:#64748b;margin-bottom:30px;">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
        <a href="index.html" class="btn-shop" style="display:inline-block;padding:14px 36px;background:#e53e3e;color:white;text-decoration:none;border-radius:40px;font-weight:600;">
          📚 Tiếp tục mua sắm
        </a>
      </div>
    `;
    if (subtotalSpan) subtotalSpan.textContent = "0đ";
    if (discountSpan) discountSpan.textContent = "0đ";
    if (totalSpan) totalSpan.textContent = "0đ";
    return;
  }

  container.innerHTML = cart.map((item, index) => `
    <div class="cart-item" data-index="${index}">
      <div class="cart-product">
        <img src="${getBookImage(item)}" alt="${escapeHtml(item.title)}" onerror="this.src='https://via.placeholder.com/200x250?text=No+Image'">
        <div class="cart-product-info">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.author) || "Không rõ tác giả"}</p>
          <div class="cart-product-price">${formatPrice(item.price)}</div>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button class="remove-item" onclick="saveForLater('${item.id}')" style="background:#e53e3e;color:white;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;">
              <i class="fas fa-heart"></i> Lưu để mua sau
            </button>
            <button class="remove-item" onclick="removeItem('${item.id}')" style="background:#64748b;color:white;padding:6px 12px;border-radius:8px;border:none;cursor:pointer;">
              <i class="fas fa-trash-alt"></i> Xóa
            </button>
          </div>
        </div>
      </div>
      <div class="cart-quantity">
        <button onclick="updateQuantity('${item.id}', -1)">-</button>
        <span>${item.quantity || 1}</span>
        <button onclick="updateQuantity('${item.id}', 1)">+</button>
      </div>
      <div class="cart-total">
        ${formatPrice((item.price || 0) * (item.quantity || 1))}
      </div>
    </div>
  `).join("");

  const { subtotal, discount, total } = calculateTotals();
  if (subtotalSpan) subtotalSpan.textContent = formatPrice(subtotal);
  if (discountSpan) discountSpan.textContent = formatPrice(discount);
  if (totalSpan) totalSpan.textContent = formatPrice(total);
}

// ==================== CART HISTORY ====================
function saveCartHistory() {
  const cart = getCart();
  if (!cart.length) {
    Swal.fire({ icon: "warning", title: "Giỏ hàng trống" });
    return;
  }
  const history = JSON.parse(localStorage.getItem(CART_HISTORY_KEY) || "[]");
  const snapshot = {
    id: Date.now(),
    createdAt: new Date().toLocaleString("vi-VN"),
    items: cart,
    total: calculateTotals().total
  };
  history.unshift(snapshot);
  localStorage.setItem(CART_HISTORY_KEY, JSON.stringify(history));
  Swal.fire({ icon: "success", title: "Đã lưu giỏ hàng" });
}

function viewCartHistory() {
  const history = JSON.parse(localStorage.getItem(CART_HISTORY_KEY) || "[]");
  if (!history.length) {
    Swal.fire({ icon: "info", title: "Chưa có lịch sử" });
    return;
  }

  let html = `<div style="max-height:450px;overflow:auto;">`;
  history.forEach(cart => {
    html += `
      <div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin-bottom:14px;background:white;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <div style="font-weight:700;">🕘 ${cart.createdAt}</div>
          <div style="color:#e53e3e;font-weight:800;">${formatPrice(cart.total)}</div>
        </div>
        ${cart.items.map(item => `
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;">
            <span>${escapeHtml(item.title)}</span>
            <span>x${item.quantity || 1}</span>
          </div>
        `).join("")}
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button onclick="restoreCart(${cart.id})" style="background:#e53e3e;color:white;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;">
            🔄 Khôi phục
          </button>
          <button onclick="deleteCartHistory(${cart.id})" style="background:#64748b;color:white;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;">
            🗑️ Xóa
          </button>
        </div>
      </div>`;
  });
  html += `</div>`;

  Swal.fire({
    title: "Lịch sử giỏ hàng",
    html,
    width: 700,
    showConfirmButton: false
  });
}

function deleteCartHistory(id) {
  Swal.fire({
    title: 'Xóa lịch sử?',
    text: 'Bạn có chắc muốn xóa giỏ hàng đã lưu này?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy'
  }).then((result) => {
    if (!result.isConfirmed) return;

    let history = JSON.parse(localStorage.getItem(CART_HISTORY_KEY) || "[]");
    history = history.filter(item => item.id !== id);
    localStorage.setItem(CART_HISTORY_KEY, JSON.stringify(history));

    if (history.length > 0) {
      viewCartHistory();
    } else {
      Swal.fire({
        icon: "success",
        title: "Đã xóa!",
        text: "Không còn lịch sử nào.",
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
}

function restoreCart(id) {
  const history = JSON.parse(localStorage.getItem(CART_HISTORY_KEY) || "[]");
  const selectedCart = history.find(item => item.id === id);
  if (!selectedCart) return;

  const currentCart = getCart();

  if (currentCart.length > 0) {
    Swal.fire({
      title: 'Khôi phục giỏ hàng',
      text: 'Bạn có sẵn sản phẩm trong giỏ. Bạn muốn?',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '📦 Gộp với giỏ hiện tại',
      denyButtonText: '🔄 Thay thế giỏ hiện tại',
      cancelButtonText: '❌ Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        let mergedCart = [...currentCart];
        selectedCart.items.forEach(savedItem => {
          const existingIndex = mergedCart.findIndex(item => item.id === savedItem.id);
          if (existingIndex !== -1) {
            mergedCart[existingIndex].quantity = (mergedCart[existingIndex].quantity || 1) + (savedItem.quantity || 1);
          } else {
            mergedCart.push(savedItem);
          }
        });
        saveCart(mergedCart);
        Swal.fire({ icon: "success", title: "Đã gộp giỏ hàng!", timer: 1500, showConfirmButton: false });
      } else if (result.isDenied) {
        localStorage.setItem(CART_KEY, JSON.stringify(selectedCart.items));
        renderCart();
        Swal.fire({ icon: "success", title: "Đã thay thế giỏ hàng!", timer: 1500, showConfirmButton: false });
      }
    });
  } else {
    localStorage.setItem(CART_KEY, JSON.stringify(selectedCart.items));
    renderCart();
    Swal.fire({ icon: "success", title: "Đã khôi phục giỏ hàng", timer: 1500, showConfirmButton: false });
  }
}

// ==================== SAVED FOR LATER ====================
function saveForLater(id) {
  let cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;

  const saved = JSON.parse(localStorage.getItem(SAVED_CARTS_KEY) || "[]");
  const alreadySaved = saved.find(i => i.id === id);
  if (!alreadySaved) {
    saved.unshift(item);
    localStorage.setItem(SAVED_CARTS_KEY, JSON.stringify(saved));
  }

  cart = cart.filter(i => i.id !== id);
  saveCart(cart);
  Swal.fire({ icon: "success", title: "Đã lưu để mua sau", timer: 1500, showConfirmButton: false });
}

function viewSavedForLater() {
  const saved = JSON.parse(localStorage.getItem(SAVED_CARTS_KEY) || "[]");

  if (!saved.length) {
    Swal.fire({ icon: "info", title: "Chưa có sản phẩm nào được lưu" });
    return;
  }

  let html = `<div style="max-height:450px;overflow:auto;">`;
  saved.forEach((item) => {
    html += `
      <div style="border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin-bottom:14px;background:white;">
        <div style="display:flex;gap:12px;margin-bottom:10px;">
          <img src="${getBookImage(item)}" style="width:60px;height:80px;object-fit:cover;border-radius:8px;" onerror="this.src='https://via.placeholder.com/60x80?text=No+Image'">
          <div style="flex:1;">
            <div style="font-weight:700;">${escapeHtml(item.title)}</div>
            <div style="color:#e53e3e;font-weight:600;">${formatPrice(item.price)}</div>
            <div style="font-size:12px;color:#64748b;">Số lượng: ${item.quantity || 1}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button onclick="moveToCart('${item.id}')" style="background:#e53e3e;color:white;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;">
            🛒 Thêm vào giỏ
          </button>
          <button onclick="removeSavedItem('${item.id}')" style="background:#64748b;color:white;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;">
            🗑️ Xóa
          </button>
        </div>
      </div>`;
  });
  html += `</div>`;

  Swal.fire({
    title: "📦 Sản phẩm đã lưu",
    html,
    width: 600,
    showConfirmButton: false
  });
}

function removeSavedItem(id) {
  const saved = JSON.parse(localStorage.getItem(SAVED_CARTS_KEY) || "[]");
  const newSaved = saved.filter(i => i.id !== id);
  localStorage.setItem(SAVED_CARTS_KEY, JSON.stringify(newSaved));

  if (newSaved.length > 0) {
    viewSavedForLater();
  } else {
    Swal.fire({
      icon: "success",
      title: "Đã xóa!",
      text: "Không còn sản phẩm nào được lưu.",
      timer: 1500,
      showConfirmButton: false
    });
  }
}

function moveToCart(id) {
  const saved = JSON.parse(localStorage.getItem(SAVED_CARTS_KEY) || "[]");
  const item = saved.find(i => i.id === id);
  if (!item) return;

  let cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
  } else {
    cart.push({ ...item });
  }
  saveCart(cart);

  const newSaved = saved.filter(i => i.id !== id);
  localStorage.setItem(SAVED_CARTS_KEY, JSON.stringify(newSaved));

  if (newSaved.length > 0) {
    viewSavedForLater();
  } else {
    Swal.fire({ icon: "success", title: "Đã thêm vào giỏ hàng!", timer: 1500, showConfirmButton: false });
  }
}

// ==================== PAYMENT ====================
function getSelectedPaymentMethod() {
  const radios = document.querySelectorAll('input[name="paymentMethod"]');
  for (const radio of radios) { if (radio.checked) return radio.value; }
  return "cod";
}

function renderPaymentDetails() {
  const method = getSelectedPaymentMethod();
  const detailsDiv = document.getElementById("payment-details");
  if (!detailsDiv) return;

  if (method === "card") {
    detailsDiv.innerHTML = `
      <div style="margin-top:12px;">
        <input type="text" id="cardName" placeholder="Tên trên thẻ" style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #e2e8f0;border-radius:8px;font-family:inherit;">
        <input type="text" id="cardNumber" placeholder="Số thẻ" style="width:100%;padding:10px;margin-bottom:8px;border:1px solid #e2e8f0;border-radius:8px;font-family:inherit;">
        <div style="display:flex;gap:8px;">
          <input type="text" id="cardExpiry" placeholder="MM/YY" style="flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-family:inherit;">
          <input type="password" id="cardCvc" placeholder="CVC" style="flex:1;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-family:inherit;">
        </div>
      </div>`;
  } else {
    const qrImages = {
      mb: "img/MB.png",
      vietinbank: "img/VietinBank.png",
      techcombank: "img/techcombank.png",
    };
    const qrSrc = qrImages[method] || "";
    detailsDiv.innerHTML = `
      <div style="text-align:center;">
        <p><i class="fas fa-qrcode"></i> Quét mã QR để thanh toán</p>
        ${qrSrc ? `<img src="${qrSrc}" style="width:160px;margin:12px auto;cursor:pointer;border-radius:12px;display:block;" onclick="openQR('${qrSrc}')">` : ""}
      </div>`;
  }
}

function openQR(src) {
  const modal = document.getElementById("qrModal");
  const img = document.getElementById("qrModalImg");
  if (modal && img) { img.src = src; modal.style.display = "flex"; }
}

function closeQR() {
  const modal = document.getElementById("qrModal");
  if (modal) modal.style.display = "none";
}

// ==================== CHECKOUT ====================
async function addOrder(order) {
  let userId = null;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    userId = user?._id || null;
  } catch (e) { }

  const orderData = {
    orderId: "ORD" + Date.now(),
    customerName: order.customerName,
    customerEmail: order.email,
    customerPhone: order.customerPhone,
    address: order.address || "",
    userId,
    items: (order.items || []).map(item => ({
      bookId: item.id,
      title: item.title,
      quantity: item.quantity || 1,
      price: item.price,
      image: item.image || ""
    })),
    subtotal: order.subtotal,
    discount: order.discount || 0,
    total: order.total,
    paymentMethod: order.paymentMethod,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    if (response.ok) {
      return result.order || result;
    } else {
      throw new Error(result.message || "Lỗi khi lưu đơn hàng");
    }
  } catch (err) {
    console.error("❌ Lỗi addOrder:", err);
    throw err;
  }
}

async function processCheckout() {
  const cart = getCart();
  if (!cart.length) {
    Swal.fire({ icon: "warning", title: "Giỏ hàng trống" });
    return;
  }

  const email = document.getElementById("customer-email").value.trim();
  if (!email) {
    Swal.fire({ icon: "warning", title: "Thiếu email", text: "Vui lòng nhập email để nhận file PDF" });
    return;
  }

  const paymentMethod = getSelectedPaymentMethod();
  const { subtotal, discount, total } = calculateTotals();

  const result = await Swal.fire({
    title: "Thông tin giao hàng",
    html: `
      <input type="text" id="customerName" class="swal2-input" placeholder="Họ tên người nhận" value="${escapeHtml(localStorage.getItem("customerName") || "")}">
      <input type="tel" id="customerPhone" class="swal2-input" placeholder="Số điện thoại" value="${escapeHtml(localStorage.getItem("customerPhone") || "")}">
    `,
    showCancelButton: true,
    confirmButtonColor: "#e53e3e",
    cancelButtonColor: "#718096",
    confirmButtonText: "Xác nhận thanh toán",
    cancelButtonText: "Hủy",
    preConfirm: () => {
      const name = document.getElementById("customerName").value.trim();
      const phone = document.getElementById("customerPhone").value.trim();
      if (!name) { Swal.showValidationMessage("Vui lòng nhập họ tên!"); return false; }
      if (!phone) { Swal.showValidationMessage("Vui lòng nhập số điện thoại!"); return false; }
      localStorage.setItem("customerName", name);
      localStorage.setItem("lastOrderEmail", email);
      localStorage.setItem("customerPhone", phone);
      return { name, phone };
    },
  });

  if (!result.isConfirmed) return;

  Swal.fire({ title: "Đang xử lý...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  const order = {
    items: cart.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image || "",
      quantity: item.quantity || 1,
    })),
    total,
    subtotal,
    discount,
    email,
    customerName: result.value.name,
    customerPhone: result.value.phone,
    address: "",
    paymentMethod,
  };

  try {
    await addOrder(order);
    localStorage.removeItem(CART_KEY);
    appliedCoupon = null;
    renderCart();

    Swal.fire({
      icon: "success",
      title: "🎉 Đặt hàng thành công!",
      html: `
        <p>Cảm ơn <strong>${escapeHtml(result.value.name)}</strong> đã mua hàng!</p>
        <p>SĐT: ${escapeHtml(result.value.phone)}</p>
        <p>Tổng tiền: <strong style="color:#e53e3e">${formatPrice(total)}</strong></p>
        <p>File PDF sẽ gửi đến: <strong>${escapeHtml(email)}</strong></p>
      `,
      confirmButtonColor: "#38a169",
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Đặt hàng thất bại", text: err.message || "Vui lòng thử lại!" });
  }
}

// ==================== AUTH ====================
function logout() {
  localStorage.removeItem("user");
  Swal.fire({ icon: "success", title: "Đã đăng xuất", timer: 1500, showConfirmButton: false });
}

function updateUserUI() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userBtn = document.getElementById("userBtn");
  if (user && userBtn) {
    userBtn.innerHTML = `<i class="far fa-user-circle"></i> ${escapeHtml((user.username || "User").substring(0, 10))}`;
  }
}

// ==================== ORDER TRACKING ====================
let allMyOrders = [];
let currentOrderFilter = 'all';

async function loadMyOrders() {
  const email = document.getElementById("customer-email")?.value.trim()
    || localStorage.getItem("lastOrderEmail")
    || "";

  const listEl = document.getElementById("myOrdersList");

  if (!email) {
    if (listEl) listEl.innerHTML = `
      <div class="empty-orders">
        <i class="fas fa-envelope"></i>
        <p>Vui lòng nhập email ở trên để xem lịch sử đơn hàng</p>
      </div>`;
    updateOrderStats([]);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/orders/email/${encodeURIComponent(email)}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });

    if (response.ok) {
      const data = await response.json();
      allMyOrders = data.orders || data;
    } else {
      throw new Error("Server error");
    }
  } catch (err) {
    console.error("Lỗi tải đơn hàng:", err);
    const allOrders = JSON.parse(localStorage.getItem("adminOrders") || "[]");
    allMyOrders = allOrders.filter(o => o.customerEmail === email || o.email === email);
  }

  updateOrderStats(allMyOrders);
  displayFilteredOrders();
}

function updateOrderStats(orders) {
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalSpent: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.total || 0), 0),
  };

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('statTotal', stats.total);
  set('statPending', stats.pending);
  set('statShipped', stats.shipped);
  set('statDelivered', stats.delivered);
  set('statTotalSpent', formatPrice(stats.totalSpent));
}

function filterOrders(status) {
  currentOrderFilter = status;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === status);
  });
  displayFilteredOrders();
}

function displayFilteredOrders() {
  const filtered = currentOrderFilter === 'all'
    ? [...allMyOrders]
    : allMyOrders.filter(o => o.status === currentOrderFilter);
  displayMyOrders(filtered);
}

function getTimelineStatus(status) {
  const map = {
    'pending':   { orderPlaced: 'completed', processing: 'active',    shipping: '',          delivered: '' },
    'shipped':   { orderPlaced: 'completed', processing: 'completed', shipping: 'active',    delivered: '' },
    'delivered': { orderPlaced: 'completed', processing: 'completed', shipping: 'completed', delivered: 'completed' },
  };
  return map[status] || { orderPlaced: 'completed', processing: '', shipping: '', delivered: '' };
}

function displayMyOrders(orders) {
  const container = document.getElementById("myOrdersList");
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-orders">
        <i class="fas fa-shopping-bag"></i>
        <p>Không có đơn hàng nào</p>
        <p style="font-size:13px;margin-top:8px;">Hãy mua sắm ngay!</p>
      </div>`;
    return;
  }

  const statusText = { pending: 'Chờ xử lý', shipped: 'Đang gửi', delivered: 'Đã gửi', 'Đã hủy': 'Đã hủy' };
  const statusClass = { pending: 'status-pending', shipped: 'status-shipped', delivered: 'status-delivered', 'Đã hủy': 'status-pending' };

  container.innerHTML = orders.map(order => {
    const items = order.items || [];
    const orderId = order._id || order.id || order.orderId || "";
    const orderDate = new Date(order.createdAt || order.date).toLocaleString("vi-VN");
    const timeline = getTimelineStatus(order.status);
    const sText = statusText[order.status] || order.status;
    const sClass = statusClass[order.status] || 'status-pending';

    return `
      <div class="order-history-card">
        <div class="order-history-header">
          <div>
            <span class="order-id">#${orderId.slice(-8)}</span>
            <div class="order-date">📅 ${orderDate}</div>
          </div>
          <span class="order-status ${sClass}">${sText}</span>
          <div class="order-total">${formatPrice(order.total)}</div>
        </div>

        <div class="order-items-list">
          ${items.map(item => `
            <div class="order-item">
              <img class="order-item-img" src="${getBookImage(item)}" onerror="this.src='https://via.placeholder.com/50x65?text=No+Image'">
              <div class="order-item-info">
                <div class="order-item-title">${escapeHtml(item.title || item.name)}</div>
                <div class="order-item-quantity">Số lượng: ${item.quantity || 1}</div>
              </div>
              <div class="order-item-price">${formatPrice(item.price)}</div>
            </div>
          `).join('')}
        </div>

        <div class="order-tracking-detail">
          <div class="timeline">
            <div class="timeline-step ${timeline.orderPlaced}">
              <div class="step-icon"><i class="fas fa-shopping-cart"></i></div>
              <div class="step-label">Đặt hàng</div>
            </div>
            <div class="timeline-step ${timeline.processing}">
              <div class="step-icon"><i class="fas fa-clock"></i></div>
              <div class="step-label">Xử lý</div>
            </div>
            <div class="timeline-step ${timeline.shipping}">
              <div class="step-icon"><i class="fas fa-truck"></i></div>
              <div class="step-label">Đang gửi</div>
            </div>
            <div class="timeline-step ${timeline.delivered}">
              <div class="step-icon"><i class="fas fa-check-circle"></i></div>
              <div class="step-label">Đã gửi</div>
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:12px;">
          <button onclick="deleteOrderFromHistory('${orderId}')" class="btn-delete-order">
            <i class="fas fa-trash-alt"></i> Xóa đơn hàng
          </button>
        </div>
      </div>`;
  }).join('');
}

async function deleteOrderFromHistory(orderId) {
  const result = await Swal.fire({
    title: 'Xóa đơn hàng?',
    text: 'Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#718096',
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy'
  });

  if (!result.isConfirmed) return;

  // Xóa local ngay lập tức
  allMyOrders = allMyOrders.filter(o => (o._id || o.id || o.orderId) !== orderId);
  updateOrderStats(allMyOrders);
  displayFilteredOrders();

  const adminOrders = JSON.parse(localStorage.getItem("adminOrders") || "[]");
  localStorage.setItem("adminOrders", JSON.stringify(
    adminOrders.filter(o => (o._id || o.id || o.orderId) !== orderId)
  ));

  Swal.fire({ icon: "success", title: "Đã xóa đơn hàng!", timer: 1500, showConfirmButton: false });

  // Gọi server ngầm, không block UI
  fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: 'DELETE',
    headers: { 'ngrok-skip-browser-warning': 'true' }
  }).catch(err => console.warn('Xóa server thất bại (đã xóa local):', err));
}

function getStatusText(status) {
  const statusMap = { pending: 'Chờ xử lý', shipped: 'Đang gửi', delivered: 'Đã gửi' };
  return statusMap[status] || status;
}

// ==================== SOCKET.IO ====================
// ✅ SỬA LỖI: Dùng API_BASE_URL thay vì BASE_URL (BASE_URL không được định nghĩa)
let socket;

function connectSocket() {
  try {
    if (typeof io === 'undefined') return;

    // Lấy base URL từ API_BASE_URL (bỏ phần /api ở cuối)
    const socketUrl = (typeof API_BASE_URL !== 'undefined')
      ? API_BASE_URL.replace('/api', '')
      : window.location.origin;

    socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      extraHeaders: {
        'ngrok-skip-browser-warning': '69420'
      },
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => console.log('✅ Đã kết nối realtime'));

    socket.on('orderStatusUpdated', (data) => {
      Swal.fire({
        icon: 'info',
        title: '📦 Cập nhật đơn hàng!',
        html: `Đơn hàng <strong>#${(data.orderId || '').slice(-8)}</strong> đã cập nhật: <strong style="color:#10b981">${getStatusText(data.status)}</strong>`,
        timer: 5000,
        toast: true,
        position: 'top-end',
        showConfirmButton: false
      });
      loadMyOrders();
    });

    socket.on('disconnect', () => console.log('❌ Mất kết nối realtime'));

    socket.on('connect_error', (err) => {
      console.log('⚠️ Socket lỗi:', err.message);
    });

  } catch (err) {
    console.error('Lỗi kết nối socket:', err);
  }
}

// ==================== INIT ====================
window.addEventListener("storage", (e) => {
  if (e.key === CART_KEY) renderCart();
});

document.addEventListener("DOMContentLoaded", () => {
  updateUserUI();
  renderCart();
  renderPaymentDetails();
  connectSocket();

  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio =>
    radio.addEventListener("change", renderPaymentDetails)
  );

  document.getElementById("userBtn")?.addEventListener("click", e => {
    e.stopPropagation();
    document.getElementById("userDropdown")?.classList.toggle("show");
  });

  document.addEventListener("click", () =>
    document.getElementById("userDropdown")?.classList.remove("show")
  );
});