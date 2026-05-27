const API_BASE = 'https://passenger-grapple-dynamic.ngrok-free.dev/api';
const USERS_API = `${API_BASE}/users`;
const BOOKS_API = `${API_BASE}/books`;
const CATEGORIES_API = `${API_BASE}/categories`;
const ITEMS_PER_PAGE = 8;

let allUsers = [], allBooks = [], allCategories = [], allOrders = [], allReviews = [];        
let currentPage = { users: 1, books: 1, orders: 1, reviews: 1 };        
let revenueChart, topBooksChart;        
let autoRefreshInterval;       
let currentCoverBase64 = '';       
let galleryBase64List = [];
function apiFetch(url, options = {}) {            
    return fetch(url, {
        ...options,
        headers: {
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers || {})            
        }
    });
}
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function formatPrice(price) {
    if (!price && price !== 0) return '0đ';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ';
}
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d)) return 'N/A';
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d)) return 'N/A';
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function showToast(message, isError = false) {
    Swal.fire({ 
        icon: isError ? 'error' : 'success', 
        title: isError ? 'Lỗi' : 'Thành công', 
        text: message, 
        timer: 2000, 
        showConfirmButton: false 
    });
}
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}
function renderPagination(containerId, current, total, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) 
        return;
    if (total <= 1) { 
        container.innerHTML = ''; 
        return; 
    }
    container.innerHTML = '';
    for (let i = 1; i <= total; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === current) btn.classList.add('active');
        btn.addEventListener('click', () => onPageChange(i));
        container.appendChild(btn);
    }
}
async function loadBooks() {
    try {
        const res = await apiFetch(BOOKS_API);
        const data = await res.json();
        if (Array.isArray(data)) allBooks = data;
        else if (data.books && Array.isArray(data.books)) allBooks = data.books;        
        else if (data.data && Array.isArray(data.data)) allBooks = data.data;
        else allBooks = [];
        renderBooks();
        updateDashboardStats();
        if (document.getElementById('categoriesTab')?.style.display !== 'none') renderCategoriesGrid();
        if (document.getElementById('reviewsTab') && document.getElementById('reviewsTab').style.display !== 'none') {
            loadAllReviews();
        }
        } catch (err) {
            console.error('Lỗi loadBooks:', err);
            showToast('Không thể tải danh sách sách', true);
            allBooks = [];
            renderBooks();
        }
}

        function renderBooks() {
            let filtered = [...allBooks];
            const search = (document.getElementById('bookSearch')?.value || '').toLowerCase();
            const category = document.getElementById('bookCategoryFilter')?.value || '';
            if (search) filtered = filtered.filter(b => (b.title || '').toLowerCase().includes(search) || (b.author || '').toLowerCase().includes(search));
            if (category) filtered = filtered.filter(b => b.category === category);
            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
            if (currentPage.books > totalPages) currentPage.books = 1;
            const paginated = filtered.slice((currentPage.books - 1) * ITEMS_PER_PAGE, currentPage.books * ITEMS_PER_PAGE);
            const tbody = document.getElementById('booksList');
            if (!tbody) return;
            if (!paginated.length) { 
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">📚 Không có sách</td></tr>'; return; 
            }
            tbody.innerHTML = paginated.map(b => `
                <tr>
                    <td>${b._id ? b._id.slice(-6) : 'N/A'}</td>
                    <td><strong>${escapeHtml(b.title)}</strong></td>
                    <td>${escapeHtml(b.author)}</td>
                    <td>${formatPrice(b.price)}</td>
                    <td><span class="badge">${escapeHtml(b.category) || 'Chưa phân loại'}</span></td>
                    <td class="action-buttons">
                        <button class="action-btn action-edit" onclick="editBook('${b._id}')"><i class="fas fa-edit"></i></button>
                        <button class="action-btn action-delete" onclick="deleteBook('${b._id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('');
            renderPagination('booksPagination', currentPage.books, totalPages, (page) => { currentPage.books = page; renderBooks(); });
        }

        function resetBookForm() {
            document.getElementById('bookId').value = '';
            document.getElementById('bookTitle').value = '';
            document.getElementById('bookAuthor').value = '';
            document.getElementById('bookPrice').value = '';
            document.getElementById('bookCategorySelect').value = '';
            document.getElementById('bookDescription').value = '';
            clearCoverImage();
            galleryBase64List = [];
            renderGalleryPreviews();
            document.getElementById('bookGalleryUrls').value = '';
            clearSamplePdf();
            clearEbookPdf();  // ← hàm này đã được fix ở trên
            window.selectedPdfFile = null;
            window.selectedEbookFile = null;
        }

        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }

        async function saveBook() {
            const bookId = document.getElementById('bookId').value;
            const title = document.getElementById('bookTitle').value.trim();
            const author = document.getElementById('bookAuthor').value.trim();
            const price = parseFloat(document.getElementById('bookPrice').value);
            const category = document.getElementById('bookCategorySelect').value;
            const description = document.getElementById('bookDescription').value;

            if (!title || !author || !price) {
                showToast('Vui lòng nhập đầy đủ thông tin!', true);
                return;
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('author', author);
            formData.append('price', price);
            formData.append('category', category);
            formData.append('description', description);

            const coverInput = document.getElementById('coverFileInput');

            // Ảnh bìa: lấy file từ input trực tiếp
            if (coverInput && coverInput.files.length > 0) {
                formData.append('image', coverInput.files[0]);
            }

            // Ảnh gallery: lấy file object từ galleryBase64List (chỉ những ảnh mới chọn có .file)
            galleryBase64List.forEach(item => {
                if (item && item.file) {
                    formData.append('images', item.file);
                }
            });

            // ---- ĐÃ SỬA - DÙNG ĐÚNG TÊN FIELD 'samplePdf' ----
            if (window.selectedPdfFile) {
                formData.append('samplePdf', window.selectedPdfFile);
            }
            try {
                const url = bookId ? `${BOOKS_API}/${bookId}` : `${BOOKS_API}/add`;
                const method = bookId ? 'PUT' : 'POST';

                const res = await fetch(url, {
                    method,
                    body: formData,
                    headers: {
                        'ngrok-skip-browser-warning': 'true'
                    }
                });

                if (res.ok) {
                    showToast(bookId ? 'Cập nhật thành công!' : 'Thêm sách thành công!');
                    resetBookForm();
                    await loadBooks();
                    window.selectedPdfFile = null;
                } else {
                    const errorText = await res.text();
                    showToast(`Lưu thất bại! (${res.status}): ${errorText.substring(0, 100)}`, true);
                }
            } catch (err) {
                console.error('saveBook error:', err);
                showToast('Lỗi kết nối: ' + err.message, true);
            }
        }
        async function deleteBook(id) {
            const result = await Swal.fire({ title: 'Xóa sách?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Xóa' });
            if (result.isConfirmed) {
                try {
                    const res = await apiFetch(`${BOOKS_API}/${id}`, { method: 'DELETE' });
                    if (res.ok) { showToast('Đã xóa!'); loadBooks(); }
                } catch (err) { showToast('Lỗi kết nối', true); }
            }
        }

        function editBook(id) {
            const b = allBooks.find(b => b._id === id);
            if (!b) return;
            const BASE_URL = API_BASE.replace('/api', '');
            function toAbsUrl(url) {
                if (!url) return '';
                if (url.startsWith('http') || url.startsWith('data:')) return url;
                return BASE_URL + (url.startsWith('/') ? url : '/' + url);
            }
            document.getElementById('bookId').value = b._id;
            document.getElementById('bookTitle').value = b.title || '';
            document.getElementById('bookAuthor').value = b.author || '';
            document.getElementById('bookPrice').value = b.price || 0;
            document.getElementById('bookCategorySelect').value = b.category || '';
            document.getElementById('bookDescription').value = b.description || '';
            // Ảnh bìa — đọc field 'image' trước, fallback 'coverImage'
            const coverUrl = toAbsUrl(b.image || b.coverImage || '');
            if (coverUrl) {
                currentCoverBase64 = coverUrl;
                document.getElementById('coverPreviewContainer').innerHTML = `<div class="preview-item"><img src="${coverUrl}" style="max-width:120px;max-height:160px;object-fit:cover;border-radius:6px;"><button class="remove-img" onclick="clearCoverImage()">✖</button></div>`;
                document.getElementById('bookCoverUrl').value = coverUrl;
            } else { clearCoverImage(); }
            // Ảnh phụ (gallery) — đọc 'galleryImages', fallback 'images'
            // Ảnh cũ lưu dạng string URL, ảnh mới thêm sẽ là {url, file}
            const gallery = b.galleryImages || b.images || [];
            if (gallery.length) {
                galleryBase64List = gallery.map(img => toAbsUrl(img)); // string URL
                renderGalleryPreviews();
            } else { galleryBase64List = []; renderGalleryPreviews(); }
            if (b.samplePdf) {
                document.getElementById("samplePdfPreview").innerHTML = `<div class="pdf-preview"><i class="fas fa-file-pdf"></i><div><div class="pdf-preview-name">Đã có file đọc thử</div><div style="font-size:12px; color:#64748b;">Click "Lưu sách" để giữ nguyên</div></div><button type="button" onclick="clearSamplePdf()" style="margin-left:auto; background:none; border:none; color:#dc2626; cursor:pointer;"><i class="fas fa-times"></i> Xóa</button></div>`;
            }
            if (b.pdfFile) {
                document.getElementById('pdfPreviewContainer').innerHTML = `<div class="pdf-preview"><i class="fas fa-file-pdf"></i><div><div class="pdf-preview-name">Đã có file Ebook PDF</div><div style="font-size:12px; color:#64748b;">Click "Lưu sách" để giữ nguyên</div></div><button type="button" onclick="clearEbookPdf()" style="margin-left:auto; background:none; border:none; color:#dc2626; cursor:pointer;"><i class="fas fa-times"></i> Xóa</button></div>`;
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function previewCoverImage(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                currentCoverBase64 = e.target.result;
                document.getElementById('coverPreviewContainer').innerHTML = `<div class="preview-item"><img src="${currentCoverBase64}"><button class="remove-img" onclick="clearCoverImage()">✖</button></div>`;
                document.getElementById('bookCoverUrl').value = currentCoverBase64;
            };
            reader.readAsDataURL(file);
        }

        function clearCoverImage() {
            currentCoverBase64 = '';
            document.getElementById('coverPreviewContainer').innerHTML = '';
            document.getElementById('bookCoverUrl').value = '';
        }

        function previewGalleryImages(event) {
            Array.from(event.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    // Lưu object {url: previewUrl, file: fileObject} để giữ cả preview lẫn file gốc
                    galleryBase64List.push({ url: e.target.result, file: file });
                    renderGalleryPreviews();
                };
                reader.readAsDataURL(file);
            });
        }

        function renderGalleryPreviews() {
            document.getElementById('galleryPreviewContainer').innerHTML = galleryBase64List.map((item, idx) => {
                const src = typeof item === 'string' ? item : item.url;
                return `<div class="preview-item"><img src="${src}" style="max-width:80px;max-height:100px;object-fit:cover;border-radius:4px;"><button class="remove-img" onclick="removeGalleryImage(${idx})">✖</button></div>`;
            }).join('');
        }

        function removeGalleryImage(idx) {
            galleryBase64List.splice(idx, 1);
            renderGalleryPreviews();
            document.getElementById('bookGalleryUrls').value = JSON.stringify(galleryBase64List);
        }

        function handleSamplePdf(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (file.type !== 'application/pdf') { showToast('Vui lòng chọn file PDF!', true); return; }
            if (file.size > 10 * 1024 * 1024) { showToast('File PDF quá lớn! Tối đa 10MB', true); return; }
            window.selectedPdfFile = file;
            document.getElementById("samplePdfPreview").innerHTML = `<div class="pdf-preview"><i class="fas fa-file-pdf"></i><div><div class="pdf-preview-name">${file.name}</div><div style="font-size:12px; color:#64748b;">${(file.size / 1024 / 1024).toFixed(2)} MB</div></div><button type="button" onclick="clearSamplePdf()" style="margin-left:auto; background:none; border:none; color:#dc2626; cursor:pointer;"><i class="fas fa-times"></i></button></div>`;
        }

        function clearSamplePdf() {
            window.selectedPdfFile = null;
            document.getElementById("samplePdfPreview").innerHTML = '';
            document.getElementById("samplePdfInput").value = '';
            document.getElementById('bookSamplePdf').value = '';
        }

        function clearEbookPdf() {
            window.selectedEbookFile = null;
            const pdfContainer = document.getElementById('pdfPreviewContainer');
            if (pdfContainer) pdfContainer.innerHTML = '';
            const bookPdfUrl = document.getElementById('bookPdfUrl');
            if (bookPdfUrl) bookPdfUrl.value = '';
        }

        // ==================== CATEGORIES ====================
        async function loadCategories() {
            try {
                const res = await apiFetch(CATEGORIES_API);
                const data = await res.json();
                allCategories = Array.isArray(data) ? data : (data.categories || data.data || []);
                renderCategoriesGrid();
                loadCategoriesForSelect();
                const el = (id) => document.getElementById(id);
                if (el('totalCategories')) el('totalCategories').textContent = allCategories.length;
                if (el('booksInCategories')) el('booksInCategories').textContent = allBooks.length;
                if (allCategories.length) {
                    let maxCount = 0, topCat = '--';
                    allCategories.forEach(cat => {
                        const count = allBooks.filter(b => b.category === cat.name).length;
                        if (count > maxCount) { maxCount = count; topCat = cat.name; }
                    });
                    if (el('topCategory')) el('topCategory').textContent = topCat.length > 20 ? topCat.substring(0, 20) + '...' : topCat;
                }
            } catch (err) { console.error('Lỗi loadCategories:', err); showToast('Không thể tải danh mục', true); allCategories = []; renderCategoriesGrid(); }
        }

        function renderCategoriesGrid() {
            const container = document.getElementById('categoriesGrid');
            if (!container) return;
            if (!allCategories.length) { container.innerHTML = '<div style="text-align:center;padding:40px;">📭 Chưa có danh mục nào</div>'; return; }
            container.innerHTML = allCategories.map(c => {
                const bookCount = allBooks.filter(b => b.category === c.name).length;
                return `<div class="category-card"><div><h4><i class="fas fa-tag"></i> ${escapeHtml(c.name)}</h4><p style="margin-top:8px;"><i class="fas fa-book"></i> ${bookCount} sách</p></div><button class="action-btn action-delete" onclick="deleteCategory('${c._id || c.id}')"><i class="fas fa-trash-alt"></i> Xóa</button></div>`;
            }).join('');
        }

        function loadCategoriesForSelect() {
            const options = '<option value="">-- Chọn thể loại --</option>' + allCategories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
            const categorySelect = document.getElementById('bookCategorySelect');
            if (categorySelect) categorySelect.innerHTML = options;
            const categoryFilter = document.getElementById('bookCategoryFilter');
            if (categoryFilter) categoryFilter.innerHTML = '<option value="">Tất cả thể loại</option>' + allCategories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
        }

        async function addCategory() {
            const name = document.getElementById('categoryName').value.trim();
            if (!name) { showToast('Vui lòng nhập tên danh mục', true); return; }
            try {
                const res = await apiFetch(CATEGORIES_API, { method: 'POST', body: JSON.stringify({ name }) });
                if (res.ok) { showToast('Thêm thành công!'); document.getElementById('categoryName').value = ''; loadCategories(); }
                else showToast('Thêm thất bại', true);
            } catch (err) { showToast('Lỗi kết nối', true); }
        }

        async function deleteCategory(id) {
            const result = await Swal.fire({ title: 'Xóa danh mục?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Xóa' });
            if (result.isConfirmed) {
                try {
                    const res = await apiFetch(`${CATEGORIES_API}/${id}`, { method: 'DELETE' });
                    if (res.ok) { showToast('Đã xóa!'); loadCategories(); }
                } catch (err) { showToast('Lỗi kết nối', true); }
            }
        }

        // ==================== USERS ====================
        async function loadUsers() {
            try {
                const res = await apiFetch(USERS_API);
                const data = await res.json();
                allUsers = Array.isArray(data) ? data : (data.users || []);
                renderUserStats();
                renderUsers();
            } catch (err) { showToast('Không thể tải người dùng', true); }
        }

        function renderUserStats() {
            const el = (id) => document.getElementById(id);
            if (el('userStatTotal')) el('userStatTotal').textContent = allUsers.length;
            if (el('userStatActive')) el('userStatActive').textContent = allUsers.filter(u => !u.isLocked).length;
            if (el('userStatLocked')) el('userStatLocked').textContent = allUsers.filter(u => u.isLocked).length;
            if (el('userStatAdmin')) el('userStatAdmin').textContent = allUsers.filter(u => u.role === 'admin').length;
        }

        function renderUsers() {
            let filtered = [...allUsers];
            const search = (document.getElementById('userSearch')?.value || '').toLowerCase();
            const role = document.getElementById('roleFilter')?.value || '';
            const status = document.getElementById('statusFilter')?.value || '';
            if (search) filtered = filtered.filter(u => (u.username || '').toLowerCase().includes(search) || (u.email || '').toLowerCase().includes(search));
            if (role) filtered = filtered.filter(u => u.role === role);
            if (status) filtered = filtered.filter(u => status === 'active' ? !u.isLocked : u.isLocked);
            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
            if (currentPage.users > totalPages) currentPage.users = 1;
            const paginated = filtered.slice((currentPage.users - 1) * ITEMS_PER_PAGE, currentPage.users * ITEMS_PER_PAGE);
            const tbody = document.getElementById('usersList');
            if (!tbody) return;
            if (!paginated.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;">👥 Không có người dùng</td></tr>'; return; }
            tbody.innerHTML = paginated.map(u => `
                <tr>
                    <td class="user-cell"><div class="avatar">${(u.username || 'U').charAt(0).toUpperCase()}</div><div><strong>${escapeHtml(u.username)}</strong><br><small>${escapeHtml(u.email)}</small></div></td>
                    <td><span class="badge">${u.role === 'admin' ? 'Admin' : 'User'}</span></td>
                    <td><span class="badge ${u.isLocked ? 'badge-banned' : 'badge-active'}">${u.isLocked ? 'Đã khóa' : 'Hoạt động'}</span></td>
                    <td>${formatDate(u.createdAt)}</td>
                    <td class="action-buttons">
                        <button class="action-btn action-edit" onclick="editUser('${u._id}')"><i class="fas fa-edit"></i></button>
                        <button class="action-btn action-delete" onclick="deleteUser('${u._id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('');
            renderPagination('usersPagination', currentPage.users, totalPages, (page) => { currentPage.users = page; renderUsers(); });
        }

        function editUser(id) {
            const u = allUsers.find(u => u._id === id);
            if (!u) return;
            document.getElementById('userId').value = u._id;
            document.getElementById('username').value = u.username || '';
            document.getElementById('email').value = u.email || '';
            document.getElementById('role').value = u.role || 'user';
            document.getElementById('password').value = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function resetUserForm() {
            document.getElementById('userId').value = '';
            document.getElementById('username').value = '';
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
            document.getElementById('role').value = 'user';
        }

        async function saveUser() {
            const userId = document.getElementById('userId').value;
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            if (!username || !email) { showToast('Vui lòng nhập đầy đủ!', true); return; }
            if (!userId && !password) { showToast('Vui lòng nhập mật khẩu!', true); return; }
            const data = { username, email, role };
            if (password) data.password = password;
            try {
                const url = userId ? `${USERS_API}/${userId}` : USERS_API;
                const method = userId ? 'PUT' : 'POST';
                const res = await apiFetch(url, { method, body: JSON.stringify(data) });
                if (res.ok) { showToast(userId ? 'Cập nhật thành công!' : 'Thêm thành công!'); resetUserForm(); loadUsers(); }
                else showToast('Lưu thất bại!', true);
            } catch (err) { showToast('Lỗi kết nối!', true); }
        }

        async function deleteUser(id) {
            const result = await Swal.fire({ title: 'Xóa người dùng?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Xóa' });
            if (result.isConfirmed) {
                try {
                    const res = await apiFetch(`${USERS_API}/${id}`, { method: 'DELETE' });
                    if (res.ok) { showToast('Đã xóa!'); loadUsers(); }
                } catch (err) { showToast('Lỗi kết nối', true); }
            }
        }

        async function loadOrders() {
            try {
                const res = await apiFetch(`${API_BASE}/orders`);
                const data = await res.json();
                if (Array.isArray(data)) allOrders = data;
                else if (data.orders && Array.isArray(data.orders)) allOrders = data.orders;
                else allOrders = [];
                renderOrders();
                updateOrderStats();
                updateDashboardStats();
                loadRecentOrders();
            } catch (err) {
                console.error('Lỗi loadOrders:', err);
                showToast('Không thể tải đơn hàng từ server', true);
                const localOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
                allOrders = localOrders;
                renderOrders();
                updateOrderStats();
            }
        }

        function renderOrders() {
            let filtered = [...allOrders];
            const search = (document.getElementById('orderSearch')?.value || '').toLowerCase();
            const status = document.getElementById('orderStatusFilter')?.value || '';
            if (search) filtered = filtered.filter(o => (o._id || o.id || '').toLowerCase().includes(search) || (o.customer || o.customerName || '').toLowerCase().includes(search) || (o.customerEmail || o.email || '').toLowerCase().includes(search) || (o.phone || o.customerPhone || '').toLowerCase().includes(search));
            if (status) filtered = filtered.filter(o => o.status === status);
            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
            if (currentPage.orders > totalPages) currentPage.orders = 1;
            const paginated = filtered.slice((currentPage.orders - 1) * ITEMS_PER_PAGE, currentPage.orders * ITEMS_PER_PAGE);
            const tbody = document.getElementById('ordersList');
            if (!tbody) return;
            if (!paginated.length) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;">📭 Chưa có đơn hàng nào</td></tr>'; document.getElementById('ordersPagination').innerHTML = ''; return; }
            tbody.innerHTML = paginated.map(o => {
                const orderId = o._id || o.id;
                const customerName = o.customer || o.customerName || 'Khách';
                const customerEmail = o.customerEmail || o.email || '--';
                const phone = o.phone || o.customerPhone || '--';
                const bookTitle = o.bookTitle || (o.items && o.items[0] ? o.items[0].title : '') || '--';
                const statusColors = { pending: '#fef3c7', shipped: '#dbeafe', delivered: '#d1fae5' };
                return `
                    <tr>
                        <td><strong>#${orderId}</strong></td>
                        <td><strong>${escapeHtml(customerName)}</strong></td>
                        <td>${escapeHtml(customerEmail)}</td>
                        <td>${phone}</td>
                        <td>${escapeHtml(bookTitle)}</td>
                        <td>${formatPrice(o.total)}</td>
                        <td><select class="status-select" onchange="updateOrderStatus('${orderId}', this.value)" style="background:${statusColors[o.status] || '#fef3c7'}"><option value="pending" ${o.status === 'pending' ? 'selected' : ''}>⏳ Chờ xử lý</option><option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>🚚 Đang gửi file Ebook/PDF</option><option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>✅ Đã gửi file Ebook/PDF</option></select></td>
                        <td>${formatDate(o.date || o.createdAt)}</td>
                        <td class="action-buttons"><button class="action-btn action-view" onclick="viewOrderDetail('${orderId}')"><i class="fas fa-eye"></i></button><button class="action-btn action-email" onclick="sendEmailToCustomer('${orderId}')"><i class="fas fa-envelope"></i></button><button class="action-btn action-delete" onclick="deleteOrder('${orderId}')"><i class="fas fa-trash"></i></button></td>
                    </tr>`;
            }).join('');
            renderPagination('ordersPagination', currentPage.orders, totalPages, (page) => { currentPage.orders = page; renderOrders(); });
        }

        function updateOrderStats() {
            const el = (id) => document.getElementById(id);
            if (el('orderPending')) el('orderPending').textContent = allOrders.filter(o => o.status === 'pending').length;
            if (el('orderShipped')) el('orderShipped').textContent = allOrders.filter(o => o.status === 'shipped').length;
            if (el('orderDelivered')) el('orderDelivered').textContent = allOrders.filter(o => o.status === 'delivered').length;
            if (el('orderRevenue')) el('orderRevenue').textContent = formatPrice(allOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0));
        }

        async function updateOrderStatus(orderId, newStatus) {
            try {
                const response = await apiFetch(`${API_BASE}/orders/${orderId}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: newStatus })
                });
                if (response.ok) {
                    const idx = allOrders.findIndex(o => (o._id === orderId || o.id === orderId));
                    if (idx !== -1) allOrders[idx].status = newStatus;
                    renderOrders();
                    updateOrderStats();
                    updateDashboardStats();
                    loadRecentOrders();
                    const labels = { pending: 'Chờ xử lý', shipped: 'Đang gửi file Ebook/PDF', delivered: 'Đã gửi file Ebook/PDF' };
                    showToast(`Đã cập nhật: ${labels[newStatus] || newStatus}`);
                } else { showToast('Cập nhật thất bại!', true); }
            } catch (err) { showToast('Lỗi kết nối!', true); }
        }

        function viewOrderDetail(id) {
            const o = allOrders.find(o => (o._id === id || o.id === id));
            if (!o) return;
            const items = o.items && o.items.length ? o.items : [{ name: o.bookTitle || '--', quantity: 1, price: o.total }];
            const itemsHtml = items.map(item => `<tr><td style="padding:10px;border:1px solid #ddd;">${escapeHtml(item.name || item.title || '--')}</td><td style="text-align:center;padding:10px;border:1px solid #ddd;">${item.quantity || 1}</td><td style="padding:10px;border:1px solid #ddd;">${formatPrice(item.price)}<\/td></tr>`).join('');
            document.getElementById('orderDetailBody').innerHTML = `<p><strong>Mã đơn:</strong> #${o._id || o.id}</p><p><strong>Khách hàng:</strong> ${escapeHtml(o.customer || o.customerName || '--')}</p><p><strong>Email:</strong> ${escapeHtml(o.customerEmail || o.email || '--')}</p><p><strong>SĐT:</strong> ${o.phone || o.customerPhone || '--'}</p><p><strong>Địa chỉ:</strong> ${escapeHtml(o.address || '--')}</p><p><strong>Tổng tiền:</strong> ${formatPrice(o.total)}</p><p><strong>Trạng thái:</strong> <select id="detailStatus" onchange="updateOrderStatus('${o._id || o.id}', this.value)"><option value="pending" ${o.status === 'pending' ? 'selected' : ''}>⏳ Chờ xử lý</option><option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>🚚 Đang gửi</option><option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>✅ Đã gửi file Ebook/PDF</option></select></p><p><strong>Ngày đặt:</strong> ${formatDateTime(o.date || o.createdAt)}</p><p><strong>Chi tiết sản phẩm:</strong></p><table class="invoice-table"><thead><tr style="background:#1D3557;color:white;"><th>Sản phẩm</th><th>Số lượng</th><th>Thành tiền</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="action-buttons mt-3"><button class="btn btn-email" onclick="sendEmailToCustomer('${o._id || o.id}'); closeModal('orderDetailModal');"><i class="fas fa-envelope"></i> Gửi email xác nhận</button><button class="btn btn-secondary" onclick="closeModal('orderDetailModal')">Đóng</button></div>`;
            document.getElementById('orderDetailModal').style.display = 'flex';
        }

        async function deleteOrder(id) {
            const result = await Swal.fire({ title: 'Xóa đơn hàng?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' });
            if (result.isConfirmed) {
                try {
                    const response = await apiFetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
                    if (response.ok) { showToast('Đã xóa đơn hàng!'); loadOrders(); }
                    else { showToast('Xóa thất bại!', true); }
                } catch (err) { showToast('Lỗi kết nối!', true); }
            }
        }

        function loadRecentOrders() {
            const tbody = document.getElementById('recentOrdersList');
            if (!tbody) return;
            const recent = allOrders.slice(0, 5);
            if (!recent.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">Chưa có đơn hàng</td></tr>'; return; }
            tbody.innerHTML = recent.map(o => `<tr><td>${o._id || o.id}</td><td>${escapeHtml(o.customer || o.customerName || 'Khách')}</td><td>${escapeHtml(o.bookTitle || (o.items && o.items[0] ? o.items[0].title : '') || '--').substring(0, 30)}</td><td>${formatPrice(o.total)}</td><td><span class="badge ${o.status === 'pending' ? 'badge-pending' : o.status === 'shipped' ? 'badge-shipped' : 'badge-delivered'}">${o.status === 'pending' ? 'Chờ' : o.status === 'shipped' ? 'Đang gửi file Ebook/PDF' : 'Đã gửi file Ebook/PDF'}</span></td></tr>`).join('');
        }

        function exportOrdersCSV() {
            if (!allOrders.length) { showToast('Không có dữ liệu', true); return; }
            const headers = ['Mã đơn', 'Khách hàng', 'Email', 'SĐT', 'Địa chỉ', 'Sản phẩm', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'];
            const rows = allOrders.map(o => [o._id || o.id, o.customer || o.customerName || '', o.customerEmail || o.email || '', o.phone || o.customerPhone || '', o.address || '', o.bookTitle || (o.items && o.items[0] ? o.items[0].title : '') || '', o.total, o.status === 'pending' ? 'Chờ' : o.status === 'shipped' ? 'Đang gửi file Ebook/PDF' : 'Đã gửi file Ebook/PDF', formatDateTime(o.date || o.createdAt)]);
            const csv = [headers, ...rows].map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
            showToast('Xuất file thành công!');
        }

        // ==================== EMAIL ====================
        function generateEmailBody(order, customerName) {
            const items = order.items && order.items.length ? order.items : [{ name: order.bookTitle || '--', quantity: 1, price: order.total }];
            let itemsText = items.map(item => `📖 ${item.name || item.title || '--'}\n   • Số lượng: ${item.quantity || 1}\n   • Giá: ${formatPrice(item.price)}\n`).join('\n');
            const statusText = { pending: 'Chờ xử lý', shipped: 'Đang gửi file Ebook/PDF', delivered: 'Đã gửi file Ebook/PDF' }[order.status] || order.status;
            return `========================================
        📚 HTTVBOOKS - HÓA ĐƠN MUA HÀNG
========================================

━━━━━━━━━━━━━━━━━━━━━━
📦 ĐƠN HÀNG ĐÃ ĐƯỢC GỬI
━━━━━━━━━━━━━━━━━━━━━━

🧾 Mã đơn:
${order._id || order.id}

📅 Ngày đặt:
${formatDateTime(order.date || order.createdAt)}

📦 Trạng thái:
Đã gửi file Ebook/PDF

━━━━━━━━━━━━━━━━━━━━━━
👤 THÔNG TIN KHÁCH HÀNG
━━━━━━━━━━━━━━━━━━━━━━

🙍 Khách hàng:
${customerName}

📧 Email:
${order.customerEmail || order.email || '--'}

📱 SĐT:
${order.phone || order.customerPhone || '--'}

📍 Địa chỉ:
${order.address || '--'}

━━━━━━━━━━━━━━━━━━━━━━
📚 CHI TIẾT ĐƠN HÀNG
━━━━━━━━━━━━━━━━━━━━━━

${itemsText}

━━━━━━━━━━━━━━━━━━━━━━
💰 TỔNG THANH TOÁN
━━━━━━━━━━━━━━━━━━━━━━

${formatPrice(order.total)}

━━━━━━━━━━━━━━━━━━━━━━
📎 FILE EBOOK/PDF
━━━━━━━━━━━━━━━━━━━━━━

File Ebook/PDF của bạn đã được đính kèm trong email này.

Vui lòng kiểm tra:
✔ Inbox
✔ Spam
✔ Promotions

Nếu không tải được file hoặc gặp lỗi khi mở sách,
hãy phản hồi lại email này để được hỗ trợ nhanh chóng.

━━━━━━━━━━━━━━━━━━━━━━
❤️ HTTVBOOKS XIN CẢM ƠN
━━━━━━━━━━━━━━━━━━━━━━

Cảm ơn bạn đã mua sắm tại HTTVBOOKS!

✨ Chúc bạn có những giờ phút đọc sách thú vị
📖 Hy vọng các cuốn sách sẽ mang lại nhiều giá trị cho bạn

━━━━━━━━━━━━━━━━━━━━━━
© ${new Date().getFullYear()} HTTVBOOKS
━━━━━━━━━━━━━━━━━━━━━━`;
        }

        function sendEmailToCustomer(orderId) {
            const order = allOrders.find(o => (o._id === orderId || o.id === orderId));
            if (!order) { showToast('Không tìm thấy đơn hàng!', true); return; }
            let customerEmail = order.customerEmail || order.email;
            if (!customerEmail) {
                Swal.fire({ title: 'Email khách hàng', input: 'email', inputLabel: 'Nhập email của khách hàng', showCancelButton: true, confirmButtonText: 'Mở Gmail' }).then(result => {
                    if (result.value) {
                        customerEmail = result.value;
                        const customerName = order.customer || order.customerName || 'Khách hàng';
                        const emailBody = generateEmailBody(order, customerName);
                        const subject = `Hóa đơn đơn hàng #${order._id || order.id} từ HTTVBOOKS`;
                        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
                        window.open(gmailUrl, '_blank');
                        showToast('Đã mở Gmail để gửi email!');
                    }
                });
            } else {
                const customerName = order.customer || order.customerName || 'Khách hàng';
                const emailBody = generateEmailBody(order, customerName);
                const subject = `Hóa đơn đơn hàng #${order._id || order.id} từ HTTVBOOKS`;
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
                window.open(gmailUrl, '_blank');
                showToast('Đã mở Gmail để gửi email!');
            }
        }
        async function syncReviewsWithBooks() {
            Swal.fire({
                title: 'Đang đồng bộ...',
                text: 'Vui lòng chờ',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            let fixedCount = 0;

            for (const book of allBooks) {
                // Gọi API lấy review thật
                const res = await fetch(`${API_BASE}/reviews/book/${book._id}`, {
                    headers: { 'ngrok-skip-browser-warning': '69420' }
                });

                if (res.ok) {
                    const data = await res.json();
                    const realReviews = data.reviews || data.data || [];
                    const realCount = realReviews.length;
                    const realAvg = realCount > 0 ? realReviews.reduce((s, r) => s + r.rating, 0) / realCount : 0;

                    // Nếu book có reviewCount sai
                    if (book.reviewCount !== realCount || book.avgRating !== realAvg) {
                        console.log(`🔧 Sửa: ${book.title} - reviewCount: ${book.reviewCount} → ${realCount}`);

                        // Cập nhật lại book
                        const updateRes = await fetch(`${API_BASE}/books/${book._id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'ngrok-skip-browser-warning': '69420'
                            },
                            body: JSON.stringify({
                                ...book,
                                reviewCount: realCount,
                                avgRating: realAvg
                            })
                        });

                        if (updateRes.ok) fixedCount++;
                    }
                }
            }

            Swal.fire({
                icon: 'success',
                title: 'Đồng bộ hoàn tất!',
                text: `Đã sửa ${fixedCount} cuốn sách`
            });

            loadBooks();
        }
        function addSyncButton() {
            const dashboardHeader = document.querySelector(
                '#dashboardTab .section-header'
            );
            const emptyButton = dashboardHeader?.querySelector(
                'button[style="margin-left: auto;"]'
            );
            if (emptyButton) {
                emptyButton.remove();
            }
        }
        setTimeout(addSyncButton, 2000);

        // ==================== REVIEWS ====================
        async function loadAllReviews() {
            console.log('🔄 Đang tải tất cả đánh giá...');
            allReviews = [];
            const booksSet = new Set();

            for (const book of allBooks) {
                try {
                    const res = await apiFetch(`${API_BASE}/reviews/book/${book._id}`);
                    if (res.ok) {
                        const data = await res.json();
                        // Xử lý cấu trúc dữ liệu khác nhau
                        let reviews = [];
                        if (Array.isArray(data)) {
                            reviews = data;
                        } else if (data.reviews && Array.isArray(data.reviews)) {
                            reviews = data.reviews;
                        } else if (data.data && Array.isArray(data.data)) {
                            reviews = data.data;
                        }

                        console.log(`📖 ${book.title}: ${reviews.length} đánh giá`);

                        reviews.forEach(r => {
                            allReviews.push({
                                ...r,
                                bookTitle: book.title,
                                bookId: book._id,
                                userName: r.userId?.username || r.userId?.name || r.userName || r.user || 'Ẩn danh'
                            });
                            booksSet.add(book._id);
                        });
                    }
                } catch (err) {
                    console.warn(`Lỗi lấy review cho ${book.title}:`, err);
                }
            }

            // Sắp xếp theo ngày mới nhất
            allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Cập nhật thống kê
            const totalReviews = allReviews.length;
            const avgRating = totalReviews > 0
                ? (allReviews.reduce((s, r) => s + (r.rating || 0), 0) / totalReviews).toFixed(1)
                : 0;
            const todayCount = allReviews.filter(r => {
                const d = new Date(r.createdAt);
                const today = new Date();
                return d.toDateString() === today.toDateString();
            }).length;

            const el = (id) => document.getElementById(id);
            if (el('reviewStatTotal')) el('reviewStatTotal').textContent = totalReviews;
            if (el('reviewStatAvg')) el('reviewStatAvg').textContent = avgRating;
            if (el('reviewStatBooks')) el('reviewStatBooks').textContent = booksSet.size;
            if (el('reviewStatToday')) el('reviewStatToday').textContent = todayCount;

            console.log(`📊 Tổng kết: ${totalReviews} đánh giá, ${booksSet.size} sách có đánh giá`);

            renderReviews();
        }
        function renderReviews() {
            let filtered = [...allReviews];
            const search = (document.getElementById('reviewSearch')?.value || '').toLowerCase();
            const rating = document.getElementById('reviewRatingFilter')?.value || '';
            if (search) filtered = filtered.filter(r => (r.bookTitle || '').toLowerCase().includes(search) || (r.userName || '').toLowerCase().includes(search));
            if (rating) filtered = filtered.filter(r => r.rating === parseInt(rating));
            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
            if (currentPage.reviews > totalPages) currentPage.reviews = 1;
            const paginated = filtered.slice((currentPage.reviews - 1) * ITEMS_PER_PAGE, currentPage.reviews * ITEMS_PER_PAGE);
            const tbody = document.getElementById('reviewsList');
            if (!tbody) return;
            if (!paginated.length) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">⭐ Không có đánh giá</td></tr>';
                return;
            }
            tbody.innerHTML = paginated.map(r => `
        <tr>
            <td>${escapeHtml(r.userName)}</td>
            <td><strong>${escapeHtml(r.bookTitle)}</strong></td>
            <td>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
            <td>"${escapeHtml(r.comment || '').substring(0, 100)}"</td>
            <td>${formatDate(r.createdAt)}</td>
            <td class="action-buttons">
                <button class="action-btn action-delete" onclick="deleteReviewWithAuth('${r._id}')"><i class="fas fa-trash-alt"></i> Xóa</button>
            </td>
        </tr>
    `).join('');
            renderPagination('reviewsPagination', currentPage.reviews, totalPages, (page) => { currentPage.reviews = page; renderReviews(); });
        }
        async function deleteReview(id) {
            const result = await Swal.fire({ title: 'Xóa đánh giá?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Xóa' });
            if (result.isConfirmed) {
                try {
                    const res = await apiFetch(`${API_BASE}/reviews/${id}`, { method: 'DELETE' });
                    if (res.ok) { showToast('Đã xóa!'); loadAllReviews(); }
                } catch (err) { showToast('Lỗi kết nối', true); }
            }
        }
        // XÓA REVIEW BẰNG TOKEN
        // ==================== DELETE REVIEW WITH TOKEN (FIXED - SAFE VERSION) ====================
        async function deleteReviewWithAuth(reviewId = null) {
            // Lấy token từ localStorage
            const storedUser = localStorage.getItem('user');
            let token = null;

            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    token = user.token;
                } catch (e) { }
            }

            if (!token) {
                Swal.fire({
                    icon: 'error',
                    title: 'Chưa đăng nhập',
                    text: 'Vui lòng đăng nhập với quyền Admin để xóa đánh giá!',
                    confirmButtonColor: '#1D3557'
                });
                return;
            }

            // NẾU CÓ reviewId -> XÓA 1 REVIEW CỤ THỂ
            if (reviewId) {
                const result = await Swal.fire({
                    title: 'Xóa đánh giá?',
                    text: 'Bạn có chắc chắn muốn xóa đánh giá này?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc2626',
                    confirmButtonText: 'Xóa',
                    cancelButtonText: 'Hủy'
                });

                if (result.isConfirmed) {
                    try {
                        const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                'ngrok-skip-browser-warning': '69420'
                            }
                        });

                        if (res.ok) {
                            showToast('Đã xóa đánh giá thành công!');
                            await loadAllReviews();
                            await loadBooks();
                        } else {
                            const error = await res.text();
                            showToast(`Xóa thất bại: ${error.substring(0, 100)}`, true);
                        }
                    } catch (err) {
                        console.error('Lỗi xóa review:', err);
                        showToast('Lỗi kết nối!', true);
                    }
                }
                return;
            }

            // NẾU KHÔNG CÓ reviewId -> HỎI XÁC NHẬN XÓA TẤT CẢ
            const confirmAll = await Swal.fire({
                title: '⚠️ CẢNH BÁO NGUY HIỂM!',
                html: 'Bạn có chắc chắn muốn xóa <strong>TẤT CẢ đánh giá</strong>?<br>Hành động này <strong>KHÔNG THỂ HOÀN TÁC</strong>!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                confirmButtonText: 'Xóa tất cả',
                cancelButtonText: 'Hủy'
            });

            if (!confirmAll.isConfirmed) return;

            Swal.fire({
                title: 'Đang xóa...',
                text: 'Vui lòng chờ',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            let deletedCount = 0;
            let errorCount = 0;

            for (const book of allBooks) {
                try {
                    const reviewRes = await fetch(`${API_BASE}/reviews/book/${book._id}`, {
                        headers: { 'ngrok-skip-browser-warning': '69420' }
                    });
                    const data = await reviewRes.json();
                    const reviews = data.reviews || [];

                    for (const review of reviews) {
                        try {
                            const delRes = await fetch(`${API_BASE}/reviews/${review._id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                    'ngrok-skip-browser-warning': '69420'
                                }
                            });

                            if (delRes.ok) {
                                deletedCount++;
                            } else {
                                errorCount++;
                            }
                        } catch (err) {
                            errorCount++;
                        }
                    }
                } catch (err) {
                    errorCount++;
                }
            }

            Swal.fire({
                icon: 'success',
                title: 'Hoàn tất!',
                html: `✅ Đã xóa: ${deletedCount} đánh giá<br>❌ Lỗi: ${errorCount}`,
                confirmButtonColor: '#1D3557'
            });

            await loadAllReviews();
            await loadBooks();
        }

        // ==================== DASHBOARD ====================
        function updateDashboardStats() {
            const el = (id) => document.getElementById(id);
            if (el('statTotalUsers')) el('statTotalUsers').textContent = allUsers.length;
            if (el('statTotalBooks')) el('statTotalBooks').textContent = allBooks.length;
            const delivered = allOrders.filter(o => o.status === 'delivered');
            if (el('statTotalOrders')) el('statTotalOrders').textContent = delivered.length;
            if (el('statTotalRevenue')) el('statTotalRevenue').textContent = formatPrice(delivered.reduce((s, o) => s + (o.total || 0), 0));
        }

        function initCharts() {
            const ctx = document.getElementById('revenueChart')?.getContext('2d');
            if (ctx) {
                if (revenueChart) revenueChart.destroy();
                revenueChart = new Chart(ctx, { type: 'bar', data: { labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'], datasets: [{ label: 'Doanh thu (triệu VNĐ)', data: [12, 19, 15, 27, 25, 32], backgroundColor: '#1D3557', borderRadius: 8 }] }, options: { responsive: true } });
            }
            const ctx2 = document.getElementById('topBooksChart')?.getContext('2d');
            if (ctx2 && allBooks.length) {
                if (topBooksChart) topBooksChart.destroy();
                const topBooks = allBooks.slice(0, 5);
                topBooksChart = new Chart(ctx2, { type: 'pie', data: { labels: topBooks.map(b => b.title.length > 20 ? b.title.substring(0, 20) + '...' : b.title), datasets: [{ data: topBooks.map((_, i) => 50 - i * 8), backgroundColor: ['#1D3557', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'] }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
            }
        }

        // ==================== TAB MANAGEMENT ====================
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
                socket = io('https://passenger-grapple-dynamic.ngrok-free.dev', {
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
            fetch('https://passenger-grapple-dynamic.ngrok-free.dev/api/books', {
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
        // Thêm vào cuối file admin.js
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
        setTimeout(() => { updateDashboardStats(); initCharts(); loadRecentOrders(); loadAllReviews(); }, 500);