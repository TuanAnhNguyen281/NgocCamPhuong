import { useState } from "react";

export function ContactPage() {
  const [sent, setSent] = useState(false);
  return <section className="contact-page">
    <header><p className="eyebrow">LIÊN HỆ / HỖ TRỢ</p><h1>Hãy kể chúng tôi nghe<br /><em>bạn đang tìm gì.</em></h1><p>Cần chọn chất liệu, kiểm tra đơn hàng hoặc hỏi về chính sách? Gửi một lời nhắn, cửa hàng sẽ phản hồi sớm nhất có thể.</p></header>
    <div className="contact-grid">
      <div className="contact-details"><div><span>EMAIL</span><strong>hello@ngoccamphuong.local</strong></div><div><span>GIỜ HỖ TRỢ</span><strong>08:30 — 18:00<br />Thứ Hai đến Thứ Bảy</strong></div><div><span>CHÍNH SÁCH MUA HÀNG</span><p>Sản phẩm bán theo đơn vị có số mét cố định. Đơn chỉ được xác nhận sau khi cửa hàng kiểm tra tồn kho.</p></div><div><span>ĐỔI TRẢ</span><p>Liên hệ trong vòng 48 giờ nếu sản phẩm giao sai hoặc có lỗi từ cửa hàng.</p></div></div>
      {sent ? <div className="contact-success"><span>ĐÃ GỬI LỜI NHẮN</span><h2>Cảm ơn bạn.</h2><p>Cửa hàng đã ghi nhận thông tin và sẽ phản hồi trong thời gian hỗ trợ.</p><button type="button" onClick={() => setSent(false)}>Gửi lời nhắn khác</button></div> : <form className="contact-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><label>Họ và tên<input required /></label><label>Email<input type="email" required /></label><label>Chủ đề<select><option>Tư vấn sản phẩm</option><option>Hỗ trợ đơn hàng</option><option>Đổi trả</option><option>Khác</option></select></label><label>Nội dung<textarea rows={6} required placeholder="Bạn cần chúng tôi hỗ trợ điều gì?" /></label><button className="primary-button" type="submit">Gửi lời nhắn <span>→</span></button></form>}
    </div>
  </section>;
}
