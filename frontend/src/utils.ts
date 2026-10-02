import type { Product } from "./api";

export function formatMoney(value: string | number) {
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

export function productImage(product: Product) {
  if (product.image_url) return product.image_url;
  const identity = `${product.sku} ${product.name} ${product.category ?? ""}`.toLocaleLowerCase();
  return identity.includes("lua") || identity.includes("lụa") ? "/product-lua.png" : "/product-cotton.png";
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
