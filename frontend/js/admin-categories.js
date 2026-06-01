// === admin-categories.js ===
// Quản lý danh mục: load, render, thêm/xóa

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