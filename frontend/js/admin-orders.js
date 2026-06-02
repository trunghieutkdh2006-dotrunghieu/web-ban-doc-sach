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

        // Lưu snapshot adminOrders và hiển thị orders
        try { localStorage.setItem('adminOrders', JSON.stringify(allOrders)); } catch (e) { /* ignore */ }
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
            ,

            // Đã hủy
            'Đã hủy': '#fee2e2'
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

                        <!-- Cancelled -->
                        <option
                            value="Đã hủy"

                            ${
                                o.status === 'Đã hủy'

                                    ? 'selected'

                                    : ''
                            }
                        >

                            ❌ Đã hủy

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
    // ĐƠN HÀNG ĐÃ HỦY
    // ============================================

    if (el('orderCancelled'))

        el('orderCancelled').textContent =

            allOrders.filter(
                o => o.status === 'Đã hủy'
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

            if (idx !== -1) {
                allOrders[idx].status = newStatus;
                try { localStorage.setItem('adminOrders', JSON.stringify(allOrders)); } catch (e) { /* ignore */ }
            }



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

            try { labels['Đã hủy'] = labels['Đã hủy'] || 'Đã hủy'; } catch (e) { /* ignore */ }

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
