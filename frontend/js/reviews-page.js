(() => {
            const API_BASE = API_BASE_URL;
            let allReviews = [];
            let filteredReviews = [];
            let currentPage = 1;
            let booksList = [];
            let useMockData = true;
            const ITEMS_PER_PAGE = 5;

            let interactionsMap = new Map();
            let openCommentsState = new Map();

            // ==================== LẤY AVATAR NGƯỜI DÙNG ====================
            function getCurrentUser() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return null;
    return {
        id: user._id || user.id,
        username: user.username,
        email: user.email
    };
}
function applyFilters() {
    let data = [...allReviews];

    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
    if (search) {
        data = data.filter(r =>
            (r.bookTitle || "").toLowerCase().includes(search) ||
            (r.comment || "").toLowerCase().includes(search)
        );
    }

    const ratingFilter = document.getElementById("ratingFilter")?.value || "all";
    if (ratingFilter !== "all") {
        const minRating = parseInt(ratingFilter);
        data = data.filter(r => r.rating >= minRating);
    }

    const sort = document.getElementById("sortSelect")?.value || "newest";
    if (sort === "newest") {
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === "oldest") {
        data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === "rating-high") {
        data.sort((a, b) => b.rating - a.rating);
    }

    filteredReviews = data;
    currentPage = 1;
    displayReviews();
}

            function getAvatarForReview(userName, reviewUserId) {
    const currentUser = getCurrentUser();
    
    // Lấy userId từ review (có thể là object hoặc string)
    let reviewUserIdStr = null;
    if (reviewUserId) {
        if (typeof reviewUserId === 'object') {
            reviewUserIdStr = reviewUserId._id || reviewUserId.id;
        } else {
            reviewUserIdStr = reviewUserId;
        }
    }
    
    // So sánh với user hiện tại
    const isCurrentUser = currentUser && (
        currentUser.id === reviewUserIdStr ||
        currentUser.username === userName ||
        currentUser.email === userName
    );
    
    console.log('🔍 Kiểm tra avatar:', {
        userName,
        reviewUserIdStr,
        currentUserId: currentUser?.id,
        isCurrentUser
    });
    
    if (isCurrentUser && currentUser) {
        const avatar = getUserAvatar(currentUser.id, currentUser.username);
        console.log('✅ Avatar của chính user:', avatar);
        return `<img src="${avatar}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?background=1D3557&color=fff&size=42&length=1&name=U&bold=true'">`;
    }
    
    const initial = userName ? userName.charAt(0).toUpperCase() : 'U';
    return `<div style="width: 42px; height: 42px; border-radius: 50%; background: #1D3557; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">${initial}</div>`;
}

            function getInteractions(reviewId) {
                if (!interactionsMap.has(reviewId)) {
                    interactionsMap.set(reviewId, {
                        likes: Math.floor(Math.random() * 50) + 10,
                        likedByUser: false,
                        comments: [
                            {
                                id: Date.now() + 1,
                                userName: "Độc giả yêu sách",
                                text: "Cảm ơn bạn đã chia sẻ review hữu ích!",
                                createdAt: new Date()
                            }
                        ]
                    });
                }
                return interactionsMap.get(reviewId);
            }

            function saveInteractions() {
                const obj = {};
                for (let [k, v] of interactionsMap.entries()) {
                    obj[k] = v;
                }
                localStorage.setItem("review_interactions", JSON.stringify(obj));
            }

            function loadInteractions() {
                const raw = localStorage.getItem("review_interactions");
                if (raw) {
                    try {
                        const obj = JSON.parse(raw);
                        for (let [k, v] of Object.entries(obj)) {
                            interactionsMap.set(k, v);
                        }
                    } catch (e) { }
                }
            }

            function escapeHtml(text) {
                if (!text) return "";
                const div = document.createElement("div");
                div.textContent = text;
                return div.innerHTML;
            }

            function renderStars(rating) {
                let html = `<div class="stars">`;
                for (let i = 1; i <= 5; i++) {
                    if (rating >= i) html += `<i class="fas fa-star"></i>`;
                    else if (rating >= i - 0.5) html += `<i class="fas fa-star-half-alt"></i>`;
                    else html += `<i class="far fa-star"></i>`;
                }
                html += `</div>`;
                return html;
            }

            function formatDate(dateString) {
                const d = new Date(dateString);
                if (isNaN(d)) return "N/A";
                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            }

            async function loadBooks() {
                try {
                    const res = await fetch(`${API_BASE}/books`, {
                        headers: { "ngrok-skip-browser-warning": "69420" }
                    });
                    const data = await res.json();
                    booksList = Array.isArray(data) ? data : (data.books || data.data || []);
                    console.log(`📚 Đã tải ${booksList.length} sách từ API`);
                    return booksList;
                } catch (err) {
                    console.error("Lỗi load books:", err);
                    return [];
                }
            }

            async function loadRealReviews() {
                const container = document.getElementById("reviewsContainer");
                if (container) {
                    container.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>📖 Đang tải đánh giá từ API...</p></div>`;
                }

                await loadBooks();
                let realReviews = [];

                for (const book of booksList) {
                    try {
                        const res = await fetch(`${API_BASE}/reviews/book/${book._id}`, {
                            headers: { "ngrok-skip-browser-warning": "69420" }
                        });
                        if (res.ok) {
                            const data = await res.json();
                            const reviews = data.reviews || data.data || [];
                            if (reviews.length > 0) {
                                reviews.forEach(r => {
    console.log('📝 Review từ API:', r);
    console.log('📝 userId:', r.userId);
    console.log('📝 userId._id:', r.userId?._id);
});
                                realReviews.push(...reviews.map(r => ({
                                    id: r._id,
                                    rating: Number(r.rating || 0),
                                    comment: r.comment || "",
                                    createdAt: r.createdAt || new Date(),
                                    userName: (r.userId?.username || r.userId?.name || r.userName || r.userId || "Độc giả"),
                                    userId: r.userId?._id || r.userId,
                                    bookId: book._id,
                                    bookTitle: book.title,
                                    bookAuthor: book.author,
                                    bookImage: book.image
                                })));
                            }
                        }
                    } catch (err) {
                        console.error(`Error loading reviews for ${book.title}:`, err);
                    }
                }

                if (realReviews.length > 0) {
                    useMockData = false;
                    allReviews = realReviews;
                } else {
                    useMockData = false;
                    allReviews = [];
                }

                allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                updateStats();
                applyFilters();
            }

            function updateStats() {
                const totalSpan = document.getElementById("totalReviews");
                const avgSpan = document.getElementById("avgRating");
                const todaySpan = document.getElementById("todayReviews");

                if (totalSpan) totalSpan.innerText = allReviews.length;
                if (avgSpan) {
                    const avg = allReviews.length ?
                        (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1) : 0;
                    avgSpan.innerText = avg;
                }
                if (todaySpan) {
                    const today = new Date().toDateString();
                    const todayCount = allReviews.filter(r => {
                        const d = new Date(r.createdAt);
                        return d.toDateString() === today;
                    }).length;
                    todaySpan.innerText = todayCount;
                }
            }

            function applyFilters() {
                let data = [...allReviews];

                const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
                if (search) {
                    data = data.filter(r =>
                        (r.bookTitle || "").toLowerCase().includes(search) ||
                        (r.comment || "").toLowerCase().includes(search)
                    );
                }

                const ratingFilter = document.getElementById("ratingFilter")?.value || "all";
                if (ratingFilter !== "all") {
                    const minRating = parseInt(ratingFilter);
                    data = data.filter(r => r.rating >= minRating);
                }

                const sort = document.getElementById("sortSelect")?.value || "newest";
                if (sort === "newest") {
                    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                } else if (sort === "oldest") {
                    data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                } else if (sort === "rating-high") {
                    data.sort((a, b) => b.rating - a.rating);
                }

                filteredReviews = data;
                currentPage = 1;
                displayReviews();
            }

            function displayReviews() {
                const container = document.getElementById("reviewsContainer");
                if (!container) return;

                const start = (currentPage - 1) * ITEMS_PER_PAGE;
                const pageData = filteredReviews.slice(start, start + ITEMS_PER_PAGE);

                if (!pageData.length) {
                    container.innerHTML = `
                        <div class="empty">
                            <i class="fas fa-comment-slash"></i>
                            <p>📭 Không có review nào phù hợp</p>
                        </div>
                    `;
                    const paginationDiv = document.getElementById("pagination");
                    if (paginationDiv) paginationDiv.innerHTML = "";
                    return;
                }

                container.innerHTML = pageData.map(r => {
                    const displayName = r.userName || "Độc giả";
                    const avatarHtml = getAvatarForReview(displayName, r.userId);
                    
                    const imgUrl = r.bookImage ?
                        (r.bookImage.startsWith("http") ? r.bookImage : `${API_BASE}/${r.bookImage.replace(/^\/+/, "")}`) :
                        `https://ui-avatars.com/api/?background=1D3557&color=fff&bold=true&size=120&name=${encodeURIComponent(r.bookTitle || "Book")}`;

                    const inter = getInteractions(r.id);
                    const isLiked = inter.likedByUser;
                    const likeCount = inter.likes;
                    const commentCount = inter.comments.length;
                    const isCommentOpen = openCommentsState.get(r.id) || false;

                    const commentsHtml = inter.comments.map(c => `
                        <div style="padding:8px 0; border-bottom:1px solid #eee;">
                            <strong>${escapeHtml(c.userName)}</strong>: ${escapeHtml(c.text)}
                            <small style="color:#999; display:block; font-size:10px;">${formatDate(c.createdAt)}</small>
                        </div>
                    `).join("");

                    return `
                        <div class="review-card" data-review-id="${r.id}">
                            <div class="post-header">
                                <div class="post-avatar">
                                    ${avatarHtml}
                                </div>
                                <div>
                                    <div class="post-username">${escapeHtml(displayName)}</div>
                                    <div class="post-date"><i class="far fa-calendar-alt"></i> ${formatDate(r.createdAt)}</div>
                                </div>
                            </div>
                            <div class="book-preview">
                                <img src="${imgUrl}" alt="${escapeHtml(r.bookTitle)}" 
                                     onerror="this.src='https://ui-avatars.com/api/?background=1D3557&color=fff&bold=true&size=120&name=Book'">
                                <div>
                                    <div class="book-title">📖 ${escapeHtml(r.bookTitle)}</div>
                                    <div class="book-author"><i class="fas fa-user-pen"></i> ${escapeHtml(r.bookAuthor)}</div>
                                </div>
                            </div>
                            <div class="post-rating">
                                ${renderStars(r.rating)}
                                <span class="rating-badge">${r.rating.toFixed(1)}/5.0</span>
                            </div>
                            <div class="post-content">
                                <i class="fas fa-quote-left" style="margin-right:8px;opacity:0.5;"></i>
                                ${escapeHtml(r.comment)}
                            </div>
                            
                            <div class="social-actions">
                                <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="window.toggleLike('${r.id}')">
                                    <i class="${isLiked ? 'fas fa-heart' : 'far fa-heart'}"></i> <span>${likeCount}</span> Thích
                                </button>
                                <button class="comment-toggle" onclick="window.toggleComments('${r.id}')">
                                    <i class="far fa-comment"></i> <span>${commentCount}</span> Bình luận
                                </button>
                            </div>
                            
                            <div class="comments-section ${isCommentOpen ? 'open' : ''}" id="comments-${r.id}">
                                <div id="comment-list-${r.id}">
                                    ${commentsHtml}
                                </div>
                                <div class="comment-input-area">
                                    <input type="text" id="comment-input-${r.id}" placeholder="Viết bình luận..." maxlength="300">
                                    <button onclick="window.addComment('${r.id}')"><i class="fas fa-paper-plane"></i> Gửi</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join("");

                renderPagination();
            }

            function renderPagination() {
                const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
                const pagination = document.getElementById("pagination");
                if (!pagination) return;

                if (totalPages <= 1) {
                    pagination.innerHTML = "";
                    return;
                }

                pagination.innerHTML = `
                    <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}>◀</button>
                    <button style="background:#1D3557; color:white;">${currentPage}/${totalPages}</button>
                    <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}>▶</button>
                `;
            }

            window.changePage = (page) => {
                const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
                if (page < 1 || page > totalPages) return;
                currentPage = page;
                displayReviews();
                window.scrollTo({ top: 0, behavior: "smooth" });
            };

            window.toggleLike = (reviewId) => {
                const inter = getInteractions(reviewId);
                inter.likedByUser = !inter.likedByUser;
                inter.likes += inter.likedByUser ? 1 : -1;
                saveInteractions();
                displayReviews();
            };

            window.toggleComments = (reviewId) => {
                const current = openCommentsState.get(reviewId) || false;
                openCommentsState.set(reviewId, !current);
                displayReviews();
            };

            window.addComment = (reviewId) => {
                const input = document.getElementById(`comment-input-${reviewId}`);
                const text = input?.value.trim();
                if (!text) return;

                const inter = getInteractions(reviewId);
                inter.comments.unshift({
                    id: Date.now(),
                    userName: "Độc giả",
                    text: text,
                    createdAt: new Date()
                });
                saveInteractions();
                input.value = "";
                displayReviews();
            };

            window.loadRealData = () => {
                loadRealReviews();
            };

            document.getElementById("refreshBtn")?.addEventListener("click", () => {
                loadRealReviews();
            });
            document.getElementById("searchInput")?.addEventListener("input", applyFilters);
            document.getElementById("sortSelect")?.addEventListener("change", applyFilters);
            document.getElementById("ratingFilter")?.addEventListener("change", applyFilters);

            loadInteractions();
            loadRealReviews();
        })();