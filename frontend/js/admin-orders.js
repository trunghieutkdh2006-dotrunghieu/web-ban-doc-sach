// === admin-orders.js ===
// Quản lý đơn hàng: load, render, trạng thái, chi tiết, CSV, email

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


