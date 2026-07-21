"use client";

import { useState } from "react";
import styles from "./TestimonialsSection.module.css";

const ASSET = "/assets/autodesk";

interface QuotePart {
  text: string;
  highlight?: boolean;
}

interface Testimonial {
  brand: string;
  brandLabel: string;
  logo: string;
  image: string;
  imageAlt: string;
  quote: QuotePart[];
  attribution: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    brand: "yamaha",
    brandLabel: "YAMAHA",
    logo: `${ASSET}/yamaha.svg`,
    image:
      "https://images.ctfassets.net/v7wr16nrr0mz/35syhI7ISNeBKjW4lCqzGn/9340cc6b6a6d5fb23f45523843824644/yamaha-large-1920x1080.jpg?w=1600",
    imageAlt: "Yamaha Concept 451 electric utility vehicle",
    // Live Autodesk: first sentence yellow, rest white
    quote: [
      {
        text: "Using generative AI, we ideated more than 2,400 different design images in just a couple of weeks.",
        highlight: true,
      },
      {
        text: " From there, we narrowed it down to a couple that we wanted to pursue.",
      },
    ],
    attribution: "Yasuhide Yokoi, Final Aim, Co-founder and CDO",
  },
  {
    brand: "rivian",
    brandLabel: "RIVIAN",
    logo: `${ASSET}/rivian.svg`,
    image:
      "https://images.ctfassets.net/v7wr16nrr0mz/7lfAS3Y1rIwHcFjwZzyKqx/6cde987f52556628275a605b00ef14d3/rivian-large-1920x1080.jpg?w=1600",
    imageAlt: "Rivian electric vehicle",
    quote: [
      { text: "We want to be able to iterate as fast as possible.", highlight: true },
      {
        text: " We want to get parts in engineers', designers', and operators' hands so that we can make our cars quickly and to quality, too. Using Fusion has allowed us to do that.",
      },
    ],
    attribution: "Jonathan Dankenbring, Senior Manager, Prototype Manufacturing, Rivian",
  },
  {
    brand: "preymaker",
    brandLabel: "preymaker",
    logo: `${ASSET}/preymaker.svg`,
    image:
      "https://images.ctfassets.net/v7wr16nrr0mz/7nVJ9fKWlQKxdsAuqL6LVX/4c832e190487064378055a2200cab5b3/preymaker-large-1920x1080.jpg?w=1600",
    imageAlt: "Preymaker creative work",
    quote: [
      { text: "The confluence of cloud and AI is a real driver for innovation.", highlight: true },
      { text: " Combined, they're extremely powerful." },
    ],
    attribution: "Angus Kneale, Chief Creative Officer, Preymaker",
  },
  {
    brand: "gamuda",
    brandLabel: "GAMUDA",
    logo: `${ASSET}/gamuda.svg`,
    image:
      "https://images.ctfassets.net/v7wr16nrr0mz/1jBMtkseQbWHSLqeGGMKqX/a91732519c2558270cb391bf00ddfd10/gamuda-large-1920x1080.jpg?w=1600",
    imageAlt: "Gamuda construction project",
    quote: [
      { text: "Once we can make sense of the data, we can make use of it,", highlight: true },
      { text: " and that lets us make better decisions faster." },
    ],
    attribution: "Kyle Ewe, Engineering Digital Lead, Gamuda",
  },
  {
    brand: "skanska",
    brandLabel: "SKANSKA",
    logo: `${ASSET}/skanska.svg`,
    image:
      "https://images.ctfassets.net/v7wr16nrr0mz/ZlscX2UwaqF2ujiaF6QKn/e993d56e1537c47bfae279cb0b05fe9e/skanska-large-1920x1080.jpg?w=1600",
    imageAlt: "Skanska architecture project",
    quote: [
      {
        text: "We all used Forma as the centerpiece for many meetings with lots of different partners.",
        highlight: true,
      },
      {
        text: " It allowed us to go around the 3D model together, make alterations, and enable everyone to quickly see solutions being proposed.",
      },
    ],
    attribution: "Martin Berger, Project Manager, Skanska",
  },
];

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const active = TESTIMONIALS[index];

  return (
    <section className={styles.section} data-testid="customer-success">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={active.brand}
        src={active.image}
        alt={active.imageAlt}
        className={styles.bg}
      />
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.pills} role="tablist" aria-label="Customer stories">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.brand}
              type="button"
              role="tab"
              aria-label={t.brandLabel}
              aria-selected={i === index}
              className={`${styles.pill} ${i === index ? styles.pillActive : ""}`}
              onClick={() => setIndex(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.logo} alt="" className={styles.pillLogo} />
            </button>
          ))}
        </div>

        <div key={active.brand} className={styles.copy}>
          <p className={styles.eyebrow}>Customer success</p>
          <blockquote className={styles.quote}>
            &ldquo;
            {active.quote.map((part, i) =>
              part.highlight ? (
                <span key={i} className={styles.highlight}>
                  {part.text}
                </span>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
            &rdquo;
          </blockquote>
          <p className={styles.attribution}>—{active.attribution}</p>
        </div>
      </div>
    </section>
  );
}
