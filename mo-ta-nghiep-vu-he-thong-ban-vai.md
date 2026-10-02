# Mô tả nghiệp vụ chi tiết — Hệ thống bán vải quy mô nhỏ

## 1. Tổng quan

Hệ thống phục vụ một cửa hàng bán vải quy mô nhỏ, chủ yếu bán vải cắt theo mét. Hệ thống giúp Nhà cung cấp cập nhật nguồn hàng; Quản lý lựa chọn, nhập kho, tùy chỉnh và công khai sản phẩm; Khách hàng mua và theo dõi đơn; Quản trị viên duy trì tài khoản và hệ thống.

Luồng tổng quát:

Nhà cung cấp cập nhật sản phẩm nguồn → Quản lý nhập sản phẩm về kho → Quản lý tùy chỉnh và công khai → Khách hàng đặt mua → Quản lý xử lý đơn → Hệ thống cập nhật tồn, tiền và trạng thái.

### 1.1. Mục tiêu

- Bán hàng cơ bản, dễ vận hành cho một cửa hàng.
- Quản lý đúng số mét của từng cây/cuộn vải.
- Không để Nhà cung cấp tự thay đổi nội dung hoặc giá bán của cửa hàng.
- Không bán vượt tồn và luôn truy được nguồn gốc giao dịch.
- Theo dõi đơn, thanh toán, hoàn trả và báo cáo cơ bản.

### 1.2. Ngoài phạm vi

- Đa chi nhánh và luân chuyển nhiều kho.
- Kế toán doanh nghiệp, công nợ phức tạp.
- Nhiều cấp nhân viên hoặc phê duyệt nhiều tầng.
- Điểm thưởng, khuyến mại và vận chuyển chuyên sâu.

## 2. Mô hình dữ liệu

### 2.1. Sản phẩm nguồn

Do Nhà cung cấp quản lý, gồm mã nguồn, tên vải, chất liệu, màu, họa tiết, khổ, ảnh, giá cung cấp tham khảo và khả năng cung ứng. Sản phẩm này không tự động hiển thị cho Khách hàng.

### 2.2. Sản phẩm cửa hàng

Do Quản lý tạo mới hoặc lấy từ sản phẩm nguồn. Quản lý được tùy chỉnh tên bán, mô tả, ảnh, phân loại, giá và trạng thái công khai mà không sửa dữ liệu nguồn.

Khi Nhà cung cấp thay đổi sản phẩm nguồn, hệ thống chỉ thông báo. Quản lý tự chọn có áp dụng thay đổi hay không; dữ liệu cửa hàng không bị ghi đè.

### 2.3. Cây/cuộn vải

Mỗi cây/cuộn là một lô tồn riêng, gồm:

- Mã lô duy nhất.
- Sản phẩm cửa hàng liên kết.
- Nhà cung cấp và phiếu nhận.
- Ngày nhập, số mét ban đầu và số mét còn lại.
- Giá vốn trên mét.
- Tình trạng: đang bán, tạm khóa, lỗi hoặc đã hết.

Một sản phẩm có thể có nhiều cây. Tổng tồn sản phẩm là tổng mét khả dụng của các cây được phép bán.

### 2.4. Đơn hàng

Mỗi dòng đơn lưu sản phẩm, số mét, đơn giá tại thời điểm đặt, giảm giá/phí và cây thực tế được xuất. Dữ liệu lịch sử không thay đổi khi sản phẩm sau đó đổi tên hoặc đổi giá.

## 3. Vai trò người dùng

### 3.1. Khách hàng

Mục tiêu: tìm vải, đặt đúng số mét, thanh toán và theo dõi đơn.

Được phép:

- Đăng ký, đăng nhập và sửa hồ sơ của mình.
- Xem, tìm kiếm và lọc sản phẩm đang công khai.
- Xem giá, ảnh, mô tả và tồn khả dụng được phép công bố.
- Thêm/sửa/xóa sản phẩm trong giỏ.
- Tạo đơn, thanh toán, xem trạng thái và lịch sử đơn của mình.
- Gửi yêu cầu hủy, trả hàng hoặc hoàn tiền.

Không được phép:

- Xem giá vốn, mã lô nội bộ hoặc dữ liệu của người khác.
- Sửa sản phẩm, giá, tồn và trạng thái xử lý đơn.
- Tự chấp nhận hoàn tiền hoặc tự cộng tồn.

Trình tự sử dụng:

1. Tìm và xem sản phẩm.
2. Chọn số mét, thêm vào giỏ.
3. Nhập thông tin nhận hàng và phương thức thanh toán.
4. Kiểm tra lại giá, phí và số mét.
5. Xác nhận đặt hàng.
6. Theo dõi đơn.
7. Xác nhận nhận hàng hoặc gửi yêu cầu hỗ trợ.

### 3.2. Quản lý cửa hàng

Mục tiêu: trực tiếp điều hành sản phẩm, nhập hàng, kho, bán hàng, đơn, thanh toán và báo cáo.

Được phép:

- Xem sản phẩm nguồn của Nhà cung cấp và lấy về danh mục cửa hàng.
- Tạo, thêm, sửa, ẩn hoặc ngừng kinh doanh sản phẩm cửa hàng.
- Tùy chỉnh tên, ảnh, mô tả, phân loại và giá bán.
- Xác nhận công khai sản phẩm cho Khách hàng.
- Gửi đơn nhập, xác nhận hàng thực nhận và tạo từng cây/cuộn.
- Kiểm kê, khóa lô lỗi và điều chỉnh tồn có lý do.
- Xem, xác nhận, chuẩn bị, giao, hoàn tất hoặc hủy đơn.
- Chọn cây để cắt, ghi nhận thanh toán, xử lý trả hàng/hoàn tiền.
- Xem giá vốn, doanh thu, lợi nhuận và báo cáo cơ bản.

Công việc hằng ngày:

1. Kiểm tra đơn mới, thanh toán và cảnh báo tồn.
2. Xác nhận đơn đủ hàng; liên hệ Khách nếu cần thay đổi.
3. Chọn cây, đo/cắt và cập nhật trạng thái đơn.
4. Ghi nhận giao hàng, thanh toán và hoàn tất.
5. Nhận hàng từ Nhà cung cấp và tạo lô.
6. Cập nhật nội dung, giá và trạng thái sản phẩm.
7. Đối chiếu đơn, tiền và tồn.

Giới hạn:

- Không xóa cứng đơn, thanh toán, lô hoặc phiếu nhập đã xác nhận.
- Không sửa trực tiếp số tồn; phải tạo giao dịch điều chỉnh.
- Không sửa dữ liệu nguồn của Nhà cung cấp.
- Phải nhập lý do khi điều chỉnh tồn, hủy sau xác nhận hoặc hoàn tiền.

### 3.3. Nhà cung cấp

Mục tiêu: duy trì nguồn hàng, xác nhận khả năng cung ứng và xử lý đơn nhập của cửa hàng.

Được phép:

- Tạo, sửa và ngừng cung cấp sản phẩm nguồn của mình.
- Cập nhật đặc tính, ảnh, giá tham khảo và khả năng cung ứng.
- Nhận đơn nhập; xác nhận đủ, một phần hoặc từ chối có lý do.
- Cập nhật trạng thái chuẩn bị và đã giao.
- Xem lịch sử đơn nhập liên quan đến mình.
- Nhận phản hồi hàng thiếu, sai hoặc lỗi.

Không được phép:

- Công khai sản phẩm trực tiếp cho Khách hàng.
- Sửa sản phẩm tùy chỉnh hoặc giá bán của cửa hàng.
- Xem đơn Khách hàng, doanh thu hoặc lợi nhuận.
- Tự cộng tồn cửa hàng; chỉ Quản lý xác nhận thực nhận.

Trình tự:

1. Cập nhật sản phẩm và khả năng cung ứng.
2. Nhận đơn nhập.
3. Xác nhận đủ, một phần hoặc từ chối.
4. Chuẩn bị, giao và cập nhật trạng thái.
5. Nhận kết quả kiểm hàng và xử lý phản hồi.

### 3.4. Quản trị viên

Mục tiêu: duy trì tài khoản, quyền truy cập, cấu hình và an toàn hệ thống.

Được phép:

- Tạo, khóa/mở khóa tài khoản và đặt lại mật khẩu.
- Gán một trong bốn vai trò.
- Cấu hình đơn vị đo, bước mét, thời hạn giữ tồn và phương thức thanh toán.
- Xem nhật ký, sao lưu, phục hồi và hỗ trợ sự cố.
- Khóa tài khoản/nội dung có dấu hiệu vi phạm.

Quản trị viên không mặc nhiên thay Quản lý xác nhận đơn, nhập kho, sửa giá, tồn hoặc hoàn tiền. Mọi hỗ trợ sửa dữ liệu phải lưu lý do và giá trị trước–sau.

## 4. Ma trận quyền

| Chức năng | Khách hàng | Quản lý | Nhà cung cấp | Quản trị viên |
|---|---|---|---|---|
| Xem sản phẩm công khai | Có | Có | Có | Có |
| Quản lý sản phẩm nguồn | Không | Xem/lấy về | Của mình | Hỗ trợ/khóa |
| Tùy chỉnh/công khai sản phẩm cửa hàng | Không | Có | Không | Không mặc định |
| Xem/quản lý kho cửa hàng | Không | Có | Không | Hỗ trợ có kiểm soát |
| Cập nhật khả năng cung ứng | Không | Không | Có | Không |
| Tạo đơn nhập | Không | Có | Không | Không |
| Xác nhận khả năng giao | Không | Không | Có | Không |
| Xác nhận thực nhận/cộng kho | Không | Có | Không | Không |
| Tạo đơn mua | Đơn của mình | Có thể hỗ trợ | Không | Không |
| Xử lý đơn Khách hàng | Không | Có | Không | Không |
| Yêu cầu hủy/trả | Đơn của mình | Có | Không | Không |
| Quyết định hoàn tiền | Không | Có | Không | Không |
| Xem giá vốn/lợi nhuận | Không | Có | Không | Không mặc định |
| Quản lý tài khoản và quyền | Hồ sơ mình | Hồ sơ mình | Hồ sơ mình | Có |

## 5. Nghiệp vụ sản phẩm và công khai

### 5.1. Nhà cung cấp cập nhật nguồn

1. Nhập thông tin và số có thể cung ứng.
2. Hệ thống kiểm tra dữ liệu bắt buộc.
3. Lưu nháp hoặc xác nhận khả dụng.
4. Quản lý nhìn thấy sản phẩm khả dụng.

Trạng thái: nháp → khả dụng → tạm hết → ngừng cung cấp.

### 5.2. Quản lý đưa sản phẩm lên cửa hàng

1. Chọn sản phẩm nguồn hoặc tạo sản phẩm riêng.
2. Hệ thống tạo bản sản phẩm cửa hàng có liên kết nguồn.
3. Quản lý tùy chỉnh nội dung và giá.
4. Sản phẩm ở trạng thái nháp/chờ hàng.
5. Khi đủ thông tin và có tồn, Quản lý xác nhận công khai.

Trạng thái: nháp → chờ hàng → đang bán → tạm hết/đã ẩn → ngừng kinh doanh.

Sản phẩm đã có giao dịch không xóa cứng. Nhà cung cấp ngừng cung cấp không ngăn cửa hàng bán nốt hàng đang tồn.

## 6. Nhập hàng

### 6.1. Đơn nhập

1. Quản lý chọn Nhà cung cấp và sản phẩm.
2. Nhập số cây hoặc số mét dự kiến, giá và ngày mong muốn.
3. Lưu nháp hoặc gửi.
4. Nhà cung cấp xác nhận đủ, một phần hoặc từ chối có lý do.
5. Nhà cung cấp chuẩn bị và đánh dấu đã giao.

Trạng thái: nháp → chờ xác nhận → xác nhận đủ/một phần/từ chối → đang chuẩn bị → đã giao → đã nhận/đã hủy.

### 6.2. Nhận hàng

1. Quản lý mở đơn nhập.
2. Đo riêng từng cây/cuộn.
3. Nhập số mét, giá vốn và chất lượng thực tế.
4. Đánh dấu đạt, lỗi hoặc từ chối nhận.
5. Xác nhận phiếu nhận.
6. Hệ thống tạo lô cho từng cây đạt và cộng tồn.

Nhà cung cấp đánh dấu đã giao không làm tăng tồn. Chỉ xác nhận thực nhận của Quản lý mới tăng kho. Chênh lệch giao nhận phải được lưu.

## 7. Quản lý kho

### 7.1. Số lượng

- Mét ban đầu: số đo khi nhận.
- Mét thực tế còn lại: số hệ thống đang ghi.
- Mét giữ chỗ: dành cho đơn chờ xử lý.
- Mét khả dụng = mét còn lại − mét giữ chỗ.

### 7.2. Quy tắc

- Đơn vị chuẩn là mét; bước bán mặc định đề xuất 0,1 m và có thể cấu hình.
- Không chấp nhận số mét bằng/nhỏ hơn 0 hoặc vượt tồn.
- Hệ thống gợi ý cây nhập trước hoặc đoạn còn phù hợp; Quản lý được chọn cây khác.
- Nếu một dòng cần lấy từ hai cây, phải thông báo vì vải không còn là một đoạn liền.
- Khi số mét về 0, lô chuyển đã hết.
- Mọi tăng/giảm tồn phải có giao dịch kho.

### 7.3. Kiểm kê

1. Quản lý tạo phiên kiểm kê.
2. Hệ thống chụp số tồn hiện tại.
3. Quản lý nhập số đo thực tế.
4. Hệ thống tính chênh lệch.
5. Quản lý nhập lý do và xác nhận.
6. Hệ thống lưu tồn trước–sau và giao dịch điều chỉnh.

Không sửa trực tiếp số mét còn lại. Lô có mét đang giữ chỗ phải được cảnh báo.

## 8. Mua và xử lý đơn

### 8.1. Giỏ hàng

- Chỉ thêm sản phẩm đang bán.
- Giỏ chưa giữ tồn.
- Khi giá/tồn đổi, Khách phải xác nhận lại trước khi đặt.

### 8.2. Tạo đơn

1. Khách kiểm tra giỏ, địa chỉ và phương thức thanh toán.
2. Hệ thống tính tiền, kiểm tra tồn lần cuối.
3. Khách xác nhận.
4. Hệ thống sinh mã đơn và lưu ảnh chụp thông tin/giá.
5. Nếu đủ, hệ thống giữ tồn; nếu thiếu, yêu cầu điều chỉnh.

### 8.3. Tính tiền

Tiền dòng hàng = số mét × đơn giá tại thời điểm đặt.

Tạm tính = tổng tiền dòng hàng.

Tổng thanh toán = tạm tính − giảm giá + phí hợp lệ.

- Các khoản giảm/phí phải hiển thị riêng.
- Tổng tiền không âm.
- Giá đơn đã tạo không tự đổi.
- Thay đổi số mét/giá sau đặt cần Khách xác nhận lại.
- Tiền làm tròn đến đồng Việt Nam theo một quy tắc thống nhất.

### 8.4. Trạng thái

Chờ xác nhận → đã xác nhận → đang chuẩn bị/cắt → đang giao/chờ nhận → hoàn tất.

Trạng thái khác: từ chối, đã hủy, trả một phần, đã trả, đang hoàn tiền, đã hoàn tiền.

- Quản lý chỉ xác nhận khi đáp ứng được đơn.
- Sau khi bắt đầu cắt, Khách không tự hủy mà gửi yêu cầu.
- Khi xuất, hệ thống đổi phần giữ chỗ thành đã xuất và trừ đúng lô.
- Mỗi lần đổi trạng thái lưu người, thời gian và ghi chú.

## 9. Thanh toán

Hỗ trợ cơ bản: tiền mặt khi nhận hoặc chuyển khoản.

Trạng thái: chưa thanh toán → chờ xác nhận → đã thanh toán; hoặc thất bại, đã hủy, hoàn một phần, đã hoàn toàn bộ.

Quy tắc:

- Mỗi thanh toán có mã tham chiếu.
- Quản lý xác nhận chuyển khoản theo tiền thực nhận.
- Ảnh chuyển khoản không mặc nhiên là xác nhận cuối.
- Không xóa thanh toán sai; tạo giao dịch đảo/hoàn.
- Gửi lặp cùng mã không tạo hai thanh toán.
- Cập nhật thanh toán, đơn và tồn phải nhất quán; lỗi giữa chừng không tạo trạng thái nửa hoàn tất.

## 10. Hủy, trả hàng và hoàn tiền

### 10.1. Trước khi cắt

Khách có thể yêu cầu hủy. Khi được chấp nhận, hệ thống giải phóng mét giữ chỗ; nếu đã trả tiền thì tạo hoàn tiền.

### 10.2. Sau khi cắt

Mặc định không tự chấp nhận trả do đổi ý. Có thể trả khi giao sai, thiếu mét, sai loại hoặc vải lỗi; Quản lý kiểm tra và quyết định.

### 10.3. Xử lý hàng trả

- Đoạn còn nguyên, bán lại được: tạo đoạn/lô trả có liên kết đơn gốc.
- Hàng lỗi/không bán lại: ghi tồn lỗi hoặc hao hụt, không cộng tồn bán.
- Không cộng tùy ý vào cây khác.
- Hoàn tiền theo số mét, giá thực bán và phần giảm giá liên quan.
- Lưu lý do, bằng chứng, phương thức hoàn, mã tham chiếu và người xác nhận.

## 11. Dữ liệu sinh ra và bị khóa

| Bước | Dữ liệu sinh ra/thay đổi | Kiểm soát |
|---|---|---|
| Xác nhận sản phẩm nguồn | Phiên bản nguồn | Không xóa khi đã được dùng |
| Lấy sản phẩm về cửa hàng | Bản cửa hàng, liên kết nguồn | Giữ nguồn gốc |
| Công khai | Trạng thái, thời điểm | Chỉ Quản lý thực hiện |
| Gửi đơn nhập | Đơn và dòng yêu cầu | Khóa nội dung yêu cầu gốc |
| NCC xác nhận | Số giao, ngày giao | Lưu lịch sử thay đổi |
| Xác nhận nhận | Phiếu nhận, lô, tăng tồn | Khóa số ban đầu |
| Tạo đơn mua | Đơn, dòng, giá lịch sử | Không bị giá mới ghi đè |
| Giữ tồn | Mét giữ chỗ | Không dùng cho đơn khác |
| Cắt/xuất | Giao dịch kho, giảm đúng lô | Không sửa tồn trực tiếp |
| Thanh toán | Giao dịch tiền | Không xóa, chỉ đảo/hoàn |
| Trả hàng | Phiếu trả, hoàn tiền, tồn trả/lỗi | Liên kết đơn/lô gốc |
| Kiểm kê | Chênh lệch, điều chỉnh | Lưu trước–sau |

## 12. Ngoại lệ và kiểm soát

- Hai Khách mua phần cuối: giữ tồn nguyên tử; chỉ một đơn thành công.
- Hai thao tác xuất cùng lô: kiểm tra phiên bản/khóa lô; thao tác sau phải tải lại.
- Nhà cung cấp giao thiếu: chỉ cộng thực nhận, lưu chênh lệch.
- Nhà cung cấp sửa nguồn: chỉ thông báo, không ghi đè gian hàng.
- Nhập sai mét: nháp được sửa; đã xác nhận phải điều chỉnh có lý do.
- Mất mạng/gửi lặp: dùng mã chống lặp; không tạo hai đơn/thanh toán.
- Giá đổi khi còn trong giỏ: thông báo và yêu cầu xác nhận.
- Sản phẩm bị ẩn trong giỏ: không cho tạo đơn.
- Điều chỉnh tồn lớn, hoàn tiền lặp hoặc đăng nhập thất bại nhiều lần: tạo cảnh báo và nhật ký.

Nhật ký thao tác nhạy cảm phải lưu người thực hiện, thời gian, lý do, dữ liệu trước và sau.

## 13. Báo cáo cơ bản

- Đơn và doanh thu theo ngày/tháng.
- Đơn chờ, đang xử lý, hủy và hoàn.
- Tiền theo phương thức thanh toán.
- Tồn theo sản phẩm và từng cây.
- Sản phẩm sắp hết/hết; lô tồn lâu/lỗi.
- Lịch sử nhập theo Nhà cung cấp.
- Chênh lệch kiểm kê và điều chỉnh.
- Giá vốn và lợi nhuận ước tính của đơn hoàn tất.

Doanh thu thuần = tiền hàng hoàn tất − giảm giá − giá trị đã hoàn. Phí giao hàng hiển thị riêng nếu không phải doanh thu hàng hóa.

## 14. Quy tắc chung

1. Không bán vượt tồn khả dụng.
2. Mọi thay đổi tồn sinh giao dịch kho.
3. Mỗi cây có mã riêng và truy được phiếu nhận.
4. Sản phẩm công khai phải đủ tên, đơn vị, giá, ảnh và tồn bán.
5. Chỉ Quản lý quyết định nội dung/giá bán và xác nhận thực nhận.
6. Chỉ Nhà cung cấp sửa dữ liệu nguồn của mình.
7. Chứng từ xác nhận không xóa cứng.
8. Khách chỉ xem dữ liệu của mình.
9. Mật khẩu không lưu rõ; giá vốn không hiển thị cho Khách.
10. Ngưỡng bước mét, giữ chỗ, trả hàng và cảnh báo là cấu hình.

## 15. Tiêu chí nghiệm thu

### 15.1. Sản phẩm

- Nhà cung cấp quản lý được nguồn của mình nhưng không tự công khai.
- Quản lý lấy về, tùy chỉnh độc lập và công khai.
- Thay đổi nguồn không ghi đè giá/nội dung cửa hàng.
- Sản phẩm hết tồn không đặt được.

### 15.2. Nhập hàng

- Nhà cung cấp xác nhận đủ, một phần hoặc từ chối.
- Đánh dấu đã giao không tự tăng kho.
- Quản lý xác nhận thực nhận tạo đúng từng cây và số mét.
- Giao thiếu/lỗi không làm sai tồn.

### 15.3. Đơn hàng

- Khách chỉ đặt sản phẩm đang bán, số mét hợp lệ.
- Hai đơn tranh tồn cuối không làm tồn âm.
- Đơn giữ đúng giá lúc đặt.
- Trạng thái chuyển đúng thứ tự và có lịch sử.
- Xuất trừ đúng cây; xử lý thất bại không trừ tồn.

### 15.4. Thanh toán và hoàn trả

- Ghi đúng tiền, phương thức và tham chiếu.
- Gửi lặp không tạo hai giao dịch.
- Hoàn tiền không xóa thanh toán gốc.
- Hủy trước cắt giải phóng tồn giữ chỗ.
- Sau cắt phải qua Quản lý.
- Hàng trả bán lại được có nguồn; hàng lỗi không vào tồn bán.

### 15.5. Phân quyền

- Khách không xem dữ liệu người khác/giá vốn.
- Nhà cung cấp không xem đơn Khách hoặc sửa gian hàng.
- Quản trị viên không mặc nhiên thực hiện nghiệp vụ bán.
- Sửa giá, điều chỉnh tồn, hủy và hoàn đều có nhật ký.

## 16. Thông báo

- Khách: tạo đơn, đổi trạng thái, đề nghị thay đổi, kết quả hủy/trả/hoàn.
- Quản lý: đơn mới, yêu cầu hỗ trợ, phản hồi đơn nhập, thay đổi nguồn, cảnh báo tồn và thanh toán.
- Nhà cung cấp: đơn nhập mới/thay đổi/hủy, kết quả nhận hàng hoặc báo lỗi.
- Quản trị viên: lỗi hệ thống, đăng nhập bất thường và sự kiện bảo mật.

## 17. Thuật ngữ

| Thuật ngữ | Giải thích |
|---|---|
| Sản phẩm nguồn | Sản phẩm do Nhà cung cấp quản lý |
| Sản phẩm cửa hàng | Bản do Quản lý tùy chỉnh và công khai |
| Cây/cuộn/lô | Một cây vải thực tế có tồn riêng |
| Mét giữ chỗ | Mét tạm dành cho đơn đang xử lý |
| Mét khả dụng | Mét còn có thể bán |
| Giá vốn | Chi phí nhập một mét của lô |
| Giá bán | Giá áp dụng cho Khách khi đặt |
| Điều chỉnh kho | Giao dịch đưa tồn về đúng thực tế |
| Công khai | Cho phép hiển thị và bán cho Khách |

## 18. Tham số cần cấu hình

- Bước mét nhỏ nhất.
- Thời gian giữ tồn.
- Điều kiện/thời hạn hủy trả.
- Ngưỡng sắp hết và tồn lâu.
- Phương thức thanh toán.
- Phí giao hàng và quy tắc làm tròn.
- Ngưỡng cảnh báo chênh lệch kiểm kê.

Các giá trị cụ thể sẽ được xác nhận khi thiết kế chức năng, không coi là chính sách cố định trong tài liệu này.
