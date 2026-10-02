## 000. Cân chỉnh mật độ toàn bộ giao diện storefront và admin theo yêu cầu mới

### Mục tiêu

- Giảm cảm giác giao diện bị phóng đại trên các màn hình Trang chủ, Câu chuyện, Sản phẩm, Chi tiết sản phẩm, Liên hệ, Đăng nhập/Đăng ký, Tài khoản, Giỏ hàng và toàn bộ dashboard.
- Ưu tiên chỉnh trực tiếp typography, khoảng cách, chiều cao section/card và kích thước ảnh; không dùng `zoom` hoặc `transform: scale` cho toàn trang.
- Giữ nguyên route, dữ liệu API, thao tác giỏ hàng, carousel hero, quyền dashboard và các breakpoint responsive hiện có.

### Phạm vi dự kiến

1. Chuẩn hóa lại các kích thước dùng chung trong `frontend/src/styles.css` để heading, body text, header/footer, card và khoảng cách dọc nhỏ hơn nhưng vẫn dễ đọc.
2. Thu gọn riêng trang Câu chuyện: hero, ảnh editorial, ba cột nội dung và CTA; tránh ảnh/heading chiếm gần toàn viewport.
3. Đồng bộ lại các trang storefront còn lại: danh sách sản phẩm, chi tiết sản phẩm, liên hệ, auth, tài khoản, đơn hàng và drawer.
4. Cân chỉnh dashboard: topbar, sidebar, KPI, card, bảng và drawer; giữ vùng thao tác/nút đủ lớn và không làm mất nội dung ở mobile.
5. Kiểm tra ba nhóm kích thước: desktop rộng, tablet khoảng 820px và mobile khoảng 560px; rà overflow ngang/dọc và trạng thái loading/error/empty.

### Tiêu chí nghiệm thu

- Các màn hình có mật độ vừa phải, không còn cảm giác heading/ảnh/card bị quá to trên desktop.
- Trang Câu chuyện và các trang chính không tạo overflow ngang; nội dung vẫn đọc được và thao tác được trên mobile.
- Không thay đổi nghiệp vụ, API, route hoặc dữ liệu hiển thị.
- `tsc --noEmit` đạt; chạy build/visual QA khi môi trường Vite cho phép ghi thư mục tạm.

### Điểm cần review trước khi triển khai

- Xác nhận phạm vi áp dụng toàn bộ storefront + dashboard như trên.
- Xác nhận mức thu gọn mặc định khoảng 10–20% trên desktop, còn mobile chỉ thu gọn nhẹ để không làm nhỏ vùng chạm.

### Trạng thái sau khi được xác nhận

- Đã triển khai giảm mật độ cho header, hero, trang sản phẩm, chi tiết sản phẩm, Câu chuyện, Liên hệ, auth, tài khoản, giỏ hàng, footer và dashboard.
- Đã giữ nguyên route, API, nghiệp vụ và các điều khiển hiện có.
- `tsc --noEmit` đạt. `vite build` chưa hoàn tất do môi trường chặn ghi file tạm trong `frontend/node_modules/.vite-temp`.

## 001. Bổ sung upload ảnh sản phẩm lên Cloudinary

### Mục tiêu

- Cho phép quản lý/admin chọn file ảnh ngay trong form tạo/sửa sản phẩm.
- Upload file qua backend lên Cloudinary, sau đó lưu `secure_url` vào trường `products.image_url` hiện có.
- Giữ URL ảnh hiện tại và ảnh mặc định khi sản phẩm chưa có ảnh; không đưa Cloudinary secret lên frontend.

### Phạm vi triển khai

1. Backend thêm cấu hình Cloudinary từ biến môi trường: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, tùy chọn `CLOUDINARY_FOLDER`.
2. Backend thêm endpoint được bảo vệ bởi role `manager/admin`, nhận `multipart/form-data`, giới hạn file ảnh hợp lệ và dung lượng, upload bằng memory stream lên Cloudinary rồi trả về `secure_url`.
3. Frontend thêm client upload dùng token hiện tại, trạng thái đang upload/lỗi, preview ảnh đã chọn và tự điền URL trả về vào payload sản phẩm.
4. Form sản phẩm vẫn hiển thị preview và giữ trường URL thủ công làm phương án tương thích với dữ liệu cũ; nếu chọn file mới thì URL Cloudinary được ưu tiên.
5. Cập nhật `.env.example`/README với tên biến cấu hình, không ghi giá trị secret thật vào repository.

### Tiêu chí nghiệm thu

- Manager/admin upload được JPG, PNG hoặc WebP trong form sản phẩm; file không hợp lệ bị báo lỗi rõ ràng.
- Upload thất bại không làm mất dữ liệu các trường đang nhập và không cho submit nhầm khi file còn đang upload.
- Sản phẩm tạo/sửa lưu đúng URL Cloudinary và storefront hiển thị ảnh đó qua `productImage`.
- Customer không gọi được endpoint upload; API không log hoặc trả secret Cloudinary.
- Backend/frontend type-check và build; kiểm tra tối thiểu upload thành công, lỗi định dạng, lỗi thiếu cấu hình và cập nhật sản phẩm.

### Điểm cần review trước khi triển khai

- Cần tài khoản Cloudinary và bốn biến môi trường nêu trên ở backend; không cần thêm credential ở frontend.
- Mặc định giới hạn ảnh 5 MB và lưu trong folder `ngoc-cam-phuong/products`; có thể đổi trước khi triển khai nếu cần.

### Trạng thái triển khai

- Đã thêm dependency `cloudinary`, `multer` và `@types/multer` cho backend.
- Đã thêm endpoint upload có kiểm tra role, loại file và giới hạn 5 MB.
- Đã tích hợp chọn file, preview, trạng thái upload và lưu URL Cloudinary vào form sản phẩm.
- Đã cập nhật `.env.example` và README.
- Backend/frontend `tsc --noEmit` đạt; build đầy đủ còn bị giới hạn quyền ghi thư mục output/tạm của môi trường.

# Kế hoạch triển khai Ngọc Cẩm Phường

## 000. Tinh chỉnh mật độ giao diện theo phản hồi ngày 18/09/2026

### Bổ sung vòng 2 — thu gọn chiều ngang

- Giới hạn storefront trong khung tối đa `1440px` và dashboard trong khung tối đa `1480px` để giao diện không bị kéo giãn trên màn hình lớn.
- Thu sidebar quản lý còn `210px`, giới hạn vùng nội dung dashboard `1220px` và căn giữa.
- Giữ nguyên bố cục responsive dưới `820px`, dữ liệu, route và toàn bộ thao tác.

- Giảm đồng bộ khoảng 15–20% kích thước header, heading, hero, ảnh sản phẩm và khoảng cách dọc trên desktop.
- Không dùng `zoom` hoặc `transform: scale`; điều chỉnh trực tiếp typography, spacing và chiều cao để responsive ổn định.
- Thu gọn trang danh sách, chi tiết, tài khoản và dashboard nhưng giữ vùng bấm đủ lớn, nội dung body dễ đọc.
- Mobile chỉ giảm nhẹ heading/chiều cao ảnh, không thu nhỏ form và nút quá mức.
- Build lại frontend và kiểm tra trực quan cùng trạng thái/viewport của hai ảnh phản hồi.

## 00. Đợt mở rộng giao diện sản phẩm và dashboard CRUD

Phần này được bổ sung trước khi triển khai theo yêu cầu ngày 17/09/2026.

### Mục tiêu

- Tách các mục trên header thành route/màn hình độc lập: Trang chủ, Sản phẩm, Câu chuyện, Liên hệ.
- Bổ sung trang danh sách sản phẩm có tìm kiếm, lọc danh mục, sắp xếp và trạng thái kết quả.
- Bổ sung trang chi tiết sản phẩm có ảnh, thông tin mét cố định, tồn kho, số lượng, tổng mét và thao tác thêm giỏ.
- Chuyển routing thủ công sang React Router với `HashRouter` để chạy ổn định trên localhost và không cần cấu hình rewrite server.
- Thiết kế lại khu quản lý thành dashboard hiện đại, tách route Tổng quan, Sản phẩm, Đơn hàng và Người dùng.
- Hoàn thiện CRUD sản phẩm gồm tạo, xem, sửa và xóa mềm; sản phẩm đã xóa không mất dữ liệu lịch sử đơn hàng.

### Cấu trúc frontend dự kiến

```text
frontend/src/
├─ components/        # header, layout, product card, cart, dialog
├─ pages/             # các màn hình storefront và tài khoản
├─ pages/admin/       # dashboard, sản phẩm, đơn hàng, người dùng
├─ app-context.tsx    # phiên đăng nhập, sản phẩm công khai, giỏ hàng
├─ admin-context.tsx  # dữ liệu và thao tác khu quản lý
├─ api.ts
└─ App.tsx            # khai báo route
```

### API bổ sung

- `GET /api/products/:id`: đọc chi tiết một sản phẩm đang public.
- `DELETE /api/manager/products/:id`: xóa mềm sản phẩm cho manager/admin.

### Tiêu chí nghiệm thu

- Mỗi liên kết chính trên header mở một route riêng và trạng thái active đúng.
- Danh sách sản phẩm tìm kiếm/lọc/sắp xếp được; card mở đúng trang chi tiết.
- Chi tiết sản phẩm tính đúng `fixed_meters × quantity`, không cho chọn quá tồn kho.
- Dashboard có sidebar, KPI, bảng gần đây và cảnh báo tồn thấp; responsive trên màn hình nhỏ.
- CRUD sản phẩm dùng form rõ ràng, thông báo lỗi/thành công và hộp xác nhận trước khi xóa.
- Các route quản lý được bảo vệ theo role; màn Người dùng chỉ dành cho admin.
- Backend và frontend build thành công; các route/API mới được kiểm tra trên localhost.

## 0. Bổ sung theo yêu cầu mới — xác thực, tài khoản quản lý và đồng nhất giao diện

Phần dưới đây là kế hoạch cho đợt thay đổi tiếp theo, được lập trước khi sửa mã nguồn để review phạm vi.

### Phạm vi đề xuất

1. **Đăng nhập Google cho khách hàng**
   - Tích hợp Google Identity Services ở frontend Vite thông qua biến môi trường `VITE_GOOGLE_CLIENT_ID`.
   - Gửi Google ID token về backend để kiểm tra audience/issuer/email và tạo hoặc liên kết tài khoản khách hàng.
   - Nếu chưa cấu hình Client ID, màn hình vẫn hiển thị trạng thái “Google chưa được cấu hình cho localhost”, không làm hỏng đăng nhập email/mật khẩu.
   - Không tự gán tài khoản Google vào vai trò quản lý hoặc quản trị viên; các vai trò nhạy cảm chỉ được cấp từ dữ liệu quản trị/seed.

2. **Tài khoản quản lý dùng thử trên localhost**
   - Bổ sung bảng `users` nếu chưa tồn tại, có `password_hash`, `role`, `status`, `google_subject`, thời điểm đăng nhập cuối.
   - Seed tài khoản:
     - Email: `quanly@ngoccamphuong.local`
     - Mật khẩu test: `NgocCam@123`
     - Vai trò: `manager`
   - Mật khẩu chỉ lưu dạng hash; tài khoản test được đánh dấu rõ trong README và có thể đổi sau khi đăng nhập.
   - Bổ sung tài khoản quản trị viên:
     - Email: `admin@ngoccamphuong.local`
     - Mật khẩu test: `NgocAdmin@123`
     - Vai trò: `admin`
   - Tài khoản admin có toàn quyền trong khu vực quản trị, nhưng chỉ được tạo bởi seed local hoặc tài khoản admin hiện hữu; đăng nhập Google không tự nâng quyền.

3. **Đồng nhất các màn hình**
   - Tách frontend thành các màn hình/route: storefront khách hàng, đăng nhập/đăng ký, tài khoản khách hàng, đơn hàng của tôi, khu vực quản lý.
   - Dùng chung design tokens hiện tại: nền giấy, chữ than chì, đường kẻ mảnh, Playfair Display + Inter và xanh mực tiết chế.
   - Khu vực quản lý dùng cùng hệ thống typography/spacing nhưng có bố cục dashboard rõ hơn: thanh điều hướng, KPI đơn giản, bảng sản phẩm và bảng đơn hàng.
   - Không dùng màu hoặc hiệu ứng lệch khỏi hướng Material Journal; không dùng shadow/gradient.

### Kiến trúc xác thực

```text
Google GIS / Email-password
          │
          ▼
POST /api/auth/google | /api/auth/login | /api/auth/register
          │
          ├─ kiểm tra tài khoản + vai trò
          └─ trả JWT access token + hồ sơ người dùng
```

- Middleware backend đọc `Authorization: Bearer <token>` và kiểm tra vai trò.
- `GET /api/auth/me` dùng để khôi phục phiên khi tải lại trang.
- Token chỉ lưu ở frontend trong `sessionStorage` cho bản localhost; khi triển khai thật sẽ chuyển sang cookie `httpOnly`, refresh token và HTTPS.
- Dữ liệu Google chỉ lưu `google_subject`, email và tên hiển thị tối thiểu; không lưu access token Google.

### API dự kiến bổ sung

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `PATCH /api/auth/me`
- `GET /api/customer/orders`
- `GET /api/manager/products`
- `POST/PATCH /api/manager/products`
- `GET /api/manager/orders`
- `PATCH /api/manager/orders/{id}/status`

### Tiêu chí nghiệm thu đợt này

- Khách hàng đăng ký và đăng nhập email/mật khẩu được; sai thông tin trả thông báo rõ ràng.
- Khi có `VITE_GOOGLE_CLIENT_ID` hợp lệ, đăng nhập Google tạo/liên kết đúng tài khoản customer; không thể tự trở thành manager/admin.
- Tài khoản manager test đăng nhập thành công bằng thông tin seed, thấy đúng màn hình quản lý.
- Tài khoản admin test đăng nhập thành công bằng thông tin seed, thấy đúng màn hình quản trị toàn hệ thống.
- Route quản lý bị chặn nếu chưa đăng nhập hoặc sai vai trò.
- Tải lại trình duyệt vẫn khôi phục phiên hợp lệ; đăng xuất xóa phiên và quay về storefront.
- Sản phẩm/đơn hàng vẫn dùng dữ liệu API hiện tại, không phá vỡ cố định mét và số lượng.
- Các màn hình mới có cùng tokens, typography, thin dividers và blue accent; không phát sinh lỗi console.
- `npm run build` backend và frontend đều thành công; test API auth và kiểm tra UI localhost hoàn tất.

### Điểm cần xác nhận sau review

- Google OAuth cần Client ID do chủ dự án tạo trong Google Cloud Console; kế hoạch chỉ thêm biến môi trường, không tự tạo credential thay người dùng.
- Tài khoản test chỉ dùng localhost. Trước khi đưa lên mạng cần đổi mật khẩu, tắt seed test và chuyển token sang cookie bảo mật.

## 1. Phạm vi đã chốt

Xây dựng hệ thống web bán vải quy mô nhỏ chạy trước trên máy local. Tên kỹ thuật của dự án là `ngoc-cam-phuong`.

Phạm vi phiên bản đầu:

- Frontend: Vite + React + TypeScript, không dùng Next.js và không xây app mobile.
- Backend: Node.js + Express + TypeScript + `pg`.
- Cơ sở dữ liệu: PostgreSQL chạy tại `localhost:5432`.
- Chỉ có ba vai trò: khách hàng, quản lý cửa hàng và quản trị viên.
- Khách hàng chỉ chọn số lượng gói/đơn vị hàng; không nhập mét tùy ý.
- Mỗi sản phẩm có `fixed_meters` cố định. Tổng mét của dòng hàng bằng `fixed_meters * quantity`.
- Không có nghiệp vụ nhà cung cấp trong phiên bản này.

## 2. Mục tiêu nghiệp vụ

Hệ thống giải quyết các nhu cầu cơ bản của một cửa hàng vải nhỏ:

1. Khách hàng xem sản phẩm đang bán, đăng ký/đăng nhập, chọn số lượng và đặt hàng.
2. Quản lý cửa hàng cập nhật thông tin hàng hóa, tồn kho và xử lý đơn hàng.
3. Quản trị viên quản lý toàn bộ tài khoản, sản phẩm, đơn hàng, tồn kho, cấu hình và nhật ký thao tác.
4. Hệ thống ghi nhận rõ số lượng đơn vị, số mét cố định, giá và tổng tiền tại thời điểm đặt hàng.
5. Tồn kho không bị âm khi có nhiều người đặt cùng lúc.

## 3. Kiến trúc tổng thể

```text
Trình duyệt
   │
   └── Frontend Vite React :5173
          │ REST/JSON + JWT
          ▼
       Backend Node.js/Express :8000
          │ pg + SQL transaction
          ▼
       PostgreSQL localhost:5432
```

Frontend không truy cập trực tiếp PostgreSQL. Mọi nghiệp vụ tạo/sửa/xóa, kiểm tra quyền và trừ tồn kho phải đi qua backend.

## 4. Cấu trúc thư mục

```text
ngoc-cam-phuong/
├─ backend/
│  ├─ src/
│  │  ├─ server.ts         # Express app và route
│  │  ├─ db.ts             # pg Pool, schema khởi tạo
│  │  ├─ config.ts         # biến môi trường
│  │  ├─ types.ts          # kiểu dữ liệu API
│  │  └─ seed.ts           # dữ liệu mẫu
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ migrations/          # bổ sung khi schema ổn định
├─ frontend/
│  ├─ src/
│  │  ├─ api.ts            # client gọi backend
│  │  ├─ pages/             # các màn hình theo route
│  │  ├─ components/        # thành phần dùng lại
│  │  ├─ layouts/           # layout storefront/admin
│  │  └─ styles.css
│  ├─ .env.example
│  ├─ package.json
│  └─ vite.config.ts
├─ implement_plan.md
└─ README.md
```

## 5. Vai trò và quyền

### 5.1. Khách hàng

- Đăng ký bằng họ tên, email/số điện thoại và mật khẩu.
- Đăng nhập, đăng xuất, xem và cập nhật thông tin cá nhân.
- Xem các sản phẩm có trạng thái `published` và chưa bị xóa.
- Chọn số lượng đơn vị của từng sản phẩm; hệ thống tự hiển thị số mét tương ứng.
- Tạo đơn hàng, xem chi tiết đơn của chính mình và theo dõi trạng thái.
- Hủy đơn khi đơn còn ở trạng thái cho phép hủy.
- Gửi yêu cầu hoàn trả/hủy sau bán theo chính sách cửa hàng.

Không được xem dữ liệu khách hàng khác, giá nhập, tồn kho nội bộ chi tiết, nhật ký quản trị hay API quản trị.

### 5.2. Quản lý cửa hàng

- Xem dashboard bán hàng, sản phẩm, tồn kho và đơn hàng.
- Thêm sản phẩm mới.
- Sửa tên, mô tả, danh mục, ảnh, giá bán, số mét cố định, đơn vị bán và tồn kho.
- Ẩn/hiện sản phẩm; không xóa cứng sản phẩm đã phát sinh đơn.
- Xác nhận, chuẩn bị, giao, hoàn tất hoặc từ chối đơn theo quy trình.
- Ghi nhận điều chỉnh tồn kho có lý do.
- Xem báo cáo đơn hàng cơ bản và lịch sử thao tác liên quan cửa hàng.

Không được quản lý tài khoản quản trị hoặc thay đổi cấu hình hệ thống nhạy cảm.

### 5.3. Quản trị viên

- Toàn quyền với người dùng, vai trò, sản phẩm, đơn hàng, tồn kho, hoàn trả và nhật ký.
- Khóa/mở khóa tài khoản, đặt lại mật khẩu theo quy trình an toàn.
- Gán hoặc thu hồi vai trò quản lý.
- Sửa dữ liệu nghiệp vụ trong trường hợp ngoại lệ; mọi sửa trực tiếp phải có lý do và audit log.
- Xem báo cáo tổng hợp, cấu hình cửa hàng và các sự kiện bảo mật.

## 6. Mô hình dữ liệu chính

### `users`

`id`, `email`, `phone`, `password_hash`, `full_name`, `role`, `status`, `created_at`, `updated_at`, `last_login_at`.

`role` chỉ nhận `customer`, `manager`, `admin`. Mật khẩu không lưu dạng rõ.

### `products`

`id`, `sku`, `name`, `description`, `category`, `image_url`, `fixed_meters`, `unit_label`, `price`, `stock_quantity`, `status`, `is_deleted`, `created_at`, `updated_at`.

Ràng buộc:

- `fixed_meters > 0`, `price >= 0`, `stock_quantity >= 0`.
- `sku` duy nhất.
- `status` gồm `draft`, `published`, `hidden`, `archived`.
- Sản phẩm đã có đơn không xóa cứng; chỉ chuyển `archived` hoặc đánh dấu xóa mềm.

### `orders`

`id`, `order_code`, `customer_id`, thông tin nhận hàng snapshot, `status`, `payment_method`, `payment_status`, `subtotal`, `shipping_fee`, `discount_amount`, `total_amount`, `total_meters`, `cancel_reason`, `created_at`, `updated_at`.

### `order_items`

`id`, `order_id`, `product_id`, `product_name_snapshot`, `sku_snapshot`, `fixed_meters_snapshot`, `unit_price_snapshot`, `quantity`, `total_meters`, `line_total`.

Snapshot giúp đơn cũ không đổi khi sản phẩm, giá hoặc mét cố định bị sửa về sau.

### `inventory_transactions`

`id`, `product_id`, `type`, `quantity_delta`, `before_quantity`, `after_quantity`, `reference_type`, `reference_id`, `reason`, `created_by`, `created_at`.

Dùng cho nhập kho ban đầu, bán hàng, hủy đơn, hoàn trả và kiểm kê.

### `audit_logs`

`id`, `actor_id`, `action`, `entity_type`, `entity_id`, `before_json`, `after_json`, `reason`, `created_at`.

## 7. Trạng thái nghiệp vụ

### Sản phẩm

`draft → published → hidden → archived`.

- `draft`: chưa hiển thị cho khách.
- `published`: được bán.
- `hidden`: tạm ẩn nhưng còn dữ liệu.
- `archived`: ngừng kinh doanh, không xóa dữ liệu lịch sử.

### Đơn hàng

`pending → confirmed → preparing → shipping → completed`.

Nhánh ngoại lệ:

- `pending → cancelled`.
- `confirmed/preparing → cancelled` khi quản lý chấp nhận hủy.
- `shipping/completed → return_requested → returned/refund_pending → refunded`.
- `pending → payment_failed` nếu thanh toán trực tuyến thất bại.

Mỗi chuyển trạng thái phải kiểm tra trạng thái hiện tại, vai trò, điều kiện tồn kho/thanh toán và ghi audit log.

## 8. Quy tắc tính tiền và mét vải

Với mỗi dòng hàng:

```text
total_meters = fixed_meters_snapshot * quantity
line_total    = unit_price_snapshot * quantity
```

```text
subtotal   = tổng line_total
total      = subtotal + shipping_fee - discount_amount
```

- `quantity` là số nguyên dương.
- Khách hàng không nhập `fixed_meters` trong request đặt hàng.
- Backend đọc `fixed_meters` và `price` hiện tại từ database rồi lưu snapshot vào đơn.
- Làm tròn tiền theo đơn vị đồng; không làm tròn mét ngoài độ chính xác của sản phẩm.
- Nếu tồn kho tính theo gói/đơn vị, `stock_quantity` giảm đúng bằng `quantity`, không giảm theo số mét.

## 9. Luồng khách hàng

1. Mở trang sản phẩm; frontend gọi `GET /api/products?status=published`.
2. Chọn số lượng; giao diện hiển thị tổng mét và tạm tính.
3. Đăng nhập hoặc đăng ký nếu chưa có phiên.
4. Nhập thông tin nhận hàng và phương thức thanh toán.
5. Backend kiểm tra sản phẩm, giá, trạng thái và tồn kho.
6. Backend khóa các dòng tồn kho cần thiết trong transaction, tính lại tiền, tạo `orders` và `order_items`, ghi biến động kho, rồi commit.
7. Khách nhận mã đơn và theo dõi trạng thái.

## 10. Luồng quản lý

1. Đăng nhập vào khu vực quản lý.
2. Xem các đơn mới ở `pending`.
3. Kiểm tra tồn và thông tin nhận hàng.
4. Xác nhận đơn; hệ thống ghi người xác nhận và thời gian.
5. Chuyển sang chuẩn bị, giao, hoàn tất theo thực tế.
6. Nếu thiếu hàng hoặc sai thông tin, từ chối/hủy với lý do bắt buộc.
7. Điều chỉnh sản phẩm/tồn kho qua form; mỗi thay đổi tạo inventory transaction và audit log.

## 11. Luồng quản trị viên

1. Đăng nhập bằng tài khoản admin.
2. Xem dashboard toàn hệ thống.
3. Quản lý người dùng và quyền.
4. Quản lý toàn bộ sản phẩm, đơn hàng và điều chỉnh tồn kho.
5. Xem nhật ký để truy vết thao tác nhạy cảm.
6. Xử lý ngoại lệ bằng form riêng, bắt buộc nhập lý do; không sửa âm thầm trực tiếp trong database.

## 12. API phiên bản đầu

### Công khai/khách hàng

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/{id}`
- `POST /api/orders`
- `GET /api/orders/me`
- `GET /api/orders/{id}`
- `POST /api/orders/{id}/cancel`

### Quản lý

- `POST /api/manager/products`
- `PATCH /api/manager/products/{id}`
- `POST /api/manager/products/{id}/publish`
- `POST /api/manager/products/{id}/stock-adjustments`
- `GET /api/manager/orders`
- `POST /api/manager/orders/{id}/confirm`
- `POST /api/manager/orders/{id}/status`

### Quản trị

- `GET/PATCH /api/admin/users`
- `GET/PATCH /api/admin/products`
- `GET/PATCH /api/admin/orders`
- `GET /api/admin/audit-logs`

## 13. An toàn dữ liệu và đồng thời

- Dùng JWT access token; role được kiểm tra ở middleware dùng chung.
- CORS chỉ cho phép origin frontend local đã cấu hình.
- Dùng parameter binding/ORM, không nối chuỗi SQL từ input.
- Khi tạo đơn, dùng transaction và khóa dòng sản phẩm (`SELECT ... FOR UPDATE`) trước khi trừ tồn.
- Không cho phép quantity âm, giá âm, tồn âm hoặc chuyển trạng thái ngược không hợp lệ.
- Dùng idempotency key cho nút đặt hàng khi bổ sung thanh toán online.
- Không log mật khẩu, token hoặc thông tin thanh toán nhạy cảm.
- Dữ liệu đơn hàng lịch sử chỉ được bất biến ở các trường snapshot.

## 14. Xử lý ngoại lệ

- Sản phẩm bị ẩn/ngừng bán: từ chối đặt mới và trả lỗi nghiệp vụ rõ ràng.
- Hết tồn: trả `409 Conflict`, không tạo đơn dở dang.
- Hai người mua đồng thời: transaction nào khóa trước được xử lý; transaction sau phải kiểm tra lại tồn.
- Giá thay đổi lúc thanh toán: backend dùng giá hiện tại, frontend phải hiển thị lại tóm tắt trước khi xác nhận.
- Hủy đơn sau khi đã trừ kho: tạo biến động kho dương để hoàn tồn một lần duy nhất.
- Hoàn trả: chỉ tăng tồn khi hàng thực sự được xác nhận nhập lại kho.
- Sửa sai tồn: không cập nhật số cuối cùng một cách âm thầm; phải tạo phiếu điều chỉnh có lý do.

## 15. Màn hình frontend

### Storefront khách hàng

- Trang sản phẩm.
- Chi tiết sản phẩm.
- Đăng ký, đăng nhập.
- Giỏ hàng/tóm tắt đặt hàng.
- Xác nhận đơn.
- Đơn hàng của tôi và chi tiết đơn.
- Hồ sơ cá nhân.

### Khu vực quản lý

- Dashboard.
- Quản lý sản phẩm.
- Form sản phẩm.
- Quản lý tồn kho.
- Danh sách và chi tiết đơn hàng.

### Khu vực quản trị

- Dashboard tổng hợp.
- Người dùng và vai trò.
- Sản phẩm, đơn hàng, tồn kho.
- Nhật ký thao tác.
- Cấu hình cửa hàng.

## 16. Tiến độ triển khai

### Giai đoạn 1 — nền tảng local

- Tạo cấu trúc `backend`/`frontend`.
- Tạo database `ngoc_cam_phuong` trên PostgreSQL local.
- Kết nối `pg` Pool và tạo bảng nền.
- Seed sản phẩm mẫu.
- Tạo API health, danh sách sản phẩm và tạo đơn có khóa tồn kho.
- Tạo storefront Vite React đọc dữ liệu thật từ API.

### Giai đoạn 2 — xác thực và mua hàng

- Đăng ký/đăng nhập JWT.
- Giỏ hàng phía frontend.
- Tạo đơn qua form nhận hàng.
- Trang lịch sử đơn và hủy đơn.

### Giai đoạn 3 — quản lý cửa hàng

- CRUD sản phẩm có phân quyền.
- Publish/ẩn sản phẩm.
- Quản lý tồn kho và lịch sử biến động.
- Quản lý trạng thái đơn.

### Giai đoạn 4 — quản trị và hoàn thiện

- Quản lý người dùng/vai trò.
- Audit log.
- Hoàn trả, kiểm kê và báo cáo cơ bản.
- Migration chính thức, backup/restore local và kiểm thử hồi quy.

## 17. Điều kiện nghiệm thu chính

1. `GET /api/health` trả trạng thái `ok`.
2. Frontend Vite chạy tại `http://localhost:5173` và hiển thị sản phẩm từ PostgreSQL.
3. Sản phẩm có mét cố định; khách chỉ thay đổi quantity.
4. Một đơn hợp lệ tính đúng tổng mét và tổng tiền.
5. Đặt vượt tồn bị từ chối, tồn không âm.
6. Đặt đồng thời không làm bán vượt tồn.
7. Đơn lưu snapshot tên/SKU/mét/giá tại thời điểm đặt.
8. Người dùng không thể gọi endpoint ngoài vai trò.
9. Quản lý không xóa cứng sản phẩm đã có lịch sử đơn.
10. Hủy/hoàn trả tạo biến động kho và audit log đúng một lần.
11. `npm run build` và kiểm thử backend chạy thành công.

## 18. Trạng thái hiện tại

Đã hoàn thành nền tảng giai đoạn 1 trong workspace:

- Backend Node.js/Express/TypeScript tại `backend/`.
- Frontend Vite React TypeScript tại `frontend/`.
- PostgreSQL database `ngoc_cam_phuong` trên `localhost:5432`.
- Seed hai sản phẩm mẫu.
- API health, danh sách sản phẩm và tạo đơn có kiểm tra tồn.
- Storefront đọc dữ liệu thật từ backend.

Các phần xác thực, giỏ hàng hoàn chỉnh, khu vực quản lý và khu vực quản trị sẽ triển khai tiếp theo các giai đoạn trên.
