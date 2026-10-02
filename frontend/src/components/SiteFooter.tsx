import { Link } from "react-router-dom";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-brand"><strong>Ngọc Cẩm Phường</strong><span>VẢI ĐẸP CHO NHỮNG ĐIỀU BÌNH DỊ</span></div>
    <div className="footer-links">
      <div><span>KHÁM PHÁ</span><Link to="/">Trang chủ</Link><Link to="/products">Sản phẩm</Link><Link to="/story">Câu chuyện</Link></div>
      <div><span>HỖ TRỢ</span><Link to="/contact">Chính sách mua hàng</Link><Link to="/contact">Đổi trả</Link><Link to="/contact">Liên hệ</Link></div>
    </div>
    <p className="footer-note">Những điều đẹp đẽ<br /><em>luôn bắt đầu từ chất liệu tốt.</em></p>
    <div className="footer-bottom"><span>© 2026 Ngọc Cẩm Phường.</span><span>Vải Việt. Cuộc sống đẹp hơn.</span></div>
  </footer>;
}
