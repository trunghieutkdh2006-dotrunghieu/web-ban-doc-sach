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
