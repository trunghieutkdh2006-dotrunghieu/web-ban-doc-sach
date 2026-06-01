// === admin-reviews.js ===
// Quản lý đánh giá: đồng bộ, load, render, xóa

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