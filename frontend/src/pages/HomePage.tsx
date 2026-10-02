import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { useApp } from "../app-context";
import { productImage } from "../utils";

type HeroSlide = {
  key: string;
  image: string;
  alt: string;
  label: string;
  caption: string;
  productId?: number;
};

export function HomePage() {
  const { products, productsLoading, productsError, apiReady } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = useMemo<HeroSlide[]>(() => [
    {
      key: "studio-note",
      image: "/hero-fabric.png",
      alt: "Những cuộn vải linen với một dải xanh bụi",
      label: "STUDIO NOTE / 01",
      caption: "LINEN, COTTON, A QUIET BLUE",
    },
    ...products.map((product) => ({
      key: `product-${product.id}`,
      image: productImage(product),
      alt: `${product.name} - chất liệu vải`,
      label: product.sku,
      caption: product.name,
      productId: product.id,
    })),
  ], [products]);

  useEffect(() => {
    setActiveSlide((current) => Math.min(current, Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const active = slides[activeSlide] ?? slides[0];
  return <>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">CHẤT LIỆU THẬT / CUỘC SỐNG THẬT</p><h1>Vải tốt cho những<br />điều tử tế.</h1><span className="short-rule" /><p className="hero-lead">Ngọc Cẩm Phường là tiệm vải nhỏ ở Việt Nam, chọn những chất liệu mộc mạc, bền đẹp để đồng hành cùng những điều bình dị của cuộc sống.</p><Link className="underlined-link" to="/products">Khám phá bộ sưu tập <span>→</span></Link><div className="hero-note"><span>NHỮNG SỢI VẢI NHỎ</span><span>LÀM NÊN NHỮNG NGÀY THẬT ĐẸP.</span></div></div>
      <figure className="hero-image" aria-roledescription="carousel" aria-label="Hình ảnh studio và sản phẩm">
        <div className="hero-slide" key={active.key}>
          {typeof active.productId === "number" ? <Link className="hero-slide-link" to={`/products/${active.productId}`} aria-label={`Xem chi tiết ${active.caption}`}><img src={active.image} alt={active.alt} /></Link> : <img src={active.image} alt={active.alt} />}
          <figcaption><span>{active.label}</span><span>{active.caption}</span></figcaption>
        </div>
        {slides.length > 1 && <>
          <div className="hero-slider-controls" aria-label="Điều khiển hình ảnh">
            <button type="button" aria-label="Ảnh trước" onClick={() => setActiveSlide((current) => (current - 1 + slides.length) % slides.length)}>←</button>
            <button type="button" aria-label="Ảnh tiếp theo" onClick={() => setActiveSlide((current) => (current + 1) % slides.length)}>→</button>
          </div>
          <div className="hero-slider-dots" aria-label="Chọn hình ảnh">
            {slides.map((slide, index) => <button key={slide.key} className={index === activeSlide ? "active" : ""} type="button" aria-label={`Hiển thị ${slide.caption}`} aria-current={index === activeSlide ? "true" : undefined} onClick={() => setActiveSlide(index)} />)}
          </div>
        </>}
      </figure>
    </section>
    <section className="home-collection">
      <header className="section-heading"><div><p className="eyebrow">LỰA CHỌN TỪ STUDIO</p><h2>Chất liệu cho<br /><em>những ngày thường.</em></h2></div><div><p>Mét vải được đóng theo từng đơn vị cố định, dễ chọn, dễ tính và luôn rõ ràng trước khi đặt hàng.</p><Link className="underlined-link" to="/products">Xem tất cả sản phẩm <span>→</span></Link></div></header>
      {productsLoading && <p className="notice">Đang tải bộ sưu tập...</p>}
      {productsError && <p className="notice error">{productsError}</p>}
      <div className="product-grid featured-grid">{products.slice(0, 2).map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
    </section>
    <section className="story-teaser">
      <div className="story-image"><img src="/story-studio.png" alt="Đôi tay sắp xếp những cuộn vải trong studio" /></div>
      <div className="story-copy"><p className="eyebrow">CÂU CHUYỆN CỦA CHÚNG TÔI</p><h2>Từ những tấm vải,<br /><em>đến những điều bình dị.</em></h2><span className="short-rule" /><p>Mỗi tấm vải tốt có thể đi cùng bạn qua nhiều mùa. Một chất liệu tử tế luôn bắt đầu bằng cách được chọn thật kỹ.</p><Link className="underlined-link" to="/story">Đọc câu chuyện của tiệm <span>→</span></Link></div>
    </section>
    <div className={apiReady ? "api-ribbon online" : "api-ribbon"}><span>{apiReady ? "Hệ thống cửa hàng đang hoạt động" : "Đang kiểm tra kết nối cửa hàng"}</span><span>LOCAL STUDIO / 2026</span></div>
  </>;
}
