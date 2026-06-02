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
