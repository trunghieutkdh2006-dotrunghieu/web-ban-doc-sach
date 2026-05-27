const BASE_URL = 'http://localhost:5001';

// API endpoints
const API          = `${BASE_URL}/api/books`;
const CATEGORY_API = `${BASE_URL}/api/categories`;
const AUTH_API     = `${BASE_URL}/api/auth`;
const API_BASE_URL = `${BASE_URL}/api`;

// Ảnh placeholder khi không có ảnh thật
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect width='200' height='280' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E`;