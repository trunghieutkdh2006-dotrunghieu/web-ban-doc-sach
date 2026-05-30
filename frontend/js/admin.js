const API_BASE = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'https://web-ban-doc-sach.onrender.com/api');
const USERS_API = `${API_BASE}/users`;
const BOOKS_API = `${API_BASE}/books`;
const CATEGORIES_API = `${API_BASE}/categories`;
const ITEMS_PER_PAGE = 8;

// Mảng lưu toàn bộ users
let allUsers = [];


// Mảng lưu toàn bộ sách
let allBooks = [];


// Mảng lưu toàn bộ categories
let allCategories = [];


// Mảng lưu toàn bộ đơn hàng
let allOrders = [];


// Mảng lưu toàn bộ đánh giá
let allReviews = [];



// ============================================
// QUẢN LÝ TRANG HIỆN TẠI (PAGINATION)
// ============================================


// Object lưu trang hiện tại của từng bảng
// users   -> trang user hiện tại
// books   -> trang sách hiện tại
// orders  -> trang đơn hàng hiện tại
// reviews -> trang review hiện tại
let currentPage = {
    users: 1,
    books: 1,
    orders: 1,
    reviews: 1
};



// ============================================
// BIẾN CHO BIỂU ĐỒ
// ============================================


// Biến lưu chart doanh thu
// Dùng để update/destroy chart sau này
let revenueChart;


// Biến lưu chart top sách bán chạy
let topBooksChart;



// ============================================
// AUTO REFRESH
// ============================================


// Biến lưu setInterval tự động refresh dữ liệu
// Có thể clearInterval(autoRefreshInterval)
let autoRefreshInterval;



// ============================================
// XỬ LÝ ẢNH BASE64
// ============================================


// Lưu ảnh bìa hiện tại dưới dạng Base64
// Thường dùng khi upload ảnh preview
let currentCoverBase64 = '';


// Mảng lưu danh sách ảnh gallery dạng Base64
// Ví dụ nhiều ảnh mô tả sách
let galleryBase64List = [];



// ============================================
// HÀM FETCH API CHUNG
// ============================================


// Hàm gọi API dùng chung cho toàn project
// url      -> đường dẫn API
// options  -> method, body, headers...
function apiFetch(url, options = {}) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user.token;

    // Trả về fetch Promise
    return fetch(url, {

        // Spread toàn bộ options truyền vào
        // Ví dụ:
        // method: 'POST'
        // body: JSON.stringify(data)
        ...options,



        // Custom headers
        headers: {

            // Kiểm tra body có phải FormData không
            // Nếu KHÔNG phải FormData:
            // -> thêm Content-Type application/json
            //
            // Nếu là FormData:
            // -> để trống vì browser tự set multipart/form-data
            ...(options.body instanceof FormData
                ? {}
                : { 'Content-Type': 'application/json' }
            ),


            // Gộp thêm headers từ ngoài truyền vào
            // Ví dụ Authorization token
            'ngrok-skip-browser-warning': 'true',
             ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        }
    });
}
// ============================================
// HÀM CHỐNG XSS / ESCAPE HTML
// ============================================

// Hàm chuyển ký tự đặc biệt thành HTML an toàn
// Ví dụ:
// <script> -> &lt;script&gt;
//
// Dùng để chống XSS khi hiển thị dữ liệu từ user
function escapeHtml(text) {

    // Nếu text rỗng, null, undefined
    // -> trả về chuỗi rỗng
    if (!text) return '';



    // Tạo thẻ div tạm trong bộ nhớ
    const div = document.createElement('div');



    // Gán textContent
    // Browser tự encode ký tự HTML nguy hiểm
    div.textContent = text;



    // Lấy HTML đã được escape
    // Ví dụ:
    // "<b>Hello</b>"
    // -> "&lt;b&gt;Hello&lt;/b&gt;"
    return div.innerHTML;
}



// ============================================
// HÀM FORMAT GIÁ TIỀN
// ============================================

// Chuyển số thành định dạng tiền VNĐ
// Ví dụ:
// 1500000 -> "1,500,000đ"
function formatPrice(price) {

    // Nếu price không tồn tại
    // nhưng vẫn cho phép số 0
    if (!price && price !== 0) return '0đ';



    // Chuyển sang string
    // replace regex để thêm dấu phẩy mỗi 3 số
    //
    // Ví dụ:
    // 1000000 -> 1,000,000
    return price
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 'đ';
}



// ============================================
// HÀM FORMAT NGÀY
// ============================================

// Chuyển date thành dạng:
// dd/mm/yyyy
//
// Ví dụ:
// 2026-05-25
// -> 25/5/2026
function formatDate(dateString) {

    // Nếu không có ngày
    if (!dateString) return 'N/A';



    // Tạo object Date
    const d = new Date(dateString);



    // Kiểm tra date hợp lệ
    if (isNaN(d)) return 'N/A';



    // getDate()      -> ngày
    // getMonth()+1  -> tháng (JS bắt đầu từ 0)
    // getFullYear() -> năm
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}



// ============================================
// HÀM FORMAT NGÀY + GIỜ
// ============================================

// Chuyển date thành:
// dd/mm/yyyy hh:mm
//
// Ví dụ:
// 2026-05-25T14:30:00
// -> 25/5/2026 14:30
function formatDateTime(dateString) {

    // Nếu không có dữ liệu
    if (!dateString) return 'N/A';



    // Tạo đối tượng Date
    const d = new Date(dateString);



    // Kiểm tra date hợp lệ
    if (isNaN(d)) return 'N/A';



    // String(...).padStart(2,'0')
    // -> thêm số 0 phía trước nếu chỉ có 1 chữ số
    //
    // Ví dụ:
    // 5 -> 05
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
// ============================================
// HIỂN THỊ THÔNG BÁO TOAST
// ============================================

// Hàm hiển thị thông báo bằng SweetAlert2
//
// message  -> nội dung thông báo
// isError  -> true = lỗi, false = thành công
function showToast(message, isError = false) {

    // Swal.fire() là hàm của thư viện SweetAlert2
    Swal.fire({

        // icon hiển thị
        // Nếu isError = true -> hiện icon error
        // Ngược lại -> success
        icon: isError ? 'error' : 'success',



        // Tiêu đề popup
        title: isError ? 'Lỗi' : 'Thành công',



        // Nội dung thông báo
        text: message,



        // Tự động tắt sau 2000ms = 2 giây
        timer: 2000,



        // Ẩn nút OK
        showConfirmButton: false
    });
}



// ============================================
// ĐÓNG MODAL
// ============================================

// Hàm đóng popup/modal theo id
//
// Ví dụ:
// closeModal('bookModal')
function closeModal(id) {

    // Lấy phần tử theo id
    // rồi đổi display thành none để ẩn
    document.getElementById(id).style.display = 'none';
}



// ============================================
// RENDER PHÂN TRANG
// ============================================

// Hàm tạo nút phân trang
//
// containerId  -> id div chứa pagination
// current      -> trang hiện tại
// total        -> tổng số trang
// onPageChange -> callback khi đổi trang
function renderPagination(containerId, current, total, onPageChange) {

    // Lấy container pagination
    const container = document.getElementById(containerId);



    // Nếu không tìm thấy container
    // -> dừng hàm
    if (!container)
        return;



    // Nếu chỉ có 1 trang hoặc ít hơn
    // -> không cần hiện pagination
    if (total <= 1) {

        // Xóa nội dung cũ
        container.innerHTML = '';

        return;
    }



    // Reset pagination cũ
    container.innerHTML = '';



    // Chạy từ trang 1 -> tổng số trang
    for (let i = 1; i <= total; i++) {

        // Tạo nút button
        const btn = document.createElement('button');

        // Hiển thị số trang
        btn.textContent = i;



        // Nếu là trang hiện tại
        // -> thêm class active
        if (i === current)
            btn.classList.add('active');



        // Khi click nút
        // gọi callback đổi trang
        //
        // Ví dụ:
        // onPageChange(2)
        btn.addEventListener('click', () => onPageChange(i));



        // Thêm button vào container
        container.appendChild(btn);
    }
}
// ============================================
// LOAD DANH SÁCH SÁCH TỪ API
// ============================================

// async = hàm bất đồng bộ
// Có thể dùng await bên trong
async function loadBooks() {

    // try catch để bắt lỗi API
    try {

        // Gọi API lấy danh sách sách
        //
        // await:
        // đợi fetch hoàn thành mới chạy tiếp
        const res = await apiFetch(BOOKS_API);



        // Chuyển dữ liệu response sang JSON
        const data = await res.json();



        // ============================================
        // KIỂM TRA CẤU TRÚC DATA
        // ============================================

        // Trường hợp API trả về trực tiếp mảng
        //
        // Ví dụ:
        // [
        //   { book1 },
        //   { book2 }
        // ]
        if (Array.isArray(data))

            // Gán vào allBooks
            allBooks = data;



        // Trường hợp API trả về:
        //
        // {
        //   books: [...]
        // }
        else if (data.books && Array.isArray(data.books))

            // Lấy data.books
            allBooks = data.books;



        // Trường hợp API trả về:
        //
        // {
        //   data: [...]
        // }
        else if (data.data && Array.isArray(data.data))

            // Lấy data.data
            allBooks = data.data;



        // Nếu không đúng format
        // -> gán mảng rỗng
        else
            allBooks = [];



        // ============================================
        // RENDER DỮ LIỆU
        // ============================================

        // Hiển thị danh sách sách ra giao diện
        renderBooks();



        // Cập nhật thống kê dashboard
        //
        // Ví dụ:
        // số sách
        // tổng doanh thu
        // số user...
        updateDashboardStats();



        // ============================================
        // KIỂM TRA TAB CATEGORY
        // ============================================

        // document.getElementById('categoriesTab')
        // ?. = optional chaining
        //
        // Nếu tồn tại element mới lấy style.display
        //
        // Nếu tab categories đang hiển thị
        // -> render categories
        if (
            document.getElementById('categoriesTab')?.style.display !== 'none'
        ) {
            renderCategoriesGrid();
        }



        // ============================================
        // KIỂM TRA TAB REVIEW
        // ============================================

        // Nếu tồn tại reviewsTab
        // và tab đang hiển thị
        if (
            document.getElementById('reviewsTab') &&
            document.getElementById('reviewsTab').style.display !== 'none'
        ) {

            // Load toàn bộ review
            loadAllReviews();
        }

    } catch (err) {

        // ============================================
        // XỬ LÝ LỖI
        // ============================================

        // In lỗi ra console
        console.error('Lỗi loadBooks:', err);



        // Hiện thông báo lỗi
        showToast('Không thể tải danh sách sách', true);



        // Reset danh sách sách
        allBooks = [];



        // Render lại giao diện rỗng
        renderBooks();
    }
}

       // ============================================
// RENDER DANH SÁCH SÁCH
// ============================================

// Hàm hiển thị danh sách sách ra bảng HTML
function renderBooks() {

    // ============================================
    // COPY DANH SÁCH SÁCH
    // ============================================

    // Spread operator (...)
    // tạo bản sao mảng allBooks
    //
    // tránh sửa trực tiếp dữ liệu gốc
    let filtered = [...allBooks];



    // ============================================
    // LẤY GIÁ TRỊ SEARCH
    // ============================================

    // Lấy input tìm kiếm
    //
    // ?. = optional chaining
    // tránh lỗi nếu element không tồn tại
    //
    // || ''
    // nếu null -> dùng chuỗi rỗng
    //
    // toLowerCase()
    // chuyển về chữ thường để tìm kiếm dễ hơn
    const search = (
        document.getElementById('bookSearch')?.value || ''
    ).toLowerCase();



    // ============================================
    // LẤY CATEGORY FILTER
    // ============================================

    // Lấy category đang chọn
    const category =
        document.getElementById('bookCategoryFilter')?.value || '';



    // ============================================
    // FILTER THEO SEARCH
    // ============================================

    // Nếu có từ khóa tìm kiếm
    if (search)

        // filter() lọc mảng
        filtered = filtered.filter(b =>

            // Tìm trong title
            (b.title || '')
                .toLowerCase()
                .includes(search)

            ||

            // Hoặc tìm trong author
            (b.author || '')
                .toLowerCase()
                .includes(search)
        );



    // ============================================
    // FILTER THEO CATEGORY
    // ============================================

    // Nếu có category
    if (category)

        // Chỉ giữ sách cùng category
        filtered = filtered.filter(
            b => b.category === category
        );



    // ============================================
    // TÍNH TỔNG SỐ TRANG
    // ============================================

    // Math.ceil()
    // làm tròn lên
    //
    // Ví dụ:
    // 10 sách / 8 = 1.25
    // -> 2 trang
    const totalPages =
        Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;



    // Nếu trang hiện tại lớn hơn tổng trang
    // -> reset về trang 1
    if (currentPage.books > totalPages)
        currentPage.books = 1;



    // ============================================
    // PHÂN TRANG
    // ============================================

    // slice(start, end)
    //
    // start:
    // vị trí bắt đầu
    //
    // end:
    // vị trí kết thúc
    const paginated = filtered.slice(

        // start
        (currentPage.books - 1) * ITEMS_PER_PAGE,

        // end
        currentPage.books * ITEMS_PER_PAGE
    );



    // ============================================
    // LẤY TBODY
    // ============================================

    // booksList là tbody chứa dữ liệu
    const tbody = document.getElementById('booksList');



    // Nếu không tồn tại tbody
    // -> dừng hàm
    if (!tbody) return;



    // ============================================
    // KHÔNG CÓ DỮ LIỆU
    // ============================================

    // Nếu mảng rỗng
    if (!paginated.length) {

        // Hiển thị dòng thông báo
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;">
                    📚 Không có sách
                </td>
            </tr>
        `;

        return;
    }



    // ============================================
    // RENDER HTML DANH SÁCH SÁCH
    // ============================================

    // map() duyệt từng sách
    //
    // join('')
    // nối tất cả HTML thành chuỗi
    tbody.innerHTML = paginated.map(b => `

        <tr>

            <!-- ID sách -->
            <td>
                ${
                    // Nếu có _id
                    // -> lấy 6 ký tự cuối
                    b._id
                        ? b._id.slice(-6)
                        : 'N/A'
                }
            </td>



            <!-- Tên sách -->
            <td>
                <strong>
                    ${
                        // escapeHtml chống XSS
                        escapeHtml(b.title)
                    }
                </strong>
            </td>



            <!-- Tác giả -->
            <td>
                ${escapeHtml(b.author)}
            </td>



            <!-- Giá -->
            <td>
                ${
                    // formatPrice format tiền
                    formatPrice(b.price)
                }
            </td>



            <!-- Category -->
            <td>
                <span class="badge">

                    ${
                        // Nếu không có category
                        // -> hiện text mặc định
                        escapeHtml(b.category)
                        || 'Chưa phân loại'
                    }

                </span>
            </td>



            <!-- Nút thao tác -->
            <td class="action-buttons">

                <!-- Nút sửa -->
                <button
                    class="action-btn action-edit"
                    onclick="editBook('${b._id}')"
                >
                    <i class="fas fa-edit"></i>
                </button>



                <!-- Nút xóa -->
                <button
                    class="action-btn action-delete"
                    onclick="deleteBook('${b._id}')"
                >
                    <i class="fas fa-trash"></i>
                </button>

            </td>

        </tr>

    `).join('');



    // ============================================
    // RENDER PAGINATION
    // ============================================

    renderPagination(

        // id container pagination
        'booksPagination',

        // trang hiện tại
        currentPage.books,

        // tổng số trang
        totalPages,

        // callback khi đổi trang
        (page) => {

            // cập nhật trang
            currentPage.books = page;

            // render lại dữ liệu
            renderBooks();
        }
    );
}

// ============================================
// RESET FORM THÊM/SỬA SÁCH
// ============================================

// Hàm đưa form về trạng thái mặc định
//
// Dùng khi:
// - Thêm sách mới
// - Đóng modal
// - Reset dữ liệu cũ
function resetBookForm() {

    // ============================================
    // RESET ID SÁCH
    // ============================================
    document.getElementById('bookId').value = '';

    // ============================================
    // RESET TÊN SÁCH
    // ============================================
    document.getElementById('bookTitle').value = '';

    // ============================================
    // RESET TÁC GIẢ
    // ============================================
    document.getElementById('bookAuthor').value = '';

    // ============================================
    // RESET GIÁ
    // ============================================
    document.getElementById('bookPrice').value = '';

    // ============================================
    // RESET CATEGORY
    // ============================================
    document.getElementById('bookCategorySelect').value = '';

    // ============================================
    // RESET MÔ TẢ
    // ============================================
    document.getElementById('bookDescription').value = '';

    // ============================================
    // XÓA ẢNH BÌA
    // ============================================
    clearCoverImage();

    // ============================================
    // RESET GALLERY
    // ============================================
    galleryBase64List = [];
    renderGalleryPreviews();

    // ============================================
    // RESET INPUT URL GALLERY
    // ============================================
    document.getElementById('bookGalleryUrls').value = '';

    // ============================================
    // XÓA FILE PDF ĐỌC THỬ
    // ============================================
    clearSamplePdf();

    // ============================================
    // XÓA FILE EBOOK CHÍNH
    // ============================================
    clearEbookPdf();

    // ============================================
    // RESET FILE ĐÃ CHỌN
    // ============================================
    window.selectedPdfFile = null;
    window.selectedEbookFile = null;

    // 👇👇👇 THÊM MỚI: Reset danh sách ảnh cần xóa 👇👇👇
    window.imagesToDelete = [];
}

// ============================================
// CHUYỂN FILE SANG BASE64
// ============================================

// Hàm chuyển file thành chuỗi Base64
//
// Dùng cho:
// - upload ảnh preview
// - lưu ảnh vào database
// - gửi file qua API
//
// file -> object File từ input[type=file]
function fileToBase64(file) {

    // Trả về Promise
    //
    // resolve -> thành công
    // reject  -> thất bại
    return new Promise((resolve, reject) => {

        // ============================================
        // TẠO FILE READER
        // ============================================

        // FileReader là API của browser
        // dùng để đọc file local
        const reader = new FileReader();



        // ============================================
        // ĐỌC FILE DƯỚI DẠNG BASE64
        // ============================================

        // readAsDataURL()
        //
        // Chuyển file thành:
        //
        // data:image/png;base64,iVBOR...
        //
        // hoặc
        //
        // data:application/pdf;base64,...
        reader.readAsDataURL(file);



        // ============================================
        // KHI ĐỌC FILE THÀNH CÔNG
        // ============================================

        reader.onload = () =>

            // resolve trả dữ liệu Base64
            resolve(reader.result);



        // ============================================
        // KHI CÓ LỖI
        // ============================================

        reader.onerror = error =>

            // reject trả lỗi
            reject(error);
    });
}
// ============================================
// LƯU SÁCH (THÊM / CẬP NHẬT)
// ============================================

async function saveBook() {

    // ============================================
    // LẤY DỮ LIỆU TỪ FORM
    // ============================================

    // ID sách
    //
    // Có ID  -> chế độ sửa
    // Không -> chế độ thêm mới
    const bookId =
        document.getElementById('bookId').value;



    // Tên sách
    const title =
        document.getElementById('bookTitle')
        .value
        .trim();



    // Tác giả
    const author =
        document.getElementById('bookAuthor')
        .value
        .trim();



    // Giá sách
    //
    // parseFloat:
    // chuyển string -> number
    const price = parseFloat(
        document.getElementById('bookPrice').value
    );



    // Danh mục
    const category =
        document.getElementById('bookCategorySelect').value;



    // Mô tả sách
    const description =
        document.getElementById('bookDescription').value;



    // ============================================
    // VALIDATE DỮ LIỆU
    // ============================================

    // Nếu thiếu title / author / price
    if (!title || !author || !price) {

        // Hiện thông báo lỗi
        showToast(
            'Vui lòng nhập đầy đủ thông tin!',
            true
        );



        // Dừng hàm
        return;
    }



    // ============================================
    // TẠO FORMDATA
    // ============================================

    // FormData dùng để:
    // - gửi file
    // - gửi ảnh
    // - gửi multipart/form-data
    const formData = new FormData();



    // ============================================
    // THÊM DỮ LIỆU TEXT
    // ============================================

    // append(key, value)

    formData.append('title', title);

    formData.append('author', author);

    formData.append('price', price);

    formData.append('category', category);

    formData.append('description', description);



    // ============================================
    // 👇👇👇 THÊM MỚI: DANH SÁCH ẢNH CẦN XÓA 👇👇👇
    // ============================================
    if (window.imagesToDelete && window.imagesToDelete.length > 0) {
        formData.append('imagesToDelete', JSON.stringify(window.imagesToDelete));
        console.log('📋 Ảnh cần xóa:', window.imagesToDelete);
    }



    // ============================================
    // LẤY INPUT ẢNH BÌA
    // ============================================

    const coverInput =
        document.getElementById('coverFileInput');



    // ============================================
    // UPLOAD ẢNH BÌA
    // ============================================

    // Kiểm tra:
    // - tồn tại input
    // - có file được chọn
    if (
        coverInput &&
        coverInput.files.length > 0
    ) {

        // files[0]
        // lấy file đầu tiên
        formData.append(
            'image',
            coverInput.files[0]
        );
    }



    // ============================================
    // UPLOAD ẢNH GALLERY
    // ============================================

    const oldImagesToKeep = galleryBase64List
        .filter(item => typeof item === 'object' && item.isOld === true)
        .map(item => item.oldUrl);  // URL gốc từ server

    // 2. Gửi danh sách ảnh cũ cần giữ (để backend không xóa chúng)
    if (oldImagesToKeep.length > 0) {
        formData.append('existingImages', JSON.stringify(oldImagesToKeep));
    }

    // 3. Upload ảnh mới (có file)
    galleryBase64List.forEach(item => {
        // Chỉ upload ảnh mới có thuộc tính file
        if (item && item.file) {
            formData.append('images', item.file);
        }
    });




    // ============================================
    // UPLOAD PDF ĐỌC THỬ
    // ============================================

    // selectedPdfFile:
    // file PDF đọc thử đã chọn
    if (window.selectedPdfFile) {

        // samplePdf:
        // tên field backend yêu cầu
        formData.append(
            'samplePdf',
            window.selectedPdfFile
        );
    }



    // ============================================
    // GỌI API
    // ============================================

    try {

        // ========================================
        // XÁC ĐỊNH URL API
        // ========================================

        // Nếu có bookId
        // -> update sách
        //
        // Ví dụ:
        // /books/123
        //
        // Nếu không:
        // -> thêm mới
        // /books/add
        const url = bookId
    ? `${BOOKS_API}/${bookId}`
    : BOOKS_API; 



        // ========================================
        // XÁC ĐỊNH METHOD
        // ========================================

        // PUT  -> cập nhật
        // POST -> thêm mới
        const method = bookId
            ? 'PUT'
            : 'POST';



        // ========================================
        // GỬI REQUEST
        // ========================================
        const token = JSON.parse(localStorage.getItem('user') || '{}').token;

        const res = await fetch(url, {

            // method HTTP
            method,



            // body multipart/form-data
            body: formData,



            // custom headers
            headers: {

                // Header bỏ warning ngrok
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`
            }
        });



        // ========================================
        // THÀNH CÔNG
        // ========================================

        // res.ok:
        // true nếu status 200-299
        if (res.ok) {

            // Hiện toast
            showToast(

                // Nếu có ID -> cập nhật
                // ngược lại -> thêm mới
                bookId
                    ? 'Cập nhật thành công!'
                    : 'Thêm sách thành công!'
            );



            // 👇👇👇 THÊM MỚI: Reset danh sách ảnh cần xóa 👇👇👇
            window.imagesToDelete = [];



            // Reset form
            resetBookForm();



            // Load lại danh sách sách
            await loadBooks();



            // Reset file PDF
            window.selectedPdfFile = null;
        }



        // ========================================
        // THẤT BẠI
        // ========================================

        else {

            // Lấy text lỗi từ server
            const errorText =
                await res.text();



            // Hiện thông báo lỗi
            showToast(

                // status HTTP
                // substring cắt ngắn lỗi
                `Lưu thất bại! (${res.status}): ${errorText.substring(0, 100)}`,

                true
            );
        }

    } catch (err) {

        // ========================================
        // LỖI KẾT NỐI / SERVER
        // ========================================

        // In lỗi ra console
        console.error(
            'saveBook error:',
            err
        );



        // Hiện lỗi cho user
        showToast(
            'Lỗi kết nối: ' + err.message,
            true
        );
    }
}
        // ============================================
// XÓA SÁCH
// ============================================

// Hàm xóa sách theo ID
async function deleteBook(id) {

    // ============================================
    // HIỆN HỘP THOẠI XÁC NHẬN
    // ============================================

    // Swal.fire():
    // popup xác nhận bằng SweetAlert2
    const result = await Swal.fire({

        // Tiêu đề popup
        title: 'Xóa sách?',



        // Icon cảnh báo
        icon: 'warning',



        // Hiện nút Cancel
        showCancelButton: true,



        // Màu nút xác nhận
        confirmButtonColor: '#dc2626',



        // Text nút xác nhận
        confirmButtonText: 'Xóa'
    });



    // ============================================
    // KIỂM TRA NGƯỜI DÙNG XÁC NHẬN
    // ============================================

    // result.isConfirmed:
    // true nếu user bấm nút Xóa
    if (result.isConfirmed) {

        // ========================================
        // GỌI API XÓA
        // ========================================

        try {

            // Gửi request DELETE
            //
            // Ví dụ:
            // DELETE /books/123
            const res = await apiFetch(

                // URL API
                `${BOOKS_API}/${id}`,

                // method HTTP
                {
                    method: 'DELETE'
                }
            );



            // ====================================
            // XÓA THÀNH CÔNG
            // ====================================

            // res.ok:
            // true nếu status 200-299
            if (res.ok) {

                // Hiện thông báo thành công
                showToast('Đã xóa!');



                // Load lại danh sách sách
                //
                // cập nhật giao diện sau khi xóa
                loadBooks();
            }

        } catch (err) {

            // ====================================
            // LỖI KẾT NỐI
            // ====================================

            // Hiện thông báo lỗi
            showToast(
                'Lỗi kết nối',
                true
            );
        }
    }
}

// ============================================
// CHỈNH SỬA SÁCH
// ============================================

function editBook(id) {

    // TÌM SÁCH THEO ID
    const b = allBooks.find(b => b._id === id);
    if (!b) return;

    // TẠO BASE URL
    const BASE_URL = API_BASE.replace('/api', '');

    // HÀM CHUYỂN URL THÀNH URL TUYỆT ĐỐI
    function toAbsUrl(url) {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) {
            return url;
        }
        return BASE_URL + (url.startsWith('/') ? url : '/' + url);
    }

    // ĐỔ DỮ LIỆU TEXT VÀO FORM
    document.getElementById('bookId').value = b._id;
    document.getElementById('bookTitle').value = b.title || '';
    document.getElementById('bookAuthor').value = b.author || '';
    document.getElementById('bookPrice').value = b.price || 0;
    document.getElementById('bookCategorySelect').value = b.category || '';
    document.getElementById('bookDescription').value = b.description || '';

    // ============================================
    // XỬ LÝ ẢNH BÌA
    // ============================================
    const coverUrl = toAbsUrl(b.image || b.coverImage || '');
    if (coverUrl) {
        currentCoverBase64 = coverUrl;
        document.getElementById('coverPreviewContainer').innerHTML = `
            <div class="preview-item" data-is-old-cover="true">
                <img src="${coverUrl}" style="max-width:120px; max-height:160px; object-fit:cover; border-radius:6px;">
                <button type="button" class="remove-img" onclick="clearCoverImage()" style="background:#e53e3e; color:white;">✖</button>
                <span style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.6); color:white; font-size:10px; text-align:center;">Ảnh hiện tại</span>
            </div>
        `;
        document.getElementById('bookCoverUrl').value = coverUrl;
    } else {
        clearCoverImage();
    }

// ============================================
// XỬ LÝ ẢNH GALLERY - SỬA LỖI QUAN TRỌNG
// ============================================

// RESET mảng gallery trước khi load mới (QUAN TRỌNG)
galleryBase64List = [];

const gallery = b.galleryImages || b.images || [];

if (gallery.length) {
    // Chuyển đổi URL và lưu vào mảng với thông tin đầy đủ
    galleryBase64List = gallery.map((img, index) => ({
        url: toAbsUrl(img),
        isOld: true,           // Đánh dấu là ảnh cũ từ server
        oldUrl: img,           // Lưu URL gốc để xóa sau
        index: index
    }));
    
    // Render preview gallery
    renderGalleryPreviews();
} else {
    renderGalleryPreviews();
}

    // ============================================
    // HIỂN THỊ FILE PDF
    // ============================================
    if (b.samplePdf) {
        document.getElementById("samplePdfPreview").innerHTML = `
            <div class="pdf-preview" data-is-old-pdf="true">
                <i class="fas fa-file-pdf"></i>
                <div>
                    <div class="pdf-preview-name">Đã có file đọc thử</div>
                    <div style="font-size:12px; color:#64748b;">Click "Lưu sách" để giữ nguyên</div>
                </div>
                <button type="button" onclick="clearSamplePdf()" style="margin-left:auto; background:#e53e3e; border:none; color:white; cursor:pointer; padding:4px 8px; border-radius:4px;">
                    <i class="fas fa-times"></i> Xóa
                </button>
            </div>
        `;
    }

    if (b.pdfFile) {
        document.getElementById('pdfPreviewContainer').innerHTML = `
            <div class="pdf-preview" data-is-old-ebook="true">
                <i class="fas fa-file-pdf"></i>
                <div>
                    <div class="pdf-preview-name">Đã có file Ebook PDF</div>
                    <div style="font-size:12px; color:#64748b;">Click "Lưu sách" để giữ nguyên</div>
                </div>
                <button type="button" onclick="clearEbookPdf()" style="margin-left:auto; background:#e53e3e; border:none; color:white; cursor:pointer; padding:4px 8px; border-radius:4px;">
                    <i class="fas fa-times"></i> Xóa
                </button>
            </div>
        `;
    }

    // SCROLL LÊN ĐẦU TRANG
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// PREVIEW ẢNH BÌA
// ============================================

// Hàm xem trước ảnh bìa khi chọn file
//
// event:
// sự kiện onchange của input file
function previewCoverImage(event) {

    // ============================================
    // LẤY FILE ĐƯỢC CHỌN
    // ============================================

    // files[0]:
    // lấy file đầu tiên
    const file = event.target.files[0];



    // Nếu chưa chọn file
    // -> dừng hàm
    if (!file) return;



    // ============================================
    // TẠO FILE READER
    // ============================================

    // FileReader:
    // dùng để đọc file local từ máy user
    const reader = new FileReader();



    // ============================================
    // KHI ĐỌC FILE THÀNH CÔNG
    // ============================================

    reader.onload = (e) => {

        // ========================================
        // LƯU BASE64
        // ========================================

        // e.target.result:
        // dữ liệu ảnh dạng Base64
        //
        // Ví dụ:
        // data:image/png;base64,iVBOR...
        currentCoverBase64 =
            e.target.result;



        // ========================================
        // HIỂN THỊ PREVIEW ẢNH
        // ========================================

        document.getElementById(
            'coverPreviewContainer'
        ).innerHTML = `

            <div class="preview-item">

                <!-- Ảnh preview -->
                <img src="${currentCoverBase64}">



                <!-- Nút xóa ảnh -->
                <button
                    type="button"
                    class="remove-img"
                    onclick="clearCoverImage()"
                >
                    ✖
                </button>

            </div>
        `;



        // ========================================
        // GÁN VÀO INPUT URL
        // ========================================

        // Lưu base64 vào input hidden/text
        document.getElementById(
            'bookCoverUrl'
        ).value = currentCoverBase64;
    };



    // ============================================
    // ĐỌC FILE THÀNH BASE64
    // ============================================

    // readAsDataURL():
    // chuyển file -> Base64
    reader.readAsDataURL(file);
}

// ============================================
// XÓA ẢNH BÌA
// ============================================

// Hàm xóa ảnh bìa hiện tại
//
// Dùng khi:
// - user bấm nút ✖
// - reset form
// - đổi ảnh mới
function clearCoverImage() {

    // ============================================
    // RESET BASE64 ẢNH
    // ============================================

    // Xóa dữ liệu ảnh đang lưu
    currentCoverBase64 = '';



    // ============================================
    // XÓA PREVIEW ẢNH
    // ============================================

    // Làm rỗng container preview
    //
    // Ảnh preview sẽ biến mất khỏi giao diện
    document.getElementById(
        'coverPreviewContainer'
    ).innerHTML = '';



    // ============================================
    // RESET INPUT URL
    // ============================================

    // Xóa giá trị input chứa URL/base64 ảnh
    document.getElementById(
        'bookCoverUrl'
    ).value = '';
}

function previewGalleryImages(event) {
    Array.from(event.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Thêm ảnh mới với flag isOld = false
            galleryBase64List.push({
                url: e.target.result,
                file: file,
                isOld: false,    // Đánh dấu là ảnh mới
                fileSize: file.size,
                fileName: file.name
            });
            renderGalleryPreviews();
        };
        reader.readAsDataURL(file);
    });
}



function renderGalleryPreviews() {
    const container = document.getElementById('galleryPreviewContainer');
    if (!container) return;
    
    if (!galleryBase64List.length) {
        container.innerHTML = '<div style="color:#94a3b8; font-size:13px; padding:10px 0;">📷 Chưa có ảnh nào. Hãy thêm ảnh gallery bên dưới.</div>';
        return;
    }
    
    container.innerHTML = galleryBase64List.map((item, idx) => {
        let src = '';
        let isOldImage = false;
        let oldUrl = '';
        
        if (typeof item === 'string') {
            src = item;
            isOldImage = false;
        } else if (item.url) {
            src = item.url;
            isOldImage = item.isOld === true;
            oldUrl = item.oldUrl || '';
        }
        
        return `
            <div class="preview-item" data-is-old="${isOldImage}" data-old-url="${oldUrl}" data-gallery-idx="${idx}">
                <img src="${src}" style="width:80px; height:100px; object-fit:cover; border-radius:8px; border:2px solid ${isOldImage ? '#e53e3e' : '#10b981'};">
                <button type="button" class="remove-img" onclick="removeGalleryImage(${idx})" style="${isOldImage ? 'background:#e53e3e; color:white;' : 'background:#64748b; color:white;'}" title="${isOldImage ? 'Xóa ảnh khỏi server' : 'Xóa ảnh này'}">
                    ✖
                </button>
                ${isOldImage ? '<span style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.7); color:white; font-size:10px; text-align:center; padding:2px;">Đã lưu</span>' : '<span style="position:absolute; bottom:0; left:0; right:0; background:rgba(16,185,129,0.8); color:white; font-size:10px; text-align:center; padding:2px;">Mới</span>'}
            </div>
        `;
    }).join('');
}

async function removeGalleryImage(idx) {
    const item = galleryBase64List[idx];
    if (!item) return;
    
    const isOldImage = typeof item === 'object' && item.isOld === true;
    const oldImageUrl = typeof item === 'object' ? item.oldUrl : null;
    
    const result = await Swal.fire({
        title: 'Xóa ảnh?',
        text: isOldImage ? 'Ảnh sẽ bị xóa khi bạn lưu sách' : 'Xóa ảnh này khỏi danh sách',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    });
    
    if (!result.isConfirmed) return;
    
    // CHỈ XÓA LOCAL, KHÔNG GỌI API
    galleryBase64List.splice(idx, 1);
    renderGalleryPreviews();
    
    if (isOldImage && oldImageUrl) {
        if (!window.imagesToDelete) window.imagesToDelete = [];
        if (!window.imagesToDelete.includes(oldImageUrl)) {
            window.imagesToDelete.push(oldImageUrl);
        }
    } else {
        showToast('Đã xóa ảnh khỏi danh sách', 'success');
    }
}

function handleSamplePdf(event) {

    // ============================================
    // LẤY FILE ĐƯỢC CHỌN
    // ============================================

    const file = event.target.files[0];



    // Nếu chưa chọn file
    if (!file) return;



    // ============================================
    // KIỂM TRA ĐỊNH DẠNG FILE
    // ============================================

    // file.type:
    // MIME type của file
    //
    // application/pdf = file PDF
    if (file.type !== 'application/pdf') {

        // Hiện lỗi
        showToast(
            'Vui lòng chọn file PDF!',
            true
        );



        return;
    }



    // ============================================
    // KIỂM TRA KÍCH THƯỚC FILE
    // ============================================

    // file.size:
    // đơn vị byte
    //
    // 10 * 1024 * 1024
    // = 10MB
    if (file.size > 10 * 1024 * 1024) {

        // Hiện lỗi
        showToast(
            'File PDF quá lớn! Tối đa 10MB',
            true
        );



        return;
    }



    // ============================================
    // LƯU FILE PDF
    // ============================================

    // Lưu vào biến global
    window.selectedPdfFile = file;



    // ============================================
    // HIỂN THỊ PREVIEW PDF
    // ============================================

    document.getElementById(
        "samplePdfPreview"
    ).innerHTML = `

        <div class="pdf-preview">

            <!-- Icon PDF -->
            <i class="fas fa-file-pdf"></i>



            <div>

                <!-- Tên file -->
                <div class="pdf-preview-name">
                    ${file.name}
                </div>



                <!-- Kích thước file -->
                <div style="
                    font-size:12px;
                    color:#64748b;
                ">

                    ${
                        // Chuyển byte -> MB
                        (file.size / 1024 / 1024)
                        .toFixed(2)
                    }

                    MB

                </div>

            </div>



            <!-- Nút xóa -->
            <button
                type="button"
                onclick="clearSamplePdf()"
                style="
                    margin-left:auto;
                    background:none;
                    border:none;
                    color:#dc2626;
                    cursor:pointer;
                "
            >
                <i class="fas fa-times"></i>
            </button>

        </div>
    `;
}



// ============================================
// XÓA FILE PDF ĐỌC THỬ
// ============================================

// Hàm reset file sample PDF
function clearSamplePdf() {

    // ============================================
    // RESET FILE ĐÃ CHỌN
    // ============================================

    window.selectedPdfFile = null;



    // ============================================
    // XÓA PREVIEW PDF
    // ============================================

    document.getElementById(
        "samplePdfPreview"
    ).innerHTML = '';



    // ============================================
    // RESET INPUT FILE
    // ============================================

    // Xóa file khỏi input
    document.getElementById(
        "samplePdfInput"
    ).value = '';



    // ============================================
    // RESET INPUT URL PDF
    // ============================================

    document.getElementById(
        'bookSamplePdf'
    ).value = '';
}



// ============================================
// XÓA FILE EBOOK PDF
// ============================================

// Hàm reset file ebook PDF
function clearEbookPdf() {

    // ============================================
    // RESET FILE ĐÃ CHỌN
    // ============================================

    window.selectedEbookFile = null;



    // ============================================
    // LẤY CONTAINER PREVIEW
    // ============================================

    const pdfContainer =
        document.getElementById(
            'pdfPreviewContainer'
        );



    // ============================================
    // XÓA PREVIEW
    // ============================================

    // Nếu tồn tại container
    if (pdfContainer)

        // Làm rỗng HTML
        pdfContainer.innerHTML = '';



    // ============================================
    // RESET INPUT URL PDF
    // ============================================

    const bookPdfUrl =
        document.getElementById(
            'bookPdfUrl'
        );



    // Nếu tồn tại input
    if (bookPdfUrl)

        // Reset value
        bookPdfUrl.value = '';
}

        // ==================== CATEGORIES ====================
// ============================================
// LOAD DANH MỤC TỪ API
// ============================================

// Hàm lấy danh sách category từ server
async function loadCategories() {

    try {

        // ========================================
        // GỌI API
        // ========================================

        // Gửi request lấy categories
        const res = await apiFetch(
            CATEGORIES_API
        );



        // Chuyển response -> JSON
        const data = await res.json();



        // ========================================
        // XỬ LÝ DATA
        // ========================================

        // Hỗ trợ nhiều format API khác nhau
        //
        // 1. []
        // 2. { categories: [] }
        // 3. { data: [] }
        allCategories = Array.isArray(data)

            ? data

            : (
                data.categories ||
                data.data ||
                []
            );



        // ========================================
        // RENDER CATEGORY GRID
        // ========================================

        renderCategoriesGrid();



        // ========================================
        // LOAD CATEGORY CHO SELECT
        // ========================================

        // Cập nhật dropdown category
        loadCategoriesForSelect();



        // ========================================
        // HELPER LẤY ELEMENT
        // ========================================

        // Hàm rút gọn:
        // el('abc')
        // thay cho:
        // document.getElementById('abc')
        const el = (id) =>
            document.getElementById(id);



        // ========================================
        // CẬP NHẬT THỐNG KÊ
        // ========================================

        // Tổng số category
        if (el('totalCategories'))

            el('totalCategories').textContent =
                allCategories.length;



        // Tổng số sách
        if (el('booksInCategories'))

            el('booksInCategories').textContent =
                allBooks.length;



        // ========================================
        // TÌM CATEGORY NHIỀU SÁCH NHẤT
        // ========================================

        if (allCategories.length) {

            // Số lượng sách lớn nhất
            let maxCount = 0;



            // Tên category top
            let topCat = '--';



            // Duyệt tất cả category
            allCategories.forEach(cat => {

                // Đếm số sách thuộc category này
                const count = allBooks.filter(
                    b => b.category === cat.name
                ).length;



                // Nếu lớn hơn max hiện tại
                if (count > maxCount) {

                    // Cập nhật max
                    maxCount = count;



                    // Lưu tên category
                    topCat = cat.name;
                }
            });



            // Hiển thị category top
            if (el('topCategory'))

                el('topCategory').textContent =

                    // Nếu tên quá dài
                    topCat.length > 20

                        // Cắt ngắn
                        ? topCat.substring(0, 20) + '...'

                        // Hiển thị bình thường
                        : topCat;
        }

    } catch (err) {

        // ========================================
        // XỬ LÝ LỖI
        // ========================================

        // In lỗi ra console
        console.error(
            'Lỗi loadCategories:',
            err
        );



        // Hiện thông báo lỗi
        showToast(
            'Không thể tải danh mục',
            true
        );



        // Reset dữ liệu
        allCategories = [];



        // Render giao diện rỗng
        renderCategoriesGrid();
    }
}



// ============================================
// RENDER GRID CATEGORY
// ============================================

// Hàm hiển thị danh sách category
function renderCategoriesGrid() {

    // Lấy container
    const container =
        document.getElementById(
            'categoriesGrid'
        );



    // Nếu không tồn tại
    if (!container) return;



    // ============================================
    // KHÔNG CÓ CATEGORY
    // ============================================

    if (!allCategories.length) {

        // Hiển thị trạng thái rỗng
        container.innerHTML = `
            <div style="
                text-align:center;
                padding:40px;
            ">
                📭 Chưa có danh mục nào
            </div>
        `;

        return;
    }



    // ============================================
    // RENDER CATEGORY
    // ============================================

    container.innerHTML = allCategories.map(c => {

        // ========================================
        // ĐẾM SỐ SÁCH TRONG CATEGORY
        // ========================================

        const bookCount = allBooks.filter(
            b => b.category === c.name
        ).length;



        // ========================================
        // HTML CATEGORY CARD
        // ========================================

        return `

            <div class="category-card">

                <div>

                    <!-- Tên category -->
                    <h4>

                        <i class="fas fa-tag"></i>

                        ${
                            // escapeHtml chống XSS
                            escapeHtml(c.name)
                        }

                    </h4>



                    <!-- Số lượng sách -->
                    <p style="margin-top:8px;">

                        <i class="fas fa-book"></i>

                        ${bookCount} sách

                    </p>

                </div>



                <!-- Nút xóa -->
                <button
                    class="action-btn action-delete"
                    onclick="deleteCategory('${c._id || c.id}')"
                >

                    <i class="fas fa-trash-alt"></i>

                    Xóa

                </button>

            </div>
        `;
    }).join('');
}



// ============================================
// LOAD CATEGORY CHO SELECT
// ============================================

// Hàm cập nhật dropdown category
function loadCategoriesForSelect() {

    // ============================================
    // TẠO OPTIONS CHO SELECT
    // ============================================

    const options =

        // Option mặc định
        '<option value="">-- Chọn thể loại --</option>'

        +

        // map category -> option
        allCategories.map(c => `

            <option value="${escapeHtml(c.name)}">

                ${escapeHtml(c.name)}

            </option>

        `).join('');



    // ============================================
    // SELECT THÊM/SỬA SÁCH
    // ============================================

    const categorySelect =
        document.getElementById(
            'bookCategorySelect'
        );



    // Nếu tồn tại select
    if (categorySelect)

        // Gán HTML option
        categorySelect.innerHTML = options;



    // ============================================
    // SELECT FILTER CATEGORY
    // ============================================

    const categoryFilter =
        document.getElementById(
            'bookCategoryFilter'
        );



    // Nếu tồn tại filter
    if (categoryFilter)

        // Tạo option filter
        categoryFilter.innerHTML =

            '<option value="">Tất cả thể loại</option>'

            +

            allCategories.map(c => `

                <option value="${escapeHtml(c.name)}">

                    ${escapeHtml(c.name)}

                </option>

            `).join('');
}

// ============================================
// THÊM DANH MỤC
// ============================================

// Hàm thêm category mới
async function addCategory() {

    // ============================================
    // LẤY TÊN DANH MỤC
    // ============================================

    // trim():
    // xóa khoảng trắng đầu/cuối
    const name =
        document.getElementById(
            'categoryName'
        ).value.trim();



    // ============================================
    // VALIDATE DỮ LIỆU
    // ============================================

    // Nếu chưa nhập tên
    if (!name) {

        // Hiện thông báo lỗi
        showToast(
            'Vui lòng nhập tên danh mục',
            true
        );



        // Dừng hàm
        return;
    }



    // ============================================
    // GỌI API THÊM CATEGORY
    // ============================================

    try {

        // Gửi request POST
        const res = await apiFetch(

            // URL API
            CATEGORIES_API,



            // Options fetch
            {

                // Method HTTP
                method: 'POST',



                // body:
                // chuyển object -> JSON string
                body: JSON.stringify({

                    // shorthand property
                    // { name: name }
                    name
                })
            }
        );



        // ========================================
        // THÊM THÀNH CÔNG
        // ========================================

        // res.ok:
        // true nếu status 200-299
        if (res.ok) {

            // Hiện toast thành công
            showToast('Thêm thành công!');



            // Reset input
            document.getElementById(
                'categoryName'
            ).value = '';



            // Load lại danh sách category
            loadCategories();
        }



        // ========================================
        // THÊM THẤT BẠI
        // ========================================

        else {

            // Hiện lỗi
            showToast(
                'Thêm thất bại',
                true
            );
        }

    } catch (err) {

        // ========================================
        // LỖI KẾT NỐI
        // ========================================

        showToast(
            'Lỗi kết nối',
            true
        );
    }
}



// ============================================
// XÓA DANH MỤC
// ============================================

// Hàm xóa category theo ID
async function deleteCategory(id) {

    // ============================================
    // HỘP THOẠI XÁC NHẬN
    // ============================================

    const result = await Swal.fire({

        // Tiêu đề
        title: 'Xóa danh mục?',



        // Icon cảnh báo
        icon: 'warning',



        // Hiện nút Cancel
        showCancelButton: true,



        // Màu nút xác nhận
        confirmButtonColor: '#dc2626',



        // Text nút xác nhận
        confirmButtonText: 'Xóa'
    });



    // ============================================
    // KIỂM TRA XÁC NHẬN
    // ============================================

    // Nếu user bấm nút Xóa
    if (result.isConfirmed) {

        try {

            // ========================================
            // GỌI API DELETE
            // ========================================

            const res = await apiFetch(

                // URL category cần xóa
                `${CATEGORIES_API}/${id}`,



                // Method DELETE
                {
                    method: 'DELETE'
                }
            );



            // ========================================
            // XÓA THÀNH CÔNG
            // ========================================

            if (res.ok) {

                // Hiện thông báo
                showToast('Đã xóa!');



                // Load lại danh sách category
                loadCategories();
            }

        } catch (err) {

            // ========================================
            // LỖI KẾT NỐI
            // ========================================

            showToast(
                'Lỗi kết nối',
                true
            );
        }
    }
}

// ============================================
// USERS MANAGEMENT
// ============================================



// ============================================
// LOAD DANH SÁCH USERS
// ============================================

// Hàm lấy danh sách người dùng từ API
async function loadUsers() {

    try {

        // ========================================
        // GỌI API USERS
        // ========================================

        const res = await apiFetch(
            USERS_API
        );



        // Chuyển response -> JSON
        const data = await res.json();



        // ========================================
        // XỬ LÝ DỮ LIỆU
        // ========================================

        // Hỗ trợ nhiều format API:
        //
        // 1. []
        // 2. { users: [] }
        allUsers = Array.isArray(data)

            ? data

            : (data.users || []);



        // ========================================
        // RENDER THỐNG KÊ USER
        // ========================================

        renderUserStats();



        // ========================================
        // RENDER DANH SÁCH USER
        // ========================================

        renderUsers();

    } catch (err) {

        // ========================================
        // LỖI KẾT NỐI/API
        // ========================================

        showToast(
            'Không thể tải người dùng',
            true
        );
    }
}



// ============================================
// RENDER THỐNG KÊ USERS
// ============================================

// Hàm cập nhật dashboard user
function renderUserStats() {

    // ============================================
    // HELPER LẤY ELEMENT
    // ============================================

    const el = (id) =>
        document.getElementById(id);



    // ============================================
    // TỔNG USERS
    // ============================================

    if (el('userStatTotal'))

        el('userStatTotal').textContent =
            allUsers.length;



    // ============================================
    // USERS ĐANG HOẠT ĐỘNG
    // ============================================

    // !u.isLocked
    // -> chưa bị khóa
    if (el('userStatActive'))

        el('userStatActive').textContent =

            allUsers.filter(
                u => !u.isLocked
            ).length;



    // ============================================
    // USERS BỊ KHÓA
    // ============================================

    if (el('userStatLocked'))

        el('userStatLocked').textContent =

            allUsers.filter(
                u => u.isLocked
            ).length;



    // ============================================
    // SỐ ADMIN
    // ============================================

    if (el('userStatAdmin'))

        el('userStatAdmin').textContent =

            allUsers.filter(
                u => u.role === 'admin'
            ).length;
}



// ============================================
// RENDER DANH SÁCH USERS
// ============================================

// Hàm hiển thị bảng users
function renderUsers() {

    // ============================================
    // COPY MẢNG USERS
    // ============================================

    let filtered = [...allUsers];



    // ============================================
    // LẤY GIÁ TRỊ SEARCH
    // ============================================

    const search = (

        document.getElementById(
            'userSearch'
        )?.value || ''

    ).toLowerCase();



    // ============================================
    // LẤY FILTER ROLE
    // ============================================

    const role =

        document.getElementById(
            'roleFilter'
        )?.value || '';



    // ============================================
    // LẤY FILTER STATUS
    // ============================================

    const status =

        document.getElementById(
            'statusFilter'
        )?.value || '';



    // ============================================
    // FILTER THEO SEARCH
    // ============================================

    if (search)

        filtered = filtered.filter(u =>

            // Search username
            (u.username || '')
                .toLowerCase()
                .includes(search)

            ||

            // Search email
            (u.email || '')
                .toLowerCase()
                .includes(search)
        );



    // ============================================
    // FILTER THEO ROLE
    // ============================================

    if (role)

        filtered = filtered.filter(
            u => u.role === role
        );



    // ============================================
    // FILTER THEO STATUS
    // ============================================

    if (status)

        filtered = filtered.filter(u =>

            // active
            status === 'active'

                ? !u.isLocked

                // locked
                : u.isLocked
        );



    // ============================================
    // TÍNH TỔNG TRANG
    // ============================================

    const totalPages =

        Math.ceil(
            filtered.length / ITEMS_PER_PAGE
        ) || 1;



    // Nếu trang hiện tại vượt tổng trang
    // -> reset về trang 1
    if (currentPage.users > totalPages)

        currentPage.users = 1;



    // ============================================
    // PHÂN TRANG
    // ============================================

    const paginated = filtered.slice(

        // start
        (currentPage.users - 1)
        * ITEMS_PER_PAGE,



        // end
        currentPage.users
        * ITEMS_PER_PAGE
    );



    // ============================================
    // LẤY TBODY
    // ============================================

    const tbody =
        document.getElementById(
            'usersList'
        );



    // Nếu không tồn tại
    if (!tbody) return;



    // ============================================
    // KHÔNG CÓ USERS
    // ============================================

    if (!paginated.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        padding:40px;
                    "
                >

                    👥 Không có người dùng

                </td>

            </tr>
        `;

        return;
    }



    // ============================================
    // RENDER USERS
    // ============================================

    tbody.innerHTML = paginated.map(u => `

        <tr>

            <!-- USER INFO -->
            <td class="user-cell">

                <!-- Avatar -->
                <div class="avatar">

                    ${
                        // Lấy chữ cái đầu username
                        (u.username || 'U')
                        .charAt(0)
                        .toUpperCase()
                    }

                </div>



                <!-- Thông tin -->
                <div>

                    <!-- Username -->
                    <strong>
                        ${escapeHtml(u.username)}
                    </strong>



                    <br>



                    <!-- Email -->
                    <small>
                        ${escapeHtml(u.email)}
                    </small>

                </div>

            </td>



            <!-- ROLE -->
            <td>

                <span class="badge">

                    ${
                        u.role === 'admin'

                            ? 'Admin'

                            : 'User'
                    }

                </span>

            </td>



            <!-- STATUS -->
            <td>

                <span class="
                    badge
                    ${u.isLocked
                        ? 'badge-banned'
                        : 'badge-active'
                    }
                ">

                    ${
                        u.isLocked

                            ? 'Đã khóa'

                            : 'Hoạt động'
                    }

                </span>

            </td>



            <!-- NGÀY TẠO -->
            <td>

                ${
                    // Format ngày
                    formatDate(u.createdAt)
                }

            </td>



            <!-- ACTION BUTTONS -->
            <td class="action-buttons">

                <!-- Nút sửa -->
                <button
                    class="action-btn action-edit"
                    onclick="editUser('${u._id}')"
                >

                    <i class="fas fa-edit"></i>

                </button>



                <!-- Nút xóa -->
                <button
                    class="action-btn action-delete"
                    onclick="deleteUser('${u._id}')"
                >

                    <i class="fas fa-trash"></i>

                </button>

            </td>

        </tr>

    `).join('');



    // ============================================
    // RENDER PAGINATION
    // ============================================

    renderPagination(

        // id container
        'usersPagination',



        // trang hiện tại
        currentPage.users,



        // tổng số trang
        totalPages,



        // callback đổi trang
        (page) => {

            // cập nhật trang
            currentPage.users = page;



            // render lại
            renderUsers();
        }
    );
}

// ============================================
// CHỈNH SỬA USER
// ============================================

// Hàm load dữ liệu user lên form để edit
function editUser(id) {

    // ============================================
    // TÌM USER THEO ID
    // ============================================

    // find():
    // tìm user đầu tiên có _id trùng id
    const u = allUsers.find(
        u => u._id === id
    );



    // Nếu không tìm thấy user
    // -> dừng hàm
    if (!u) return;



    // ============================================
    // ĐỔ DỮ LIỆU VÀO FORM
    // ============================================

    // ID user
    //
    // Dùng để biết đang edit user nào
    document.getElementById(
        'userId'
    ).value = u._id;



    // Username
    document.getElementById(
        'username'
    ).value = u.username || '';



    // Email
    document.getElementById(
        'email'
    ).value = u.email || '';



    // Role
    //
    // Nếu không có role
    // -> mặc định là user
    document.getElementById(
        'role'
    ).value = u.role || 'user';



    // ============================================
    // RESET PASSWORD
    // ============================================

    // Không hiển thị password cũ
    //
    // vì lý do bảo mật
    document.getElementById(
        'password'
    ).value = '';



    // ============================================
    // SCROLL LÊN ĐẦU TRANG
    // ============================================

    // behavior: smooth
    // -> cuộn mượt
    window.scrollTo({

        // Cuộn lên đầu
        top: 0,



        // Hiệu ứng mượt
        behavior: 'smooth'
    });
}



// ============================================
// RESET FORM USER
// ============================================

// Hàm đưa form user về trạng thái mặc định
function resetUserForm() {

    // ============================================
    // RESET USER ID
    // ============================================

    // Xóa ID
    //
    // chuyển form về chế độ thêm mới
    document.getElementById(
        'userId'
    ).value = '';



    // ============================================
    // RESET USERNAME
    // ============================================

    document.getElementById(
        'username'
    ).value = '';



    // ============================================
    // RESET EMAIL
    // ============================================

    document.getElementById(
        'email'
    ).value = '';



    // ============================================
    // RESET PASSWORD
    // ============================================

    document.getElementById(
        'password'
    ).value = '';



    // ============================================
    // RESET ROLE
    // ============================================

    // Đưa role về mặc định = user
    document.getElementById(
        'role'
    ).value = 'user';
}

// ============================================
// LƯU USER
// ============================================

// Hàm thêm mới hoặc cập nhật user
async function saveUser() {

    // ============================================
    // LẤY DỮ LIỆU TỪ FORM
    // ============================================

    // ID user
    //
    // Nếu có -> edit
    // Nếu rỗng -> thêm mới
    const userId =
        document.getElementById(
            'userId'
        ).value;



    // Username
    const username =
        document.getElementById(
            'username'
        ).value.trim();



    // Email
    const email =
        document.getElementById(
            'email'
        ).value.trim();



    // Password
    const password =
        document.getElementById(
            'password'
        ).value;



    // Role
    const role =
        document.getElementById(
            'role'
        ).value;



    // ============================================
    // VALIDATE FORM
    // ============================================

    // Nếu thiếu username hoặc email
    if (!username || !email) {

        showToast(
            'Vui lòng nhập đầy đủ!',
            true
        );

        return;
    }



    // Nếu thêm mới mà chưa nhập password
    //
    // !userId:
    // -> đang tạo user mới
    if (!userId && !password) {

        showToast(
            'Vui lòng nhập mật khẩu!',
            true
        );

        return;
    }



    // ============================================
    // TẠO OBJECT DỮ LIỆU
    // ============================================

    const data = {

        // shorthand property
        username,
        email,
        role
    };



    // ============================================
    // THÊM PASSWORD NẾU CÓ
    // ============================================

    // Khi edit:
    // nếu để trống password
    // -> giữ nguyên password cũ
    if (password)

        data.password = password;



    // ============================================
    // GỌI API
    // ============================================

    try {

        // ========================================
        // XÁC ĐỊNH URL
        // ========================================

        // Edit:
        // /users/id
        //
        // Add:
        // /users
        const url = userId

            ? `${USERS_API}/${userId}`

            : USERS_API;



        // ========================================
        // XÁC ĐỊNH METHOD
        // ========================================

        // PUT:
        // cập nhật
        //
        // POST:
        // thêm mới
        const method = userId

            ? 'PUT'

            : 'POST';



        // ========================================
        // GỬI REQUEST
        // ========================================

        const res = await apiFetch(

            url,

            {
                method,



                // object -> JSON string
                body: JSON.stringify(data)
            }
        );



        // ========================================
        // LƯU THÀNH CÔNG
        // ========================================

        if (res.ok) {

            // Toast thành công
            showToast(

                userId

                    ? 'Cập nhật thành công!'

                    : 'Thêm thành công!'
            );



            // Reset form
            resetUserForm();



            // Load lại users
            loadUsers();
        }



        // ========================================
        // LƯU THẤT BẠI
        // ========================================

        else {

            showToast(
                'Lưu thất bại!',
                true
            );
        }

    } catch (err) {

        // ========================================
        // LỖI KẾT NỐI
        // ========================================

        showToast(
            'Lỗi kết nối!',
            true
        );
    }
}



// ============================================
// XÓA USER
// ============================================

// Hàm xóa user theo ID
async function deleteUser(id) {

    // ============================================
    // HỘP THOẠI XÁC NHẬN
    // ============================================

    const result = await Swal.fire({

        // Tiêu đề
        title: 'Xóa người dùng?',



        // Icon cảnh báo
        icon: 'warning',



        // Hiện nút cancel
        showCancelButton: true,



        // Màu nút xác nhận
        confirmButtonColor: '#dc2626',



        // Text nút xác nhận
        confirmButtonText: 'Xóa'
    });



    // ============================================
    // KIỂM TRA XÁC NHẬN
    // ============================================

    if (result.isConfirmed) {

        try {

            // ========================================
            // GỌI API DELETE
            // ========================================

            const res = await apiFetch(

                `${USERS_API}/${id}`,

                {
                    method: 'DELETE'
                }
            );



            // ========================================
            // XÓA THÀNH CÔNG
            // ========================================

            if (res.ok) {

                showToast('Đã xóa!');



                // Reload users
                loadUsers();
            }

        } catch (err) {

            // ========================================
            // LỖI KẾT NỐI
            // ========================================

            showToast(
                'Lỗi kết nối',
                true
            );
        }
    }
}



// ============================================
// LOAD ĐƠN HÀNG
// ============================================

// Hàm lấy danh sách orders
async function loadOrders() {

    try {

        // ========================================
        // GỌI API ORDERS
        // ========================================

        const res = await apiFetch(

            `${API_BASE}/orders`
        );



        // Chuyển response -> JSON
        const data = await res.json();



        // ========================================
        // XỬ LÝ DỮ LIỆU
        // ========================================

        // API trả về array
        if (Array.isArray(data))

            allOrders = data;



        // API trả về:
        // { orders: [] }
        else if (

            data.orders &&
            Array.isArray(data.orders)

        )

            allOrders = data.orders;



        // Không có dữ liệu hợp lệ
        else

            allOrders = [];



        // ========================================
        // RENDER GIAO DIỆN
        // ========================================

        // Hiển thị orders
        renderOrders();



        // Cập nhật thống kê order
        updateOrderStats();



        // Cập nhật dashboard
        updateDashboardStats();



        // Load đơn hàng gần đây
        loadRecentOrders();

    } catch (err) {

        // ========================================
        // LỖI API
        // ========================================

        console.error(
            'Lỗi loadOrders:',
            err
        );



        // Toast lỗi
        showToast(
            'Không thể tải đơn hàng từ server',
            true
        );



        // ========================================
        // FALLBACK LOCAL STORAGE
        // ========================================

        // Nếu API lỗi
        // -> dùng dữ liệu local
        const localOrders = JSON.parse(

            localStorage.getItem(
                'adminOrders'
            ) || '[]'
        );



        // Gán dữ liệu local
        allOrders = localOrders;



        // ========================================
        // RENDER LOCAL DATA
        // ========================================

        renderOrders();

        updateOrderStats();
    }
}

// ============================================
// RENDER DANH SÁCH ĐƠN HÀNG
// ============================================

// Hàm hiển thị bảng orders
function renderOrders() {

    // ============================================
    // COPY DANH SÁCH ORDERS
    // ============================================

    let filtered = [...allOrders];



    // ============================================
    // LẤY GIÁ TRỊ SEARCH
    // ============================================

    const search = (

        document.getElementById(
            'orderSearch'
        )?.value || ''

    ).toLowerCase();



    // ============================================
    // LẤY FILTER STATUS
    // ============================================

    const status =

        document.getElementById(
            'orderStatusFilter'
        )?.value || '';



    // ============================================
    // FILTER THEO SEARCH
    // ============================================

    if (search)

        filtered = filtered.filter(o =>

            // Search theo ID đơn hàng
            (o._id || o.id || '')
                .toLowerCase()
                .includes(search)

            ||

            // Search theo tên khách hàng
            (o.customer || o.customerName || '')
                .toLowerCase()
                .includes(search)

            ||

            // Search theo email
            (o.customerEmail || o.email || '')
                .toLowerCase()
                .includes(search)

            ||

            // Search theo số điện thoại
            (o.phone || o.customerPhone || '')
                .toLowerCase()
                .includes(search)
        );



    // ============================================
    // FILTER THEO STATUS
    // ============================================

    if (status)

        filtered = filtered.filter(
            o => o.status === status
        );



    // ============================================
    // TÍNH TỔNG SỐ TRANG
    // ============================================

    const totalPages =

        Math.ceil(
            filtered.length / ITEMS_PER_PAGE
        ) || 1;



    // Nếu page hiện tại vượt tổng page
    if (currentPage.orders > totalPages)

        currentPage.orders = 1;



    // ============================================
    // PHÂN TRANG
    // ============================================

    const paginated = filtered.slice(

        // start
        (currentPage.orders - 1)
        * ITEMS_PER_PAGE,



        // end
        currentPage.orders
        * ITEMS_PER_PAGE
    );



    // ============================================
    // LẤY TBODY
    // ============================================

    const tbody =
        document.getElementById(
            'ordersList'
        );



    // Nếu không tồn tại
    if (!tbody) return;



    // ============================================
    // KHÔNG CÓ ĐƠN HÀNG
    // ============================================

    if (!paginated.length) {

        // Hiển thị trạng thái rỗng
        tbody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    style="
                        text-align:center;
                        padding:40px;
                    "
                >

                    📭 Chưa có đơn hàng nào

                </td>

            </tr>
        `;



        // Xóa pagination
        document.getElementById(
            'ordersPagination'
        ).innerHTML = '';



        return;
    }



    // ============================================
    // RENDER ORDERS
    // ============================================

    tbody.innerHTML = paginated.map(o => {

        // ========================================
        // LẤY THÔNG TIN ĐƠN HÀNG
        // ========================================

        // ID order
        const orderId =
            o._id || o.id;



        // Tên khách hàng
        const customerName =
            o.customer ||
            o.customerName ||
            'Khách';



        // Email khách hàng
        const customerEmail =
            o.customerEmail ||
            o.email ||
            '--';



        // Số điện thoại
        const phone =
            o.phone ||
            o.customerPhone ||
            '--';



        // Tên sách
        const bookTitle =

            // bookTitle trực tiếp
            o.bookTitle ||

            // item đầu tiên
            (
                o.items &&
                o.items[0]

                    ? o.items[0].title

                    : ''
            )

            ||

            '--';



        // ========================================
        // MÀU STATUS
        // ========================================

        const statusColors = {

            // Chờ xử lý
            pending: '#fef3c7',



            // Đang gửi
            shipped: '#dbeafe',



            // Đã gửi
            delivered: '#d1fae5'
        };



        // ========================================
        // HTML ROW
        // ========================================

        return `

            <tr>

                <!-- ORDER ID -->
                <td>

                    <strong>

                        #${orderId}

                    </strong>

                </td>



                <!-- CUSTOMER -->
                <td>

                    <strong>

                        ${escapeHtml(customerName)}

                    </strong>

                </td>



                <!-- EMAIL -->
                <td>

                    ${escapeHtml(customerEmail)}

                </td>



                <!-- PHONE -->
                <td>

                    ${phone}

                </td>



                <!-- BOOK -->
                <td>

                    ${escapeHtml(bookTitle)}

                </td>



                <!-- TOTAL -->
                <td>

                    ${
                        formatPrice(o.total)
                    }

                </td>



                <!-- STATUS -->
                <td>

                    <select

                        class="status-select"

                        onchange="
                            updateOrderStatus(
                                '${orderId}',
                                this.value
                            )
                        "

                        style="
                            background:
                            ${
                                statusColors[o.status]
                                || '#fef3c7'
                            }
                        "
                    >

                        <!-- Pending -->
                        <option
                            value="pending"

                            ${
                                o.status === 'pending'

                                    ? 'selected'

                                    : ''
                            }
                        >

                            ⏳ Chờ xử lý

                        </option>



                        <!-- Shipped -->
                        <option
                            value="shipped"

                            ${
                                o.status === 'shipped'

                                    ? 'selected'

                                    : ''
                            }
                        >

                            🚚 Đang gửi file Ebook/PDF

                        </option>



                        <!-- Delivered -->
                        <option
                            value="delivered"

                            ${
                                o.status === 'delivered'

                                    ? 'selected'

                                    : ''
                            }
                        >

                            ✅ Đã gửi file Ebook/PDF

                        </option>

                    </select>

                </td>



                <!-- NGÀY -->
                <td>

                    ${
                        formatDate(
                            o.date || o.createdAt
                        )
                    }

                </td>



                <!-- ACTIONS -->
                <td class="action-buttons">

                    <!-- Xem chi tiết -->
                    <button
                        class="action-btn action-view"
                        onclick="
                            viewOrderDetail(
                                '${orderId}'
                            )
                        "
                    >

                        <i class="fas fa-eye"></i>

                    </button>



                    <!-- Gửi email -->
                    <button
                        class="action-btn action-email"
                        onclick="
                            sendEmailToCustomer(
                                '${orderId}'
                            )
                        "
                    >

                        <i class="fas fa-envelope"></i>

                    </button>



                    <!-- Xóa -->
                    <button
                        class="action-btn action-delete"
                        onclick="
                            deleteOrder(
                                '${orderId}'
                            )
                        "
                    >

                        <i class="fas fa-trash"></i>

                    </button>

                </td>

            </tr>
        `;

    }).join('');



    // ============================================
    // RENDER PAGINATION
    // ============================================

    renderPagination(

        // Container ID
        'ordersPagination',



        // Trang hiện tại
        currentPage.orders,



        // Tổng trang
        totalPages,



        // Callback đổi trang
        (page) => {

            // Cập nhật page
            currentPage.orders = page;



            // Render lại
            renderOrders();
        }
    );
}



// ============================================
// CẬP NHẬT THỐNG KÊ ĐƠN HÀNG
// ============================================

// Hàm cập nhật dashboard orders
function updateOrderStats() {

    // ============================================
    // HELPER LẤY ELEMENT
    // ============================================

    const el = (id) =>
        document.getElementById(id);



    // ============================================
    // ĐƠN HÀNG CHỜ XỬ LÝ
    // ============================================

    if (el('orderPending'))

        el('orderPending').textContent =

            allOrders.filter(
                o => o.status === 'pending'
            ).length;



    // ============================================
    // ĐƠN HÀNG ĐANG GỬI
    // ============================================

    if (el('orderShipped'))

        el('orderShipped').textContent =

            allOrders.filter(
                o => o.status === 'shipped'
            ).length;



    // ============================================
    // ĐƠN HÀNG ĐÃ GỬI
    // ============================================

    if (el('orderDelivered'))

        el('orderDelivered').textContent =

            allOrders.filter(
                o => o.status === 'delivered'
            ).length;



    // ============================================
    // TÍNH DOANH THU
    // ============================================

    if (el('orderRevenue'))

        el('orderRevenue').textContent =

            formatPrice(

                // Chỉ tính đơn delivered
                allOrders

                    .filter(
                        o => o.status === 'delivered'
                    )

                    // reduce():
                    // cộng tổng doanh thu
                    .reduce(

                        // s = sum
                        (s, o) =>

                            s + (o.total || 0),

                        // giá trị khởi tạo
                        0
                    )
            );
}

// ============================================
// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
// ============================================

// Hàm update status order
//
// orderId:
// ID đơn hàng
//
// newStatus:
// trạng thái mới
async function updateOrderStatus(orderId, newStatus) {

    try {

        // ========================================
        // GỌI API UPDATE STATUS
        // ========================================

        const response = await apiFetch(

            // URL API
            `${API_BASE}/orders/${orderId}/status`,



            // Options request
            {
                // PATCH:
                // cập nhật 1 phần dữ liệu
                method: 'PATCH',



                // body JSON
                body: JSON.stringify({

                    // status mới
                    status: newStatus
                })
            }
        );



        // ========================================
        // UPDATE THÀNH CÔNG
        // ========================================

        if (response.ok) {

            // ====================================
            // TÌM INDEX ORDER
            // ====================================

            const idx = allOrders.findIndex(o =>

                o._id === orderId ||

                o.id === orderId
            );



            // ====================================
            // CẬP NHẬT STATUS LOCAL
            // ====================================

            if (idx !== -1)

                allOrders[idx].status =
                    newStatus;



            // ====================================
            // RENDER LẠI GIAO DIỆN
            // ====================================

            renderOrders();

            updateOrderStats();

            updateDashboardStats();

            loadRecentOrders();



            // ====================================
            // LABEL STATUS
            // ====================================

            const labels = {

                pending:
                    'Chờ xử lý',



                shipped:
                    'Đang gửi file Ebook/PDF',



                delivered:
                    'Đã gửi file Ebook/PDF'
            };



            // ====================================
            // THÔNG BÁO THÀNH CÔNG
            // ====================================

            showToast(

                `Đã cập nhật: ${
                    labels[newStatus]
                    || newStatus
                }`
            );
        }



        // ========================================
        // UPDATE THẤT BẠI
        // ========================================

        else {

            showToast(
                'Cập nhật thất bại!',
                true
            );
        }

    } catch (err) {

        // ========================================
        // LỖI KẾT NỐI
        // ========================================

        showToast(
            'Lỗi kết nối!',
            true
        );
    }
}



// ============================================
// XEM CHI TIẾT ĐƠN HÀNG
// ============================================

// Hàm hiển thị modal chi tiết order
function viewOrderDetail(id) {

    // ============================================
    // TÌM ORDER THEO ID
    // ============================================

    const o = allOrders.find(o =>

        o._id === id ||

        o.id === id
    );



    // Nếu không tìm thấy
    if (!o) return;



    // ============================================
    // LẤY DANH SÁCH SẢN PHẨM
    // ============================================

    // Nếu order có items
    const items =

        o.items && o.items.length

            ? o.items

            // fallback nếu không có items
            : [{
                name:
                    o.bookTitle || '--',

                quantity: 1,

                price: o.total
            }];



    // ============================================
    // TẠO HTML CHI TIẾT SẢN PHẨM
    // ============================================

    const itemsHtml = items.map(item => `

        <tr>

            <!-- Tên sản phẩm -->
            <td style="
                padding:10px;
                border:1px solid #ddd;
            ">

                ${
                    escapeHtml(
                        item.name ||
                        item.title ||
                        '--'
                    )
                }

            </td>



            <!-- Số lượng -->
            <td style="
                text-align:center;
                padding:10px;
                border:1px solid #ddd;
            ">

                ${item.quantity || 1}

            </td>



            <!-- Thành tiền -->
            <td style="
                padding:10px;
                border:1px solid #ddd;
            ">

                ${
                    formatPrice(item.price)
                }

            </td>

        </tr>

    `).join('');



    // ============================================
    // RENDER MODAL DETAIL
    // ============================================

    document.getElementById(
        'orderDetailBody'
    ).innerHTML = `

        <!-- Mã đơn -->
        <p>

            <strong>Mã đơn:</strong>

            #${o._id || o.id}

        </p>



        <!-- Khách hàng -->
        <p>

            <strong>Khách hàng:</strong>

            ${
                escapeHtml(
                    o.customer ||
                    o.customerName ||
                    '--'
                )
            }

        </p>



        <!-- Email -->
        <p>

            <strong>Email:</strong>

            ${
                escapeHtml(
                    o.customerEmail ||
                    o.email ||
                    '--'
                )
            }

        </p>



        <!-- SĐT -->
        <p>

            <strong>SĐT:</strong>

            ${
                o.phone ||
                o.customerPhone ||
                '--'
            }

        </p>



        <!-- Địa chỉ -->
        <p>

            <strong>Địa chỉ:</strong>

            ${
                escapeHtml(
                    o.address || '--'
                )
            }

        </p>



        <!-- Tổng tiền -->
        <p>

            <strong>Tổng tiền:</strong>

            ${
                formatPrice(o.total)
            }

        </p>



        <!-- Status -->
        <p>

            <strong>Trạng thái:</strong>

            <select
                id="detailStatus"

                onchange="
                    updateOrderStatus(
                        '${o._id || o.id}',
                        this.value
                    )
                "
            >

                <option
                    value="pending"

                    ${
                        o.status === 'pending'
                            ? 'selected'
                            : ''
                    }
                >

                    ⏳ Chờ xử lý

                </option>



                <option
                    value="shipped"

                    ${
                        o.status === 'shipped'
                            ? 'selected'
                            : ''
                    }
                >

                    🚚 Đang gửi

                </option>



                <option
                    value="delivered"

                    ${
                        o.status === 'delivered'
                            ? 'selected'
                            : ''
                    }
                >

                    ✅ Đã gửi file Ebook/PDF

                </option>

            </select>

        </p>



        <!-- Ngày đặt -->
        <p>

            <strong>Ngày đặt:</strong>

            ${
                formatDateTime(
                    o.date || o.createdAt
                )
            }

        </p>



        <!-- Bảng sản phẩm -->
        <p>

            <strong>
                Chi tiết sản phẩm:
            </strong>

        </p>



        <table class="invoice-table">

            <!-- Header -->
            <thead>

                <tr style="
                    background:#1D3557;
                    color:white;
                ">

                    <th>Sản phẩm</th>

                    <th>Số lượng</th>

                    <th>Thành tiền</th>

                </tr>

            </thead>



            <!-- Body -->
            <tbody>

                ${itemsHtml}

            </tbody>

        </table>



        <!-- Buttons -->
        <div class="action-buttons mt-3">

            <!-- Gửi email -->
            <button
                class="btn btn-email"

                onclick="
                    sendEmailToCustomer(
                        '${o._id || o.id}'
                    );

                    closeModal(
                        'orderDetailModal'
                    );
                "
            >

                <i class="fas fa-envelope"></i>

                Gửi email xác nhận

            </button>



            <!-- Đóng -->
            <button
                class="btn btn-secondary"

                onclick="
                    closeModal(
                        'orderDetailModal'
                    )
                "
            >

                Đóng

            </button>

        </div>
    `;



    // ============================================
    // HIỆN MODAL
    // ============================================

    document.getElementById(
        'orderDetailModal'
    ).style.display = 'flex';
}



// ============================================
// XÓA ĐƠN HÀNG
// ============================================

// Hàm delete order
async function deleteOrder(id) {

    // ============================================
    // HỘP THOẠI XÁC NHẬN
    // ============================================

    const result = await Swal.fire({

        // Tiêu đề
        title: 'Xóa đơn hàng?',



        // Icon cảnh báo
        icon: 'warning',



        // Hiện nút cancel
        showCancelButton: true,



        // Màu nút xác nhận
        confirmButtonColor: '#dc2626',



        // Text nút xác nhận
        confirmButtonText: 'Xóa',



        // Text nút hủy
        cancelButtonText: 'Hủy'
    });



    // ============================================
    // KIỂM TRA XÁC NHẬN
    // ============================================

    if (result.isConfirmed) {

        try {

            // ========================================
            // GỌI API DELETE
            // ========================================

            const response = await apiFetch(

                `${API_BASE}/orders/${id}`,

                {
                    method: 'DELETE'
                }
            );



            // ========================================
            // XÓA THÀNH CÔNG
            // ========================================

            if (response.ok) {

                // Toast thành công
                showToast(
                    'Đã xóa đơn hàng!'
                );



                // Reload orders
                loadOrders();
            }



            // ========================================
            // XÓA THẤT BẠI
            // ========================================

            else {

                showToast(
                    'Xóa thất bại!',
                    true
                );
            }

        } catch (err) {

            // ========================================
            // LỖI KẾT NỐI
            // ========================================

            showToast(
                'Lỗi kết nối!',
                true
            );
        }
    }
}

// ============================================
// LOAD ĐƠN HÀNG GẦN ĐÂY
// ============================================

// Hàm hiển thị 5 đơn hàng mới nhất
function loadRecentOrders() {

    // ============================================
    // LẤY TBODY
    // ============================================

    const tbody = document.getElementById(
        'recentOrdersList'
    );



    // Nếu không tồn tại tbody
    if (!tbody) return;



    // ============================================
    // LẤY 5 ĐƠN HÀNG GẦN NHẤT
    // ============================================

    // slice(0, 5):
    // lấy từ index 0 -> 4
    const recent = allOrders.slice(0, 5);



    // ============================================
    // KHÔNG CÓ ĐƠN HÀNG
    // ============================================

    if (!recent.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="
                        text-align:center;
                        padding:20px;
                    "
                >

                    Chưa có đơn hàng

                </td>

            </tr>
        `;

        return;
    }



    // ============================================
    // RENDER RECENT ORDERS
    // ============================================

    tbody.innerHTML = recent.map(o => `

        <tr>

            <!-- ORDER ID -->
            <td>

                ${o._id || o.id}

            </td>



            <!-- CUSTOMER -->
            <td>

                ${
                    escapeHtml(

                        o.customer ||

                        o.customerName ||

                        'Khách'
                    )
                }

            </td>



            <!-- BOOK TITLE -->
            <td>

                ${
                    escapeHtml(

                        o.bookTitle ||

                        (
                            o.items &&
                            o.items[0]

                                ? o.items[0].title

                                : ''
                        )

                        ||

                        '--'
                    )

                    // Giới hạn 30 ký tự
                    .substring(0, 30)
                }

            </td>



            <!-- TOTAL -->
            <td>

                ${
                    formatPrice(o.total)
                }

            </td>



            <!-- STATUS -->
            <td>

                <span
                    class="
                        badge

                        ${
                            o.status === 'pending'

                                ? 'badge-pending'

                                : o.status === 'shipped'

                                    ? 'badge-shipped'

                                    : 'badge-delivered'
                        }
                    "
                >

                    ${
                        o.status === 'pending'

                            ? 'Chờ'

                            : o.status === 'shipped'

                                ? 'Đang gửi file Ebook/PDF'

                                : 'Đã gửi file Ebook/PDF'
                    }

                </span>

            </td>

        </tr>

    `).join('');
}



// ============================================
// XUẤT FILE CSV ĐƠN HÀNG
// ============================================

// Hàm export orders ra file CSV
function exportOrdersCSV() {

    // ============================================
    // KIỂM TRA DỮ LIỆU
    // ============================================

    if (!allOrders.length) {

        showToast(
            'Không có dữ liệu',
            true
        );

        return;
    }



    // ============================================
    // HEADER CSV
    // ============================================

    const headers = [

        'Mã đơn',

        'Khách hàng',

        'Email',

        'SĐT',

        'Địa chỉ',

        'Sản phẩm',

        'Tổng tiền',

        'Trạng thái',

        'Ngày đặt'
    ];



    // ============================================
    // TẠO DỮ LIỆU ROWS
    // ============================================

    const rows = allOrders.map(o => [

        // Mã đơn
        o._id || o.id,



        // Khách hàng
        o.customer ||
        o.customerName ||
        '',



        // Email
        o.customerEmail ||
        o.email ||
        '',



        // Số điện thoại
        o.phone ||
        o.customerPhone ||
        '',



        // Địa chỉ
        o.address || '',



        // Tên sách
        o.bookTitle ||

        (
            o.items &&
            o.items[0]

                ? o.items[0].title

                : ''
        )

        ||

        '',



        // Tổng tiền
        o.total,



        // Trạng thái
        o.status === 'pending'

            ? 'Chờ'

            : o.status === 'shipped'

                ? 'Đang gửi file Ebook/PDF'

                : 'Đã gửi file Ebook/PDF',



        // Ngày đặt
        formatDateTime(
            o.date || o.createdAt
        )
    ]);



    // ============================================
    // CHUYỂN THÀNH CSV STRING
    // ============================================

    const csv = [

        // Header
        headers,



        // Data
        ...rows

    ]

    .map(r =>

        // Xử lý từng cột
        r.map(v =>

            // Escape dấu "
            `"${String(v || '')
                .replace(/"/g, '""')}"`
        )

        // Join bằng dấu ,
        .join(',')
    )

    // Join từng dòng
    .join('\n');



    // ============================================
    // TẠO FILE CSV
    // ============================================

    // \uFEFF:
    // thêm BOM để Excel đọc UTF-8 tiếng Việt
    const blob = new Blob(

        ['\uFEFF' + csv],

        {
            type: 'text/csv'
        }
    );



    // ============================================
    // TẠO LINK DOWNLOAD
    // ============================================

    const link =
        document.createElement('a');



    // Tạo URL tạm
    link.href =
        URL.createObjectURL(blob);



    // Tên file
    link.download = `

        orders_${
            new Date()
                .toISOString()
                .slice(0, 10)
        }.csv

    `;



    // ============================================
    // DOWNLOAD FILE
    // ============================================

    link.click();



    // ============================================
    // GIẢI PHÓNG MEMORY
    // ============================================

    URL.revokeObjectURL(
        link.href
    );



    // ============================================
    // THÔNG BÁO
    // ============================================

    showToast(
        'Xuất file thành công!'
    );
}



// ============================================
// TẠO NỘI DUNG EMAIL
// ============================================

// order:
// dữ liệu đơn hàng
//
// customerName:
// tên khách hàng
function generateEmailBody(
    order,
    customerName
) {

    // ============================================
    // LẤY DANH SÁCH SẢN PHẨM
    // ============================================

    const items =

        order.items &&
        order.items.length

            ? order.items

            // fallback nếu không có items
            : [{
                name:
                    order.bookTitle || '--',

                quantity: 1,

                price: order.total
            }];



    // ============================================
    // TẠO TEXT CHI TIẾT SẢN PHẨM
    // ============================================

    let itemsText = items.map(item => `

📖 ${item.name || item.title || '--'}

   • Số lượng:
   ${item.quantity || 1}

   • Giá:
   ${formatPrice(item.price)}

`).join('\n');



    // ============================================
    // TEXT TRẠNG THÁI
    // ============================================

    const statusText = {

        pending:
            'Chờ xử lý',



        shipped:
            'Đang gửi file Ebook/PDF',



        delivered:
            'Đã gửi file Ebook/PDF'

    }[order.status] || order.status;



    // ============================================
    // TRẢ VỀ EMAIL TEMPLATE
    // ============================================

    return `

========================================
📚 HTTVBOOKS - HÓA ĐƠN MUA HÀNG
========================================

━━━━━━━━━━━━━━━━━━━━━━
📦 ĐƠN HÀNG ĐÃ ĐƯỢC GỬI
━━━━━━━━━━━━━━━━━━━━━━

🧾 Mã đơn:
${order._id || order.id}

📅 Ngày đặt:
${formatDateTime(
    order.date || order.createdAt
)}

📦 Trạng thái:
${statusText}

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
━━━━━━━━━━━━━━━━━━━━━━

`;
}

// ============================================
// GỬI EMAIL CHO KHÁCH HÀNG
// ============================================

// Hàm mở Gmail để gửi email hóa đơn
function sendEmailToCustomer(orderId) {

    // ============================================
    // TÌM ĐƠN HÀNG
    // ============================================

    const order = allOrders.find(o =>

        o._id === orderId ||

        o.id === orderId
    );



    // ============================================
    // KHÔNG TÌM THẤY ORDER
    // ============================================

    if (!order) {

        showToast(
            'Không tìm thấy đơn hàng!',
            true
        );

        return;
    }



    // ============================================
    // LẤY EMAIL KHÁCH HÀNG
    // ============================================

    let customerEmail =

        order.customerEmail ||

        order.email;



    // ============================================
    // NẾU CHƯA CÓ EMAIL
    // ============================================

    if (!customerEmail) {

        // Hiện popup nhập email
        Swal.fire({

            // Tiêu đề
            title: 'Email khách hàng',



            // Kiểu input
            input: 'email',



            // Label input
            inputLabel:
                'Nhập email của khách hàng',



            // Hiện nút hủy
            showCancelButton: true,



            // Text nút confirm
            confirmButtonText: 'Mở Gmail'

        }).then(result => {

            // ====================================
            // NẾU CÓ EMAIL ĐƯỢC NHẬP
            // ====================================

            if (result.value) {

                // Gán email
                customerEmail =
                    result.value;



                // ================================
                // TÊN KHÁCH HÀNG
                // ================================

                const customerName =

                    order.customer ||

                    order.customerName ||

                    'Khách hàng';



                // ================================
                // NỘI DUNG EMAIL
                // ================================

                const emailBody =

                    generateEmailBody(
                        order,
                        customerName
                    );



                // ================================
                // SUBJECT EMAIL
                // ================================

                const subject = `

Hóa đơn đơn hàng #${
    order._id || order.id
} từ HTTVBOOKS

`;



                // ================================
                // TẠO URL GMAIL
                // ================================

                const gmailUrl = `

https://mail.google.com/mail/?view=cm&fs=1
&to=${encodeURIComponent(customerEmail)}
&su=${encodeURIComponent(subject)}
&body=${encodeURIComponent(emailBody)}

`;



                // ================================
                // MỞ GMAIL TAB MỚI
                // ================================

                window.open(
                    gmailUrl,
                    '_blank'
                );



                // ================================
                // THÔNG BÁO
                // ================================

                showToast(
                    'Đã mở Gmail để gửi email!'
                );
            }
        });
    }



    // ============================================
    // NẾU ĐÃ CÓ EMAIL
    // ============================================

    else {

        // ========================================
        // TÊN KHÁCH HÀNG
        // ========================================

        const customerName =

            order.customer ||

            order.customerName ||

            'Khách hàng';



        // ========================================
        // TẠO NỘI DUNG EMAIL
        // ========================================

        const emailBody =

            generateEmailBody(
                order,
                customerName
            );



        // ========================================
        // SUBJECT EMAIL
        // ========================================

        const subject = `

Hóa đơn đơn hàng #${
    order._id || order.id
} từ HTTVBOOKS

`;



        // ========================================
        // TẠO URL GMAIL
        // ========================================

        const gmailUrl = `

https://mail.google.com/mail/?view=cm&fs=1
&to=${encodeURIComponent(customerEmail)}
&su=${encodeURIComponent(subject)}
&body=${encodeURIComponent(emailBody)}

`;



        // ========================================
        // MỞ GMAIL
        // ========================================

        window.open(
            gmailUrl,
            '_blank'
        );



        // ========================================
        // THÔNG BÁO
        // ========================================

        showToast(
            'Đã mở Gmail để gửi email!'
        );
    }
}



// ============================================
// ĐỒNG BỘ REVIEW VỚI BOOK
// ============================================

// Hàm sửa reviewCount và avgRating
// theo review thật trong database
async function syncReviewsWithBooks() {

    // ============================================
    // HIỆN LOADING
    // ============================================

    Swal.fire({

        title: 'Đang đồng bộ...',

        text: 'Vui lòng chờ',



        // Không cho click ngoài
        allowOutsideClick: false,



        // Khi mở popup
        didOpen: () => {

            // Hiện loading spinner
            Swal.showLoading();
        }
    });



    // ============================================
    // BIẾN ĐẾM SÁCH ĐÃ SỬA
    // ============================================

    let fixedCount = 0;



    // ============================================
    // DUYỆT TỪNG BOOK
    // ============================================

    for (const book of allBooks) {

        // ========================================
        // GỌI API REVIEW
        // ========================================

        const res = await fetch(

            `${API_BASE}/reviews/book/${book._id}`,

            {
                headers: {

                    // bypass warning ngrok
                    'ngrok-skip-browser-warning':
                        '69420'
                }
            }
        );



        // ========================================
        // NẾU API THÀNH CÔNG
        // ========================================

        if (res.ok) {

            // Parse JSON
            const data = await res.json();



            // ====================================
            // LẤY REVIEW THẬT
            // ====================================

            const realReviews =

                data.reviews ||

                data.data ||

                [];



            // ====================================
            // TÍNH SỐ REVIEW
            // ====================================

            const realCount =
                realReviews.length;



            // ====================================
            // TÍNH AVG RATING
            // ====================================

            const realAvg =

                realCount > 0

                    ? realReviews.reduce(

                        // cộng rating
                        (s, r) =>
                            s + r.rating,

                        0

                    ) / realCount

                    : 0;



            // ====================================
            // KIỂM TRA DỮ LIỆU SAI
            // ====================================

            if (

                book.reviewCount !== realCount ||

                book.avgRating !== realAvg
            ) {

                // Log console
                console.log(

                    `🔧 Sửa:
                    ${book.title}
                    - reviewCount:
                    ${book.reviewCount}
                    → ${realCount}`
                );



                // ================================
                // CẬP NHẬT BOOK
                // ================================

                const updateRes = await fetch(

                    `${API_BASE}/books/${book._id}`,

                    {
                        // PUT update
                        method: 'PUT',



                        headers: {

                            // JSON
                            'Content-Type':
                                'application/json',



                            // bypass ngrok
                            'ngrok-skip-browser-warning':
                                '69420'
                        },



                        // body update
                        body: JSON.stringify({

                            // giữ dữ liệu cũ
                            ...book,



                            // update review
                            reviewCount:
                                realCount,

                            avgRating:
                                realAvg
                        })
                    }
                );



                // ================================
                // UPDATE OK
                // ================================

                if (updateRes.ok)

                    fixedCount++;
            }
        }
    }



    // ============================================
    // THÔNG BÁO HOÀN TẤT
    // ============================================

    Swal.fire({

        icon: 'success',

        title: 'Đồng bộ hoàn tất!',



        text: `

Đã sửa ${fixedCount} cuốn sách

`
    });



    // ============================================
    // LOAD LẠI BOOKS
    // ============================================

    loadBooks();
}



// ============================================
// THÊM NÚT ĐỒNG BỘ
// ============================================

// Hàm xử lý dashboard button
function addSyncButton() {

    // ============================================
    // LẤY HEADER DASHBOARD
    // ============================================

    const dashboardHeader =

        document.querySelector(

            '#dashboardTab .section-header'
        );



    // ============================================
    // TÌM BUTTON RỖNG
    // ============================================

    const emptyButton =

        dashboardHeader?.querySelector(

            'button[style="margin-left: auto;"]'
        );



    // ============================================
    // NẾU TỒN TẠI BUTTON
    // ============================================

    if (emptyButton) {

        // Xóa button
        emptyButton.remove();
    }
}



// ============================================
// CHẠY SAU 2 GIÂY
// ============================================

// setTimeout():
// chạy hàm sau thời gian delay
setTimeout(

    // Hàm cần chạy
    addSyncButton,



    // Delay 2000ms = 2 giây
    2000
);

        // ==================== REVIEWS ====================
// ============================================
// LOAD TẤT CẢ REVIEWS
// ============================================

// Hàm tải toàn bộ đánh giá từ server
async function loadAllReviews() {

    // ============================================
    // LOG BẮT ĐẦU LOAD
    // ============================================

    console.log(
        '🔄 Đang tải tất cả đánh giá...'
    );



    // ============================================
    // RESET DANH SÁCH REVIEW
    // ============================================

    allReviews = [];



    // ============================================
    // SET LƯU BOOK UNIQUE
    // ============================================

    // Set:
    // không cho trùng lặp
    const booksSet = new Set();



    // ============================================
    // DUYỆT TỪNG SÁCH
    // ============================================

    for (const book of allBooks) {

        try {

            // ====================================
            // GỌI API LẤY REVIEW
            // ====================================

            const res = await apiFetch(

                `${API_BASE}/reviews/book/${book._id}`
            );



            // ====================================
            // NẾU API OK
            // ====================================

            if (res.ok) {

                // Parse JSON
                const data =
                    await res.json();



                // =================================
                // XỬ LÝ NHIỀU KIỂU DATA
                // =================================

                let reviews = [];



                // TH1:
                // API trả array trực tiếp
                if (Array.isArray(data)) {

                    reviews = data;
                }



                // TH2:
                // data.reviews
                else if (

                    data.reviews &&

                    Array.isArray(data.reviews)
                ) {

                    reviews = data.reviews;
                }



                // TH3:
                // data.data
                else if (

                    data.data &&

                    Array.isArray(data.data)
                ) {

                    reviews = data.data;
                }



                // =================================
                // LOG SỐ REVIEW
                // =================================

                console.log(

                    `📖 ${book.title}:
                    ${reviews.length}
                    đánh giá`
                );



                // =================================
                // DUYỆT TỪNG REVIEW
                // =================================

                reviews.forEach(r => {

                    // Push review vào allReviews
                    allReviews.push({

                        // copy toàn bộ field review
                        ...r,



                        // thêm title sách
                        bookTitle:
                            book.title,



                        // thêm id sách
                        bookId:
                            book._id,



                        // =================================
                        // USER NAME
                        // =================================

                        // ưu tiên:
                        // userId.username
                        // userId.name
                        // userName
                        // user
                        // fallback "Ẩn danh"

                        userName:

                            r.userId?.username ||

                            r.userId?.name ||

                            r.userName ||

                            r.user ||

                            'Ẩn danh'
                    });



                    // thêm book id vào set
                    booksSet.add(book._id);
                });
            }

        } catch (err) {

            // ====================================
            // LỖI LOAD REVIEW
            // ====================================

            console.warn(

                `Lỗi lấy review cho
                ${book.title}:`,

                err
            );
        }
    }



    // ============================================
    // SẮP XẾP REVIEW MỚI NHẤT
    // ============================================

    allReviews.sort((a, b) =>

        // ngày mới trước
        new Date(b.createdAt) -

        new Date(a.createdAt)
    );



    // ============================================
    // THỐNG KÊ REVIEWS
    // ============================================

    // Tổng số review
    const totalReviews =
        allReviews.length;



    // ============================================
    // TÍNH AVG RATING
    // ============================================

    const avgRating =

        totalReviews > 0

            ? (

                // tính tổng rating
                allReviews.reduce(

                    (s, r) =>

                        s + (r.rating || 0),

                    0

                )

                // chia trung bình
                / totalReviews

            )

            // làm tròn 1 số thập phân
            .toFixed(1)

            : 0;



    // ============================================
    // ĐẾM REVIEW HÔM NAY
    // ============================================

    const todayCount = allReviews.filter(r => {

        // ngày review
        const d =
            new Date(r.createdAt);



        // ngày hiện tại
        const today =
            new Date();



        // so sánh cùng ngày
        return (

            d.toDateString() ===

            today.toDateString()
        );

    }).length;



    // ============================================
    // HELPER LẤY ELEMENT
    // ============================================

    const el = (id) =>

        document.getElementById(id);



    // ============================================
    // UPDATE THỐNG KÊ UI
    // ============================================

    // Tổng review
    if (el('reviewStatTotal'))

        el('reviewStatTotal').textContent =
            totalReviews;



    // Rating trung bình
    if (el('reviewStatAvg'))

        el('reviewStatAvg').textContent =
            avgRating;



    // Số sách có review
    if (el('reviewStatBooks'))

        el('reviewStatBooks').textContent =
            booksSet.size;



    // Review hôm nay
    if (el('reviewStatToday'))

        el('reviewStatToday').textContent =
            todayCount;



    // ============================================
    // LOG TỔNG KẾT
    // ============================================

    console.log(

        `📊 Tổng kết:
        ${totalReviews} đánh giá,
        ${booksSet.size} sách có đánh giá`
    );



    // ============================================
    // RENDER REVIEWS
    // ============================================

    renderReviews();
}



// ============================================
// RENDER REVIEWS
// ============================================

// Hàm hiển thị reviews ra bảng
function renderReviews() {

    // clone array reviews
    let filtered = [...allReviews];



    // ============================================
    // LẤY SEARCH VALUE
    // ============================================

    const search = (

        document.getElementById(
            'reviewSearch'
        )?.value || ''

    ).toLowerCase();



    // ============================================
    // FILTER RATING
    // ============================================

    const rating =

        document.getElementById(
            'reviewRatingFilter'
        )?.value || '';



    // ============================================
    // FILTER SEARCH
    // ============================================

    if (search) {

        filtered = filtered.filter(r =>

            // tìm theo tên sách
            (r.bookTitle || '')
                .toLowerCase()
                .includes(search)

            ||

            // tìm theo username
            (r.userName || '')
                .toLowerCase()
                .includes(search)
        );
    }



    // ============================================
    // FILTER RATING
    // ============================================

    if (rating) {

        filtered = filtered.filter(r =>

            r.rating ===
            parseInt(rating)
        );
    }



    // ============================================
    // TÍNH TOTAL PAGE
    // ============================================

    const totalPages =

        Math.ceil(

            filtered.length /

            ITEMS_PER_PAGE

        ) || 1;



    // ============================================
    // RESET PAGE NẾU VƯỢT
    // ============================================

    if (

        currentPage.reviews >

        totalPages
    ) {

        currentPage.reviews = 1;
    }



    // ============================================
    // CẮT DỮ LIỆU THEO PAGE
    // ============================================

    const paginated = filtered.slice(

        (currentPage.reviews - 1)
        * ITEMS_PER_PAGE,

        currentPage.reviews
        * ITEMS_PER_PAGE
    );



    // ============================================
    // LẤY TBODY
    // ============================================

    const tbody =

        document.getElementById(
            'reviewsList'
        );



    // Nếu không có tbody
    if (!tbody) return;



    // ============================================
    // KHÔNG CÓ REVIEW
    // ============================================

    if (!paginated.length) {

        tbody.innerHTML = `

<tr>
    <td
        colspan="6"
        style="
            text-align:center;
            padding:40px;
        "
    >
        ⭐ Không có đánh giá
    </td>
</tr>

`;

        return;
    }



    // ============================================
    // RENDER TABLE REVIEW
    // ============================================

    tbody.innerHTML = paginated.map(r => `

<tr>

    <!-- USER -->
    <td>

        ${
            escapeHtml(
                r.userName
            )
        }

    </td>



    <!-- BOOK -->
    <td>

        <strong>

            ${
                escapeHtml(
                    r.bookTitle
                )
            }

        </strong>

    </td>



    <!-- RATING -->
    <td>

        ${
            // sao vàng
            '★'.repeat(r.rating)
        }

        ${
            // sao xám
            '☆'.repeat(
                5 - r.rating
            )
        }

    </td>



    <!-- COMMENT -->
    <td>

        "

        ${
            escapeHtml(

                r.comment || ''

            )

            // giới hạn 100 ký tự
            .substring(0, 100)
        }

        "

    </td>



    <!-- DATE -->
    <td>

        ${
            formatDate(
                r.createdAt
            )
        }

    </td>



    <!-- ACTION -->
    <td class="action-buttons">

        <button

            class="
                action-btn
                action-delete
            "

            onclick="
                deleteReviewWithAuth(
                    '${r._id}'
                )
            "
        >

            <i class="
                fas
                fa-trash-alt
            "></i>

            Xóa

        </button>

    </td>

</tr>

`).join('');



    // ============================================
    // RENDER PAGINATION
    // ============================================

    renderPagination(

        'reviewsPagination',

        currentPage.reviews,

        totalPages,

        (page) => {

            // đổi page
            currentPage.reviews =
                page;

            // render lại
            renderReviews();
        }
    );
}
        

// ============================================
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
        setTimeout(() => { updateDashboardStats(); initCharts(); loadRecentOrders(); loadAllReviews(); }, 500);