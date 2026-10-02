# Ngoc Cam Phuong

He thong web ban vai quy mo nho.

## Cau truc

- frontend: Vite + React + TypeScript.
- backend: Node.js + Express + TypeScript + `pg`.
- PostgreSQL local: localhost:5432.

## Khoi dong backend

1. Chuyen vao thu muc backend va cai dependency:
   cd backend
   npm install
2. Sao chep backend/.env.example thanh backend/.env va dien thong tin PostgreSQL.
   Neu muon upload anh san pham, dien them `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` va tuy chon `CLOUDINARY_FOLDER` trong file nay.
3. Khoi tao bang/du lieu mau:
   npm run seed
4. Chay API:
   npm run dev

Lenh dev da cau hinh nodemon de tu khoi dong lai backend khi file TypeScript trong `src/` thay doi.

API health: http://localhost:8000/api/health.

## Khoi dong frontend

1. Mo terminal moi va chay npm install trong thu muc frontend.
2. Sao chep frontend/.env.example thanh frontend/.env.
3. Chay npm run dev -- --host 127.0.0.1.

Mo http://localhost:5173.

Khach hang chi chon so luong. Tong met bang fixed_meters nhan quantity; ton kho quan ly theo so don vi.

## Cac man hinh chinh

- `#/`: trang chu cua hang.
- `#/products`: danh sach san pham, tim kiem, loc va sap xep.
- `#/products/{id}`: chi tiet san pham, chon so luong va tong met.
- `#/story`: cau chuyen cua hang.
- `#/contact`: lien he va chinh sach.
- `#/account`, `#/orders`: ho so va don hang khach hang.
- `#/dashboard`: tong quan quan ly.
- `#/dashboard/products`: CRUD san pham, xoa mem.
- `#/dashboard/orders`: quan ly trang thai don hang.
- `#/payment/{id}`: huong dan chuyen khoan (trang tam, chua noi cong thanh toan).
- `#/forgot-password`, `#/reset-password`: quen va dat lai mat khau.
- `#/dashboard/categories`: quan ly danh muc.
- `#/dashboard/chats`: tro chuyen voi khach hang.
- `#/dashboard/messages`: loi nhan khach gui tu trang lien he.
- `#/dashboard/account`: doi mat khau cho manager/admin.
- `#/dashboard/users`: quan ly vai tro, chi hien voi admin.

Frontend dung `HashRouter`, vi vay cac route chay truc tiep tren localhost ma khong can cau hinh rewrite web server.

## Tai khoan test localhost

`npm run seed` trong thu muc `backend` tao bang, hai tai khoan va 5 san pham mau (anh trong `frontend/public/sample-products`, dat ten theo SKU, duoc upload len Cloudinary neu da cau hinh). Cung co the dung cac anh nay de thu chuc nang upload trong dashboard.

Voi PostgreSQL tren localhost, mat khau mac dinh la:

- Quan ly: `quanly@ngoccamphuong.local` / `NgocCam@123`
- Quan tri vien: `admin@ngoccamphuong.local` / `NgocAdmin@123`

Voi database tu xa (Neon), seed khong dung mat khau mac dinh: no tu sinh mat khau ngau nhien va in ra mot lan. Dat `ADMIN_PASSWORD` / `MANAGER_PASSWORD` (va tuy chon `ADMIN_EMAIL` / `MANAGER_EMAIL`) truoc khi chay de tu chon hoac dat lai mat khau.

Tai khoan Google chi hoat dong sau khi tao OAuth Client ID cho localhost, sau do dien cung gia tri vao `GOOGLE_CLIENT_ID` trong `backend/.env` va `VITE_GOOGLE_CLIENT_ID` trong `frontend/.env`.

Upload anh san pham dung Cloudinary qua backend. Chi manager/admin moi co quyen upload; anh JPG, PNG hoac WebP toi da 4 MB duoc luu vao folder `ngoc-cam-phuong/products` mac dinh. Khong dua `CLOUDINARY_API_SECRET` vao frontend.

## Email

Email xac nhan don hang va email dat lai mat khau gui qua Resend khi da dat `RESEND_API_KEY` va `MAIL_FROM` trong `backend/.env`. Chua dat thi backend chi ghi log `[mail:skipped]`. Khi chay local chua co email, lien ket dat lai mat khau duoc in ra console cua backend (`[reset-password] ...`) de thu.

## Deploy production

Xem [DEPLOY.md](DEPLOY.md): Neon (database), Cloudinary (anh), Google OAuth (dang nhap) va Vercel (frontend + backend).
