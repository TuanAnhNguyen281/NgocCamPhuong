import { Link } from "react-router-dom";

export function StoryPage() {
  return <section className="editorial-page">
    <header className="editorial-hero"><p className="eyebrow">CÂU CHUYỆN / NGỌC CẨM PHƯỜNG</p><h1>Một tiệm vải nhỏ,<br /><em>một cách chọn thật kỹ.</em></h1><p>Chúng tôi bắt đầu từ niềm tin đơn giản: chất liệu tốt làm cho những món đồ hàng ngày trở nên bền hơn, đẹp hơn và đáng giữ lại lâu hơn.</p></header>
    <figure className="editorial-image"><img src="/story-studio.png" alt="Không gian chọn và sắp xếp vải tại Ngọc Cẩm Phường" /><figcaption>STUDIO NOTES — NHỮNG CHẤT LIỆU ĐƯỢC CHỌN BẰNG TAY</figcaption></figure>
    <div className="editorial-columns"><article><span>01</span><h2>Chọn ít, hiểu kỹ.</h2><p>Mỗi dòng vải được xem xét dựa trên cảm giác bề mặt, độ bền và khả năng ứng dụng thực tế. Chúng tôi không cố có thật nhiều, chỉ giữ lại những lựa chọn đủ tốt.</p></article><article><span>02</span><h2>Rõ ràng từng mét.</h2><p>Sản phẩm được đóng theo số mét cố định. Bạn chỉ cần chọn số lượng, hệ thống luôn cho biết tổng mét, giá và tồn kho trước khi đặt.</p></article><article><span>03</span><h2>Đi cùng đời sống.</h2><p>Từ chiếc áo mặc thường ngày đến một góc rèm trong nhà, vải đẹp nhất khi trở thành một phần tự nhiên của cuộc sống.</p></article></div>
    <div className="editorial-cta"><h2>Tìm một chất liệu<br /><em>cho điều bạn đang may.</em></h2><Link className="underlined-link" to="/products">Khám phá sản phẩm <span>→</span></Link></div>
  </section>;
}
