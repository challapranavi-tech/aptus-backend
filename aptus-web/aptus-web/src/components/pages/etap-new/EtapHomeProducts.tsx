import Image from "next/image";
import { PRODUCTS } from "./home-data";

export function EtapHomeProducts() {
  return (
    <section className="etap-home-products" data-gsap-section>
      <h2 className="portfolio-title">Explore our solutions</h2>
      <p>Take a test drive or get a personalized demonstration.</p>
      <div className="product-grid">
        {PRODUCTS.map((product) => (
          <div key={product.title} className="product-box">
            <div className="product-image">
              <Image src={product.image} alt={product.title} width={360} height={200} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div className="product-details">
              <h5 className="product-title">{product.title}</h5>
              <p className="product-description" dangerouslySetInnerHTML={{ __html: product.description }} />
              <a href={product.cta.href} target="_blank" rel="noopener noreferrer" className="btn-etap-primary btn-etap-lg">
                {product.cta.label}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
