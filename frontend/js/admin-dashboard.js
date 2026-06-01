// === admin-dashboard.js ===
// Dashboard: thống kê, biểu đồ, khởi tạo

// DASHBOARD
// ============================================



// ============================================
// UPDATE THỐNG KÊ DASHBOARD
// ============================================

// Hàm cập nhật số liệu dashboard
function updateDashboardStats() {

    // ========================================
    // HELPER LẤY ELEMENT
    // ========================================

    // Hàm rút gọn:
    // el('id')
    // thay cho:
    // document.getElementById('id')

    const el = (id) =>

        document.getElementById(id);



    // ========================================
    // TỔNG NGƯỜI DÙNG
    // ========================================

    // Nếu tồn tại element
    if (el('statTotalUsers'))

        // gán số user
        el('statTotalUsers').textContent =
            allUsers.length;



    // ========================================
    // TỔNG SÁCH
    // ========================================

    if (el('statTotalBooks'))

        // tổng số sách
        el('statTotalBooks').textContent =
            allBooks.length;



    // ========================================
    // LỌC ĐƠN ĐÃ GIAO
    // ========================================

    // Chỉ lấy đơn:
    // status = delivered

    const delivered = allOrders.filter(

        o => o.status === 'delivered'
    );



    // ========================================
    // TỔNG ĐƠN ĐÃ GIAO
    // ========================================

    if (el('statTotalOrders'))

        // số lượng đơn delivered
        el('statTotalOrders').textContent =
            delivered.length;



    // ========================================
    // TỔNG DOANH THU
    // ========================================

    if (el('statTotalRevenue'))

        // tính tổng tiền
        el('statTotalRevenue').textContent =

            formatPrice(

                delivered.reduce(

                    // s = tổng hiện tại
                    // o = từng order

                    (s, o) =>

                        s + (o.total || 0),

                    // giá trị ban đầu
                    0
                )
            );
}



// ============================================
// KHỞI TẠO CHART
// ============================================

function initCharts() {

    // ========================================
    // LẤY CANVAS REVENUE CHART
    // ========================================

    const ctx =

        document

            .getElementById('revenueChart')

            ?.getContext('2d');



    // ========================================
    // NẾU CÓ CANVAS
    // ========================================

    if (ctx) {

        // ====================================
        // XÓA CHART CŨ
        // ====================================

        if (revenueChart)

            revenueChart.destroy();



        // ====================================
        // TẠO BAR CHART
        // ====================================

        revenueChart = new Chart(ctx, {

            // loại biểu đồ
            type: 'bar',



            // dữ liệu chart
            data: {

                // label trục X
                labels: [

                    'T1',
                    'T2',
                    'T3',
                    'T4',
                    'T5',
                    'T6'
                ],



                // datasets
                datasets: [

                    {

                        // tên biểu đồ
                        label:
                            'Doanh thu (triệu VNĐ)',



                        // data doanh thu
                        data: [

                            12,
                            19,
                            15,
                            27,
                            25,
                            32
                        ],



                        // màu cột
                        backgroundColor:
                            '#1D3557',



                        // bo góc cột
                        borderRadius: 8
                    }
                ]
            },



            // options chart
            options: {

                // responsive
                responsive: true
            }
        });
    }



    // ========================================
    // LẤY CANVAS TOP BOOKS CHART
    // ========================================

    const ctx2 =

        document

            .getElementById('topBooksChart')

            ?.getContext('2d');



    // ========================================
    // NẾU CÓ CHART VÀ CÓ SÁCH
    // ========================================

    if (ctx2 && allBooks.length) {

        // ====================================
        // XÓA CHART CŨ
        // ====================================

        if (topBooksChart)

            topBooksChart.destroy();



        // ====================================
        // LẤY TOP 5 SÁCH
        // ====================================

        const topBooks =

            allBooks.slice(0, 5);



        // ====================================
        // TẠO PIE CHART
        // ====================================

        topBooksChart = new Chart(ctx2, {

            // loại chart
            type: 'pie',



            // data chart
            data: {

                // labels chart
                labels:

                    topBooks.map(b =>

                        // nếu title quá dài
                        b.title.length > 20

                            // cắt ngắn
                            ? b.title.substring(0, 20) + '...'

                            // giữ nguyên
                            : b.title
                    ),



                // datasets
                datasets: [

                    {

                        // dữ liệu demo
                        data:

                            topBooks.map(

                                (_, i) =>

                                    50 - i * 8
                            ),



                        // màu từng phần
                        backgroundColor: [

                            '#1D3557',

                            '#10b981',

                            '#3b82f6',

                            '#f59e0b',

                            '#8b5cf6'
                        ]
                    }
                ]
            },



            // options chart
            options: {

                // responsive
                responsive: true,



                // plugins
                plugins: {

                    // legend
                    legend: {

                        // vị trí legend
                        position: 'bottom'
                    }
                }
            }
        });
    }
}
// ============================================
// XÓA REVIEW VỚI XÁC THỰC
// ============================================

async function deleteReviewWithAuth(reviewId) {
    // Kiểm tra đăng nhập
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.token) {
        showToast('Vui lòng đăng nhập để xóa đánh giá!', true);
        return;
    }
    
    const result = await Swal.fire({
        title: 'Xóa đánh giá?',
        text: 'Bạn có chắc muốn xóa đánh giá này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    });
    
    if (!result.isConfirmed) return;
    
    try {
        const res = await apiFetch(
            `${API_BASE}/reviews/${reviewId}`,
            { method: 'DELETE' }
        );
        
        if (res.ok) {
            showToast('Đã xóa đánh giá!');
            loadAllReviews();  // Tải lại danh sách review
            loadBooks();       // Tải lại sách để cập nhật rating
        } else {
            const error = await res.text();
            showToast('Xóa thất bại: ' + error.substring(0, 100), true);
        }
    } catch (err) {
        console.error('Lỗi xóa review:', err);
        showToast('Lỗi kết nối!', true);
    }
}

        // ==================== TAB MANAGEMENT ====================
        async function clearAllGalleryImages() {
    const bookId = document.getElementById('bookId').value;
    
    if (!bookId) {
        galleryBase64List = [];
        renderGalleryPreviews();
        showToast('Đã xóa tất cả ảnh khỏi form', 'success');
        return;
    }
    
    const result = await Swal.fire({
        title: 'Xóa tất cả ảnh gallery?',
        text: 'Hành động này không thể hoàn tác!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Xóa tất cả',
        cancelButtonText: 'Hủy'
    });
    
    if (!result.isConfirmed) return;
    
    try {
        const res = await apiFetch(
            `${BOOKS_API}/${bookId}/gallery/all`,
            { method: 'DELETE' }
        );
        
        if (res.ok) {
            galleryBase64List = [];
            renderGalleryPreviews();
            showToast('Đã xóa tất cả ảnh gallery!', 'success');
            await loadBooks();
        } else {
            showToast('Xóa thất bại!', 'error');
        }
    } catch (err) {
        console.error('Lỗi xóa gallery:', err);
        showToast('Lỗi kết nối!', 'error');
    }
}
        function switchTab(tab) {
            const tabs = ['dashboard', 'users', 'books', 'categories', 'orders', 'reviews'];
            tabs.forEach(t => {
                const tabEl = document.getElementById(t + 'Tab');
                if (tabEl) tabEl.style.display = t === tab ? 'block' : 'none';
                const btn = document.getElementById('tab-' + t);
                if (btn) btn.classList.toggle('active', t === tab);
            });
            const titles = { dashboard: ' Tổng quan hệ thống', users: 'Quản lý người dùng', books: 'Quản lý sách', categories: 'Quản lý danh mục', orders: 'Quản lý đơn hàng', reviews: 'Quản lý đánh giá' };
            const titleEl = document.getElementById('pageTitle');
            if (titleEl) titleEl.innerHTML = `<i class="fas ${titles[tab].includes('📊') ? 'fa-chart-line' : titles[tab].includes('👥') ? 'fa-users' : titles[tab].includes('📚') ? 'fa-book' : titles[tab].includes('🏷️') ? 'fa-tags' : titles[tab].includes('🛒') ? 'fa-shopping-cart' : 'fa-star'}"></i> ${titles[tab]}`;
            if (tab === 'dashboard') { updateDashboardStats(); initCharts(); loadRecentOrders(); }
            if (tab === 'users') loadUsers();
            if (tab === 'books') { loadBooks(); loadCategoriesForSelect(); }
            if (tab === 'categories') loadCategories();
            if (tab === 'orders') { document.getElementById('newOrderBadge').style.display = 'none'; loadOrders(); }
            if (tab === 'reviews') loadAllReviews();
        }

        function showAdminInfo() {
            Swal.fire({ title: 'HTTVBOOKS Admin', html: '<p>Phiên bản 2.0 Pro</p><p>Dashboard thông minh</p>', icon: 'info', confirmButtonColor: '#1D3557' });
        }

        function startAutoRefresh() {
            if (autoRefreshInterval) clearInterval(autoRefreshInterval);
            autoRefreshInterval = setInterval(async () => {
                try {
                    const res = await apiFetch(`${API_BASE}/orders`);
                    const data = await res.json();
                    const newOrders = Array.isArray(data) ? data : (data.orders || []);
                    if (newOrders.length > allOrders.length) {
                        document.getElementById('newOrderBadge').style.display = 'flex';
                        Swal.fire({ icon: 'info', title: '📦 Đơn hàng mới!', timer: 5000, toast: true, position: 'top-end', showConfirmButton: false });
                    }
                    allOrders = newOrders;
                    if (document.getElementById('ordersTab')?.style.display !== 'none') renderOrders();
                    updateOrderStats();
                    updateDashboardStats();
                    loadRecentOrders();
                } catch (err) { console.error(err); }
            }, 10000);
        }

        // ==================== EVENT LISTENERS ====================
        document.getElementById('userSearch')?.addEventListener('input', () => { currentPage.users = 1; renderUsers(); });
        document.getElementById('roleFilter')?.addEventListener('change', () => { currentPage.users = 1; renderUsers(); });
        document.getElementById('statusFilter')?.addEventListener('change', () => { currentPage.users = 1; renderUsers(); });
        document.getElementById('bookSearch')?.addEventListener('input', () => { currentPage.books = 1; renderBooks(); });
        document.getElementById('bookCategoryFilter')?.addEventListener('change', () => { currentPage.books = 1; renderBooks(); });
        document.getElementById('orderSearch')?.addEventListener('input', () => { currentPage.orders = 1; renderOrders(); });
        document.getElementById('orderStatusFilter')?.addEventListener('change', () => { currentPage.orders = 1; renderOrders(); });
        document.getElementById('reviewSearch')?.addEventListener('input', () => { currentPage.reviews = 1; renderReviews(); });
        document.getElementById('reviewRatingFilter')?.addEventListener('change', () => { currentPage.reviews = 1; renderReviews(); });

        window.onclick = (event) => { if (event.target.classList.contains('modal')) event.target.style.display = 'none'; };
        window.addEventListener('storage', (e) => { if (e.key === 'adminOrders') { loadOrders(); Swal.fire({ icon: 'info', title: 'Đơn hàng mới!', text: 'Có đơn hàng vừa được tạo', timer: 3000, toast: true, position: 'top-end' }); } });
        // ==================== SOCKET.IO ====================
        let socket;

        function connectSocket() {
            try {
                if (typeof io === 'undefined') return;
                socket = io(API_BASE_URL.replace('/api', ''), {
                    path: '/socket.io',
                    transports: ['websocket', 'polling'],  // websocket trước, polling fallback
                    extraHeaders: {
                        'ngrok-skip-browser-warning': '69420'  // bắt buộc cho ngrok
                    },
                    reconnection: true,
                    reconnectionDelay: 5000,
                    reconnectionAttempts: 5
                });

                socket.on('connect', () => {
                    console.log('✅ Socket.IO kết nối thành công');
                });

                socket.on('newOrder', (order) => {
                    allOrders.unshift(order);
                    document.getElementById('newOrderBadge').style.display = 'flex';
                    Swal.fire({
                        icon: 'info', title: '📦 Đơn hàng mới!',
                        text: `Khách: ${order.customer || order.customerName || 'Khách hàng'}`,
                        timer: 5000, toast: true, position: 'top-end', showConfirmButton: false
                    });
                    renderOrders(); updateOrderStats(); updateDashboardStats(); loadRecentOrders();
                });

                socket.on('bookAdded', (book) => {
                    allBooks.unshift(book);
                    renderBooks(); updateDashboardStats();
                });

                socket.on('connect_error', (err) => {
                    console.log('⚠️ Socket lỗi:', err.message);
                });

            } catch (err) {
                console.log('⚠️ Socket khởi tạo lỗi:', err.message);
            }
        }
        // Chạy trong Console Dashboard
        function syncFromBooksCache() {
            console.log('🔄 Đồng bộ từ booksCache (dữ liệu đã có rating đúng)...');

            // Lấy dữ liệu sách từ API
            fetch(`${API_BASE}/books`, {
                headers: { 'ngrok-skip-browser-warning': '69420' }
            })
                .then(res => res.json())
                .then(books => {
                    // Lọc sách có đánh giá
                    const booksWithReviews = books.filter(b => b.reviewCount > 0);

                    // Tạo reviews tổng hợp từng sách (1 dòng/sách thay vì từng review)
                    const summaryReviews = booksWithReviews.map(book => ({
                        _id: book._id,
                        bookTitle: book.title,
                        bookId: book._id,
                        rating: book.avgRating,
                        comment: `⭐ ${book.avgRating} sao dựa trên ${book.reviewCount} đánh giá`,
                        userName: `${book.reviewCount} người dùng`,
                        createdAt: new Date().toISOString(),
                        isSummary: true
                    }));
                    allReviews = summaryReviews;

                    // Cập nhật thống kê
                    const totalReviews = booksWithReviews.reduce((sum, b) => sum + b.reviewCount, 0);
                    const avgRating = booksWithReviews.length > 0
                        ? (booksWithReviews.reduce((sum, b) => sum + (b.avgRating * b.reviewCount), 0) / totalReviews).toFixed(1)
                        : 0;

                    document.getElementById('reviewStatTotal').textContent = totalReviews;
                    document.getElementById('reviewStatAvg').textContent = avgRating;
                    document.getElementById('reviewStatBooks').textContent = booksWithReviews.length;

                    renderReviews();

                    console.log(`✅ Đã đồng bộ:`);
                    console.log(`   - ${totalReviews} đánh giá (tổng hợp)`);
                    console.log(`   - ${booksWithReviews.length} sách có đánh giá`);
                    console.log(`   - Rating trung bình: ${avgRating}`);
                    console.table(booksWithReviews.map(b => ({
                        'Sách': b.title,
                        '⭐ Sao': b.avgRating,
                        '📝 Số đánh giá': b.reviewCount
                    })));
                })
                .catch(err => console.error('Lỗi:', err));
        }
function adminLogout() {
    Swal.fire({
        title: 'Đăng xuất?',
        text: 'Bạn có chắc muốn đăng xuất khỏi Admin Panel?',   
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            // Xóa thông tin đăng nhập
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            localStorage.removeItem('token');
            // Chuyển về trang chủ
            window.location.href = 'index.html';
        }
    });
}

        syncFromBooksCache();
        // ==================== INIT ====================
        loadUsers();
        loadBooks();
        loadCategories();
        loadOrders();
        connectSocket();
        startAutoRefresh();