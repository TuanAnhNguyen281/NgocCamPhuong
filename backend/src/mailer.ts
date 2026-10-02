import { config } from "./config.js";
import type { OrderRead } from "./types.js";

// Gui email qua Resend (https://resend.com) khi da dat RESEND_API_KEY va MAIL_FROM.
// Chua cau hinh thi chi ghi log va bo qua, de luong dat hang khong phu thuoc vao email.
export function mailerReady() {
  return Boolean(config.resendApiKey && config.mailFrom);
}

async function sendMail(to: string, subject: string, html: string) {
  if (!mailerReady()) {
    console.log(`[mail:skipped] chua cau hinh RESEND_API_KEY/MAIL_FROM | to=${to} | ${subject}`);
    return false;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: config.mailFrom, to, subject, html }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Resend tra ve ${response.status}: ${await response.text()}`);
  return true;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
const money = (value: string | number) => `${Number(value).toLocaleString("vi-VN")} đ`;

export async function sendPasswordReset(to: string, fullName: string, link: string) {
  try {
    const html = `<div style="font-family:Arial,sans-serif;color:#151918;max-width:560px">
      <h2 style="font-weight:500">Đặt lại mật khẩu</h2>
      <p>Chào ${escapeHtml(fullName)}, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Ngọc Cẩm Phường của bạn.</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#151918;color:#fff;text-decoration:none">Đặt lại mật khẩu</a></p>
      <p style="color:#6d716d">Liên kết có hiệu lực trong 30 phút và chỉ dùng được một lần. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    </div>`;
    return await sendMail(to, "Đặt lại mật khẩu Ngọc Cẩm Phường", html);
  } catch (error) {
    console.error("[mail:failed]", error);
    return false;
  }
}

// Khong bao gio nem loi: don hang da duoc tao, email chi la buoc phu.
export async function sendOrderConfirmation(order: OrderRead) {
  try {
    const rows = order.items.map((item) => `<tr><td style="padding:6px 12px 6px 0">${escapeHtml(item.product_name)} × ${item.quantity}</td><td style="padding:6px 0;text-align:right">${money(item.line_total)}</td></tr>`).join("");
    const payment = order.payment_method === "bank_transfer" ? "Chuyển khoản ngân hàng" : "Thanh toán khi nhận hàng (COD)";
    const html = `<div style="font-family:Arial,sans-serif;color:#151918;max-width:560px">
      <h2 style="font-weight:500">Cảm ơn bạn đã đặt hàng tại Ngọc Cẩm Phường</h2>
      <p>Mã đơn: <strong>${escapeHtml(order.order_code)}</strong></p>
      <table style="border-collapse:collapse;width:100%">${rows}<tr><td style="padding:10px 12px 0 0;border-top:1px solid #c9c6bd"><strong>Tổng cộng</strong></td><td style="padding:10px 0 0;border-top:1px solid #c9c6bd;text-align:right"><strong>${money(order.total_amount)}</strong></td></tr></table>
      <p>Người nhận: ${escapeHtml(order.recipient_name ?? order.customer_name)} · ${escapeHtml(order.recipient_phone ?? "")}<br>Địa chỉ: ${escapeHtml(order.shipping_address)}<br>Thanh toán: ${payment}</p>
      <p style="color:#6d716d">Bạn có thể hủy đơn trong vòng 5 phút sau khi đặt, tại mục Đơn hàng của tôi.</p>
    </div>`;
    return await sendMail(order.customer_email, `Xác nhận đơn hàng ${order.order_code}`, html);
  } catch (error) {
    console.error("[mail:failed]", error);
    return false;
  }
}
