"use client";

import Link from "next/link";

const HELP_VIDEOS = [
  {
    title: "AutoCAD: getting started",
    product: "AutoCAD",
    duration: "4:12",
    href: "/software-solutions/products",
  },
  {
    title: "3ds Max: rendering basics",
    product: "3ds Max",
    duration: "7:40",
    href: "/software-solutions/products",
  },
  {
    title: "Acrobat Pro: e-signatures",
    product: "Adobe Acrobat",
    duration: "3:05",
    href: "/software-solutions/products",
  },
] as const;

export function HelpVideosPanel({ limit }: { limit?: number }) {
  const videos = limit ? HELP_VIDEOS.slice(0, limit) : HELP_VIDEOS;

  return (
    <div className="aptus-portal-videos" aria-label="Help videos">
      <div className="aptus-portal-videos__grid">
        {videos.map((video) => (
          <Link key={video.title} href={video.href} className="aptus-portal-videos__card">
            <div className="aptus-portal-videos__thumb" aria-hidden="true">
              <span className="aptus-portal-videos__play">â–¶</span>
              <span className="aptus-portal-videos__dur">{video.duration}</span>
            </div>
            <div className="aptus-portal-videos__meta">
              <p>{video.title}</p>
              <span>{video.product}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function helpVideosTotal(): number {
  return HELP_VIDEOS.length;
}
