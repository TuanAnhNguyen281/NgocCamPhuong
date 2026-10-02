import { useEffect } from "react";

export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
    <button className="lightbox-close" type="button" onClick={onClose}>Đóng</button>
    <figure onClick={(event) => event.stopPropagation()}><img src={src} alt={alt} /><figcaption>{alt}</figcaption></figure>
  </div>;
}
