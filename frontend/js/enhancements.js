/* ============================================================
   HTTVBOOKS – ENHANCEMENTS PRO v4
   Banner nâng cấp | Trending | Yêu thích | Gợi ý thông minh | Dark mode
   ============================================================ */

const BANNERS = [
  {
    id: 1,
    tag: '🔥 SIÊU SALE HÔM NAY',
    /* Giữ màu Vàng Cam rực rỡ truyền thống của Flash Sale */
    title: '<span style="color:#ffffff">Giảm Đến </span><span style="color:#fbbf24; font-weight:900; text-shadow: 0 0 10px rgba(251,191,36,0.6)">50%</span><br><span style="color:#ffffff">Sách Bestseller</span>',
    sub: 'Hàng ngàn đầu sách hay, giá không thể rẻ hơn. Mua ngay trước khi hết!',
    cta: 'Xem Flash Sale',
    pct: '-50%',
    ctaAction: 'scrollToFlashSale()',
    bgGradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    icon: '🔥'
  },
  {
    id: 2,
    tag: '🎁 QUÀ TẶNG ĐẶC BIỆT',
    /* Gợi ý: Màu Hồng Pastel Neon (#ff79c6) cực kỳ ngọt ngào và nổi bật trên nền tím thẫm */
    title: '<span style="color:#ffffff">Mua 2 Tặng 1<br></span><span style="color:#ff79c6; font-weight:900; text-shadow: 0 0 10px rgba(255,121,198,0.5)">Tri Thức Vô Giá</span>',
    sub: 'Gói quà đặc biệt dịp lễ, miễn phí vận chuyển cho đơn hàng từ 200.000đ.',
    cta: 'Xem Quà Tặng',
    pct: 'FREE\nSHIP',
    ctaAction: "filterByCategory('Tất cả')",
    bgGradient: 'linear-gradient(135deg, #1a0533 0%, #6d28d9 55%, #f59e0b 100%)',
    icon: '🎁'
  },
  {
    id: 3,
    tag: '📚 SÁCH MỚI RA MẮT',
    /* Gợi ý: Màu Vàng Chanh Mint sáng (#e0fe00) tạo cảm giác tươi mới, dịu mắt nhưng cực nổi trên nền xanh lá */
    title: '<span style="color:#ffffff">Khám Phá Bộ Sách</span><br><span style="color:#e0fe00; font-weight:900; text-shadow: 0 0 10px rgba(224,254,0,0.6)">Mới Nhất 2025</span>',
    sub: 'Cập nhật liên tục các tựa sách hot nhất từ NXB hàng đầu Việt Nam.',
    cta: 'Khám Phá Ngay',
    pct: 'NEW',
    ctaAction: "filterByCategory('Tất cả')",
    bgGradient: 'linear-gradient(135deg, #0a2e1f 0%, #065f46 55%, #10b981 100%)',
    icon: '📚'
  },
  {
    id: 4,
    tag: '⚡ KỸ NĂNG SỐNG',
    /* Gợi ý: Màu Xanh Ngọc Lam sáng (#50fa7b) mang tính công nghệ, bứt phá, rất hợp với nền đỏ cam cháy */
    title: '<span style="color:#ffffff">Đầu Tư Vào Bản Thân<br></span><span style="color:#50fa7b; font-weight:900; text-shadow: 0 0 10px rgba(80,250,123,0.5)">Ngay Hôm Nay</span>',
    sub: 'Bộ sách kỹ năng, phát triển cá nhân được đọc nhiều nhất Việt Nam.',
    cta: 'Xem Ngay',
    pct: '-30%',
    ctaAction: "filterByCategory('Kỹ năng sống')",
    bgGradient: 'linear-gradient(135deg, #1c1c2e 0%, #c84b31 55%, #eccc68 100%)',
    icon: '⚡'
  },
  {
    id: 5,
    tag: '🌟 BESTSELLER CHÂU Á',
    /* Gợi ý: Màu Cam San Hô sáng (#ffb86c) tạo điểm nhấn ấm áp, sang xịn mịn trên nền xanh dương mờ */
    title: '<span style="color:#ffffff">Top 10 Cuốn Sách<br></span><span style="color:#ffb86c; font-weight:900; text-shadow: 0 0 10px rgba(255,184,108,0.5)">Được Yêu Thích Nhất</span>',
    sub: 'Những tựa sách làm thay đổi cuộc đời hàng triệu độc giả.',
    cta: 'Xem Bestseller',
    pct: '-40%',
    ctaAction: "filterByCategory('Tiểu thuyết')",
    bgGradient: 'linear-gradient(135deg, #2c3e50 0%, #3498db 50%, #2980b9 100%)',
    icon: '🌟'
  },
  {
    id: 6,
    tag: '💎 SÁCH KINH ĐIỂN',
    /* Gợi ý: Màu Xanh Băng Giá (#8be9fd) mang lại cảm giác cổ điển, quý phái trên nền đỏ thẫm */
    title: '<span style="color:#ffffff">Tủ Sách Văn Học<br></span><span style="color:#8be9fd; font-weight:900; text-shadow: 0 0 10px rgba(139,233,253,0.5)">Thế Giới</span>',
    sub: 'Những kiệt tác mọi thời đại, bản dịch mới nhất.',
    cta: 'Khám Phá Ngay',
    pct: '-25%',
    ctaAction: "filterByCategory('Văn học')",
    bgGradient: 'linear-gradient(135deg, #8e0e00 0%, #d7342a 50%, #f39c12 100%)',
    icon: '💎'
  }
];




// ── DARK MODE ────────────────────────────────────────────────────
function initDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) document.body.classList.add('dark-mode');
  
  const btn = document.createElement('button');
  btn.id = 'darkModeToggle';
  btn.innerHTML = '<i class="fas fa-moon"></i>';
  btn.title = 'Chế độ tối/sáng';
  btn.onclick = () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    btn.innerHTML = document.body.classList.contains('dark-mode') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  };
  document.body.appendChild(btn);
}

// ── YÊU THÍCH (FAVORITES) ────────────────────────────────────────
const FAV_KEY = 'httvbooks_favorites';

function toggleFavorite(bookId, bookTitle, bookPrice, bookImage) {
  let favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  const index = favs.findIndex(f => f.id === bookId);
  if (index === -1) {
    favs.push({ id: bookId, title: bookTitle, price: bookPrice, image: bookImage });
    if (typeof showToast === 'function') showToast(`❤️ Đã thêm "${bookTitle}" vào yêu thích`, 'success');
  } else {
    favs.splice(index, 1);
    if (typeof showToast === 'function') showToast(`💔 Đã xóa "${bookTitle}" khỏi yêu thích`, 'info');
  }
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  renderFavorites();
  return favs.length;
}

function isFavorite(bookId) {
  const favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  return favs.some(f => f.id === bookId);
}

function renderFavorites() {
  const section = document.getElementById('favoritesSection');
  if (!section) return;
  const favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  if (favs.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  const grid = section.querySelector('.fav-grid');
  if (!grid) return;
  grid.innerHTML = favs.map(book => `
    <div class="fav-card" onclick="openBookDetail('${book.id}')">
      <div class="fav-img-wrap">
        <img src="${book.image}" onerror="this.src=PLACEHOLDER_SVG" alt="${escapeHtml(book.title)}">
        <button class="fav-remove-btn" onclick="event.stopPropagation(); toggleFavorite('${book.id}','${escapeHtml(book.title).replace(/'/g,"\\'")}',${book.price},'${book.image}')">
          <i class="fas fa-heart-broken"></i>
        </button>
      </div>
      <div class="fav-info">
        <div class="fav-title">${escapeHtml(book.title)}</div>
        <div class="fav-price">${formatPrice(book.price)}</div>
      </div>
    </div>
  `).join('');
}

function buildFavoritesSection() {
  const section = document.createElement('section');
  section.id = 'favoritesSection';
  section.className = 'favorites-section';
  section.style.display = 'none';
  section.innerHTML = `
    <div class="container">
      <div class="section-header">
        <div class="section-icon">❤️</div>
        <div>
          <p class="section-tag">SÁCH YÊU THÍCH</p>
          <h2>Những Cuốn Sách Bạn Đã Thích</h2>
        </div>
      </div>
      <div class="fav-grid"></div>
    </div>`;
  return section;
}

// ── TRENDING WEEKLY ──────────────────────────────────────────────
function buildTrendingSection(books) {
  const trending = [...books].sort(() => 0.5 - Math.random()).slice(0, 6);
  const section = document.createElement('section');
  section.className = 'trending-section';
  section.innerHTML = `
    <div class="container">
      <div class="section-header">
        <div class="section-icon">📈</div>
        <div>
          <p class="section-tag">XU HƯỚNG TUẦN NÀY</p>
          <h2>Được Đọc Nhiều Nhất 🔥</h2>
        </div>
      </div>
      <div class="trending-grid">
        ${trending.map((book, idx) => {
          const img = getBookImage(book);
          return `
            <div class="trending-card" onclick="openBookDetail('${book._id}')">
              <div class="trending-rank">#${idx + 1}</div>
              <img src="${img}" onerror="this.src=PLACEHOLDER_SVG" alt="${escapeHtml(book.title)}">
              <div class="trending-info">
                <div class="trending-title">${escapeHtml(book.title)}</div>
                <div class="trending-price">${formatPrice(book.price)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>`;
  return section;
}

// ── SÁCH MỚI RA MẮT ──────────────────────────────────────────────
function buildNewReleasesSection(books) {
  const newBooks = books.slice(0, 6);
  const section = document.createElement('section');
  section.className = 'new-releases-section';
  section.innerHTML = `
    <div class="container">
      <div class="section-header">
        <div class="section-icon">✨</div>
        <div>
          <p class="section-tag">VỪA RA MẮT</p>
          <h2>Sách Mới Tuần Này 🆕</h2>
        </div>
      </div>
      <div class="new-releases-grid">
        ${newBooks.map(book => {
          const img = getBookImage(book);
          const disc = getDiscountPct(book.price);
          const orig = getOriginalPrice(book.price, disc);
          return `
            <div class="new-release-card" onclick="openBookDetail('${book._id}')">
              <div class="new-img-wrap">
                <img src="${img}" onerror="this.src=PLACEHOLDER_SVG" alt="${escapeHtml(book.title)}">
                <div class="new-badge">Mới</div>
                ${disc ? `<div class="discount-badge">-${disc}%</div>` : ''}
              </div>
              <div class="new-info">
                <div class="new-title">${escapeHtml(book.title)}</div>
                <div class="price-row">
                  <span class="price-sale">${formatPrice(book.price)}</span>
                  ${disc ? `<span class="price-orig">${formatPrice(orig)}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>`;
  return section;
}

// ── DEAL HÔM NAY ────────────────────────────────────────────────
function buildDailyDealSection(books) {
  const dealBooks = books.slice(0, 4);
  const section = document.createElement('section');
  section.className = 'daily-deal-section';
  section.innerHTML = `
    <div class="container">
      <div class="daily-deal-header">
        <div class="daily-deal-left">
          <span class="daily-deal-icon">⏰</span>
          <div>
            <div class="daily-deal-label">DEAL HÔM NAY</div>
            <div class="daily-deal-title">Siêu Giảm Giá 24h</div>
          </div>
        </div>
        <div class="daily-deal-timer" id="dailyDealTimer">
          <div class="timer-block"><span id="dealHour">00</span><small>giờ</small></div>
          <span>:</span>
          <div class="timer-block"><span id="dealMin">00</span><small>phút</small></div>
          <span>:</span>
          <div class="timer-block"><span id="dealSec">00</span><small>giây</small></div>
        </div>
      </div>
      <div class="daily-deal-grid">
        ${dealBooks.map(book => {
          const img = getBookImage(book);
          const disc = 40 + Math.floor(Math.random() * 20);
          const orig = getOriginalPrice(book.price, disc);
          return `
            <div class="daily-deal-card" onclick="openBookDetail('${book._id}')">
              <div class="deal-img-wrap">
                <img src="${img}" onerror="this.src=PLACEHOLDER_SVG" alt="${escapeHtml(book.title)}">
                <div class="deal-discount">-${disc}%</div>
              </div>
              <div class="deal-info">
                <div class="deal-title">${escapeHtml(book.title)}</div>
                <div class="deal-price-row">
                  <span class="deal-price-sale">${formatPrice(book.price)}</span>
                  <span class="deal-price-orig">${formatPrice(orig)}</span>
                </div>
                <button class="deal-add-btn" onclick="event.stopPropagation(); addToCart('${book._id}','${escapeHtml(book.title).replace(/'/g,"\\'")}',${book.price},'${img}')">
                  <i class="fas fa-bolt"></i> Mua ngay
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>`;
  return section;
}

let dealEndTime = new Date();
dealEndTime.setHours(23, 59, 59, 999);

function updateDailyDealTimer() {
  const diff = Math.max(0, dealEndTime - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = n => String(n).padStart(2, '0');
  const hourEl = document.getElementById('dealHour');
  const minEl = document.getElementById('dealMin');
  const secEl = document.getElementById('dealSec');
  if (hourEl) hourEl.textContent = pad(h);
  if (minEl) minEl.textContent = pad(m);
  if (secEl) secEl.textContent = pad(s);
}

// ── BANNER NÂNG CẤP (VỚI PROGRESS BAR & THUMBNAIL) ───────────────
function buildEnhancedBanner() {
  const section = document.createElement('div');
  section.className = 'enhanced-banner';
  section.id = 'enhancedBanner';
  
  const track = document.createElement('div');
  track.className = 'banner-track-enhanced';
  track.id = 'bannerTrackEnhanced';
  
  BANNERS.forEach((b, idx) => {
    const slide = document.createElement('div');
    slide.className = 'banner-slide-enhanced';
    slide.style.background = b.bgGradient;
    slide.innerHTML = `
      <div class="banner-content-enhanced">
        <div class="banner-icon">${b.icon}</div>
        <span class="banner-tag-enhanced">${b.tag}</span>
        <h2 class="banner-title-enhanced">${b.title}</h2>
        <p class="banner-sub-enhanced">${b.sub}</p>
        <button class="banner-cta-enhanced" onclick="${b.ctaAction}">
          ${b.cta} <i class="fas fa-arrow-right"></i>
        </button>
      </div>
      <div class="banner-badge-enhanced">
        <div class="banner-badge-pct-enhanced">${b.pct}</div>
      </div>
    `;
    track.appendChild(slide);
  });
  section.appendChild(track);
  
  const progressBar = document.createElement('div');
  progressBar.className = 'banner-progress-bar';
  progressBar.innerHTML = '<div class="banner-progress-fill" id="bannerProgressFill"></div>';
  section.appendChild(progressBar);
  
  const thumbNav = document.createElement('div');
  thumbNav.className = 'banner-thumb-nav';
  BANNERS.forEach((b, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'banner-thumb';
    thumb.innerHTML = `<span>${b.icon}</span>`;
    thumb.onclick = () => enhancedBannerGoTo(idx);
    thumbNav.appendChild(thumb);
  });
  section.appendChild(thumbNav);
  
  let currentIndex = 0;
  let autoTimer = null;
  let progressInterval = null;
  let isPaused = false;
  
  function updateBanner() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    document.querySelectorAll('.banner-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === currentIndex);
    });
    resetProgress();
  }
  
  function resetProgress() {
    if (progressInterval) clearInterval(progressInterval);
    const fill = document.getElementById('bannerProgressFill');
    if (!fill) return;
    fill.style.width = '0%';
    let width = 0;
    progressInterval = setInterval(() => {
      if (!isPaused) {
        width += 1;
        fill.style.width = `${width}%`;
        if (width >= 100) {
          clearInterval(progressInterval);
          enhancedBannerMove(1);
        }
      }
    }, 50);
  }
  
  function startAutoPlay() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      if (!isPaused) enhancedBannerMove(1);
    }, 5000);
  }
  
  function enhancedBannerGoTo(idx) {
    currentIndex = (idx + BANNERS.length) % BANNERS.length;
    updateBanner();
    startAutoPlay();
  }
  
  function enhancedBannerMove(dir) {
    enhancedBannerGoTo(currentIndex + dir);
  }
  
  section.addEventListener('mouseenter', () => { isPaused = true; });
  section.addEventListener('mouseleave', () => { isPaused = false; resetProgress(); });
  
  enhancedBannerGoTo(0);
  startAutoPlay();
  
  return section;
}

// ── LIVE NOTIFICATIONS ──────────────────────────────────────────
const FAKE_BUYERS = ['Minh T.','Lan N.','Quang H.','Thu P.','Đức V.','Hoa B.','Nam K.','Yến L.', 'Anh K.', 'Mai S.'];
const FAKE_BOOKS = ['Đắc Nhân Tâm','Nhà Giả Kim','Atomic Habits','Tư Duy Nhanh Và Chậm','Sapiens','The Alchemist','Outliers','Mindset'];
let liveNotifTimer = null;

function startLiveNotifications() {
  function fire() {
    const buyer = FAKE_BUYERS[Math.floor(Math.random() * FAKE_BUYERS.length)];
    const book = FAKE_BOOKS[Math.floor(Math.random() * FAKE_BOOKS.length)];
    showLiveNotif(`<b>${buyer}</b> vừa mua "<i>${book}</i>"`);
    liveNotifTimer = setTimeout(fire, 8000 + Math.random() * 12000);
  }
  liveNotifTimer = setTimeout(fire, 5000);
}

function showLiveNotif(html) {
  let wrap = document.getElementById('liveNotifWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'liveNotifWrap';
    wrap.style.cssText = `position:fixed;bottom:90px;left:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;`;
    document.body.appendChild(wrap);
  }
  const box = document.createElement('div');
  box.className = 'live-notif-box';
  box.innerHTML = `<span style="font-size:18px">🛒</span><span style="font-size:12px;color:#1e293b;line-height:1.4">${html}</span>`;
  wrap.appendChild(box);
  setTimeout(() => { box.style.opacity = '0'; box.style.transform = 'translateX(-20px)'; setTimeout(() => box.remove(), 400); }, 4000);
}

// ── FLASH SALE ──────────────────────────────────────────────────
function getFlashSaleEndTime() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 0);
  return end.getTime();
}
let flashSaleEnd = getFlashSaleEndTime();

function getDiscountPct(price) {
  if (!price || price <= 0) return 0;
  const tiers = [10, 15, 20, 25, 30, 35, 40];
  return tiers[Math.floor(price / 30000) % tiers.length];
}
function getOriginalPrice(price, discountPct) {
  if (!discountPct) return price;
  return Math.round(price / (1 - discountPct / 100) / 1000) * 1000;
}

function buildFlashSaleSection(books) {
  const section = document.createElement('section');
  section.className = 'flash-sale-section';
  section.id = 'flashSaleSection';
  const container = document.createElement('div');
  container.className = 'container';
  
  const header = document.createElement('div');
  header.className = 'flash-sale-header';
  header.innerHTML = `
    <div class="flash-sale-left">
      <div class="flash-label">
        <span class="bolt">⚡</span>
        FLASH SALE GIỜ VÀNG
      </div>
      <div class="flash-countdown" id="flashCountdown">
        <div class="countdown-block"><div class="countdown-num" id="cdHour">--</div><div class="countdown-label">Giờ</div></div>
        <span class="countdown-colon">:</span>
        <div class="countdown-block"><div class="countdown-num" id="cdMin">--</div><div class="countdown-label">Phút</div></div>
        <span class="countdown-colon">:</span>
        <div class="countdown-block"><div class="countdown-num" id="cdSec">--</div><div class="countdown-label">Giây</div></div>
      </div>
    </div>
    <button class="flash-see-all" onclick="document.getElementById('new-books').scrollIntoView({behavior:'smooth'})">
      Xem tất cả <i class="fas fa-chevron-right"></i>
    </button>`;
  container.appendChild(header);
  
  const grid = document.createElement('div');
  grid.className = 'flash-books-row';
  books.slice(0, 8).forEach(book => {
    const discountPct = Math.min(50, getDiscountPct(book.price) + 10);
    const origPrice = getOriginalPrice(book.price, discountPct);
    const bookImage = getBookImage(book);
    const card = document.createElement('div');
    card.className = 'flash-book-card';
    card.innerHTML = `
      <div class="flash-book-img-wrap" onclick="openBookDetail('${book._id}')">
        <img src="${bookImage}" onerror="this.src=PLACEHOLDER_SVG" alt="${escapeHtml(book.title)}">
        <div class="discount-badge" style="position:absolute;top:8px;left:8px;z-index:5">-${discountPct}%</div>
      </div>
      <div class="flash-book-info">
        <div class="flash-book-title">${escapeHtml(book.title)}</div>
        <div class="flash-price-row">
          <span class="flash-price-sale">${formatPrice(book.price)}</span>
          <span class="flash-price-orig">${formatPrice(origPrice)}</span>
        </div>
        <button class="flash-add-btn" onclick="addToCart('${book._id}','${escapeHtml(book.title).replace(/'/g, "\\'")}',${book.price},'${bookImage}')">
          <i class="fas fa-cart-plus"></i> Thêm giỏ hàng
        </button>
      </div>`;
    grid.appendChild(card);
  });
  container.appendChild(grid);
  section.appendChild(container);
  return section;
}

// ── RECENTLY VIEWED ─────────────────────────────────────────────
const RV_KEY = 'httvbooks_recently_viewed';
const RV_MAX = 8;

function addRecentlyViewed(bookId) {
  try {
    let rv = JSON.parse(localStorage.getItem(RV_KEY) || '[]');
    rv = rv.filter(id => id !== bookId);
    rv.unshift(bookId);
    if (rv.length > RV_MAX) rv = rv.slice(0, RV_MAX);
    localStorage.setItem(RV_KEY, JSON.stringify(rv));
    renderRecentlyViewed();
  } catch (e) { }
}

function renderRecentlyViewed() {
  const section = document.getElementById('recentlyViewedSection');
  if (!section) return;
  try {
    const rv = JSON.parse(localStorage.getItem(RV_KEY) || '[]');
    if (rv.length === 0) { section.style.display = 'none'; return; }
    if (typeof booksCache === 'undefined') return;
    const books = rv.map(id => booksCache.find(b => b._id === id)).filter(Boolean);
    if (books.length === 0) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    const grid = section.querySelector('.rv-grid');
    if (!grid) return;
    grid.innerHTML = books.map(book => {
      const img = getBookImage(book);
      const disc = getDiscountPct(book.price);
      const orig = getOriginalPrice(book.price, disc);
      return `
        <div class="rv-card" onclick="openBookDetail('${book._id}')">
          <div class="rv-img-wrap">
            <img src="${img}" onerror="this.src=PLACEHOLDER_SVG" alt="${escapeHtml(book.title)}">
            ${disc ? `<div class="discount-badge">-${disc}%</div>` : ''}
          </div>
          <div class="rv-info">
            <div class="rv-title">${escapeHtml(book.title)}</div>
            <div class="price-row">
              <span class="price-sale">${formatPrice(book.price)}</span>
              ${disc ? `<span class="price-orig">${formatPrice(orig)}</span>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  } catch (e) { }
}

function clearRecentlyViewed() {
  try { localStorage.removeItem(RV_KEY); } catch (e) { }
  const section = document.getElementById('recentlyViewedSection');
  if (section) section.style.display = 'none';
  if (typeof showToast === 'function') showToast('Đã xoá lịch sử duyệt', 'success', '🗑️ Đã xoá');
}

function buildRecentlyViewedSection() {
  const section = document.createElement('section');
  section.id = 'recentlyViewedSection';
  section.className = 'recently-viewed-section';
  section.style.display = 'none';
  section.innerHTML = `
    <div class="container">
      <div class="section-header">
        <div class="section-icon">👁️</div>
        <div>
          <p class="section-tag">LỊCH SỬ DUYỆT</p>
          <h2>Bạn Đã Xem Gần Đây</h2>
        </div>
        <button onclick="clearRecentlyViewed()" class="rv-clear-btn">
          <i class="fas fa-trash-alt"></i> Xoá lịch sử
        </button>
      </div>
      <div class="rv-grid"></div>
    </div>`;
  return section;
}

// ── SCROLL TO TOP ───────────────────────────────────────────────
function buildScrollToTop() {
  const btn = document.createElement('button');
  btn.id = 'scrollTopBtn';
  btn.innerHTML = '<i class="fas fa-chevron-up"></i><span>TOP</span>';
  btn.title = 'Về đầu trang';
  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
}

// ── UPGRADE BOOK CARDS ──────────────────────────────────────────
function upgradeBookCards() {
  document.querySelectorAll('.book-card:not([data-upgraded])').forEach(card => {
    card.setAttribute('data-upgraded', '1');
    const h4 = card.querySelector('.book-info h4');
    if (!h4) return;
    const price = parseInt(h4.textContent.replace(/[^\d]/g, ''), 10);
    if (!price || price <= 0) {
      card.removeAttribute('data-upgraded');
      return;
    }
    const disc = getDiscountPct(price);
    const orig = disc ? getOriginalPrice(price, disc) : null;
    const priceRow = document.createElement('div');
    priceRow.className = 'price-row';
    priceRow.innerHTML = '<span class="price-sale">' + formatPrice(price) + '</span>' + (disc && orig ? '<span class="price-orig">' + formatPrice(orig) + '</span>' : '');
    h4.parentNode.insertBefore(priceRow, h4);
    if (disc && !card.querySelector('.discount-badge')) {
      const badge = document.createElement('div');
      badge.className = 'discount-badge';
      badge.textContent = '-' + disc + '%';
      card.insertBefore(badge, card.firstChild);
    }
    
    const bookId = card.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    if (bookId && !card.querySelector('.favorite-btn')) {
      const favBtn = document.createElement('button');
      favBtn.className = 'favorite-btn';
      favBtn.innerHTML = isFavorite(bookId) ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
      favBtn.onclick = (e) => {
        e.stopPropagation();
        const title = card.querySelector('.book-info h4')?.textContent || '';
        const img = card.querySelector('img')?.src || '';
        toggleFavorite(bookId, title, price, img);
        favBtn.innerHTML = isFavorite(bookId) ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
      };
      card.querySelector('.book-info')?.appendChild(favBtn);
    }
  });
}

// ── INJECT TẤT CẢ (ĐÃ SỬA - CHÈN TRƯỚC FILTER BAR) ──────────────
function injectEnhancements(books) {
  const mainNav = document.querySelector('.main-nav');
  const heroSection = document.querySelector('.hero');
  const filterBar = document.querySelector('.filter-bar');
  const newBooksGrid = document.getElementById('new-books');
  const footer = document.querySelector('.footer');
  
  // Banner nâng cấp
  if (mainNav && !document.getElementById('enhancedBanner')) {
    const banner = buildEnhancedBanner();
    mainNav.parentNode.insertBefore(banner, mainNav.nextSibling);
  }
  
  if (heroSection) heroSection.style.display = 'none';
  
  // Tất cả các section đều chèn TRƯỚC filter bar
  if (filterBar) {
    // Flash Sale
    if (!document.getElementById('flashSaleSection') && books.length > 0) {
      const flashSale = buildFlashSaleSection(books);
      filterBar.parentNode.insertBefore(flashSale, filterBar);
    }
    
    // Daily Deal
    if (!document.getElementById('dailyDealSection') && books.length > 0) {
      const dealSection = buildDailyDealSection(books);
      dealSection.id = 'dailyDealSection';
      filterBar.parentNode.insertBefore(dealSection, filterBar);
    }
    
    // Trending Section
    if (!document.querySelector('.trending-section')) {
      const trendingSection = buildTrendingSection(books);
      filterBar.parentNode.insertBefore(trendingSection, filterBar);
    }
    
    // New Releases Section
    if (!document.querySelector('.new-releases-section')) {
      const newReleasesSection = buildNewReleasesSection(books);
      filterBar.parentNode.insertBefore(newReleasesSection, filterBar);
    }
  }
  
  // Favorites Section - chèn SAU footer
  if (footer && !document.getElementById('favoritesSection')) {
    const favSection = buildFavoritesSection();
    footer.parentNode.insertBefore(favSection, footer);
    renderFavorites();
  }
  
  // Recently Viewed - chèn SAU footer
  if (footer && !document.getElementById('recentlyViewedSection')) {
    const rvSection = buildRecentlyViewedSection();
    footer.parentNode.insertBefore(rvSection, footer);
    renderRecentlyViewed();
  }
  
  if (!document.getElementById('scrollTopBtn')) buildScrollToTop();
  if (!document.getElementById('darkModeToggle')) initDarkMode();
  
  upgradeBookCards();
  startLiveNotifications();
  setInterval(updateDailyDealTimer, 1000);
}

function scrollToFlashSale() {
  const el = document.getElementById('flashSaleSection');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ── COUNTDOWN ────────────────────────────────────────────────────
let _lastCdVals = {};
function setCountdownNum(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (_lastCdVals[id] !== val) {
    el.classList.remove('flip');
    void el.offsetWidth;
    el.classList.add('flip');
    el.textContent = val;
    _lastCdVals[id] = val;
  }
}
function tickCountdown() {
  let diff = Math.max(0, flashSaleEnd - Date.now());
  const h = Math.floor(diff / 3600000);
  diff %= 3600000;
  const m = Math.floor(diff / 60000);
  diff %= 60000;
  const s = Math.floor(diff / 1000);
  const pad = n => String(n).padStart(2, '0');
  setCountdownNum('cdHour', pad(h));
  setCountdownNum('cdMin', pad(m));
  setCountdownNum('cdSec', pad(s));
  if (h === 0 && m === 0 && s === 0) flashSaleEnd = getFlashSaleEndTime() + 86400000;
}

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  tickCountdown();
  setInterval(tickCountdown, 1000);
  
  const grid = document.getElementById('new-books');
  if (grid) new MutationObserver(() => upgradeBookCards()).observe(grid, { childList: true, subtree: true });
  
  const origRenderBooks = window.renderBooks;
  if (origRenderBooks) {
    window.renderBooks = function(books) {
      origRenderBooks.call(this, books);
      if (books && books.length > 0 && !document.getElementById('flashSaleSection')) injectEnhancements(books);
      else upgradeBookCards();
      renderRecentlyViewed();
      renderFavorites();
    };
  }
  
  const origOpenDetail = window.openBookDetail;
  if (origOpenDetail) {
    window.openBookDetail = async function(id) {
      addRecentlyViewed(id);
      return await origOpenDetail.call(this, id);
    };
  }
  
  window.toggleFavorite = toggleFavorite;
  window.isFavorite = isFavorite;
});

const _watchBooksCache = setInterval(() => {
  if (typeof booksCache !== 'undefined' && booksCache.length > 0) {
    clearInterval(_watchBooksCache);
    if (!document.getElementById('enhancedBanner')) injectEnhancements(booksCache);
  }
}, 300);