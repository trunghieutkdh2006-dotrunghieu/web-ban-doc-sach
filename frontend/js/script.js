// ==================== TOAST ====================
function showToast(message, type = 'success', title = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { 
    success: '✅', 
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️' 
  };
  const titles = { success: title || 'Thành công!', error: title || 'Thất bại!', warning: title || 'Cảnh báo!', info: title || 'Thông báo' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-icon">${icons[type] || 'ℹ️'}</div><div class="toast-content"><div class="toast-title">${titles[type]}</div><div class="toast-message">${message}</div></div>`;
  toast.addEventListener('click', () => { toast.style.animation = 'fadeOut 0.3s ease'; setTimeout(() => toast.remove(), 300); });
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) { toast.style.animation = 'fadeOut 0.3s ease'; setTimeout(() => toast.remove(), 300); } }, 4000);
}

// ==================== CART ====================
function getCart() { const cart = localStorage.getItem('shoppingCart'); return cart ? JSON.parse(cart) : []; }
function saveCart(cart) { localStorage.setItem('shoppingCart', JSON.stringify(cart)); updateCartBadge(); renderCartDropdown(); }
function updateCartBadge() { const cart = getCart(); const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0); const cartCountSpan = document.getElementById('cartCount'); if (cartCountSpan) { if (totalItems > 0) { cartCountSpan.textContent = totalItems; cartCountSpan.style.display = 'flex'; } else { cartCountSpan.style.display = 'none'; } } }
function formatPrice(price) { if (!price && price !== 0) return '0đ'; return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ'; }
function escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

function addToCart(bookId, bookTitle, bookPrice, bookImage) {
  let cart = getCart();
  const existingItem = cart.find(item => item.id === bookId);
  if (existingItem) {
    existingItem.quantity += 1;
    showToast(`Đã tăng số lượng "${bookTitle}" lên ${existingItem.quantity}`, 'success', '🛒 Cập nhật giỏ hàng');
  } else {
    cart.push({ id: bookId, title: bookTitle, price: bookPrice, image: bookImage, quantity: 1 });
    showToast(`Đã thêm "${bookTitle}" vào giỏ hàng với giá ${formatPrice(bookPrice)}`, 'success', '🛒 Thêm giỏ hàng');
  }
  saveCart(cart);
}

function renderCartDropdown() {
  const cart = getCart();
  const dropdownItems = document.getElementById('cartDropdownItems');
  const dropdownFooter = document.getElementById('cartDropdownFooter');
  const dropdownTotalSpan = document.getElementById('dropdownTotal');
  if (!dropdownItems) return;
  if (cart.length === 0) {
    dropdownItems.innerHTML = `<div class="cart-dropdown-empty"><i class="fas fa-shopping-cart"></i><p>Giỏ hàng đang trống</p></div>`;
    if (dropdownFooter) dropdownFooter.style.display = 'none';
    return;
  }
  let total = 0;
  dropdownItems.innerHTML = cart.map(item => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    total += itemTotal;
    return `<div class="cart-dropdown-item"><img src="${item.image || PLACEHOLDER_SVG}" onerror="this.onerror=null; this.src=PLACEHOLDER_SVG"><div class="cart-dropdown-item-info"><div class="title">${escapeHtml(item.title)}</div><div class="price">${formatPrice(item.price)}</div><div class="quantity">Số lượng: ${item.quantity || 1}</div></div><div class="cart-dropdown-item-total">${formatPrice(itemTotal)}</div><button class="remove-cart-item" onclick="removeCartItem('${item.id}')"><i class="fas fa-times"></i></button></div>`;
  }).join('');
  if (dropdownTotalSpan) dropdownTotalSpan.textContent = formatPrice(total);
  if (dropdownFooter) dropdownFooter.style.display = 'block';
}

function removeCartItem(itemId) { let cart = getCart(); cart = cart.filter(item => item.id !== itemId); saveCart(cart); renderCartDropdown(); updateCartBadge(); showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'warning', '🗑️ Đã xóa'); }
function clearCartDropdown() { const cart = getCart(); if (cart.length === 0) { showToast('Giỏ hàng đã trống', 'info'); return; } Swal.fire({ title: 'Xóa toàn bộ giỏ hàng?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e53e3e', confirmButtonText: 'Xóa tất cả' }).then((result) => { if (result.isConfirmed) { localStorage.setItem('shoppingCart', JSON.stringify([])); renderCartDropdown(); updateCartBadge(); showToast('Đã xóa toàn bộ giỏ hàng', 'success'); } }); }

// ==================== CONFIG (từ config.js) ====================
// BASE_URL, API, CATEGORY_API, AUTH_API, API_BASE_URL, PLACEHOLDER_SVG đã định nghĩa trong config.js

let booksCache = [], categoriesCache = [], wishlist = [], user = null;
let currentReviewBookId = null, currentReviewsBookId = null, currentReviewsBookTitle = '';
let _modalImgs = [], _modalImgIdx = 0;
let filterSettings = { category: 'all', minPrice: '', maxPrice: '', minRating: 0, sortBy: 'default' };
let isLoading = false, retryCount = 0;
const MAX_RETRY = 3;

function getBookImage(book) {
    if (!book) return PLACEHOLDER_SVG;
    
    let imgField = book.image || book.coverImage || book.cover;
    
    if (!imgField || imgField === "undefined" || imgField === "null" || imgField === "") {
        const title = book?.title || "Book";
        const encodedTitle = encodeURIComponent(title.substring(0, 20));
        return `https://ui-avatars.com/api/?background=1D3557&color=fff&size=200&fontsize=40&length=2&name=${encodedTitle}&bold=true`;
    }
    
    if (imgField.startsWith('/uploads/')) {
        return BASE_URL + imgField;
    }
    
    if (imgField.startsWith('http://') || imgField.startsWith('https://') || imgField.startsWith('data:')) {
        return imgField;
    }
    
    return BASE_URL + '/uploads/' + imgField;
}

function renderStars(rating) {
    const numRating = Number(rating) || 0;
    const fullStars = Math.floor(numRating);
    const decimal = numRating - fullStars;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<span style="color: #f59e0b;">★</span>';
    }
    
    if (decimal >= 0.5) {
        stars += '<span style="color: #f59e0b;">★</span>';
    } else if (decimal > 0 && decimal < 0.5) {
        stars += '<span style="color: #fbbf24;">★</span>';
    }
    
    const emptyCount = 5 - fullStars - (decimal >= 0.5 ? 1 : 0);
    for (let i = 0; i < emptyCount; i++) {
        stars += '<span style="color: #d1d5db;">☆</span>';
    }
    
    return stars;
}

function renderStarsSimple(rating) {
    const numRating = Math.round(Number(rating) || 0);
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= numRating ? '★' : '☆';
    }
    return `<span style="color: ${numRating >= 1 ? '#f59e0b' : '#d1d5db'}">${stars}</span>`;
}

function renderStarsText(rating) { let stars = ''; for (let i = 1; i <= 5; i++) stars += i <= rating ? '★' : '☆'; return stars; }

function applyFilters() {
  if (booksCache.length === 0) { loadBooks(); return; }
  filterSettings.category = document.getElementById('filterCategory').value;
  filterSettings.minPrice = document.getElementById('minPrice').value;
  filterSettings.maxPrice = document.getElementById('maxPrice').value;
  filterSettings.minRating = parseInt(document.getElementById('filterRating').value) || 0;
  filterSettings.sortBy = document.getElementById('sortOrder').value;
  let result = [...booksCache];
  if (filterSettings.category !== 'all') result = result.filter(b => String(b.category || '').toLowerCase() === filterSettings.category.toLowerCase());
  if (filterSettings.minPrice) result = result.filter(b => (b.price || 0) >= parseFloat(filterSettings.minPrice));
  if (filterSettings.maxPrice) result = result.filter(b => (b.price || 0) <= parseFloat(filterSettings.maxPrice));
  if (filterSettings.minRating > 0) result = result.filter(b => (b.avgRating || 0) >= filterSettings.minRating);
  switch (filterSettings.sortBy) {
    case 'price_asc': result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
    case 'price_desc': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
    case 'rating_desc': result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0)); break;
    case 'name_asc': result.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
    default: break;
  }
  renderBooks(result);
}

function resetFilters() { document.getElementById('filterCategory').value = 'all'; document.getElementById('minPrice').value = ''; document.getElementById('maxPrice').value = ''; document.getElementById('filterRating').value = '0'; document.getElementById('sortOrder').value = 'default'; applyFilters(); showToast('Đã đặt lại bộ lọc', 'info'); }

function loadWishlist() { const stored = localStorage.getItem("wishlist"); if (stored) try { wishlist = JSON.parse(stored); if (!Array.isArray(wishlist)) wishlist = []; } catch (e) { wishlist = []; } }
function saveWishlist() { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }
function isWishlisted(bookId) { return wishlist.some(b => b._id === bookId); }
function toggleWishlist(bookId) {
  const book = booksCache.find(b => b._id === bookId);
  if (!book) return;

  const index = wishlist.findIndex(b => b._id === bookId);

  if (index === -1) {
    wishlist.push(book);
    showToast(`Đã thêm "${book.title}" vào yêu thích`, 'success', '❤️');
  } else {
    wishlist.splice(index, 1);
    showToast(`Đã xóa "${book.title}" khỏi yêu thích`, 'warning', '💔');
  }

  saveWishlist();
  renderWishlistIcon();
  renderWishlistPopup();
  applyFilters();

  const modalWishBtn = document.querySelector('.book-modal .modal-btn-wish');
  if (modalWishBtn) {
    const active = isWishlisted(bookId);
    modalWishBtn.classList.toggle('active', active);
    modalWishBtn.innerHTML = `<i class="${active ? 'fas' : 'far'} fa-heart"></i>`;
  }
}
function clearWishlist() { if (!wishlist.length) return; Swal.fire({ title: 'Xóa tất cả yêu thích?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e53e3e', confirmButtonText: 'Xóa tất cả' }).then((result) => { if (result.isConfirmed) { wishlist = []; saveWishlist(); applyFilters(); renderWishlistIcon(); renderWishlistPopup(); showToast('Đã xóa toàn bộ sách yêu thích', 'warning'); } }); }
function renderWishlistIcon() { const btn = document.querySelector('.heart-btn'); if (btn) { const count = wishlist.filter(w => booksCache.some(b => b._id === w._id)).length; btn.innerHTML = `<i class="far fa-heart"></i> <span class="heart-count">${count}</span>`; } }
function renderWishlistPopup() { const container = document.getElementById("wishlistItems"); if (!container) return; if (!wishlist.length) { container.innerHTML = '<div class="heart-empty">Chưa có sách yêu thích</div>'; return; } container.innerHTML = wishlist.map(book => `<div class="heart-dropdown-item" onclick="openBookDetail('${book._id}')"><img src="${getBookImage(book)}" onerror="this.onerror=null; this.src=PLACEHOLDER_SVG"><div class="heart-dropdown-item-info"><div class="title">${escapeHtml(book.title)}</div><div class="author">${escapeHtml(book.author) || "Không rõ tác giả"}</div></div></div>`).join(""); }
function subscribeNewsletter(event) { event.preventDefault(); const email = document.getElementById('newsletterEmail').value; if (email && email.includes('@')) { Swal.fire({ title: 'Đăng ký thành công!', text: `Chúng tôi sẽ gửi ưu đãi đến ${email}`, icon: 'success', timer: 2000, showConfirmButton: false }); document.getElementById('newsletterEmail').value = ''; } else { showToast('Vui lòng nhập email hợp lệ', 'error'); } }

// ==================== LOAD BOOKS ====================
async function loadBooks() {
    if (isLoading) return;
    isLoading = true;
    const container = document.getElementById("new-books");
    if (container) container.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Đang tải sách...</div>';
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(API, { headers: { 'ngrok-skip-browser-warning': '69420' }, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        let data = await res.json();
        if (!Array.isArray(data)) booksCache = data.books || data.data || [];
        else booksCache = data;
        
        for (const book of booksCache) {
            try {
                const reviewRes = await fetch(`${BASE_URL}/api/reviews/book/${book._id}`, {
                    headers: { 'ngrok-skip-browser-warning': '69420' }
                });
                if (reviewRes.ok) {
                    const reviewData = await reviewRes.json();
                    let reviews = [];
                    if (Array.isArray(reviewData)) reviews = reviewData;
                    else if (reviewData.reviews) reviews = reviewData.reviews;
                    else reviews = [];
                    
                    book.reviewCount = reviews.length;
                    book.avgRating = reviews.length > 0 
                        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
                        : 0;
                    
                    console.log(`📊 ${book.title}: ${book.avgRating} sao (${book.reviewCount} đánh giá)`);
                }
            } catch (err) {
                console.warn(`Không thể lấy review cho ${book.title}:`, err);
                book.reviewCount = 0;
                book.avgRating = 0;
            }
        }
        
        retryCount = 0;
        applyFilters();
        
        // === THÊM DÒNG NÀY ĐỂ HIỂN THỊ LỊCH SỬ XEM ===
        if (typeof renderRecentlyViewed === 'function') renderRecentlyViewed();
        
    } catch (err) {
        console.error("Lỗi tải sách:", err);
        if (retryCount < MAX_RETRY) {
            retryCount++;
            showToast(`Thử lại lần ${retryCount}/${MAX_RETRY}...`, 'info', '🔄');
            setTimeout(() => loadBooks(), 2000);
        } else {
            if (container) container.innerHTML = `<div class="empty-state">Không thể tải dữ liệu. Vui lòng thử lại sau.</div>`;
            showToast('Không thể kết nối đến server!', 'error', '🚨');
        }
    } finally {
        isLoading = false;
    }
}

async function loadCategories() {
  try {
    const res = await fetch(CATEGORY_API, { headers: { 'ngrok-skip-browser-warning': '69420' } });
    categoriesCache = await res.json();
    const filterSelect = document.getElementById("filterCategory");
    if (filterSelect && categoriesCache) filterSelect.innerHTML = `<option value="all">Tất cả</option>` + categoriesCache.map(cat => `<option value="${cat.name.replace(/'/g, "\\'")}">${escapeHtml(cat.name)}</option>`).join('');
    const dropdown = document.getElementById("categoryDropdown");
    if (dropdown && categoriesCache) dropdown.innerHTML = `<li><a href="#" onclick="filterByCategory('Tất cả'); return false;">Tất cả</a></li>` + categoriesCache.map(cat => `<li><a href="#" onclick="filterByCategory('${cat.name.replace(/'/g, "\\'")}'); return false;">${escapeHtml(cat.name)}</a></li>`).join('');
  } catch (err) { console.warn("Lỗi loadCategories:", err); }
}

function renderBooks(books) { 
    const container = document.getElementById("new-books"); 
    if (!container) return; 
    
    if (!books || books.length === 0) { 
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 80px 20px; background: white; border-radius: 24px; margin: 40px 0;">
                <i class="fas fa-book-open" style="font-size: 64px; color: #cbd5e1; margin-bottom: 20px;"></i>
                <h3 style="font-size: 24px; color: #1e293b; margin-bottom: 12px;">📚 Không có sách nào</h3>
                <p style="font-size: 16px; color: #64748b; margin-bottom: 30px;">Hiện tại chưa có sách nào trong thư viện.</p>
                <button onclick="resetFilters()" class="btn-filter btn-filter-primary" style="padding: 12px 28px; background: #1D3557; color: white; border: none; border-radius: 30px; cursor: pointer;">
                    <i class="fas fa-sync-alt"></i> Đặt lại bộ lọc
                </button>
            </div>
        `; 
        return; 
    }
    
    container.innerHTML = `
        <div class="book-section-wrapper">
            <div class="container book-section-container">
                <div class="section-header">
                    <div>
                        <p class="section-tag"></p>
                        <h2>${filterSettings.category === 'all' ? 'Tất cả sách' : escapeHtml(filterSettings.category)}</h2>
                    </div>
                </div>
                <div class="section-row">
                    ${books.map(renderBookCard).join('')}
                </div>
            </div>
        </div>
    `; 
}

function renderBookCard(book) { 
    const avgRating = book.avgRating || 0;
    const reviewCount = book.reviewCount || 0;
    const discountPct = typeof getDiscountPct === 'function' ? getDiscountPct(book.price) : 0;
    const originalPrice = discountPct > 0 ? Math.round(book.price / (1 - discountPct / 100) / 1000) * 1000 : book.price;
    const pdfButton = book.samplePdf ? `<button class="modal-btn modal-btn-sample" onclick="openPdfPreview('${book._id}')">📖 Đọc thử</button>` : ""; 
    const bookImage = getBookImage(book);
    const isFav = isWishlisted(book._id);
    
    return `<div class="book-card" data-id="${book._id}">
        <img src="${bookImage}" onclick="openBookDetail('${book._id}')" onerror="this.onerror=null; this.src=PLACEHOLDER_SVG">
        ${discountPct > 0 ? `<div class="discount-badge">-${discountPct}%</div>` : ''}
        <div class="book-info">
            <h3 onclick="openBookDetail('${book._id}')">${escapeHtml(book.title)}</h3>
            <p>${escapeHtml(book.author) || 'Không rõ tác giả'}</p>
            <div class="book-rating">
                <div class="stars">${renderStars(avgRating)}</div>
                <span class="review-count">(${reviewCount} đánh giá)</span>
            </div>
            <div class="price-row">
                <span class="price-sale">${formatPrice(book.price)}</span>
                ${discountPct > 0 ? `<span class="price-orig">${formatPrice(originalPrice)}</span>` : ''}
            </div>
            <div class="book-actions">
                <button class="modal-btn modal-btn-cart" onclick="addToCart('${book._id}', '${escapeHtml(book.title).replace(/'/g, "\\'")}', ${book.price}, '${bookImage}')">🛒 Thêm giỏ</button>
                <button class="modal-btn modal-btn-review" onclick="openReviewModal('${book._id}', '${escapeHtml(book.title).replace(/'/g, "\\'")}')">⭐ Đánh giá</button>
                <button class="modal-btn modal-btn-view-reviews" onclick="viewReviews('${book._id}', '${escapeHtml(book.title).replace(/'/g, "\\'")}')">📝 Xem đánh giá</button>
                ${pdfButton}
                <button class="modal-btn modal-btn-wish ${isFav ? 'active' : ''}" onclick="toggleWishlist('${book._id}')">
                    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                </button>
                
            </div>
        </div>
    </div>`; 
}

function filterByCategory(category) {
  // Set filter value
  if (category === 'Tất cả') document.getElementById('filterCategory').value = 'all';
  else document.getElementById('filterCategory').value = category;

  // Update active state in dropdown
  document.querySelectorAll('#categoryDropdown a').forEach(a => {
    a.classList.remove('active');
    if (a.textContent.trim() === category) a.classList.add('active');
  });

  // Close the dropdown
  const categoryMenu = document.getElementById('categoryMenu');
  if (categoryMenu) categoryMenu.classList.remove('open');

  // Apply filters first
  applyFilters();

  // Scroll to filter bar
  const filterBar = document.getElementById('filter-bar');
  const navHeight = document.querySelector('.main-nav')?.offsetHeight || 70;

  if (filterBar) {
    const top = filterBar.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

function performSearch() { 
  if (booksCache.length === 0) { showToast('Đang tải dữ liệu...', 'info'); loadBooks(); return; } 
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim(); 
  const resultsDiv = document.getElementById('searchResults'); 
  if (searchTerm === '') { resultsDiv.classList.remove('show'); applyFilters(); return; } 
  const results = booksCache.filter(book => (book.title && book.title.toLowerCase().includes(searchTerm)) || (book.author && book.author.toLowerCase().includes(searchTerm)) || (book.category && book.category.toLowerCase().includes(searchTerm))); 
  if (results.length === 0) { resultsDiv.innerHTML = `<div class="search-no-results">😔 Không tìm thấy sách nào cho "${escapeHtml(searchTerm)}"</div>`; resultsDiv.classList.add('show'); } 
  else { resultsDiv.innerHTML = results.slice(0, 5).map(book => `<div class="search-result-item" onclick="selectSearchResult('${book._id}')"><img src="${getBookImage(book)}" class="search-result-img" onerror="this.onerror=null; this.src=PLACEHOLDER_SVG"><div class="search-result-info"><div class="search-result-title">${escapeHtml(book.title)}</div><div class="search-result-author">${escapeHtml(book.author || 'Chưa rõ tác giả')}</div><div class="search-result-price">${formatPrice(book.price)}</div></div></div>`).join(''); resultsDiv.classList.add('show'); } 
  renderBooks(results); 
}

function selectSearchResult(bookId) { 
  const book = booksCache.find(b => b._id === bookId); 
  if (book) { 
    document.getElementById('searchInput').value = book.title; 
    renderBooks([book]); 
    document.getElementById('searchResults').classList.remove('show'); 
    document.getElementById('new-books').scrollIntoView({ behavior: 'smooth' }); 
  } 
}

// ==================== BOOK MODAL - FIXED ====================
async function openBookDetail(id) {
   try {
    let rv = JSON.parse(localStorage.getItem('httvbooks_recently_viewed') || '[]');
    rv = rv.filter(bookId => bookId !== id);
    rv.unshift(id);
    if (rv.length > 8) rv = rv.slice(0, 8);
    localStorage.setItem('httvbooks_recently_viewed', JSON.stringify(rv));
    if (typeof renderRecentlyViewed === 'function') renderRecentlyViewed();
  } catch(e) {}
  let book;
  try {
    const res = await fetch(`${BASE_URL}/api/books/${id}`, {
      headers: { 'ngrok-skip-browser-warning': '69420' }
    });
    if (res.ok) {
      book = await res.json();
      // Cập nhật lại cache
      const idx = booksCache.findIndex(b => b._id === id);
      if (idx !== -1) booksCache[idx] = { ...booksCache[idx], ...book };
    }
  } catch (e) {}
  // Fallback về cache nếu fetch lỗi
  if (!book) book = booksCache.find(b => b._id === id);
  if (!book) return;

  const coverImg = getBookImage(book);
  const gallery = Array.isArray(book.galleryImages) ? book.galleryImages.filter(Boolean) : [];
  const allImgs = [coverImg, ...gallery.map(g => g.startsWith('http') ? g : BASE_URL + g)];

  const pdfButton = book.samplePdf ? `<button class="modal-btn modal-btn-sample" onclick="openPdfPreview('${id}')">📖 Đọc thử</button>` : "";

  const existingModal = document.querySelector('.book-modal');
  if (existingModal) existingModal.remove();

  // Render thumbnail strip nếu có nhiều ảnh
  const thumbsHtml = allImgs.length > 1 ? `
    <div class="modal-thumbs" id="modalThumbs_${id}">
      ${allImgs.map((src, i) => `
        <img src="${src}" class="modal-thumb ${i === 0 ? 'active' : ''}"
          onclick="switchModalImg('${id}', '${src}', this)"
          onerror="this.style.display='none'">
      `).join('')}
    </div>` : '';

  const modal = document.createElement("div");
  modal.className = "book-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="closeBookModal()">&times;</span>
      <div class="modal-left">
        <img src="${coverImg}" id="modalMainImg_${id}" class="modal-main-img" style="cursor:zoom-in" onclick="openLightbox(this.src)" onerror="this.src=PLACEHOLDER_SVG">
        ${thumbsHtml}
      </div>
      <div class="modal-right">
        ${book.category ? `<div class="modal-category-badge">${escapeHtml(book.category)}</div>` : ""}
        <h2>${escapeHtml(book.title)}</h2>
        <p class="modal-author">Tác giả: <strong>${escapeHtml(book.author || "Không rõ")}</strong></p>
        <div class="modal-price">${formatPrice(book.price)}</div>
        <div class="modal-rating">
          <div class="stars">${renderStars(book.avgRating || 0)}</div>
          <span>(${book.reviewCount || 0} đánh giá)</span>
          <button class="view-reviews-link" onclick="viewReviews('${id}', '${escapeHtml(book.title).replace(/'/g, "\\'")}')">Xem tất cả</button>
        </div>
        <div class="modal-actions-row">
          <button class="modal-btn modal-btn-cart" onclick="addToCart('${id}', '${escapeHtml(book.title).replace(/'/g, "\\'")}', ${book.price}, '${coverImg}')">🛒 Thêm giỏ</button>
          <button class="modal-btn modal-btn-review" onclick="openReviewModal('${id}', '${escapeHtml(book.title).replace(/'/g, "\\'")}')">⭐ Đánh giá</button>
          ${pdfButton}
          <button class="modal-btn modal-btn-wish ${isWishlisted(id) ? 'active' : ''}" onclick="toggleWishlist('${id}')">
            <i class="${isWishlisted(id) ? 'fas' : 'far'} fa-heart"></i>
          </button>
          
        </div>
        ${book.description ? `<hr><h4>📖 Nội dung sách</h4><div class="modal-description">${escapeHtml(book.description)}</div>` : ""}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

function switchModalImg(bookId, src, thumbEl) {
  const mainImg = document.getElementById('modalMainImg_' + bookId);
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('#modalThumbs_' + bookId + ' .modal-thumb').forEach(t => t.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
}

function openLightbox(src) {
  const existing = document.getElementById('lightbox');
  if (existing) existing.remove();

  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.style.position = 'fixed';
  lb.style.top = '0';
  lb.style.left = '0';
  lb.style.right = '0';
  lb.style.bottom = '0';
  lb.style.zIndex = '999999';
  lb.style.background = 'rgba(0,0,0,0.92)';
  lb.style.display = 'flex';
  lb.style.alignItems = 'center';
  lb.style.justifyContent = 'center';
  lb.style.cursor = 'zoom-out';

  const img = document.createElement('img');
  img.src = src;
  img.style.maxWidth = '90vw';
  img.style.maxHeight = '90vh';
  img.style.objectFit = 'contain';
  img.style.borderRadius = '10px';
  img.style.boxShadow = '0 8px 40px rgba(0,0,0,0.6)';
  img.style.cursor = 'default';
  img.onclick = (e) => e.stopPropagation();

  const closeBtn = document.createElement('span');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.position = 'fixed';
  closeBtn.style.top = '20px';
  closeBtn.style.right = '28px';
  closeBtn.style.color = '#fff';
  closeBtn.style.fontSize = '44px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.lineHeight = '1';
  closeBtn.style.fontWeight = '300';
  closeBtn.style.zIndex = '1000000';
  closeBtn.style.textShadow = '0 2px 8px rgba(0,0,0,0.7)';
  closeBtn.style.userSelect = 'none';
  lb.appendChild(img);
  lb.appendChild(closeBtn);

  function escHandler(e) {
    if (e.key === 'Escape') {
      lb.remove();
      if (bookModal) bookModal.style.visibility = 'visible';
      document.removeEventListener('keydown', escHandler);
    }
  }
  // Ẩn modal để lightbox hiện lên trên
  const bookModal = document.querySelector('.book-modal');
  if (bookModal) bookModal.style.visibility = 'hidden';

  lb.onclick = (e) => {
    if (e.target === lb) {
      lb.remove();
      if (bookModal) bookModal.style.visibility = 'visible';
    }
  };
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    lb.remove();
    if (bookModal) bookModal.style.visibility = 'visible';
  };

  document.addEventListener('keydown', escHandler);
  document.body.appendChild(lb);
}
  function renderRecentlyViewed() {
    const section = document.getElementById('recentlyViewedSection');
    if (!section) return;
    
    try {
        const rv = JSON.parse(localStorage.getItem('httvbooks_recently_viewed') || '[]');
        
        if (rv.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        // Lấy thông tin sách từ cache
        const books = rv.map(id => booksCache.find(b => b._id === id)).filter(Boolean);
        
        if (books.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        const grid = section.querySelector('.rv-grid');
        if (!grid) return;
        
        grid.innerHTML = books.map(book => {
            const img = getBookImage(book);
            const discountPct = typeof getDiscountPct === 'function' ? getDiscountPct(book.price) : 0;
            const origPrice = discountPct > 0 ? Math.round(book.price / (1 - discountPct / 100) / 1000) * 1000 : book.price;
            
            return `
                <div class="rv-card" onclick="openBookDetail('${book._id}')">
                    <div class="rv-img-wrap">
                        <img src="${img}" onerror="this.src=PLACEHOLDER_SVG" alt="${escapeHtml(book.title)}">
                        ${discountPct > 0 ? `<div class="discount-badge">-${discountPct}%</div>` : ''}
                    </div>
                    <div class="rv-info">
                        <div class="rv-title">${escapeHtml(book.title)}</div>
                        <div class="price-row">
                            <span class="price-sale">${formatPrice(book.price)}</span>
                            ${discountPct > 0 ? `<span class="price-orig">${formatPrice(origPrice)}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch(e) {
        console.warn('renderRecentlyViewed error:', e);
        section.style.display = 'none';
    }
}

function clearRecentlyViewed() {
    localStorage.removeItem('httvbooks_recently_viewed');
    renderRecentlyViewed();
    showToast('Đã xóa lịch sử xem', 'info');
}

function closeBookModal() {
  const modal = document.querySelector('.book-modal');
  if (modal) modal.remove();
  document.body.style.overflow = 'auto';
}

function openPdfPreview(bookId) { 
  const book = booksCache.find(b => b._id === bookId); 
  if (book?.samplePdf) window.open(book.samplePdf.startsWith("http") ? book.samplePdf : `${BASE_URL}${book.samplePdf}`, '_blank'); 
  else showToast('Chưa có file đọc thử cho sách này', 'warning'); 
}

// ==================== REVIEW MODAL ====================
function openReviewModal(bookId, bookTitle) { 
  if (!user) { showToast('Vui lòng đăng nhập để đánh giá sách!', 'warning'); toggleAuth(true); return; } 
  currentReviewBookId = bookId; 
  document.getElementById('reviewBookTitle').innerHTML = `<strong>${escapeHtml(bookTitle)}</strong>`; 
  document.getElementById('reviewRating').value = 0; 
  document.getElementById('reviewComment').value = ''; 
  document.querySelectorAll('.star-rating .star').forEach(s => { s.classList.remove('selected'); s.style.color = '#cbd5e1'; }); 
  document.getElementById('reviewModal').style.display = 'flex'; 
  document.body.style.overflow = 'hidden'; 
}
function closeReviewModal() { document.getElementById('reviewModal').style.display = 'none'; document.body.style.overflow = 'auto'; }

async function submitReview() { 
  const rating = parseInt(document.getElementById('reviewRating').value || 0); 
  const comment = document.getElementById('reviewComment').value.trim(); 
  
  if (!rating) { 
    showToast('Vui lòng chọn số sao đánh giá!', 'warning'); 
    return; 
  } 
  
  if (!comment) { 
    showToast('Vui lòng nhập nhận xét của bạn!', 'warning'); 
    return; 
  } 
  
  if (!user?.token) { 
    showToast('Vui lòng đăng nhập lại!', 'error'); 
    toggleAuth(true); 
    return; 
  } 
  
  const submitBtn = document.querySelector('.btn-submit-review');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
  submitBtn.disabled = true;
  
  try { 
    const res = await fetch(`${BASE_URL}/api/reviews`, { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${user.token}`,
        'ngrok-skip-browser-warning': '69420'
      }, 
      body: JSON.stringify({ 
        bookId: currentReviewBookId, 
        rating: rating, 
        comment: comment 
      }) 
    }); 
    
    if (res.ok) { 
      showToast('Cảm ơn bạn đã đánh giá!', 'success'); 
      closeReviewModal(); 
      await loadBooks(); 
      
      if (currentReviewsBookId === currentReviewBookId) {
        await viewReviews(currentReviewBookId, currentReviewsBookTitle);
      }
    } else { 
      let errMsg = 'Gửi đánh giá thất bại';
      try {
        const err = await res.json();
        errMsg = err.message || errMsg;
      } catch(e) {}
      showToast(errMsg, 'error'); 
    } 
  } catch (e) { 
    console.error('Submit review error:', e);
    showToast('Lỗi kết nối! Vui lòng thử lại sau.', 'error'); 
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  } 
}

// ==================== VIEW REVIEWS ====================
async function viewReviews(bookId, bookTitle) {
  currentReviewsBookId = bookId;
  currentReviewsBookTitle = bookTitle;
  
  document.getElementById('reviewsBookTitle').innerHTML = `<strong>${escapeHtml(bookTitle)}</strong>`;
  document.getElementById('reviewsList').innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Đang tải đánh giá...</div>';
  document.getElementById('reviewsListModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeReviewsModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  try {
    let reviews = [];
    let totalReviews = 0;
    let avgRating = 0;
    let ratingCounts = [0, 0, 0, 0, 0];
    
    try {
      const res = await fetch(`${BASE_URL}/api/reviews/book/${bookId}`, { 
        headers: { 'ngrok-skip-browser-warning': '69420' } 
      });
      
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          reviews = data;
        } else if (data.reviews && Array.isArray(data.reviews)) {
          reviews = data.reviews;
        } else if (data.data && Array.isArray(data.data)) {
          reviews = data.data;
        } else {
          reviews = [];
        }
        
        totalReviews = reviews.length;
        if (totalReviews > 0) {
          avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews;
          reviews.forEach(r => {
            const rating = Math.floor(r.rating || 0);
            if (rating >= 1 && rating <= 5) ratingCounts[rating - 1]++;
          });
        }
      } else {
        console.warn('API trả về lỗi:', res.status);
        const book = booksCache.find(b => b._id === bookId);
        if (book && book.reviews && Array.isArray(book.reviews)) {
          reviews = book.reviews;
          totalReviews = reviews.length;
          if (totalReviews > 0) {
            avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews;
            reviews.forEach(r => {
              const rating = Math.floor(r.rating || 0);
              if (rating >= 1 && rating <= 5) ratingCounts[rating - 1]++;
            });
          }
        }
      }
    } catch (fetchErr) {
      console.warn('Fetch error, trying cache:', fetchErr);
      const book = booksCache.find(b => b._id === bookId);
      if (book && book.reviews && Array.isArray(book.reviews)) {
        reviews = book.reviews;
        totalReviews = reviews.length;
        if (totalReviews > 0) {
          avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews;
          reviews.forEach(r => {
            const rating = Math.floor(r.rating || 0);
            if (rating >= 1 && rating <= 5) ratingCounts[rating - 1]++;
          });
        }
      }
    }
    
    if (totalReviews === 0) {
      document.getElementById('reviewsList').innerHTML = `
        <div class="empty-state">
          <i class="far fa-comment-dots" style="font-size: 48px; color: #cbd5e1;"></i>
          <h3 style="margin-top: 16px;">Chưa có đánh giá nào</h3>
          <p>Hãy là người đầu tiên đánh giá sách này!</p>
          <button class="write-review-btn" onclick="openReviewModal('${bookId}', '${escapeHtml(bookTitle).replace(/'/g, "\\'")}'); closeReviewsModal();">
            <i class="fas fa-star"></i> Viết đánh giá ngay
          </button>
        </div>
      `;
    } else {
      document.getElementById('reviewsList').innerHTML = `
        <div class="rating-summary">
          <div class="rating-summary-header">
            <div class="average-rating">
              <div class="score">${avgRating.toFixed(1)}</div>
              <div class="stars">${renderStarsText(Math.round(avgRating))}</div>
              <div class="total">${totalReviews} đánh giá</div>
            </div>
            <div class="rating-bars">
              ${[5,4,3,2,1].map(star => {
                const percent = totalReviews > 0 ? (ratingCounts[star-1] / totalReviews * 100) : 0;
                return `
                  <div class="rating-bar-item">
                    <div class="rating-bar-label">${star} <i class="fas fa-star" style="color:#fbbf24; font-size:12px;"></i></div>
                    <div class="rating-bar-bg"><div class="rating-bar-fill" style="width: ${percent}%;"></div></div>
                    <div class="rating-bar-percent">${Math.round(percent)}%</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
            <button class="write-review-btn" onclick="openReviewModal('${bookId}', '${escapeHtml(bookTitle).replace(/'/g, "\\'")}'); closeReviewsModal();">
              <i class="fas fa-edit"></i> Viết đánh giá
            </button>
          </div>
        </div>
        <div class="reviews-list-container">
          ${reviews.map((review, index) => renderReviewItem(review, index, bookId)).join('')}
        </div>
      `;
    }
  } catch (e) {
    console.error("Lỗi tải reviews:", e);
    document.getElementById('reviewsList').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-wifi" style="font-size: 48px; color: #ef4444;"></i>
        <h3 style="margin-top: 16px;">Lỗi kết nối</h3>
        <p>Vui lòng kiểm tra kết nối mạng và thử lại</p>
        <button class="btn-filter btn-filter-primary" onclick="viewReviews('${bookId}', '${escapeHtml(bookTitle).replace(/'/g, "\\'")}')" style="margin-top: 20px;">
          <i class="fas fa-sync-alt"></i> Thử lại
        </button>
      </div>
    `;
  }
}

function renderReviewItem(review, index, bookId) {
  const userName = review.userId?.username || review.userId?.name || review.userName || review.author || 'Người dùng';
  const userAvatar = getUserInitials(userName);
  const reviewDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 
                     (review.date ? new Date(review.date).toLocaleDateString('vi-VN') : 'Ngày không rõ');
  const isVerified = review.isVerifiedPurchase || false;
  const reviewId = review._id || review.id || `review_${index}`;
  
  return `
    <div class="review-item" data-review-id="${reviewId}">
      <div class="review-avatar">
        <span>${userAvatar}</span>
      </div>
      <div class="review-content">
        <div class="review-header">
          <div class="reviewer-name">
            ${escapeHtml(userName)}
            ${isVerified ? '<span class="reviewer-badge"><i class="fas fa-check-circle"></i> Đã mua</span>' : ''}
          </div>
          <div class="review-rating">
            ${renderStarsText(review.rating || 0)}
          </div>
        </div>
        <div class="review-date">
          <i class="far fa-calendar-alt"></i> ${reviewDate}
        </div>
        <div class="review-comment">
          "${escapeHtml(review.comment || review.content || 'Không có nội dung')}"
        </div>
        <div class="review-actions">
          <button class="review-action-btn" onclick="likeReview('${reviewId}')">
            <i class="far fa-thumbs-up"></i> Hữu ích (${review.likes || review.helpful || 0})
          </button>
          ${user ? `<button class="review-action-btn" onclick="replyToReview('${reviewId}', '${escapeHtml(userName).replace(/'/g, "\\'")}')">
            <i class="far fa-comment"></i> Trả lời
          </button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function getUserInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function likeReview(reviewId) {
  if (!user) {
    showToast('Vui lòng đăng nhập để like đánh giá!', 'warning');
    toggleAuth(true);
    return;
  }
  showToast('Tính năng đang được phát triển', 'info');
}

function replyToReview(reviewId, userName) {
  if (!user) {
    showToast('Vui lòng đăng nhập để trả lời!', 'warning');
    toggleAuth(true);
    return;
  }
  showToast(`Trả lời ${userName} - Tính năng đang phát triển`, 'info');
}

function closeReviewsModal() { 
  const modal = document.getElementById('reviewsListModal');
  if (modal) modal.style.display = 'none'; 
  document.body.style.overflow = 'auto'; 
}

// ==================== AUTH ====================
function toggleAuth(show) { 
  const panel = document.getElementById("authPanel");
  if (panel) panel.classList.toggle("active", show);
}
function switchAuthTab(tab) { 
  const loginForm = document.getElementById("loginForm"), registerForm = document.getElementById("registerForm"); 
  const tabLogin = document.getElementById("tabLogin"), tabRegister = document.getElementById("tabRegister"); 
  if (tab === "login") { 
    if (loginForm) loginForm.style.display = "block"; 
    if (registerForm) registerForm.style.display = "none"; 
    if (tabLogin) tabLogin.classList.add("active"); 
    if (tabRegister) tabRegister.classList.remove("active"); 
    const authTitle = document.getElementById("authTitle");
    if (authTitle) authTitle.textContent = "Chào bạn trở lại!"; 
  } else { 
    if (loginForm) loginForm.style.display = "none"; 
    if (registerForm) registerForm.style.display = "block"; 
    if (tabLogin) tabLogin.classList.remove("active"); 
    if (tabRegister) tabRegister.classList.add("active"); 
    const authTitle = document.getElementById("authTitle");
    if (authTitle) authTitle.textContent = "Tạo tài khoản mới"; 
  } 
}
function togglePass(inputId, icon) { 
  const inp = document.getElementById(inputId); 
  if (inp && inp.type === "password") { 
    inp.type = "text"; 
    if (icon) icon.classList.replace("fa-eye", "fa-eye-slash"); 
  } else if (inp) { 
    inp.type = "password"; 
    if (icon) icon.classList.replace("fa-eye-slash", "fa-eye"); 
  } 
}

function loginSuccess(userObj, token) {
  user = { id: userObj.id, username: userObj.username, email: userObj.email, role: userObj.role, token };
  localStorage.setItem("user", JSON.stringify(user));
  toggleAuth(false);
  updateUserUI();
  showToast(`Đăng nhập thành công! Xin chào ${user.username}!`, 'success');
}

function logout() { localStorage.removeItem("user"); user = null; updateUserUI(); showToast('Đã đăng xuất khỏi hệ thống', 'info'); }

function updateUserUI() {
    const userBtn = document.getElementById("userBtn");
    const dropdown = document.getElementById("userDropdown");
    
    if (user && userBtn) {
        const userId = user._id || user.id || user.email;
const profileKey = `userProfile_${userId}`;
const userProfile = JSON.parse(localStorage.getItem(profileKey) || '{}');
        const avatarUrl = userProfile.avatar || getUserAvatar();
        const displayName = userProfile.fullName || user.username;
        
        userBtn.innerHTML = `
            <img src="${avatarUrl}" class="navbar-avatar" 
                 onerror="this.src='https://ui-avatars.com/api/?background=1D3557&color=fff&size=32&length=2&name=${encodeURIComponent(user.username)}&bold=true'"
                 style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 8px;">
            <span>${displayName.substring(0, 12)}</span>
        `;
        
        if (dropdown) {
            const adminLink = user.role === 'admin' ? '<a href="dashboard.html">📊 Admin Dashboard</a>' : '';
            dropdown.innerHTML = `
    <a href="#" onclick="openProfile()">👤 Hồ sơ của tôi</a>
    <a href="#" onclick="openEditProfile()">✏️ Chỉnh sửa hồ sơ</a>
    <a href="#" onclick="openSettings()">⚙️ Cài đặt</a>
    <a href="#" onclick="openOrderHistory()">📦 Lịch sử đơn hàng</a>
    ${adminLink}
    <a href="#" onclick="logout()">🚪 Đăng xuất</a>
`;
        }
    } else if (userBtn) {
        userBtn.innerHTML = `<i class="far fa-user-circle"></i>`;
        if (dropdown) {
            dropdown.innerHTML = `<a href="#" onclick="toggleAuth(true)">🔑 Đăng nhập</a>`;
        }
    }
}
// ==================== PROFILE ====================
function openProfile() {
    if (!user) {
        toggleAuth(true);
        return;
    }

    const joinDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('vi-VN')
        : 'Chưa cập nhật';
    
    const userId = user._id || user.id || user.email;
const profileKey = `userProfile_${userId}`;
const userProfile = JSON.parse(localStorage.getItem(profileKey) || '{}');
    const fullName = userProfile.fullName || 'Chưa cập nhật';
    const phone = userProfile.phone || 'Chưa cập nhật';
    const address = userProfile.address || 'Chưa cập nhật';
    const gender = userProfile.gender || 'Chưa cập nhật';
    const birthday = userProfile.birthday ? new Date(userProfile.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
    const avatarUrl = userProfile.avatar || getUserAvatar();

    Swal.fire({
        width: '550px',
        showConfirmButton: false,
        showCloseButton: true,
        background: '#fff',
        customClass: {
            popup: 'profile-popup'
        },
        html: `
            <div class="profile-modal">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <img src="${avatarUrl}" style="width: 88px; height: 88px; border-radius: 50%; object-fit: cover;" 
                             onerror="this.src='https://ui-avatars.com/api/?background=1D3557&color=fff&size=88&length=2&name=${encodeURIComponent(fullName !== 'Chưa cập nhật' ? fullName : user.username)}&bold=true'">
                    </div>
                    <h2>${escapeHtml(fullName !== 'Chưa cập nhật' ? fullName : user.username)}</h2>
                    <p>${escapeHtml(user.email)}</p>
                    <span class="profile-role ${user.role}">
                        ${user.role === 'admin' ? '👑 Quản trị viên' : '📚 Thành viên'}
                    </span>
                </div>
                <div class="profile-body">
                    <div class="profile-card">
                        <div class="profile-label"><i class="fas fa-user"></i> Tên đăng nhập</div>
                        <div class="profile-value">${escapeHtml(user.username)}</div>
                    </div>
                    <div class="profile-card">
                        <div class="profile-label"><i class="fas fa-user-circle"></i> Họ và tên</div>
                        <div class="profile-value">${escapeHtml(fullName)}</div>
                    </div>
                    <div class="profile-card">
                        <div class="profile-label"><i class="fas fa-envelope"></i> Email</div>
                        <div class="profile-value">${escapeHtml(user.email)}</div>
                    </div>
                    <div class="profile-card">
                        <div class="profile-label"><i class="fas fa-phone"></i> Số điện thoại</div>
                        <div class="profile-value">${escapeHtml(phone)}</div>
                    </div>
                    <div class="profile-card">
                        <div class="profile-label"><i class="fas fa-map-marker-alt"></i> Địa chỉ</div>
                        <div class="profile-value">${escapeHtml(address)}</div>
                    </div>
                    <div class="profile-card">
                        <div class="profile-label"><i class="fas fa-venus-mars"></i> Giới tính</div>
                        <div class="profile-value">${escapeHtml(gender === 'nam' ? 'Nam' : gender === 'nu' ? 'Nữ' : gender === 'khac' ? 'Khác' : 'Chưa cập nhật')}</div>
                    </div>
                    <div class="profile-card">
                        <div class="profile-label"><i class="fas fa-calendar"></i> Ngày sinh</div>
                        <div class="profile-value">${escapeHtml(birthday)}</div>
                    </div>
                    <div class="profile-card">
                        <div class="profile-label"><i class="fas fa-calendar-alt"></i> Ngày tham gia</div>
                        <div class="profile-value">${joinDate}</div>
                    </div>
                </div>
                <div class="profile-actions">
                    <button class="profile-btn profile-btn-primary" onclick="Swal.close(); openEditProfile();">
                        <i class="fas fa-edit"></i> Chỉnh sửa hồ sơ
                    </button>
                    <button class="profile-btn profile-btn-danger" onclick="logout(); Swal.close();">
                        <i class="fas fa-sign-out-alt"></i> Đăng xuất
                    </button>
                </div>
            </div>
        `
    });
}

// ==================== CHỈNH SỬA HỒ SƠ VỚI UPLOAD AVATAR ====================
let tempAvatarPreview = null; // Lưu avatar preview tạm thời

function openEditProfile() {
    if (!user) {
        toggleAuth(true);
        return;
    }

    const userId = user._id || user.id || user.email;
const profileKey = `userProfile_${userId}`;
const userProfile = JSON.parse(localStorage.getItem(profileKey) || '{}');
    const currentAvatar = userProfile.avatar || getUserAvatar(user._id || user.id);
    
    tempAvatarPreview = currentAvatar;
    
    Swal.fire({
        title: '<span style="font-family: Sora, sans-serif;">✏️ Chỉnh sửa hồ sơ</span>',
        width: '550px',
        showConfirmButton: false,
        showCloseButton: true,
        background: '#fff',
        customClass: {
            popup: 'edit-profile-popup'
        },
        html: `
            <div class="edit-profile-form">
                <div class="avatar-upload-section">
                    <img src="${currentAvatar}" class="profile-avatar-preview" id="avatarPreview" onerror="this.src='https://ui-avatars.com/api/?background=1D3557&color=fff&size=100&length=2&name=${encodeURIComponent(user.username)}&bold=true'">
                    <label class="avatar-upload-label" for="avatarFileInput">
                        <i class="fas fa-camera"></i>
                    </label>
                    <input type="file" id="avatarFileInput" accept="image/jpeg,image/png,image/jpg,image/gif">
                    <small style="display:block; margin-top:8px; color:#94a3b8; font-size:11px;">Nhấn vào camera để đổi avatar (JPG, PNG, tối đa 2MB)</small>
                </div>
                <div class="edit-field">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" id="editEmail" value="${escapeHtml(user.email || '')}" readonly>
                </div>
                <div class="edit-field">
                    <label><i class="fas fa-user"></i> Tên đăng nhập</label>
                    <input type="text" id="editUsername" value="${escapeHtml(user.username || '')}" readonly>
                </div>
                <div class="edit-field">
                    <label><i class="fas fa-user-circle"></i> Họ và tên</label>
                    <input type="text" id="editFullName" placeholder="Nhập họ tên của bạn" value="${escapeHtml(userProfile.fullName || '')}">
                </div>
                <div class="edit-field-row">
                    <div class="edit-field">
                        <label><i class="fas fa-phone"></i> Số điện thoại</label>
                        <input type="tel" id="editPhone" placeholder="Nhập số điện thoại" value="${escapeHtml(userProfile.phone || '')}">
                    </div>
                    <div class="edit-field">
                        <label><i class="fas fa-calendar"></i> Ngày sinh</label>
                        <input type="date" id="editBirthday" value="${userProfile.birthday || ''}">
                    </div>
                </div>
                <div class="edit-field">
                    <label><i class="fas fa-venus-mars"></i> Giới tính</label>
                    <select id="editGender">
                        <option value="">Chọn giới tính</option>
                        <option value="nam" ${userProfile.gender === 'nam' ? 'selected' : ''}>Nam</option>
                        <option value="nu" ${userProfile.gender === 'nu' ? 'selected' : ''}>Nữ</option>
                        <option value="khac" ${userProfile.gender === 'khac' ? 'selected' : ''}>Khác</option>
                    </select>
                </div>
                <div class="edit-field">
                    <label><i class="fas fa-map-marker-alt"></i> Địa chỉ</label>
                    <input type="text" id="editAddress" placeholder="Nhập địa chỉ của bạn" value="${escapeHtml(userProfile.address || '')}">
                </div>
                <div class="edit-buttons">
                    <button class="btn-edit-save" onclick="saveUserProfileWithAvatar()">
                        <i class="fas fa-save"></i> Lưu thay đổi
                    </button>
                    <button class="btn-edit-cancel" onclick="Swal.close()">
                        <i class="fas fa-times"></i> Hủy
                    </button>
                </div>
            </div>
        `,
        didOpen: () => {
            const avatarInput = document.getElementById('avatarFileInput');
            if (avatarInput) {
                avatarInput.addEventListener('change', handleAvatarPreview);
            }
        }
    });
}

function handleAvatarPreview(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Kiểm tra kích thước (tối đa 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showToast('Ảnh quá lớn! Tối đa 2MB', 'error');
        event.target.value = '';
        return;
    }
    
    // Kiểm tra định dạng
    if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn file ảnh!', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('avatarPreview');
        if (preview) {
            preview.src = e.target.result;
            tempAvatarPreview = e.target.result;
        }
    };
    reader.readAsDataURL(file);
}

function getUserAvatar() {
    // Lấy avatar từ localStorage nếu có
    const userId = user?._id || user?.id || user?.email;
if (!userId) {
    const username = user?.username || 'User';
    return `https://ui-avatars.com/api/?background=1D3557&color=fff&size=100&length=2&name=${encodeURIComponent(username)}&bold=true`;
}
const profileKey = `userProfile_${userId}`;
const userProfile = JSON.parse(localStorage.getItem(profileKey) || '{}');
    if (userProfile.avatar && userProfile.avatar !== 'undefined') {
        return userProfile.avatar;
    }
    // Fallback về avatar mặc định từ UI Avatars API
    const username = user?.username || 'User';
    return `https://ui-avatars.com/api/?background=1D3557&color=fff&size=100&length=2&name=${encodeURIComponent(username)}&bold=true`;
}

async function saveUserProfileWithAvatar() {
    const fullName = document.getElementById('editFullName')?.value.trim() || '';
    const phone = document.getElementById('editPhone')?.value.trim() || '';
    const birthday = document.getElementById('editBirthday')?.value || '';
    const gender = document.getElementById('editGender')?.value || '';
    const address = document.getElementById('editAddress')?.value.trim() || '';
    
    if (phone && !/^[0-9]{10,11}$/.test(phone)) {
        showToast('Số điện thoại không hợp lệ! (10-11 số)', 'error');
        return;
    }
    
    // Lấy userId để lưu riêng
    const userId = user?._id || user?.id || user?.email;
    const profileKey = `userProfile_${userId}`;
    
    const userProfile = {
        fullName: fullName,
        phone: phone,
        birthday: birthday,
        gender: gender,
        address: address,
        updatedAt: new Date().toISOString()
    };
    
    if (tempAvatarPreview && tempAvatarPreview.startsWith('data:image')) {
        userProfile.avatar = tempAvatarPreview;
    } else {
        const oldProfile = JSON.parse(localStorage.getItem(profileKey) || '{}');
        if (oldProfile.avatar) {
            userProfile.avatar = oldProfile.avatar;
        }
    }
    
    localStorage.setItem(profileKey, JSON.stringify(userProfile));
    
    updateNavbarAvatar();
    
    Swal.close();
    showToast('Đã cập nhật hồ sơ thành công!', 'success');
    setTimeout(() => openProfile(), 300);
}

function openSettings() {
    if (!user) {
        toggleAuth(true);
        return;
    }

    Swal.fire({
        width: '760px',
        showConfirmButton: false,
        showCloseButton: true,
        background: '#fff',
        customClass: {
            popup: 'settings-popup'
        },
        html: `
            <div class="settings-modal">
                <div class="settings-header">
                    <div class="settings-icon"><i class="fas fa-cog"></i></div>
                    <h2>Cài đặt tài khoản</h2>
                    <p>Tùy chỉnh trải nghiệm của bạn tại HTTVBOOKS</p>
                </div>
                <div class="settings-section">
                    <div class="settings-section-title">👤 Thông tin cá nhân</div>
                    <div class="settings-card">
                        <label>Tên người dùng</label>
                        <input type="text" id="settingsUsername" value="${escapeHtml(user.username || '')}">
                    </div>
                    <div class="settings-card">
                        <label>Email</label>
                        <input type="email" id="settingsEmail" value="${escapeHtml(user.email || '')}">
                    </div>
                </div>
                <div class="settings-section">
                    <div class="settings-section-title">🔒 Bảo mật</div>
                    <div class="settings-card">
                        <label>Mật khẩu hiện tại</label>
                        <div class="settings-password-wrap">
                            <input type="password" id="currentPassword" placeholder="Nhập mật khẩu hiện tại">
                            <button type="button" class="toggle-setting-pass" onclick="toggleFieldPassword('currentPassword', this)"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>
                    <div class="settings-card">
                        <label>Mật khẩu mới</label>
                        <div class="settings-password-wrap">
                            <input type="password" id="newPassword" placeholder="Nhập mật khẩu mới">
                            <button type="button" class="toggle-setting-pass" onclick="toggleFieldPassword('newPassword', this)"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>
                    <div class="settings-card">
                        <label>Xác nhận mật khẩu mới</label>
                        <div class="settings-password-wrap">
                            <input type="password" id="confirmPassword" placeholder="Nhập lại mật khẩu mới">
                            <button type="button" class="toggle-setting-pass" onclick="toggleFieldPassword('confirmPassword', this)"><i class="fas fa-eye"></i></button>
                        </div>
                    </div>
                    <button class="btn-save" onclick="changeAdminPassword()"><i class="fas fa-key"></i> Đổi mật khẩu</button>
                </div>
                <div class="settings-actions">
                    <button class="settings-btn settings-btn-save" onclick="saveUserSettings()"><i class="fas fa-save"></i> Lưu thay đổi</button>
                    <button class="settings-btn settings-btn-cancel" onclick="Swal.close()"><i class="fas fa-times"></i> Đóng</button>
                </div>
            </div>
        `
    });
}

function toggleFieldPassword(fieldId, btn) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function saveUserSettings() {
    const username = document.getElementById('settingsUsername').value.trim();
    const email = document.getElementById('settingsEmail').value.trim();
    
    if (!username || !email) {
        showToast('Vui lòng nhập đầy đủ thông tin', 'warning');
        return;
    }

    user.username = username;
    user.email = email;

    localStorage.setItem('user', JSON.stringify(user));
    updateUserUI();

    Swal.close();
    showToast('Đã lưu thay đổi cài đặt thành công!', 'success');
}

function showHomePage() { 
  const mainContent = document.getElementById('mainContent'); 
  const filterBar = document.querySelector('.filter-bar'); 
  const hero = document.querySelector('.hero'); 
  if (mainContent) mainContent.style.display = 'block'; 
  if (filterBar) filterBar.style.display = 'block'; 
  if (hero) hero.style.display = 'block'; 
  const filterCategory = document.getElementById('filterCategory');
  if (filterCategory) filterCategory.value = 'all'; 
  applyFilters(); 
}

function initStarRating() {
  document.body.addEventListener('click', (e) => {
    if (e.target.classList?.contains('star') && e.target.closest('.star-rating')) {
      const stars = e.target.closest('.star-rating').querySelectorAll('.star');
      const value = parseInt(e.target.getAttribute('data-value'));
      const ratingInput = document.getElementById('reviewRating');
      if (ratingInput) ratingInput.value = value;
      stars.forEach(s => { 
        const sv = parseInt(s.getAttribute('data-value')); 
        s.style.color = sv <= value ? '#fbbf24' : '#cbd5e1'; 
        s.classList.toggle('selected', sv <= value); 
      });
    }
  });
}
function updateNavbarAvatar() {
    const userBtn = document.getElementById('userBtn');
    if (!userBtn) return;
    
    const userId = user._id || user.id || user.email;
const profileKey = `userProfile_${userId}`;
const userProfile = JSON.parse(localStorage.getItem(profileKey) || '{}');
    const avatarUrl = userProfile.avatar || getUserAvatar();
    const displayName = userProfile.fullName || user?.username || 'User';
    
    // Tạo avatar nhỏ trên navbar
    userBtn.innerHTML = `
        <img src="${avatarUrl}" class="navbar-avatar" 
             onerror="this.src='https://ui-avatars.com/api/?background=1D3557&color=fff&size=32&length=2&name=${encodeURIComponent(user?.username || 'User')}&bold=true'"
             style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 8px;">
        <span>${displayName.substring(0, 12)}</span>
    `;
}
async function uploadImageForBook(bookId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
        const res = await fetch(`${BASE_URL}/api/books/${bookId}`, {
            method: 'PUT',
            body: formData,
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (res.ok) {
            showToast('Cập nhật ảnh thành công!', 'success');
            loadBooks();
            return true;
        } else {
            const error = await res.text();
            showToast('Lỗi: ' + error.substring(0, 100), 'error');
            return false;
        }
    } catch (err) {
        showToast('Lỗi kết nối: ' + err.message, 'error');
        return false;
    }
}

async function deleteReview(reviewId, bookId) {
  if (!user) {
    showToast('Vui lòng đăng nhập để xóa đánh giá!', 'warning');
    toggleAuth(true);
    return;
  }
  
  const result = await Swal.fire({
    title: 'Xóa đánh giá?',
    text: 'Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy'
  });
  
  if (!result.isConfirmed) return;
  
  try {
    const res = await fetch(`${BASE_URL}/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    });
    
    if (res.ok) {
      showToast('Đã xóa đánh giá thành công!', 'success');
      if (currentReviewsBookId === bookId) {
        await viewReviews(bookId, currentReviewsBookTitle);
      }
      loadBooks();
    } else {
      const book = booksCache.find(b => b._id === bookId);
      if (book && book.reviews) {
        const index = book.reviews.findIndex(r => (r._id === reviewId || r.id === reviewId));
        if (index !== -1) {
          book.reviews.splice(index, 1);
          if (book.reviews.length > 0) {
            book.avgRating = book.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / book.reviews.length;
          } else {
            book.avgRating = 0;
          }
          book.reviewCount = book.reviews.length;
          showToast('Đã xóa đánh giá thành công!', 'success');
          if (currentReviewsBookId === bookId) {
            await viewReviews(bookId, currentReviewsBookTitle);
          }
          applyFilters();
        } else {
          showToast('Không tìm thấy đánh giá để xóa', 'error');
        }
      } else {
        showToast('Không thể xóa đánh giá. Vui lòng thử lại sau.', 'error');
      }
    }
  } catch (e) {
    console.error('Lỗi khi xóa review:', e);
    const book = booksCache.find(b => b._id === bookId);
    if (book && book.reviews) {
      const index = book.reviews.findIndex(r => (r._id === reviewId || r.id === reviewId));
      if (index !== -1) {
        book.reviews.splice(index, 1);
        if (book.reviews.length > 0) {
          book.avgRating = book.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / book.reviews.length;
        } else {
          book.avgRating = 0;
        }
        book.reviewCount = book.reviews.length;
        showToast('Đã xóa đánh giá thành công!', 'success');
        if (currentReviewsBookId === bookId) {
          await viewReviews(bookId, currentReviewsBookTitle);
        }
        applyFilters();
      } else {
        showToast('Không thể xóa đánh giá. Vui lòng thử lại sau.', 'error');
      }
    } else {
      showToast('Lỗi kết nối: Không thể xóa đánh giá', 'error');
    }
  }
}

function findBooksMissingImage() {
    return booksCache.filter(book => !book.coverImage || book.coverImage === undefined || book.coverImage === null);
}

function showUploadPanelForBook(bookTitle) {
    const book = booksCache.find(b => b.title === bookTitle);
    if (!book) {
        showToast('Không tìm thấy sách!', 'error');
        return;
    }
    
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed; bottom:20px; right:20px; background:white; padding:20px; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.2); z-index:10000; border:2px solid #1D3557;';
    panel.innerHTML = `
        <h4 style="margin:0 0 10px 0;">📷 Upload ảnh cho sách</h4>
        <p style="margin:0 0 10px 0; font-size:14px;"><strong>${book.title}</strong></p>
        <input type="file" id="uploadImageInput" accept="image/*" style="margin-bottom:10px;">
        <button id="confirmUploadBtn" style="background:#1D3557; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer;">Upload</button>
        <button id="cancelUploadBtn" style="background:#999; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer;">Đóng</button>
        <div id="uploadMessage" style="margin-top:8px; font-size:12px;"></div>
    `;
    document.body.appendChild(panel);
    
    document.getElementById('cancelUploadBtn').onclick = () => panel.remove();
    document.getElementById('confirmUploadBtn').onclick = async () => {
        const fileInput = document.getElementById('uploadImageInput');
        const file = fileInput.files[0];
        if (!file) {
            document.getElementById('uploadMessage').innerHTML = '<span style="color:red;">Chọn file ảnh!</span>';
            return;
        }
        document.getElementById('uploadMessage').innerHTML = '<span style="color:blue;">Đang upload...</span>';
        const success = await uploadImageForBook(book._id, file);
        if (success) panel.remove();
    };
}

// ==================== ORDER HISTORY ====================
function openOrderHistory() {
    if (!user) {
        showToast('Vui lòng đăng nhập để xem lịch sử đơn hàng!', 'warning');
        toggleAuth(true);
        return;
    }
    
    Swal.fire({
        title: '📦 Lịch sử đơn hàng',
        width: '900px',
        showConfirmButton: false,
        showCloseButton: true,
        html: '<div id="orderHistoryModalContent" style="max-height: 500px; overflow-y: auto;"><div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div></div>',
        didOpen: async () => {
            await loadOrderHistoryForModal();
        }
    });
}

async function loadOrderHistoryForModal() {
    const container = document.getElementById('orderHistoryModalContent');
    if (!container) return;
    
    const email = user?.email || '';
    
    if (!email) {
        container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-envelope"></i><p>Không tìm thấy email của bạn</p></div>';
        return;
    }
    
    try {
        const url = `${BASE_URL}/api/orders/email/${encodeURIComponent(email)}`;
        const response = await fetch(url, {
            headers: {
                'ngrok-skip-browser-warning': 'true',
                ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            let orders = data.orders || data;
            
            if (!orders || orders.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px;">
                        <i class="fas fa-shopping-bag" style="font-size: 64px; color: #cbd5e1; margin-bottom: 20px;"></i>
                        <h3 style="color: #1e293b;">Chưa có đơn hàng nào</h3>
                        <p style="color: #64748b; margin-top: 10px;">Email: ${email}</p>
                        <p style="color: #64748b;">Hãy mua sắm ngay tại HTTVBOOKS!</p>
                        <button onclick="Swal.close(); window.location.href='index.html'" style="margin-top: 20px; padding: 10px 24px; background: #e53e3e; color: white; border: none; border-radius: 30px; cursor: pointer;">
                            🛒 Mua sắm ngay
                        </button>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = orders.map(order => {
                const statusText = {
                    'pending': '⏳ Chờ xử lý',
                    'shipped': '🚚 Đang gửi',
                    'delivered': '✅ Đã gửi'
                }[order.status] || order.status;
                
                const statusClass = {
                    'pending': '#fef3c7',
                    'shipped': '#dbeafe',
                    'delivered': '#d1fae5'
                }[order.status] || '#f1f5f9';
                
                const orderDate = new Date(order.createdAt || order.date).toLocaleString("vi-VN");
                const items = order.items || [];
                
                return `
                    <div style="background: #f8fafc; border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; margin-bottom: 12px;">
                            <div>
                                <strong style="color: #1D3557;">#${(order._id || order.id || order.orderId).slice(-8)}</strong>
                                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">📅 ${orderDate}</div>
                            </div>
                            <div>
                                <span style="background: ${statusClass}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${statusText}</span>
                            </div>
                            <div style="font-weight: 800; color: #e53e3e; font-size: 18px;">${formatPrice(order.total)}</div>
                        </div>
                        <div style="margin-top: 12px;">
                            ${items.map(item => `
                                <div style="display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                                    <img src="${getBookImage(item)}" style="width: 40px; height: 52px; object-fit: cover; border-radius: 8px;" onerror="this.src='https://via.placeholder.com/40x52?text=No+Image'">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; font-size: 14px;">${escapeHtml(item.title || item.name)}</div>
                                        <div style="font-size: 12px; color: #64748b;">Số lượng: ${item.quantity || 1}</div>
                                    </div>
                                    <div style="font-weight: 600;">${formatPrice(item.price)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
            
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e53e3e; margin-bottom: 20px;"></i>
                    <h3 style="color: #1e293b;">Lỗi tải đơn hàng</h3>
                    <p style="color: #64748b;">Mã lỗi: ${response.status}</p>
                    <p style="color: #64748b;">Vui lòng thử lại sau.</p>
                    <button onclick="Swal.close();" style="margin-top: 20px; padding: 10px 24px; background: #1D3557; color: white; border: none; border-radius: 30px; cursor: pointer;">Đóng</button>
                </div>
            `;
        }
        
    } catch (err) {
        console.error('Lỗi kết nối:', err);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-wifi" style="font-size: 48px; color: #e53e3e; margin-bottom: 20px;"></i>
                <h3 style="color: #1e293b;">Lỗi kết nối</h3>
                <p style="color: #64748b;">Không thể kết nối đến server.</p>
                <button onclick="loadOrderHistoryForModal()" style="margin-top: 20px; padding: 10px 24px; background: #1D3557; color: white; border: none; border-radius: 30px; cursor: pointer;">🔄 Thử lại</button>
            </div>
        `;
    }
}

async function changeAdminPassword() {
    const currentPassword = document.getElementById('currentPassword')?.value || '';
    const newPassword = document.getElementById('newPassword')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    
    if (!currentPassword) {
        showToast('Vui lòng nhập mật khẩu hiện tại!', 'error');
        return;
    }
    
    if (!newPassword) {
        showToast('Vui lòng nhập mật khẩu mới!', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp!', 'error');
        return;
    }
    
    const storedUser = localStorage.getItem('user');
    let userId = null;
    let token = null;
    
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            userId = userData._id || userData.id;
            token = userData.token;
        } catch (e) {}
    }
    
    if (!userId) {
        showToast('Không tìm thấy thông tin người dùng!', 'error');
        return;
    }
    
    Swal.fire({
        title: 'Đang xử lý...',
        text: 'Vui lòng chờ',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
    
    try {
        const response = await fetch(`${BASE_URL}/api/users/${userId}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                'ngrok-skip-browser-warning': '69420'
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const currentPassInput = document.getElementById('currentPassword');
            const newPassInput = document.getElementById('newPassword');
            const confirmPassInput = document.getElementById('confirmPassword');
            
            if (currentPassInput) currentPassInput.value = '';
            if (newPassInput) newPassInput.value = '';
            if (confirmPassInput) confirmPassInput.value = '';
            
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: data.message || 'Đã đổi mật khẩu thành công!',
                timer: 2000,
                showConfirmButton: false
            });
            
            setTimeout(() => {
                Swal.fire({
                    icon: 'info',
                    title: 'Thông báo',
                    text: 'Vui lòng đăng nhập lại với mật khẩu mới!',
                    confirmButtonColor: '#1D3557'
                }).then(() => {
                    localStorage.removeItem('user');
                    window.location.reload();
                });
            }, 2000);
        } else {
            showToast(data.message || 'Đổi mật khẩu thất bại!', 'error');
        }
    } catch (err) {
        console.error('Lỗi đổi mật khẩu:', err);
        showToast('Lỗi kết nối server!', 'error');
    }
}


// ==================== OPEN READER ====================
function openReader(bookId) {
  if (!user) {
    showToast('Vui lòng đăng nhập để đọc sách!', 'warning');
    toggleAuth(true);
    return;
  }
  window.open(`reader.html?id=${bookId}`, '_blank');
}

// ==================== DOM READY ====================
document.addEventListener("DOMContentLoaded", () => {
  loadWishlist();
  updateCartBadge();
  renderCartDropdown();
  const storedUser = localStorage.getItem("user");
  if (storedUser) try { user = JSON.parse(storedUser); } catch (e) { user = null; }
  updateUserUI();
  loadBooks();
  loadCategories();
  initStarRating();

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => { 
      if (searchInput.value.trim() === '') { 
        const resultsDiv = document.getElementById('searchResults');
        if (resultsDiv) resultsDiv.classList.remove('show'); 
        applyFilters(); 
      } else performSearch(); 
    });
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
  }
  
  document.addEventListener('click', (e) => { 
    if (!e.target.closest('.search-container')) {
      const resultsDiv = document.getElementById('searchResults');
      if (resultsDiv) resultsDiv.classList.remove('show');
    }
  });

  const heartWrapper = document.querySelector('.heart-wrapper');
  const heartDropdown = document.querySelector('.heart-dropdown');
  if (heartWrapper) {
    heartWrapper.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      if (heartDropdown) heartDropdown.classList.toggle('show'); 
    });
  }
  document.addEventListener('click', () => { if (heartDropdown) heartDropdown.classList.remove('show'); });

  const userBtn = document.getElementById('userBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (userBtn) {
    userBtn.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      if (userDropdown) userDropdown.classList.toggle('show'); 
    });
  }
  document.addEventListener('click', () => { if (userDropdown) userDropdown.classList.remove('show'); });

  const cartBtn = document.getElementById('cartBtn');
  const cartDropdown = document.getElementById('cartDropdown');
  if (cartBtn) {
    cartBtn.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      if (cartDropdown) cartDropdown.classList.toggle('show'); 
      renderCartDropdown();
    });
  }
  document.addEventListener('click', (e) => { 
    if (!e.target.closest('.cart-wrapper') && cartDropdown) cartDropdown.classList.remove('show'); 
  });

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`${AUTH_API}/login`, { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ 
            email: document.getElementById("loginEmail").value, 
            password: document.getElementById("loginPass").value 
          }) 
        });
        const data = await res.json();
        if (res.ok) loginSuccess(data.user, data.token);
        else showToast(data.message || "Sai email hoặc mật khẩu", 'error');
      } catch (e) { showToast("Không thể kết nối server", 'error'); }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`${AUTH_API}/register`, { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ 
            username: document.getElementById("regName").value, 
            email: document.getElementById("regEmail").value, 
            password: document.getElementById("regPass").value 
          }) 
        });
        const data = await res.json();
        if (res.ok) { 
          showToast("Đăng ký thành công! Vui lòng đăng nhập", 'success'); 
          switchAuthTab("login"); 
        } else showToast(data.message || "Đăng ký thất bại", 'error');
      } catch (e) { showToast("Không thể kết nối server", 'error'); }
    });
  }

  setTimeout(() => {
      const missingBooks = findBooksMissingImage();
      if (missingBooks.length > 0) {
          console.log('📕 Sách thiếu ảnh:', missingBooks.map(b => b.title));
          console.log('Để upload ảnh, gõ: showUploadPanelForBook("Tên sách")');
      }
  }, 2000);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const bookModal = document.querySelector('.book-modal');
      const reviewModal = document.getElementById('reviewModal');
      const reviewsModal = document.getElementById('reviewsListModal');
      const authPanel = document.getElementById('authPanel');
      
      if (bookModal) closeBookModal();
      if (reviewModal && reviewModal.style.display === 'flex') closeReviewModal();
      if (reviewsModal && reviewsModal.style.display === 'flex') closeReviewsModal();
      if (authPanel && authPanel.classList.contains('active')) toggleAuth(false);
    }
  });

  // === THÊM ĐOẠN NÀY VÀO ĐÂY ===
  setTimeout(() => {
      if (typeof renderRecentlyViewed === 'function') {
          renderRecentlyViewed();
          console.log('✅ Đã gọi renderRecentlyViewed sau 1.5s');
      }
  }, 1500);
});

// Thêm CSS động cho các nút
const deleteButtonStyle = document.createElement('style');
deleteButtonStyle.textContent = `
  .delete-review-btn:hover {
    background: #fee2e2 !important;
    color: #dc2626 !important;
  }
  
  .write-review-btn {
    background: linear-gradient(135deg, #1D3557, #274c77);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 28px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
  }
  
  .write-review-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(29, 53, 87, 0.25);
  }
  
  .empty-state .write-review-btn {
    margin-top: 20px;
  }
`;
document.head.appendChild(deleteButtonStyle);