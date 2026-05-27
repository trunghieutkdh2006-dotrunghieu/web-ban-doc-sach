// ==================== CORS FIX - SỬ DỤNG PROXY ====================
// Nếu dùng CORS-Anywhere (cần vào https://cors-anywhere.herokuapp.com/corsdemo để kích hoạt)
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

// BACKEND URL GỐC (ngrok hoặc localhost)
const BACKEND_URL = 'https://passenger-grapple-dynamic.ngrok-free.dev';

// BASE URL với proxy (dùng cho fetch)
const BASE_URL = CORS_PROXY + BACKEND_URL;

// API endpoints
const API          = `${BASE_URL}/api/books`;
const CATEGORY_API = `${BASE_URL}/api/categories`;
const AUTH_API     = `${BASE_URL}/api/auth`;
const API_BASE_URL = `${BASE_URL}/api`;

// Backend URL gốc không proxy (dùng cho ảnh, file)
const RAW_BACKEND_URL = BACKEND_URL;

// Ảnh placeholder khi không có ảnh thật
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E`;

// Helper để lấy URL ảnh đúng (không qua proxy)
function getRawImageUrl(path) {
    if (!path) return PLACEHOLDER_SVG;
    if (path.startsWith('http')) return path;
    if (path.startsWith('/uploads/')) return RAW_BACKEND_URL + path;
    return RAW_BACKEND_URL + '/uploads/' + path;
}