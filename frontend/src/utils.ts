import type { Product } from "./api";

export function formatMoney(value: string | number) {
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

const noImage = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#dedbd2"/><text x="200" y="206" text-anchor="middle" font-family="sans-serif" font-size="15" letter-spacing="2" fill="#6d716d">CHƯA CÓ ẢNH</text></svg>`)}`;

export function productImage(product: Pick<Product, "image_url">, fallback = noImage) {
  return product.image_url || fallback;
}

export const productStatusLabel: Record<string, string> = {
  draft: "Bản nháp",
  published: "Đang bán",
  hidden: "Đang ẩn",
  archived: "Ngừng bán",
};

export const orderStatusLabel: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

export const paymentMethodLabel: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng",
};

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatCountdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
