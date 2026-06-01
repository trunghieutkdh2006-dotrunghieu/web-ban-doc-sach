// === admin-config.js ===
// Config, biến toàn cục, hàm fetch chung

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