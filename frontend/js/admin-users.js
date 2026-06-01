// === admin-users.js ===
// Quản lý users: load, render, thêm/sửa/xóa

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