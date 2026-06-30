"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Thumbs, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "animate.css";
import { HERO_SLIDES, type HeroSlide } from "./home-data";

function animateClass(position: HeroSlide["position"]): string {
  if (position === "Center") return "animate__animated animate__fadeInUp";
  if (position === "Right") return "animate__animated animate__fadeInRight";
  return "animate__animated animate__fadeInLeft";
}

function SlideBlocks({ slide, animateKey }: { slide: HeroSlide; animateKey: number }) {
  const anim = animateClass(slide.position);

  return (
    <div className="slide-content" data-position={slide.position}>
      <div className="etap-container">
        {slide.blocks.map((block, i) => (
          <div key={`${slide.id}-${animateKey}-${i}`} className={`animate-block ${anim}`}>
            {block.type === "logo" ? (
              <div className="caption-logo">
                <Image src={block.src} alt={block.alt ?? ""} width={426} height={105} style={{ height: "auto", width: "auto", maxHeight: 105 }} />
              </div>
            ) : null}
            {block.type === "demo-title" ? (
              <h2 className="demo-title" dangerouslySetInnerHTML={{ __html: block.html }} />
            ) : null}
            {block.type === "heading" ? (
              block.tag === "h2" ? (
                <h2 dangerouslySetInnerHTML={{ __html: block.html }} />
              ) : block.tag === "h3" ? (
                <h3 dangerouslySetInnerHTML={{ __html: block.html }} />
              ) : (
                <h4 dangerouslySetInnerHTML={{ __html: block.html }} />
              )
            ) : null}
            {block.type === "text" ? <p dangerouslySetInnerHTML={{ __html: block.html }} /> : null}
            {block.type === "cta" ? (
              <p>
                <a
                  href={block.href}
                  className={`btn-etap-primary${block.large ? " btn-etap-lg" : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {block.label}
                </a>
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EtapHomeHeroCarousel() {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [animateKey, setAnimateKey] = useState(0);

  const onSlideChange = useCallback(() => {
    setAnimateKey((k) => k + 1);
  }, []);

  useEffect(() => {
    setAnimateKey(1);
  }, []);

  return (
    <section className="etap-home-hero">
      <Swiper
        modules={[Autoplay, Navigation, Thumbs]}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        loop
        speed={1000}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation
        onSlideChange={onSlideChange}
        onInit={onSlideChange}
        className="swiper-main"
      >
        {HERO_SLIDES.map((slide) => (
          <SwiperSlide key={slide.id}>
            <Image src={slide.image} alt="" fill priority={slide.id === "etap-2026"} sizes="100vw" style={{ objectFit: "cover" }} />
            <SlideBlocks slide={slide} animateKey={animateKey} />
          </SwiperSlide>
        ))}
      </Swiper>

      <Swiper
        modules={[FreeMode, Thumbs]}
        onSwiper={setThumbsSwiper}
        watchSlidesProgress
        slidesPerView={4}
        freeMode
        className="swiper-thumbs etap-container"
        breakpoints={{
          0: { slidesPerView: 2 },
          640: { slidesPerView: 3 },
          992: { slidesPerView: 4 },
        }}
      >
        {HERO_SLIDES.map((slide) => (
          <SwiperSlide key={`thumb-${slide.id}`}>
            <Image
              src={slide.thumb ?? slide.image}
              alt=""
              width={180}
              height={70}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
