# Deploy production

Kiến trúc: một repo GitHub, hai project Vercel.

| Thành phần | Dịch vụ | Ghi chú |
| --- | --- | --- |
| Frontend (Vite + React) | Vercel, Root Directory `frontend` | Site tĩnh, dùng `HashRouter` nên không cần rewrite |
| Backend (Express) | Vercel, Root Directory `backend` | Vercel tự nhận `src/app.ts` và chạy thành một Function |
| Database | Neon (PostgreSQL) | Dùng chuỗi kết nối **pooled** |
| Ảnh sản phẩm | Cloudinary | Upload qua backend, tối đa 4 MB |
| Đăng nhập Google | Google Identity Services | Chỉ cần Client ID, không cần client secret |

Làm theo đúng thứ tự bên dưới, vì bước sau cần giá trị của bước trước.

## 1. Neon — database

1. Vào <https://console.neon.tech>, tạo project. Chọn region **AWS Asia Pacific (Singapore)** và Postgres bản mới nhất.
2. Ở Dashboard bấm **Connect**, bật **Connection pooling**, copy chuỗi kết nối. Chuỗi đúng có `-pooler` trong hostname và kết thúc bằng `?sslmode=require`:

   ```
   postgresql://<user>:<password>@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

3. Tạo bảng và tài khoản admin đầu tiên. Chạy từ máy bạn, trong PowerShell:

   ```powershell
   cd backend
   $env:DATABASE_URL = "<chuỗi pooled của Neon>"
   $env:ADMIN_EMAIL = "ban@example.com"
   $env:ADMIN_PASSWORD = "<mật khẩu ít nhất 12 ký tự>"
   $env:ADMIN_NAME = "Tên của bạn"
   npm run db:setup
   Remove-Item Env:DATABASE_URL, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD, Env:ADMIN_NAME
   ```

   Lệnh in ra `Database schema is ready` và `Admin account ready: ...` là xong. Chạy lại lệnh này với cùng email sẽ đặt lại mật khẩu admin.

Không chạy `npm run seed` với database Neon: lệnh đó tạo hai tài khoản test có mật khẩu ghi công khai trong README.

## 2. Cloudinary — ảnh sản phẩm

1. Vào <https://console.cloudinary.com>, mở **Settings → API Keys**.
2. Ghi lại ba giá trị: **Cloud name**, **API Key**, **API Secret**.

Ảnh được lưu vào folder `ngoc-cam-phuong/products` (đổi bằng `CLOUDINARY_FOLDER`). `API Secret` chỉ đặt ở backend, không bao giờ đặt ở frontend.

## 3. Đưa code lên GitHub

Thư mục này chưa phải git repo. Tạo một repo trống trên GitHub rồi chạy ở thư mục gốc:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

`.gitignore` đã chặn `.env`, nên secret không bị đẩy lên. Kiểm tra lại bằng `git status` trước khi commit: không được có file `.env` nào trong danh sách.

## 4. Vercel — backend

1. Vào <https://vercel.com/new>, import repo vừa tạo.
2. **Root Directory**: `backend`. Framework Preset để Vercel tự nhận (Express). Không đổi Build/Output settings.
3. Thêm Environment Variables (áp dụng cho Production):

   | Tên | Giá trị |
   | --- | --- |
   | `APP_ENV` | `production` |
   | `DATABASE_URL` | Chuỗi pooled của Neon |
   | `JWT_SECRET` | Chuỗi ngẫu nhiên, tối thiểu 32 ký tự (lệnh tạo ở dưới) |
   | `FRONTEND_ORIGIN` | Tạm để `http://localhost:5173`, sửa lại ở bước 7 |
   | `GOOGLE_CLIENT_ID` | Để trống, điền ở bước 6 |
   | `CLOUDINARY_CLOUD_NAME` | Từ bước 2 |
   | `CLOUDINARY_API_KEY` | Từ bước 2 |
   | `CLOUDINARY_API_SECRET` | Từ bước 2 |
   | `CLOUDINARY_FOLDER` | `ngoc-cam-phuong/products` |

   Tạo `JWT_SECRET`:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

4. Bấm **Deploy**. Sau đó vào **Settings → Functions → Function Region**, chọn **Singapore (sin1)** để gần Neon, rồi Redeploy.
5. Mở `https://<backend>.vercel.app/api/health`. Phải trả về `{"status":"ok",...}`. Ghi lại URL backend này.

Backend sẽ từ chối khởi động nếu thiếu `DATABASE_URL` hoặc `JWT_SECRET` ngắn hơn 32 ký tự; lỗi hiện trong tab **Logs** của deployment.

## 5. Vercel — frontend

1. Vào <https://vercel.com/new>, import **cùng repo đó** lần nữa.
2. **Root Directory**: `frontend`. Framework Preset: Vite.
3. Environment Variables:

   | Tên | Giá trị |
   | --- | --- |
   | `VITE_API_URL` | `https://<backend>.vercel.app` (không có `/` cuối) |
   | `VITE_GOOGLE_CLIENT_ID` | Để trống, điền ở bước 6 |

4. Bấm **Deploy**. Ghi lại URL frontend: `https://<frontend>.vercel.app`.

Biến `VITE_*` được nhúng vào lúc build. Mỗi lần đổi giá trị phải **Redeploy** frontend thì mới có hiệu lực.

## 6. Google OAuth — đăng nhập bằng Google

1. Vào <https://console.cloud.google.com>, tạo project mới (hoặc chọn project có sẵn).
2. Mở **Google Auth Platform** (tên cũ: APIs & Services → OAuth consent screen):
   - **Branding**: điền tên ứng dụng, email hỗ trợ, email liên hệ.
   - **Audience**: chọn **External**, rồi bấm **Publish app** để chuyển sang *In production*. Nếu để ở *Testing*, chỉ các email trong danh sách test user mới đăng nhập được.
3. Mở **Clients → Create client**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**, thêm đủ ba dòng:
     - `https://<frontend>.vercel.app`
     - `http://localhost:5173`
     - `http://localhost`
   - **Authorized redirect URIs**: để trống. App dùng nút Google Identity Services, không dùng redirect.
4. Copy **Client ID** (dạng `xxxx.apps.googleusercontent.com`). Không cần Client secret.
5. Dán cùng một giá trị vào hai nơi trên Vercel:
   - project backend: `GOOGLE_CLIENT_ID`
   - project frontend: `VITE_GOOGLE_CLIENT_ID`

Origin phải khớp chính xác: đúng `https`, không có `/` cuối, không có path. Nếu sau này gắn domain riêng thì thêm domain đó vào danh sách origin. Thay đổi origin có thể mất vài phút đến vài giờ mới có hiệu lực.

## 7. Nối frontend với backend

1. Trong project backend, sửa `FRONTEND_ORIGIN` thành `https://<frontend>.vercel.app`. Nhiều origin thì cách nhau bằng dấu phẩy:

   ```
   https://<frontend>.vercel.app,https://ngoccamphuong.vn
   ```

2. **Redeploy cả hai project** để nhận biến môi trường mới (Deployments → ⋯ → Redeploy).

## 8. Kiểm tra sau khi deploy

- [ ] `https://<backend>.vercel.app/api/health` trả về `status: ok`.
- [ ] Trang chủ frontend tải được danh sách sản phẩm (trống cũng được, miễn không báo lỗi).
- [ ] Đăng nhập bằng email/mật khẩu admin đã tạo ở bước 1, vào được `#/dashboard`.
- [ ] Tạo một sản phẩm kèm ảnh; ảnh xuất hiện trong Media Library của Cloudinary.
- [ ] Đăng nhập bằng Google với một tài khoản chưa từng đăng ký; tài khoản mới có vai trò `customer`.
- [ ] Đặt thử một đơn hàng và đổi trạng thái đơn trong dashboard.

## Lỗi thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
| --- | --- | --- |
| Console trình duyệt báo lỗi CORS | `FRONTEND_ORIGIN` không khớp URL frontend | Sửa cho khớp chính xác, không có `/` cuối, rồi Redeploy backend |
| Frontend vẫn gọi `localhost:8000` | Đổi `VITE_API_URL` nhưng chưa build lại | Redeploy frontend |
| Nút Google không hiện, hoặc báo `origin is not allowed` | Thiếu origin trong Google Cloud, hoặc thiếu `VITE_GOOGLE_CLIENT_ID` | Thêm origin, kiểm tra biến, Redeploy frontend |
| Google báo `Khong the xac minh tai khoan Google` | `GOOGLE_CLIENT_ID` ở backend khác `VITE_GOOGLE_CLIENT_ID` ở frontend | Dùng cùng một Client ID |
| Backend trả 500 ngay khi mở | Thiếu `DATABASE_URL` hoặc `JWT_SECRET` chưa đủ 32 ký tự | Xem Logs trên Vercel, bổ sung biến |
| Upload ảnh báo lỗi với file lớn | Vercel giới hạn request 4.5 MB | Nén ảnh xuống dưới 4 MB |
| URL preview của Vercel đòi đăng nhập | Deployment Protection bật cho preview | Dùng domain production, hoặc tắt trong Settings → Deployment Protection |

## Cập nhật về sau

- Mỗi lần `git push` lên `main`, Vercel tự build và deploy cả hai project.
- Schema database không tự chạy trên Vercel. Khi thay đổi bảng trong `backend/src/db.ts`, chạy lại `npm run db:setup` với `DATABASE_URL` của Neon như ở bước 1.
- Preview deployment (từ branch khác) có URL riêng nên sẽ bị CORS chặn và không dùng được Google login, trừ khi bạn thêm URL đó vào `FRONTEND_ORIGIN` và vào Google Cloud.
