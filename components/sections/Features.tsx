"use client";

import { Container, CmsImage } from "@/components/ui";
import { ELV_ICONS } from "@/data/elv-icons";
import { AUTODESK_ICONS } from "@/data/autodesk-icons";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import type { Features as FeaturesData } from "@/types";
import Link from "next/link";
import { useEffect, useRef } from "react";

interface FeaturesProps {
  data: FeaturesData;
}

function PillarIcon({ name, className = "aptus-pillar-icon" }: { name?: string; className?: string }) {
  // ELV product cards key their icon by the live Font Awesome name (e.g. "thermometer-half").
  // Render the exact SVG lifted from the live site so pages match 1:1.
  const live = name ? (ELV_ICONS[name] ?? AUTODESK_ICONS[name]) : undefined;
  if (live) {
    return (
      <svg
        className={className}
        viewBox={live.viewBox}
        fill="currentColor"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: live.paths }}
      />
    );
  }
  if (name === "medal") {
    return (
      <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
        <path d="M223.75 130.75L154.62 15.54A31.997 31.997 0 0 0 127.18 0H16.03C3.08 0-4.5 14.57 2.92 25.18l111.27 158.96c29.72-27.77 67.52-46.83 109.56-53.39zM495.97 0H384.82c-11.24 0-21.66 5.9-27.44 15.54l-69.13 115.21c42.04 6.56 79.84 25.62 109.56 53.38L509.08 25.18C516.5 14.57 508.92 0 495.97 0zM256 160c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm92.52 157.26l-37.93 36.96 8.97 52.22c1.6 9.36-8.26 16.51-16.65 12.09L256 393.88l-46.9 24.65c-8.4 4.45-18.25-2.74-16.65-12.09l8.97-52.22-37.93-36.96c-6.82-6.64-3.05-18.23 6.35-19.59l52.43-7.64 23.43-47.52c2.11-4.28 6.19-6.39 10.28-6.39 4.11 0 8.22 2.14 10.33 6.39l23.43 47.52 52.43 7.64c9.4 1.36 13.17 12.95 6.35 19.59z" />
      </svg>
    );
  }
  if (name === "check-circle") {
    return (
      <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
        <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z" />
      </svg>
    );
  }
  if (name === "hand-holding-usd") {
    return (
      <svg className={className} viewBox="0 0 576 512" fill="currentColor" aria-hidden="true">
        <path d="M271.06 144.3l54.27 14.3a8.59 8.59 0 0 1 6.63 8.1c0 4.6-4.09 8.4-9.12 8.4h-35.6a30 30 0 0 1-11.19-2.2c-5.24-2.2-11.28-1.7-15.3 2l-19 17.5a11.68 11.68 0 0 0-2.25 2.66 11.42 11.42 0 0 0 3.88 15.74 83.77 83.77 0 0 0 34.51 11.5V240c0 8.8 7.83 16 17.37 16h17.37c9.55 0 17.38-7.2 17.38-16V222.4c32.93-3.6 57.84-31 53.5-63-3.15-23-22.46-41.3-46.56-47.7L282.68 97.4a8.59 8.59 0 0 1-6.63-8.1c0-4.6 4.09-8.4 9.12-8.4h35.6A30 30 0 0 1 332 83.1c5.23 2.2 11.28 1.7 15.3-2l19-17.5A11.31 11.31 0 0 0 368.47 61a11.43 11.43 0 0 0-3.84-15.78 83.82 83.82 0 0 0-34.52-11.5V16c0-8.8-7.82-16-17.37-16H295.37C285.82 0 278 7.2 278 16V33.6c-32.89 3.6-57.85 31-53.51 63C227.63 119.6 247 137.9 271.06 144.3ZM565.27 328.1c-11.8-10.7-30.2-10-42.6 0L430.27 402a63.64 63.64 0 0 1-40 14H272a16 16 0 0 1 0-32h78.29c15.9 0 30.71-10.9 33.25-26.6a31.2 31.2 0 0 0 .46-5.46A32 32 0 0 0 352 320H192a117.66 117.66 0 0 0-74.1 26.29L71.4 384H16A16 16 0 0 0 0 400v96a16 16 0 0 0 16 16H372.77a64 64 0 0 0 40-14L564 377a32 32 0 0 0 1.28-48.9Z" />
      </svg>
    );
  }
  if (name === "user-friends") {
    return (
      <svg className={className} viewBox="0 0 640 512" fill="currentColor" aria-hidden="true">
        <path d="M192 256c61.9 0 112-50.1 112-112S253.9 32 192 32 80 82.1 80 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C51.6 288 0 339.6 0 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zM480 256c53 0 96-43 96-96s-43-96-96-96-96 43-96 96 43 96 96 96zm48 32h-3.8c-13.9 4.8-28.6 8-44.2 8s-30.3-3.2-44.2-8H432c-20.4 0-39.2 5.9-55.7 15.4 24.4 26.3 39.7 61.2 39.7 99.8v38.4c0 2.2-.5 4.3-.6 6.4H592c26.5 0 48-21.5 48-48 0-61.9-50.1-112-112-112z" />
      </svg>
    );
  }
  if (name === "handshake") {
    return (
      <svg className={className} viewBox="0 0 640 512" fill="currentColor" aria-hidden="true">
        <path d="M434.7 64h-66.4c-14.9 0-27.7 10.3-31 24.8-1.5 6.6-2.2 13.4-2.2 20.2 0 7.8.8 15.5 2.4 23.1 3.1 14.4 15.9 24.7 30.6 24.7h66.4c5.5 0 10.1-3.9 11.1-9.3l6.3-34.7c1.1-6.1-3.9-11.7-10.1-11.7zM170 128h66.4c14.9 0 27.7 10.3 31 24.8 1.5 6.6 2.2 13.4 2.2 20.2 0 7.8-.8 15.5-2.4 23.1-3.1 14.4-15.9 24.7-30.6 24.7H170c-5.5 0-10.1-3.9-11.1-9.3l-6.3-34.7c-1.1-6.1 3.9-11.7 10.1-11.7zm397.3 256H384v-64h135.7c5.5 0 10.1 3.9 11.1 9.3l6.3 34.7c1.1 6.1-3.9 11.7-10.1 11.7zM320 128h94.4c20.1 0 37.2-12.6 44-30.3 7.8-21.8 12.9-44.9 12.9-69.1 0-7.8-.8-15.5-2.4-23.1C466.5 10.3 453.7 0 438.8 0H320v128zm0 64V0H201.2c-14.9 0-27.7 10.3-31 24.8-1.5 6.6-2.2 13.4-2.2 20.2 0 7.8.8 15.5 2.4 23.1 3.1 14.4 15.9 24.7 30.6 24.7H320zm-64 192v64H64.3c-5.5 0-10.1-3.9-11.1-9.3l-6.3-34.7c-1.1-6.1 3.9-11.7 10.1-11.7H256z" />
      </svg>
    );
  }
  if (name === "users") {
    return (
      <svg className={className} viewBox="0 0 640 512" fill="currentColor" aria-hidden="true">
        <path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-416 0c0-53 43-96 96-96h8.3c-13.9 4.6-28.8 7.2-44.3 7.2-53 0-96 43-96 96v28.8c0 8.8 7.2 16 16 16h32v-44.8z" />
      </svg>
    );
  }
  if (name === "bullseye") {
    return (
      <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
        <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm0-344c-79.5 0-144 64.5-144 144s64.5 144 144 144 144-64.5 144-144-64.5-144-144-144zm0 240c-52.9 0-96-43.1-96-96s43.1-96 96-96 96 43.1 96 96-43.1 96-96 96zm0-160c-35.3 0-64 28.7-64 64s28.7 64 64 64 64-28.7 64-64-28.7-64-64-64z" />
      </svg>
    );
  }
  if (name === "lightbulb") {
    return (
      <svg className={className} viewBox="0 0 352 512" fill="currentColor" aria-hidden="true">
        <path d="M96.06 454.35c.01 6.29 1.87 12.45 5.36 17.69l17.09 25.69a31.99 31.99 0 0 0 26.64 14.28h61.71a31.99 31.99 0 0 0 26.64-14.28l17.09-25.69a31.99 31.99 0 0 0 5.36-17.69l.04-38.35H96.02l.04 38.35zM0 176c0 44.37 16.45 84.85 43.56 115.78 16.52 18.85 42.36 58.23 52.21 91.45.04.26.07.52.11.78h160.24c.04-.26.07-.52.11-.78 9.85-33.22 35.69-72.6 52.21-91.45C335.55 260.85 352 220.37 352 176 352 78.61 272.91-.3 175.45 0 73.44.31 0 82.97 0 176zm176-80c-44.11 0-80 35.89-80 80 0 8.84-7.16 16-16 16s-16-7.16-16-16c0-61.76 50.24-112 112-112 8.84 0 16 7.16 16 16s-7.16 16-16 16z" />
      </svg>
    );
  }
  if (name === "drafting-compass") {
    return (
      <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
        <path d="M457.01 344.42c-25.05 20.33-52.63 37.18-82.54 49.05l54.38 94.19 53.95 23.04c9.81 4.19 20.89-2.21 22.17-12.8l7.02-58.25-54.98-95.23zm42.49-94.56c4.86-7.67 1.89-17.99-6.05-22.39l-28.07-15.57c-7.48-4.15-16.61-1.46-21.26 5.72C403.01 281.15 332.25 320 256 320c-23.93 0-47.23-4.25-69.41-11.53l67.36-116.68c.7.02 1.34.21 2.04.21s1.35-.19 2.04-.21l51.09 88.5c31.23-8.96 59.56-25.75 82.61-48.92l-51.79-89.71C347.39 128.03 352 112.63 352 96c0-53.02-42.98-96-96-96s-96 42.98-96 96c0 16.63 4.61 32.03 12.05 45.66l-68.3 118.31c-12.55-11.61-23.96-24.59-33.68-39-4.79-7.1-13.97-9.62-21.38-5.33l-27.75 16.07c-7.85 4.54-10.63 14.9-5.64 22.47 15.57 23.64 34.69 44.21 55.98 62.02L0 439.66l7.02 58.25c1.28 10.59 12.36 16.99 22.17 12.8l53.95-23.04 70.8-122.63C186.13 377.28 220.62 384 256 384c99.05 0 190.88-51.01 243.5-134.14zM256 64c17.67 0 32 14.33 32 32s-14.33 32-32 32-32-14.33-32-32 14.33-32 32-32z" />
      </svg>
    );
  }
  if (name === "cube") {
    return (
      <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
        <path d="M239.1 6.3l-208 78c-18.7 7-31.1 25-31.1 45v225.1c0 18.2 10.3 34.8 26.5 42.9l208 104c13.5 6.8 29.4 6.8 42.9 0l208-104c16.3-8.1 26.5-24.8 26.5-42.9V129.3c0-20-12.4-37.9-31.1-44.9l-208-78C262 2.2 250 2.2 239.1 6.3zM256 68.4l192 72v1.1l-192 78-192-78v-1.1l192-72zm32 356V275.5l160-65v133.9l-160 80z" />
      </svg>
    );
  }
  if (name === "robot") {
    return (
      <svg className={className} viewBox="0 0 640 512" fill="currentColor" aria-hidden="true">
        <path d="M32,224H64V416H32A31.96166,31.96166,0,0,1,0,384V256A31.96166,31.96166,0,0,1,32,224Zm512-48V448a64.06328,64.06328,0,0,1-64,64H160a64.06328,64.06328,0,0,1-64-64V176a79.974,79.974,0,0,1,80-80H288V32a32,32,0,0,1,64,0V96H464A79.974,79.974,0,0,1,544,176ZM264,256a40,40,0,1,0-40,40A39.997,39.997,0,0,0,264,256Zm-8,128H192v32h64Zm96,0H288v32h64ZM456,256a40,40,0,1,0-40,40A39.997,39.997,0,0,0,456,256Zm-8,128H384v32h64ZM640,256V384a31.96166,31.96166,0,0,1-32,32H576V224h32A31.96166,31.96166,0,0,1,640,256Z" />
      </svg>
    );
  }
  if (name === "cloud-upload") {
    return (
      <svg className={className} viewBox="0 0 640 512" fill="currentColor" aria-hidden="true">
        <path d="M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4zM393.4 288H328v112c0 8.8-7.2 16-16 16h-48c-8.8 0-16-7.2-16-16V288h-65.4c-14.3 0-21.4-17.2-11.3-27.3l105.4-105.4c6.2-6.2 16.4-6.2 22.6 0l105.4 105.4c10.1 10.1 2.9 27.3-11.3 27.3z" />
      </svg>
    );
  }
  if (name === "mobile") {
    return (
      <svg className={className} viewBox="0 0 320 512" fill="currentColor" aria-hidden="true">
        <path d="M272 0H48C21.5 0 0 21.5 0 48v416c0 26.5 21.5 48 48 48h224c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48zM160 480c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm112-108c0 6.6-5.4 12-12 12H60c-6.6 0-12-5.4-12-12V60c0-6.6 5.4-12 12-12h200c6.6 0 12 5.4 12 12v312z" />
      </svg>
    );
  }
  if (name === "dollar-sign") {
    return (
      <svg className={className} viewBox="0 0 288 512" fill="currentColor" aria-hidden="true">
        <path d="M209.2 233.4l-108-31.6C88.7 198.2 80 186.5 80 173.5c0-16.3 13.2-29.5 29.5-29.5h66.3c12.2 0 24.2 3.7 34.2 10.5 6.1 4.1 14.3 3.1 19.5-2l34.8-34c7.1-6.9 6.1-18.4-1.8-24.5C238 74.8 207.4 64.1 176 64V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48h-2.5C45.8 64-5.4 118.7.5 183.6c4.2 46.1 39.4 83.6 83.8 96.6l102.5 30c12.5 3.7 21.2 15.3 21.2 28.3 0 16.3-13.2 29.5-29.5 29.5h-66.3C100 368 88 364.3 78 357.5c-6.1-4.1-14.3-3.1-19.5 2l-34.8 34c-7.1 6.9-6.1 18.4 1.8 24.5 24.5 19.2 55.1 29.9 86.5 30v48c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-48.2c46.6-.9 90.3-28.6 105.7-72.7 21.5-61.6-14.6-124.8-72.5-141.7z" />
      </svg>
    );
  }
  if (name === "stopwatch") {
    return (
      <svg className={className} viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
        <path d="M432 304c0 114.9-93.1 208-208 208S16 418.9 16 304c0-104 76.3-190.2 176-205.5V64h-28c-6.6 0-12-5.4-12-12V12c0-6.6 5.4-12 12-12h120c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-28v34.5c37.5 5.8 71.7 21.6 99.7 44.6l27.5-27.5c4.7-4.7 12.3-4.7 17 0l28.3 28.3c4.7 4.7 4.7 12.3 0 17l-29.4 29.4-.6.6C419.7 223.3 432 262.2 432 304zm-176 36V188.5c0-6.6-5.4-12-12-12h-40c-6.6 0-12 5.4-12 12V340c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12z" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
        <path d="M466.5 83.7l-192-80a48.15 48.15 0 0 0-36.9 0l-192 80C27.7 91.1 16 108.6 16 128c0 198.5 114.5 335.7 221.5 380.3 11.8 4.9 25.1 4.9 36.9 0C360.1 472.6 496 349.3 496 128c0-19.4-11.7-36.9-29.5-44.3zM256.1 446.3l-.1-381 175.9 73.3c-3.3 151.4-82.1 261.1-175.8 307.7z" />
      </svg>
    );
  }
  if (name === "headset") {
    return (
      <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
        <path d="M192 208c0-17.67-14.33-32-32-32h-16c-35.35 0-64 28.65-64 64v48c0 35.35 28.65 64 64 64h16c17.67 0 32-14.33 32-32V208zm176 144c35.35 0 64-28.65 64-64v-48c0-35.35-28.65-64-64-64h-16c-17.67 0-32 14.33-32 32v112c0 17.67 14.33 32 32 32h16zM256 0C113.18 0 4.58 118.83 0 256v16c0 8.84 7.16 16 16 16h16c8.84 0 16-7.16 16-16v-16c0-114.69 93.31-208 208-208s208 93.31 208 208h-.12c.08 2.43.12 165.72.12 165.72 0 23.35-18.93 42.28-42.28 42.28H320c0-26.51-21.49-48-48-48h-32c-26.51 0-48 21.49-48 48s21.49 48 48 48h181.72c49.86 0 90.28-40.42 90.28-90.28V256C507.42 118.83 398.82 0 256 0z" />
      </svg>
    );
  }
  if (name === "graduation-cap") {
    return (
      <svg className={className} viewBox="0 0 640 512" fill="currentColor" aria-hidden="true">
        <path d="M622.34 153.2L343.4 67.5c-15.2-4.67-31.6-4.67-46.79 0L17.66 153.2c-23.54 7.23-23.54 38.36 0 45.59l48.63 14.94c-10.67 13.19-17.23 29.28-17.88 46.9C38.48 346.4 48.74 362 64 372.7V464c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V372.7c15.26-10.7 25.52-26.3 25.99-44.27l48.63-14.94c23.54-7.23 23.54-38.36 0-45.59zM320 352c-44.19 0-80-42.99-80-96 0-53.02 35.82-96 80-96s80 42.98 80 96c0 53.01-35.83 96-80 96zm272 32h-32c-8.84 0-16 7.16-16 16v48c0 8.84 7.16 16 16 16h32c8.84 0 16-7.16 16-16v-48c0-8.84-7.16-16-16-16z" />
      </svg>
    );
  }
  return null;
}

function SoftwareSectionHeading({
  heading,
  headingAccent,
  subheading,
  leadMuted,
}: Pick<FeaturesData, "heading" | "headingAccent" | "subheading"> & { leadMuted?: boolean }) {
  const title = [heading, headingAccent].filter(Boolean).join(" ");
  if (!title && !subheading) return null;

  return (
    <div className="aptus-software-section-heading mx-auto max-w-3xl text-center">
      {title && <h2 className="aptus-software-section-title">{title}</h2>}
      {subheading && (
        <p
          className={
            leadMuted ? "aptus-software-value-lead mt-3" : "aptus-software-section-lead"
          }
        >
          {subheading}
        </p>
      )}
    </div>
  );
}

export function Features({ data }: FeaturesProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isPillars = data.variant === "pillars";
  const isProductCards = data.variant === "product-cards";
  const isValueCards = data.variant === "value-cards";
  const isIconCards = data.variant === "icon-cards";
  const isBulletList = data.variant === "bullet-list";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll(".feature-card");
      if (!cards) return;
      const isSoftware = sectionRef.current?.closest(".aptus-software-page");
      gsap.from(cards, {
        y: isSoftware ? 24 : 40,
        opacity: isSoftware ? 1 : 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 82%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (isProductCards) {
    const colCount = data.gridColumns ?? ((data.items?.length ?? 0) <= 3 ? 3 : 4);

    return (
      <section
        ref={sectionRef}
        id={data.anchorId}
        className="aptus-software-section bg-white aptus-software-products-section"
        data-section="features"
        data-variant="product-cards"
      >
        <div className="aptus-live-container">
          <SoftwareSectionHeading
            heading={data.heading}
            headingAccent={data.headingAccent}
            subheading={data.subheading}
          />
          <div
            className={cn(
              "aptus-software-product-grid",
              colCount === 3 ? "aptus-software-product-grid--3" : "aptus-software-product-grid--4",
            )}
          >
            {data.items?.map((item) => (
              <article key={item.id} className="feature-card aptus-software-product-card">
                {item.media && (
                  <div className="aptus-software-product-media">
                    {item.href ? (
                      <Link href={item.href} className="block h-full w-full">
                        <CmsImage
                          src={item.media.src}
                          alt={item.media.alt}
                          width={120}
                          height={136}
                        />
                      </Link>
                    ) : (
                      <CmsImage
                        src={item.media.src}
                        alt={item.media.alt}
                        width={120}
                        height={136}
                      />
                    )}
                  </div>
                )}
                {item.title && <h3 className="aptus-software-product-title">{item.title}</h3>}
                {item.bullets?.length ? (
                  <ul className="aptus-software-product-body aptus-software-product-body--list">
                    {item.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  item.description && <p className="aptus-software-product-body">{item.description}</p>
                )}
                {item.action && (
                  <Link href={item.action.href} className="aptus-software-btn aptus-software-btn-blue mt-4">
                    {item.action.label}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (isBulletList) {
    return (
      <section
        ref={sectionRef}
        id={data.anchorId}
        className="aptus-software-section bg-white"
        data-section="features"
        data-variant="bullet-list"
      >
        <div className="aptus-live-container">
          <SoftwareSectionHeading
            heading={data.heading}
            headingAccent={data.headingAccent}
            subheading={data.subheading}
          />
          <div className="aptus-software-bullet-panel">
            <ul className="aptus-software-bullet-list">
              {data.items?.map((item) => (
                <li key={item.id}>
                  {item.title && <strong>{item.title}:</strong>}{" "}
                  {item.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  if (isValueCards || isIconCards) {
    const gridClass = isIconCards ? "aptus-software-icon-grid" : "aptus-software-value-grid";
    const iconGridClass =
      isIconCards && data.gridColumns === 5 ? "aptus-software-icon-grid--5" : undefined;
    const cardClass = isIconCards ? "aptus-software-icon-card" : "aptus-software-value-card";
    const iconClass = isIconCards ? "aptus-software-icon-card__icon" : "aptus-software-value-icon";
    const titleClass = isIconCards ? "aptus-software-icon-card__title" : "aptus-software-value-title";
    const bodyClass = isIconCards ? "aptus-software-icon-card__body" : "aptus-software-value-body";

    return (
      <section
        ref={sectionRef}
        id={data.anchorId}
        className={cn(
          "aptus-software-section bg-white",
          isValueCards && data.anchorId !== "why-choose" && "pb-8 pt-2",
          data.anchorId === "why-choose" && "aptus-software-section--why-choose",
          data.anchorId === "benefits" && "aptus-software-benefits-band",
          data.anchorId === "why-elv" && "aptus-software-benefits-band",
        )}
        data-section="features"
        data-variant={data.variant}
        data-id={data.anchorId}
      >
        <div className="aptus-live-container">
          <SoftwareSectionHeading
            heading={data.heading}
            headingAccent={data.headingAccent}
            subheading={data.subheading}
            leadMuted={isValueCards}
          />
          <div className={cn(gridClass, iconGridClass)}>
            {data.items?.map((item) => (
              <article key={item.id} className={`feature-card ${cardClass}`}>
                {item.icon && (
                  <div className="flex justify-center">
                    <PillarIcon name={item.icon} className={iconClass} />
                  </div>
                )}
                {item.title && <h3 className={titleClass}>{item.title}</h3>}
                {item.description && <p className={bodyClass}>{item.description}</p>}
                {isIconCards && item.action && (
                  <Link href={item.action.href} className="aptus-software-btn aptus-software-btn-blue">
                    {item.action.label}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className={cn(isPillars ? "bg-white pb-16 pt-0" : "section-padding bg-brand-light")}
      data-section="features"
      data-variant={data.variant ?? "default"}
    >
      <Container>
        {!isPillars && (data.heading || data.headingAccent || data.subheading) && (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            {(data.heading || data.headingAccent) && (
              <h2 className="text-3xl font-bold text-brand-navy sm:text-4xl">
                {data.heading}
                {data.heading && data.headingAccent && " "}
                {data.headingAccent && (
                  <span className="text-brand-green">{data.headingAccent}</span>
                )}
              </h2>
            )}
            {data.subheading && (
              <p className="mt-4 text-muted-foreground">{data.subheading}</p>
            )}
            <span className="mx-auto mt-4 block h-1 w-14 rounded-full bg-brand-orange" />
          </div>
        )}

        {data.items && data.items.length > 0 && (
          <div
            className={cn(
              isPillars
                ? "grid gap-8 sm:grid-cols-3"
                : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {data.items.map((item) => (
              <article
                key={item.id}
                className={cn(
                  "feature-card",
                  isPillars
                    ? "group text-center"
                    : "rounded-lg border border-border bg-white p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-md)]",
                )}
              >
                {item.icon && (
                  <div
                    className={cn(
                      "mb-4 flex justify-center",
                      !isPillars &&
                        "h-12 w-12 items-center justify-center rounded-lg bg-brand-orange/10 text-2xl text-brand-orange",
                    )}
                  >
                    <PillarIcon name={item.icon} />
                  </div>
                )}
                {item.title && (
                  <h3
                    className={cn(
                      isPillars
                        ? "text-base font-semibold text-brand-blue"
                        : "text-base font-bold text-brand-navy",
                    )}
                  >
                    {item.title}
                  </h3>
                )}
                {!isPillars && item.description && (
                  <p
                    className={cn(
                      "mt-2 text-sm leading-relaxed",
                      isPillars ? "text-[#475569]" : "text-muted-foreground",
                    )}
                  >
                    {item.description}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
