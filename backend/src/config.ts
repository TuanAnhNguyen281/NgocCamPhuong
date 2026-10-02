import "dotenv/config";

// VERCEL=1 tren moi deployment cua Vercel (ca preview), nen khong bao gio dung secret mac dinh o do.
const isProduction = process.env.APP_ENV === "production" || Boolean(process.env.VERCEL);
const localJwtSecret = "ngoc-cam-phuong-local-secret-change-me";

if (isProduction && !process.env.DATABASE_URL) throw new Error("DATABASE_URL is required in production");
if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error("JWT_SECRET (at least 32 characters) is required in production");
}

export const config = {
  isProduction,
  port: Number(process.env.PORT ?? 8000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/ngoc_cam_phuong",
  // Co the khai bao nhieu origin, cach nhau bang dau phay.
  frontendOrigins: (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
  appName: process.env.APP_NAME ?? "Ngoc Cam Phuong API",
  jwtSecret: process.env.JWT_SECRET ?? localJwtSecret,
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER ?? "ngoc-cam-phuong/products",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  mailFrom: process.env.MAIL_FROM ?? "",
};
