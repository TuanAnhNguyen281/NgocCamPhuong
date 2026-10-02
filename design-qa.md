# Design QA — Điều chỉnh mật độ giao diện Ngọc Cẩm Phường

## Nguồn phản hồi trực quan

- Ảnh trang chủ trước điều chỉnh: `C:\Users\admin\AppData\Local\Temp\codex-clipboard-33cea254-4637-4e0a-b874-7db5cf8fbb75.png` — 1914 × 921 px.
- Ảnh khối sản phẩm trước điều chỉnh: `C:\Users\admin\AppData\Local\Temp\codex-clipboard-f197be70-da84-466f-8ad9-62fab253a3b1.png` — 1914 × 921 px.
- Mục tiêu: giảm cảm giác phóng đại trên desktop, giữ nguyên phong cách editorial, nội dung, màu sắc, ảnh và hành vi.

## Bằng chứng triển khai

- Trang chủ: `http://127.0.0.1:5173/#/`
- Danh sách sản phẩm: `http://127.0.0.1:5173/#/products`
- Dashboard quản lý: `http://127.0.0.1:5173/#/dashboard`
- Vòng 1 đã kiểm tra ở viewport 1265 × 710 CSS px.
- Vòng 2 đã đặt viewport trình duyệt đúng 1914 × 921 CSS px để đối chiếu trực tiếp với hai ảnh phản hồi 1914 × 921 px, mật độ 1x theo kích thước CSS mục tiêu.
- Ảnh triển khai trang chủ, sản phẩm và dashboard được chụp nội tuyến trong trình duyệt Codex; công cụ không cung cấp đường dẫn tệp ảnh chụp để lưu lại.

## Kết quả đối chiếu

### Trang chủ

- Header gọn hơn nhưng logo, điều hướng và giỏ hàng vẫn rõ ràng.
- Hero giảm chiều cao và cỡ tiêu đề; toàn bộ thông điệp chính hiển thị trong một viewport thông dụng.
- Toàn bộ storefront được giới hạn ở 1440px và căn giữa; trên viewport 1914px có khoảng thở hai bên thay vì kéo ảnh và chữ sát toàn chiều ngang.
- Ảnh hero vẫn giữ tỷ lệ, không bị kéo méo hoặc giảm chất lượng.

### Sản phẩm

- Ảnh thẻ sản phẩm giảm chiều cao; tên, mô tả, giá và thao tác xuất hiện sớm hơn trong cùng viewport.
- Lưới sản phẩm nằm trong khung 1440px; độ rộng thẻ không còn phình theo màn hình siêu rộng.
- Khoảng cách giữa tiêu đề bộ sưu tập, lưới và nội dung thẻ đã cân lại.
- Trang danh sách sản phẩm giữ đủ bộ lọc, nhãn mét vải cố định và thao tác mua hàng.

### Dashboard

- Sidebar, topbar, KPI và bảng nội dung được thu gọn đồng bộ.
- Dashboard được giới hạn ở 1480px, sidebar 210px và vùng nội dung chính tối đa 1220px.
- Bốn KPI cùng hai khối vận hành chính hiển thị trọn vẹn ở cả viewport 1265 × 710 và 1914 × 921.
- Cỡ chữ và nút vẫn đủ dễ đọc, không tạo vùng bấm quá nhỏ.

## Các bề mặt đã kiểm tra

- [x] Typography Playfair Display/Inter và thứ bậc tiêu đề.
- [x] Khoảng cách, chiều cao section, kích thước ảnh và nhịp lưới.
- [x] Màu giấy, than và xanh nhấn không thay đổi.
- [x] Nội dung, route và thao tác không thay đổi.
- [x] Responsive mobile giữ vùng chạm phù hợp; chỉ giảm chiều cao hero và ảnh.
- [x] Frontend production build thành công.
- [x] Trang chủ, danh sách sản phẩm và dashboard quản lý được kiểm tra trực quan.

## Lịch sử sửa lỗi

1. Trạng thái đầu: hero và ảnh sản phẩm chiếm gần toàn bộ chiều cao màn hình; người dùng phải cuộn nhiều mới thấy nội dung và thao tác.
2. Sau điều chỉnh: giảm khoảng 15–20% các kích thước desktop trọng yếu bằng giá trị CSS cụ thể, không dùng `zoom` hoặc `transform: scale`.
3. Phản hồi vòng 2: giao diện vẫn bị kéo phình theo chiều ngang ở màn hình 1914px — xếp loại P2 vì làm sai mật độ mong muốn.
4. Khắc phục vòng 2: giới hạn storefront 1440px, dashboard 1480px, nội dung dashboard 1220px; thu sidebar còn 210px.
5. Bằng chứng sau sửa: kiểm tra lại trang chủ, danh sách sản phẩm và dashboard ở đúng 1914 × 921; bố cục được căn giữa, không còn kéo giãn, không có lỗi console mức warning/error.
6. Kiểm tra cuối: không còn lỗi mức P0, P1 hoặc P2 liên quan đến mật độ hoặc chiều ngang giao diện.

final result: passed
