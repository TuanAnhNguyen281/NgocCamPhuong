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
- `#/dashboard/users`: quan ly vai tro, chi hien voi admin.

Frontend dung `HashRouter`, vi vay cac route chay truc tiep tren localhost ma khong can cau hinh rewrite web server.

## Tai khoan test localhost

Sau khi chay `npm run seed` trong thu muc `backend`, co the dang nhap:

- Quan ly: `quanly@ngoccamphuong.local` / `NgocCam@123`
- Quan tri vien: `admin@ngoccamphuong.local` / `NgocAdmin@123`

Tai khoan Google chi hoat dong sau khi tao OAuth Client ID cho localhost, sau do dien cung gia tri vao `GOOGLE_CLIENT_ID` trong `backend/.env` va `VITE_GOOGLE_CLIENT_ID` trong `frontend/.env`.

Upload anh san pham dung Cloudinary qua backend. Chi manager/admin moi co quyen upload; anh JPG, PNG hoac WebP toi da 4 MB duoc luu vao folder `ngoc-cam-phuong/products` mac dinh. Khong dua `CLOUDINARY_API_SECRET` vao frontend.

## Deploy production

Xem [DEPLOY.md](DEPLOY.md): Neon (database), Cloudinary (anh), Google OAuth (dang nhap) va Vercel (frontend + backend).
