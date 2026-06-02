async function loadBooks() {

    // try catch để bắt lỗi API
    try {

        // Gọi API lấy danh sách sách
        //
        // await:
        // đợi fetch hoàn thành mới chạy tiếp
        const res = await apiFetch(BOOKS_API);



        // Chuyển dữ liệu response sang JSON
        const data = await res.json();



        // ============================================
        // KIỂM TRA CẤU TRÚC DATA
        // ============================================

        // Trường hợp API trả về trực tiếp mảng
        //
        // Ví dụ:
        // [
        //   { book1 },
        //   { book2 }
        // ]
        if (Array.isArray(data))

            // Gán vào allBooks
            allBooks = data;



        // Trường hợp API trả về:
        //
        // {
        //   books: [...]
        // }
        else if (data.books && Array.isArray(data.books))

            // Lấy data.books
            allBooks = data.books;



        // Trường hợp API trả về:
        //
        // {
        //   data: [...]
        // }
        else if (data.data && Array.isArray(data.data))

            // Lấy data.data
            allBooks = data.data;



        // Nếu không đúng format
        // -> gán mảng rỗng
        else
            allBooks = [];



        // ============================================
        // RENDER DỮ LIỆU
        // ============================================

        // Hiển thị danh sách sách ra giao diện
        renderBooks();



        // Cập nhật thống kê dashboard
        //
        // Ví dụ:
        // số sách
        // tổng doanh thu
        // số user...
        updateDashboardStats();



        // ============================================
        // KIỂM TRA TAB CATEGORY
        // ============================================

        // document.getElementById('categoriesTab')
        // ?. = optional chaining
        //
        // Nếu tồn tại element mới lấy style.display
        //
        // Nếu tab categories đang hiển thị
        // -> render categories
        if (
            document.getElementById('categoriesTab')?.style.display !== 'none'
        ) {
            renderCategoriesGrid();
        }



        // ============================================
        // KIỂM TRA TAB REVIEW
        // ============================================

        // Nếu tồn tại reviewsTab
        // và tab đang hiển thị
        if (
            document.getElementById('reviewsTab') &&
            document.getElementById('reviewsTab').style.display !== 'none'
        ) {

            // Load toàn bộ review
            loadAllReviews();
        }

    } catch (err) {

        // ============================================
        // XỬ LÝ LỖI
        // ============================================

        // In lỗi ra console
        console.error('Lỗi loadBooks:', err);



        // Hiện thông báo lỗi
        showToast('Không thể tải danh sách sách', true);



        // Reset danh sách sách
        allBooks = [];



        // Render lại giao diện rỗng
        renderBooks();
    }
}

       // ============================================
// RENDER DANH SÁCH SÁCH
// ============================================

// Hàm hiển thị danh sách sách ra bảng HTML
function renderBooks() {

    // ============================================
    // COPY DANH SÁCH SÁCH
    // ============================================

    // Spread operator (...)
    // tạo bản sao mảng allBooks
    //
    // tránh sửa trực tiếp dữ liệu gốc
    let filtered = [...allBooks];



    // ============================================
    // LẤY GIÁ TRỊ SEARCH
    // ============================================

    // Lấy input tìm kiếm
    //
    // ?. = optional chaining
    // tránh lỗi nếu element không tồn tại
    //
    // || ''
    // nếu null -> dùng chuỗi rỗng
    //
    // toLowerCase()
    // chuyển về chữ thường để tìm kiếm dễ hơn
    const search = (
        document.getElementById('bookSearch')?.value || ''
    ).toLowerCase();



    // ============================================
    // LẤY CATEGORY FILTER
    // ============================================

    // Lấy category đang chọn
    const category =
        document.getElementById('bookCategoryFilter')?.value || '';



    // ============================================
    // FILTER THEO SEARCH
    // ============================================

    // Nếu có từ khóa tìm kiếm
    if (search)

        // filter() lọc mảng
        filtered = filtered.filter(b =>

            // Tìm trong title
            (b.title || '')
                .toLowerCase()
                .includes(search)

            ||

            // Hoặc tìm trong author
            (b.author || '')
                .toLowerCase()
                .includes(search)
        );



    // ============================================
    // FILTER THEO CATEGORY
    // ============================================

    // Nếu có category
    if (category)

        // Chỉ giữ sách cùng category
        filtered = filtered.filter(
            b => b.category === category
        );



    // ============================================
    // TÍNH TỔNG SỐ TRANG
    // ============================================

    // Math.ceil()
    // làm tròn lên
    //
    // Ví dụ:
    // 10 sách / 8 = 1.25
    // -> 2 trang
    const totalPages =
        Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;



    // Nếu trang hiện tại lớn hơn tổng trang
    // -> reset về trang 1
    if (currentPage.books > totalPages)
        currentPage.books = 1;



    // ============================================
    // PHÂN TRANG
    // ============================================

    // slice(start, end)
    //
    // start:
    // vị trí bắt đầu
    //
    // end:
    // vị trí kết thúc
    const paginated = filtered.slice(

        // start
        (currentPage.books - 1) * ITEMS_PER_PAGE,

        // end
        currentPage.books * ITEMS_PER_PAGE
    );



    // ============================================
    // LẤY TBODY
    // ============================================

    // booksList là tbody chứa dữ liệu
    const tbody = document.getElementById('booksList');



    // Nếu không tồn tại tbody
    // -> dừng hàm
    if (!tbody) return;



    // ============================================
    // KHÔNG CÓ DỮ LIỆU
    // ============================================

    // Nếu mảng rỗng
    if (!paginated.length) {

        // Hiển thị dòng thông báo
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;">
                    📚 Không có sách
                </td>
            </tr>
        `;

        return;
    }



    // ============================================
    // RENDER HTML DANH SÁCH SÁCH
    // ============================================

    // map() duyệt từng sách
    //
    // join('')
    // nối tất cả HTML thành chuỗi
    tbody.innerHTML = paginated.map(b => `

        <tr>

            <!-- ID sách -->
            <td>
                ${
                    // Nếu có _id
                    // -> lấy 6 ký tự cuối
                    b._id
                        ? b._id.slice(-6)
                        : 'N/A'
                }
            </td>



            <!-- Tên sách -->
            <td>
                <strong>
                    ${
                        // escapeHtml chống XSS
                        escapeHtml(b.title)
                    }
                </strong>
            </td>



            <!-- Tác giả -->
            <td>
                ${escapeHtml(b.author)}
            </td>



            <!-- Giá -->
            <td>
                ${
                    // formatPrice format tiền
                    formatPrice(b.price)
                }
            </td>



            <!-- Category -->
            <td>
                <span class="badge">

                    ${
                        // Nếu không có category
                        // -> hiện text mặc định
                        escapeHtml(b.category)
                        || 'Chưa phân loại'
                    }

                </span>
            </td>



            <!-- Nút thao tác -->
            <td class="action-buttons">

                <!-- Nút sửa -->
                <button
                    class="action-btn action-edit"
                    onclick="editBook('${b._id}')"
                >
                    <i class="fas fa-edit"></i>
                </button>



                <!-- Nút xóa -->
                <button
                    class="action-btn action-delete"
                    onclick="deleteBook('${b._id}')"
                    title="Xóa sách"
                >
                    <i class="fas fa-trash"></i>
                    <span style="margin-left:6px;">Xóa</span>
                </button>

            </td>

        </tr>

    `).join('');



    // ============================================
    // RENDER PAGINATION
    // ============================================

    renderPagination(

        // id container pagination
        'booksPagination',

        // trang hiện tại
        currentPage.books,

        // tổng số trang
        totalPages,

        // callback khi đổi trang
        (page) => {

            // cập nhật trang
            currentPage.books = page;

            // render lại dữ liệu
            renderBooks();
        }
    );
}

// ============================================
// RESET FORM THÊM/SỬA SÁCH
// ============================================

// Hàm đưa form về trạng thái mặc định
//
// Dùng khi:
// - Thêm sách mới
// - Đóng modal
// - Reset dữ liệu cũ
function resetBookForm() {

    // ============================================
    // RESET ID SÁCH
    // ============================================
    document.getElementById('bookId').value = '';

    // ============================================
    // RESET TÊN SÁCH
    // ============================================
    document.getElementById('bookTitle').value = '';

    // ============================================
    // RESET TÁC GIẢ
    // ============================================
    document.getElementById('bookAuthor').value = '';

    // ============================================
    // RESET GIÁ
    // ============================================
    document.getElementById('bookPrice').value = '';

    // ============================================
    // RESET CATEGORY
    // ============================================
    document.getElementById('bookCategorySelect').value = '';

    // ============================================
    // RESET MÔ TẢ
    // ============================================
    document.getElementById('bookDescription').value = '';

    // ============================================
    // XÓA ẢNH BÌA
    // ============================================
    clearCoverImage();

    // ============================================
    // RESET GALLERY
    // ============================================
    galleryBase64List = [];
    renderGalleryPreviews();

    // ============================================
    // RESET INPUT URL GALLERY
    // ============================================
    document.getElementById('bookGalleryUrls').value = '';

    // ============================================
    // XÓA FILE PDF ĐỌC THỬ
    // ============================================
    clearSamplePdf();

    // ============================================
    // XÓA FILE EBOOK CHÍNH
    // ============================================
    clearEbookPdf();

    // ============================================
    // RESET FILE ĐÃ CHỌN
    // ============================================
    window.selectedPdfFile = null;
    window.selectedEbookFile = null;

    // 👇👇👇 THÊM MỚI: Reset danh sách ảnh cần xóa 👇👇👇
    window.imagesToDelete = [];
}

// ============================================
// CHUYỂN FILE SANG BASE64
// ============================================

// Hàm chuyển file thành chuỗi Base64
//
// Dùng cho:
// - upload ảnh preview
// - lưu ảnh vào database
// - gửi file qua API
//
// file -> object File từ input[type=file]
function fileToBase64(file) {

    // Trả về Promise
    //
    // resolve -> thành công
    // reject  -> thất bại
    return new Promise((resolve, reject) => {

        // ============================================
        // TẠO FILE READER
        // ============================================

        // FileReader là API của browser
        // dùng để đọc file local
        const reader = new FileReader();



        // ============================================
        // ĐỌC FILE DƯỚI DẠNG BASE64
        // ============================================

        // readAsDataURL()
        //
        // Chuyển file thành:
        //
        // data:image/png;base64,iVBOR...
        //
        // hoặc
        //
        // data:application/pdf;base64,...
        reader.readAsDataURL(file);



        // ============================================
        // KHI ĐỌC FILE THÀNH CÔNG
        // ============================================

        reader.onload = () =>

            // resolve trả dữ liệu Base64
            resolve(reader.result);



        // ============================================
        // KHI CÓ LỖI
        // ============================================

        reader.onerror = error =>

            // reject trả lỗi
            reject(error);
    });
}
// ============================================
// LƯU SÁCH (THÊM / CẬP NHẬT)
// ============================================

async function saveBook() {

    // ============================================
    // LẤY DỮ LIỆU TỪ FORM
    // ============================================

    // ID sách
    //
    // Có ID  -> chế độ sửa
    // Không -> chế độ thêm mới
    const bookId =
        document.getElementById('bookId').value;



    // Tên sách
    const title =
        document.getElementById('bookTitle')
        .value
        .trim();



    // Tác giả
    const author =
        document.getElementById('bookAuthor')
        .value
        .trim();



    // Giá sách
    //
    // parseFloat:
    // chuyển string -> number
    const price = parseFloat(
        document.getElementById('bookPrice').value
    );



    // Danh mục
    const category =
        document.getElementById('bookCategorySelect').value;



    // Mô tả sách
    const description =
        document.getElementById('bookDescription').value;



    // ============================================
    // VALIDATE DỮ LIỆU
    // ============================================

    // Nếu thiếu title / author / price
    if (!title || !author || !price) {

        // Hiện thông báo lỗi
        showToast(
            'Vui lòng nhập đầy đủ thông tin!',
            true
        );



        // Dừng hàm
        return;
    }



    // ============================================
    // TẠO FORMDATA
    // ============================================

    // FormData dùng để:
    // - gửi file
    // - gửi ảnh
    // - gửi multipart/form-data
    const formData = new FormData();



    // ============================================
    // THÊM DỮ LIỆU TEXT
    // ============================================

    // append(key, value)

    formData.append('title', title);

    formData.append('author', author);

    formData.append('price', price);

    formData.append('category', category);

    formData.append('description', description);



    // ============================================
    // 👇👇👇 THÊM MỚI: DANH SÁCH ẢNH CẦN XÓA 👇👇👇
    // ============================================
    if (window.imagesToDelete && window.imagesToDelete.length > 0) {
        formData.append('imagesToDelete', JSON.stringify(window.imagesToDelete));
        console.log('📋 Ảnh cần xóa:', window.imagesToDelete);
    }



    // ============================================
    // LẤY INPUT ẢNH BÌA
    // ============================================

    const coverInput =
        document.getElementById('coverFileInput');



    // ============================================
    // UPLOAD ẢNH BÌA
    // ============================================

    // Kiểm tra:
    // - tồn tại input
    // - có file được chọn
    if (
        coverInput &&
        coverInput.files.length > 0
    ) {

        // files[0]
        // lấy file đầu tiên
        formData.append(
            'image',
            coverInput.files[0]
        );
    }



    // ============================================
    // UPLOAD ẢNH GALLERY
    // ============================================

    const oldImagesToKeep = galleryBase64List
        .filter(item => typeof item === 'object' && item.isOld === true)
        .map(item => item.oldUrl);  // URL gốc từ server

    // 2. Gửi danh sách ảnh cũ cần giữ (để backend không xóa chúng)
    // Luôn gửi existingImages khi là edit (bookId có giá trị)
    const bookIdValue = document.getElementById('bookId')?.value;
    if (bookIdValue) {
        // Khi edit: luôn gửi (kể cả rỗng) để backend biết chỉ giữ những ảnh này
        formData.append('existingImages', JSON.stringify(oldImagesToKeep));
    } else if (oldImagesToKeep.length > 0) {
        formData.append('existingImages', JSON.stringify(oldImagesToKeep));
    }

    // 3. Upload ảnh mới (có file)
    galleryBase64List.forEach(item => {
        // Chỉ upload ảnh mới có thuộc tính file
        if (item && item.file) {
            formData.append('images', item.file);
        }
    });




    // ============================================
    // UPLOAD PDF ĐỌC THỬ
    // ============================================

    // selectedPdfFile:
    // file PDF đọc thử đã chọn
    if (window.selectedPdfFile) {

        // samplePdf:
        // tên field backend yêu cầu
        formData.append(
            'samplePdf',
            window.selectedPdfFile
        );
    }



    // ============================================
    // GỌI API
    // ============================================

    try {

        // ========================================
        // XÁC ĐỊNH URL API
        // ========================================

        // Nếu có bookId
        // -> update sách
        //
        // Ví dụ:
        // /books/123
        //
        // Nếu không:
        // -> thêm mới
        // /books/add
        const url = bookId
    ? `${BOOKS_API}/${bookId}`
    : BOOKS_API; 



        // ========================================
        // XÁC ĐỊNH METHOD
        // ========================================

        // PUT  -> cập nhật
        // POST -> thêm mới
        const method = bookId
            ? 'PUT'
            : 'POST';



        // ========================================
        // GỬI REQUEST
        // ========================================
        const token = JSON.parse(localStorage.getItem('user') || '{}').token;

        const res = await fetch(url, {

            // method HTTP
            method,



            // body multipart/form-data
            body: formData,



            // custom headers
            headers: {

                // Header bỏ warning ngrok
                'ngrok-skip-browser-warning': 'true',
                'Authorization': `Bearer ${token}`
            }
        });



        // ========================================
        // THÀNH CÔNG
        // ========================================

        // res.ok:
        // true nếu status 200-299
        if (res.ok) {

            // Hiện toast
            showToast(

                // Nếu có ID -> cập nhật
                // ngược lại -> thêm mới
                bookId
                    ? 'Cập nhật thành công!'
                    : 'Thêm sách thành công!'
            );



            // 👇👇👇 THÊM MỚI: Reset danh sách ảnh cần xóa 👇👇👇
            window.imagesToDelete = [];



            // Reset form
            resetBookForm();



            // Load lại danh sách sách
            await loadBooks();



            // Reset file PDF
            window.selectedPdfFile = null;
        }



        // ========================================
        // THẤT BẠI
        // ========================================

        else {

            // Lấy text lỗi từ server
            const errorText =
                await res.text();



            // Hiện thông báo lỗi
            showToast(

                // status HTTP
                // substring cắt ngắn lỗi
                `Lưu thất bại! (${res.status}): ${errorText.substring(0, 100)}`,

                true
            );
        }

    } catch (err) {

        // ========================================
        // LỖI KẾT NỐI / SERVER
        // ========================================

        // In lỗi ra console
        console.error(
            'saveBook error:',
            err
        );



        // Hiện lỗi cho user
        showToast(
            'Lỗi kết nối: ' + err.message,
            true
        );
    }
}
        // ============================================
// XÓA SÁCH
// ============================================

// Hàm xóa sách theo ID
async function deleteBook(id) {

    // ============================================
    // HIỆN HỘP THOẠI XÁC NHẬN
    // ============================================

    // Swal.fire():
    // popup xác nhận bằng SweetAlert2
    const result = await Swal.fire({

        // Tiêu đề popup
        title: 'Xóa sách?',



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
    // KIỂM TRA NGƯỜI DÙNG XÁC NHẬN
    // ============================================

    // result.isConfirmed:
    // true nếu user bấm nút Xóa
    if (result.isConfirmed) {

        // ========================================
        // GỌI API XÓA
        // ========================================

        try {

            // Gửi request DELETE
            //
            // Ví dụ:
            // DELETE /books/123
            const res = await apiFetch(

                // URL API
                `${BOOKS_API}/${id}`,

                // method HTTP
                {
                    method: 'DELETE'
                }
            );



            // ====================================
            // XÓA THÀNH CÔNG
            // ====================================

            // res.ok:
            // true nếu status 200-299
            if (res.ok) {

                // Hiện thông báo thành công
                showToast('Đã xóa!');



                // Load lại danh sách sách
                //
                // cập nhật giao diện sau khi xóa
                loadBooks();
            }

        } catch (err) {

            // ====================================
            // LỖI KẾT NỐI
            // ====================================

            // Hiện thông báo lỗi
            showToast(
                'Lỗi kết nối',
                true
            );
        }
    }
}

// ============================================
// CHỈNH SỬA SÁCH
// ============================================

function editBook(id) {

    // TÌM SÁCH THEO ID
    const b = allBooks.find(b => b._id === id);
    if (!b) return;

    // TẠO BASE URL
    const BASE_URL = API_BASE.replace('/api', '');

    // HÀM CHUYỂN URL THÀNH URL TUYỆT ĐỐI
    function toAbsUrl(url) {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) {
            return url;
        }
        return BASE_URL + (url.startsWith('/') ? url : '/' + url);
    }

    // ĐỔ DỮ LIỆU TEXT VÀO FORM
    document.getElementById('bookId').value = b._id;
    document.getElementById('bookTitle').value = b.title || '';
    document.getElementById('bookAuthor').value = b.author || '';
    document.getElementById('bookPrice').value = b.price || 0;
    document.getElementById('bookCategorySelect').value = b.category || '';
    document.getElementById('bookDescription').value = b.description || '';

    // ============================================
    // XỬ LÝ ẢNH BÌA
    // ============================================
    const coverUrl = toAbsUrl(b.image || b.coverImage || '');
    if (coverUrl) {
        currentCoverBase64 = coverUrl;
        document.getElementById('coverPreviewContainer').innerHTML = `
            <div class="preview-item" data-is-old-cover="true">
                <img src="${coverUrl}" style="max-width:120px; max-height:160px; object-fit:cover; border-radius:6px;">
                <button type="button" class="remove-img" onclick="clearCoverImage()" style="background:#e53e3e; color:white;">✖</button>
                <span style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.6); color:white; font-size:10px; text-align:center;">Ảnh hiện tại</span>
            </div>
        `;
        document.getElementById('bookCoverUrl').value = coverUrl;
    } else {
        clearCoverImage();
    }

// ============================================
// XỬ LÝ ẢNH GALLERY - SỬA LỖI QUAN TRỌNG
// ============================================

// RESET mảng gallery trước khi load mới (QUAN TRỌNG)
galleryBase64List = [];

const gallery = b.galleryImages || b.images || [];

if (gallery.length) {
    // Chuyển đổi URL và lưu vào mảng với thông tin đầy đủ
    galleryBase64List = gallery.map((img, index) => ({
        url: toAbsUrl(img),
        isOld: true,           // Đánh dấu là ảnh cũ từ server
        oldUrl: img,           // Lưu URL gốc để xóa sau
        index: index
    }));
    
    // Render preview gallery
    renderGalleryPreviews();
} else {
    renderGalleryPreviews();
}

    // ============================================
    // HIỂN THỊ FILE PDF
    // ============================================
    if (b.samplePdf) {
        document.getElementById("samplePdfPreview").innerHTML = `
            <div class="pdf-preview" data-is-old-pdf="true">
                <i class="fas fa-file-pdf"></i>
                <div>
                    <div class="pdf-preview-name">Đã có file đọc thử</div>
                    <div style="font-size:12px; color:#64748b;">Click "Lưu sách" để giữ nguyên</div>
                </div>
                <button type="button" onclick="clearSamplePdf()" style="margin-left:auto; background:#e53e3e; border:none; color:white; cursor:pointer; padding:4px 8px; border-radius:4px;">
                    <i class="fas fa-times"></i> Xóa
                </button>
            </div>
        `;
    }

    if (b.pdfFile) {
        document.getElementById('pdfPreviewContainer').innerHTML = `
            <div class="pdf-preview" data-is-old-ebook="true">
                <i class="fas fa-file-pdf"></i>
                <div>
                    <div class="pdf-preview-name">Đã có file Ebook PDF</div>
                    <div style="font-size:12px; color:#64748b;">Click "Lưu sách" để giữ nguyên</div>
                </div>
                <button type="button" onclick="clearEbookPdf()" style="margin-left:auto; background:#e53e3e; border:none; color:white; cursor:pointer; padding:4px 8px; border-radius:4px;">
                    <i class="fas fa-times"></i> Xóa
                </button>
            </div>
        `;
    }

    // SCROLL LÊN ĐẦU TRANG
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// PREVIEW ẢNH BÌA
// ============================================

// Hàm xem trước ảnh bìa khi chọn file
//
// event:
// sự kiện onchange của input file
function previewCoverImage(event) {

    // ============================================
    // LẤY FILE ĐƯỢC CHỌN
    // ============================================

    // files[0]:
    // lấy file đầu tiên
    const file = event.target.files[0];



    // Nếu chưa chọn file
    // -> dừng hàm
    if (!file) return;



    // ============================================
    // TẠO FILE READER
    // ============================================

    // FileReader:
    // dùng để đọc file local từ máy user
    const reader = new FileReader();



    // ============================================
    // KHI ĐỌC FILE THÀNH CÔNG
    // ============================================

    reader.onload = (e) => {

        // ========================================
        // LƯU BASE64
        // ========================================

        // e.target.result:
        // dữ liệu ảnh dạng Base64
        //
        // Ví dụ:
        // data:image/png;base64,iVBOR...
        currentCoverBase64 =
            e.target.result;



        // ========================================
        // HIỂN THỊ PREVIEW ẢNH
        // ========================================

        document.getElementById(
            'coverPreviewContainer'
        ).innerHTML = `

            <div class="preview-item">

                <!-- Ảnh preview -->
                <img src="${currentCoverBase64}">



                <!-- Nút xóa ảnh -->
                <button
                    type="button"
                    class="remove-img"
                    onclick="clearCoverImage()"
                >
                    ✖
                </button>

            </div>
        `;



        // ========================================
        // GÁN VÀO INPUT URL
        // ========================================

        // Lưu base64 vào input hidden/text
        document.getElementById(
            'bookCoverUrl'
        ).value = currentCoverBase64;
    };



    // ============================================
    // ĐỌC FILE THÀNH BASE64
    // ============================================

    // readAsDataURL():
    // chuyển file -> Base64
    reader.readAsDataURL(file);
}

// ============================================
// XÓA ẢNH BÌA
// ============================================

// Hàm xóa ảnh bìa hiện tại
//
// Dùng khi:
// - user bấm nút ✖
// - reset form
// - đổi ảnh mới
function clearCoverImage() {

    // ============================================
    // RESET BASE64 ẢNH
    // ============================================

    // Xóa dữ liệu ảnh đang lưu
    currentCoverBase64 = '';



    // ============================================
    // XÓA PREVIEW ẢNH
    // ============================================

    // Làm rỗng container preview
    //
    // Ảnh preview sẽ biến mất khỏi giao diện
    document.getElementById(
        'coverPreviewContainer'
    ).innerHTML = '';



    // ============================================
    // RESET INPUT URL
    // ============================================

    // Xóa giá trị input chứa URL/base64 ảnh
    document.getElementById(
        'bookCoverUrl'
    ).value = '';
}

function previewGalleryImages(event) {
    Array.from(event.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Thêm ảnh mới với flag isOld = false
            galleryBase64List.push({
                url: e.target.result,
                file: file,
                isOld: false,    // Đánh dấu là ảnh mới
                fileSize: file.size,
                fileName: file.name
            });
            renderGalleryPreviews();
        };
        reader.readAsDataURL(file);
    });
}



function renderGalleryPreviews() {
    const container = document.getElementById('galleryPreviewContainer');
    if (!container) return;
    
    if (!galleryBase64List.length) {
        container.innerHTML = '<div style="color:#94a3b8; font-size:13px; padding:10px 0;">📷 Chưa có ảnh nào. Hãy thêm ảnh gallery bên dưới.</div>';
        return;
    }
    
    container.innerHTML = galleryBase64List.map((item, idx) => {
        let src = '';
        let isOldImage = false;
        let oldUrl = '';
        
        if (typeof item === 'string') {
            src = item;
            isOldImage = false;
        } else if (item.url) {
            src = item.url;
            isOldImage = item.isOld === true;
            oldUrl = item.oldUrl || '';
        }
        
        return `
            <div class="preview-item" data-is-old="${isOldImage}" data-old-url="${oldUrl}" data-gallery-idx="${idx}">
                <img src="${src}" style="width:80px; height:100px; object-fit:cover; border-radius:8px; border:2px solid ${isOldImage ? '#e53e3e' : '#10b981'};">
                <button type="button" class="remove-img" onclick="removeGalleryImage(${idx})" style="${isOldImage ? 'background:#e53e3e; color:white;' : 'background:#64748b; color:white;'}" title="${isOldImage ? 'Xóa ảnh khỏi server' : 'Xóa ảnh này'}">
                    ✖
                </button>
                ${isOldImage ? '<span style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.7); color:white; font-size:10px; text-align:center; padding:2px;">Đã lưu</span>' : '<span style="position:absolute; bottom:0; left:0; right:0; background:rgba(16,185,129,0.8); color:white; font-size:10px; text-align:center; padding:2px;">Mới</span>'}
            </div>
        `;
    }).join('');
}

async function removeGalleryImage(idx) {
    const item = galleryBase64List[idx];
    if (!item) return;
    
    const isOldImage = typeof item === 'object' && item.isOld === true;
    const oldImageUrl = typeof item === 'object' ? item.oldUrl : null;
    
    const result = await Swal.fire({
        title: 'Xóa ảnh?',
        text: isOldImage ? 'Ảnh sẽ bị xóa khi bạn lưu sách' : 'Xóa ảnh này khỏi danh sách',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    });
    
    if (!result.isConfirmed) return;
    
    // CHỈ XÓA LOCAL, KHÔNG GỌI API
    galleryBase64List.splice(idx, 1);
    renderGalleryPreviews();
    
    if (isOldImage && oldImageUrl) {
        if (!window.imagesToDelete) window.imagesToDelete = [];
        if (!window.imagesToDelete.includes(oldImageUrl)) {
            window.imagesToDelete.push(oldImageUrl);
        }
    } else {
        showToast('Đã xóa ảnh khỏi danh sách', 'success');
    }
}

function handleSamplePdf(event) {

    // ============================================
    // LẤY FILE ĐƯỢC CHỌN
    // ============================================

    const file = event.target.files[0];



    // Nếu chưa chọn file
    if (!file) return;



    // ============================================
    // KIỂM TRA ĐỊNH DẠNG FILE
    // ============================================

    // file.type:
    // MIME type của file
    //
    // application/pdf = file PDF
    if (file.type !== 'application/pdf') {

        // Hiện lỗi
        showToast(
            'Vui lòng chọn file PDF!',
            true
        );



        return;
    }



    // ============================================
    // KIỂM TRA KÍCH THƯỚC FILE
    // ============================================

    // file.size:
    // đơn vị byte
    //
    // 10 * 1024 * 1024
    // = 10MB
    if (file.size > 10 * 1024 * 1024) {

        // Hiện lỗi
        showToast(
            'File PDF quá lớn! Tối đa 10MB',
            true
        );



        return;
    }



    // ============================================
    // LƯU FILE PDF
    // ============================================

    // Lưu vào biến global
    window.selectedPdfFile = file;



    // ============================================
    // HIỂN THỊ PREVIEW PDF
    // ============================================

    document.getElementById(
        "samplePdfPreview"
    ).innerHTML = `

        <div class="pdf-preview">

            <!-- Icon PDF -->
            <i class="fas fa-file-pdf"></i>



            <div>

                <!-- Tên file -->
                <div class="pdf-preview-name">
                    ${file.name}
                </div>



                <!-- Kích thước file -->
                <div style="
                    font-size:12px;
                    color:#64748b;
                ">

                    ${
                        // Chuyển byte -> MB
                        (file.size / 1024 / 1024)
                        .toFixed(2)
                    }

                    MB

                </div>

            </div>



            <!-- Nút xóa -->
            <button
                type="button"
                onclick="clearSamplePdf()"
                style="
                    margin-left:auto;
                    background:none;
                    border:none;
                    color:#dc2626;
                    cursor:pointer;
                "
            >
                <i class="fas fa-times"></i>
            </button>

        </div>
    `;
}



// ============================================
// XÓA FILE PDF ĐỌC THỬ
// ============================================

// Hàm reset file sample PDF
function clearSamplePdf() {

    // ============================================
    // RESET FILE ĐÃ CHỌN
    // ============================================

    window.selectedPdfFile = null;



    // ============================================
    // XÓA PREVIEW PDF
    // ============================================

    document.getElementById(
        "samplePdfPreview"
    ).innerHTML = '';



    // ============================================
    // RESET INPUT FILE
    // ============================================

    // Xóa file khỏi input
    document.getElementById(
        "samplePdfInput"
    ).value = '';



    // ============================================
    // RESET INPUT URL PDF
    // ============================================

    document.getElementById(
        'bookSamplePdf'
    ).value = '';
}



// ============================================
// XÓA FILE EBOOK PDF
// ============================================

// Hàm reset file ebook PDF
function clearEbookPdf() {

    // ============================================
    // RESET FILE ĐÃ CHỌN
    // ============================================

    window.selectedEbookFile = null;



    // ============================================
    // LẤY CONTAINER PREVIEW
    // ============================================

    const pdfContainer =
        document.getElementById(
            'pdfPreviewContainer'
        );



    // ============================================
    // XÓA PREVIEW
    // ============================================

    // Nếu tồn tại container
    if (pdfContainer)

        // Làm rỗng HTML
        pdfContainer.innerHTML = '';



    // ============================================
    // RESET INPUT URL PDF
    // ============================================

    const bookPdfUrl =
        document.getElementById(
            'bookPdfUrl'
        );



    // Nếu tồn tại input
    if (bookPdfUrl)

        // Reset value
        bookPdfUrl.value = '';
}

        // ==================== CATEGORIES ====================
// ============================================
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



                <div class="category-card-actions">
                    <button
                        class="action-btn action-primary"
                        onclick="viewCategoryBooks('${String(c.name).replace(/'/g, "\\'")}');"
                    >
                        <i class="fas fa-eye"></i>
                        Xem sách
                    </button>
                    <button
                        class="action-btn action-delete"
                        onclick="deleteCategory('${c._id || c.id}')"
                    >
                        <i class="fas fa-trash-alt"></i>
                        Xóa
                    </button>
                </div>
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
// VIEW SÁCH TRONG CATEGORY
// ============================================
function viewCategoryBooks(categoryName) {
    const booksInCategory = (allBooks || []).filter(b => b.category === categoryName);
    const bookListHtml = booksInCategory.length
        ? `<ul style="text-align:left; padding-left:18px; margin:0;">${booksInCategory.map(b => `
                <li style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div>
                        <strong>${escapeHtml(b.title || 'Tên sách trống')}</strong>${b.author ? ` - ${escapeHtml(b.author)}` : ''}
                    </div>
                    <div>
                        <button class="swal2-styled" style="background:#dc2626;border:none;padding:6px 10px;border-radius:6px;color:#fff;cursor:pointer;" onclick="deleteBookFromCategory('${b._id || b.id}', '${String(categoryName).replace(/'/g, "\\'")}')">Xóa</button>
                    </div>
                </li>`).join('')}</ul>`
        : '<p>Không có sách nào thuộc danh mục này.</p>';

    Swal.fire({
        title: `Sách trong danh mục "${escapeHtml(categoryName)}"`,
        html: bookListHtml,
        width: '820px',
        confirmButtonText: 'Đóng',
    });
}


// Wrapper để xóa sách khi đang xem modal category
async function deleteBookFromCategory(id, categoryName) {
    try {
        await deleteBook(id);
        // Sau khi xóa, chờ một chút để loadBooks cập nhật rồi mở lại modal
        setTimeout(() => viewCategoryBooks(categoryName), 200);
    } catch (e) {
        console.warn('deleteBookFromCategory error', e);
    }
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
// USERS MANAGEMENT
// ============================================



// ============================================
// LOAD DANH SÁCH USERS
// ============================================

// Hàm lấy danh sách người dùng từ API
