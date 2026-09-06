import type { Locale } from "@/lib/locale";

/** Flat message catalog for chrome / forms / portal shell. */
export type MessageTree = {
  topBar: {
    contact: string;
    email: string;
    followUs: string;
  };
  auth: {
    login: string;
    register: string;
    portal: string;
    cart: string;
    logout: string;
  };
  common: {
    requestQuote: string;
    submitRequest: string;
    loadingAccount: string;
    learnMore: string;
    readMore: string;
    contactUs: string;
    home: string;
    language: string;
  };
  footer: {
    reachUs: string;
    quickLinks: string;
    rights: string;
  };
  emptyCms: string;
  /** Nav label overrides keyed by href (e.g. "/our-story"). */
  nav: Record<string, string>;
};

export const enMessages: MessageTree = {
  topBar: {
    contact: "Contact:",
    email: "Email:",
    followUs: "Follow Us",
  },
  auth: {
    login: "Login",
    register: "Register",
    portal: "Portal",
    cart: "Cart",
    logout: "Logout",
  },
  common: {
    requestQuote: "Request Quote",
    submitRequest: "Submit Request",
    loadingAccount: "Loading your account…",
    learnMore: "Learn More",
    readMore: "Read More",
    contactUs: "Contact Us",
    home: "Home",
    language: "Language",
  },
  footer: {
    reachUs: "Reach Us",
    quickLinks: "Quick Links",
    rights: "All rights reserved.",
  },
  emptyCms:
    "No page content configured. Connect Odoo CMS to populate this page.",
  nav: {
    "/": "Home",
    "/our-story": "Our Story",
    "/our-team": "Our Team",
    "/aptus-policy": "Aptus Policy",
    "/why-aptus-infotech": "Why Aptus Infotech",
    "/winning-together": "Winning together",
    "/aptus-infotech-iso-certifications": "Aptus Infotech ISO Certifications",
    "/careers": "Careers",
    "/contact-us": "Contact Us",
    "/software-solutions": "Software",
    "/autodesk": "Autodesk",
    "/adobe": "Adobe",
    "/microsoft": "Microsoft",
    "/multimedia-software-solutions": "Multimedia",
    "/cyber-security-solution": "Cyber Security Solutions",
    "/elv-solutions": "ELV Solutions",
    "/aptus-solar": "Aptus Solar",
    "/aptus-case-studies": "Solutions in Action",
    "/customer-stories": "Solutions in Action",
    "/access-control-system": "Access Control System",
    "/thermal-scanners": "Thermal Scanners",
    "/cctv-camera": "CCTV",
    "/gate-automation": "Gate Automation",
    "/home-automation": "Smart Homes",
    "/audio-video-solutions": "Audio/Video Solutions",
    "/telephone-systems": "Telephone Systems",
    "/network-and-structured-cabling-solutions":
      "Network and Structured Cabling Solutions",
    "/ups": "UPS",
    "/guest-room-management": "Guest Room Management",
    "/nurse-calling-system": "Nurse Calling System",
    "/smatv-iptv": "SMATV/ IPTV",
    "/rsi-queue-management": "Queue Management",
    "/data-center-solutions": "Data Center Solutions",
    "/switching-and-routing": "Switching and Routing",
    "/conference-room-solution": "Conference room solution",
  },
};

export const arMessages: MessageTree = {
  topBar: {
    contact: "اتصل:",
    email: "البريد:",
    followUs: "تابعنا",
  },
  auth: {
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    portal: "البوابة",
    cart: "السلة",
    logout: "تسجيل الخروج",
  },
  common: {
    requestQuote: "طلب عرض سعر",
    submitRequest: "إرسال الطلب",
    loadingAccount: "جاري تحميل حسابك…",
    learnMore: "اعرف المزيد",
    readMore: "اقرأ المزيد",
    contactUs: "اتصل بنا",
    home: "الرئيسية",
    language: "اللغة",
  },
  footer: {
    reachUs: "تواصل معنا",
    quickLinks: "روابط سريعة",
    rights: "جميع الحقوق محفوظة.",
  },
  emptyCms:
    "لا يوجد محتوى لهذه الصفحة. اربط نظام إدارة المحتوى لعرض المحتوى.",
  nav: {
    "/": "الرئيسية",
    "/our-story": "قصتنا",
    "/our-team": "فريقنا",
    "/aptus-policy": "سياسة أبتس",
    "/why-aptus-infotech": "لماذا أبتس إنفوتك",
    "/winning-together": "ننجح معاً",
    "/aptus-infotech-iso-certifications": "شهادات الأيزو",
    "/careers": "الوظائف",
    "/contact-us": "اتصل بنا",
    "/software-solutions": "البرمجيات",
    "/autodesk": "Autodesk",
    "/adobe": "Adobe",
    "/microsoft": "Microsoft",
    "/multimedia-software-solutions": "الوسائط المتعددة",
    "/cyber-security-solution": "حلول الأمن السيبراني",
    "/elv-solutions": "حلول الأنظمة منخفضة الجهد",
    "/aptus-solar": "أبتوس سولار",
    "/aptus-case-studies": "حلول في الميدان",
    "/customer-stories": "حلول في الميدان",
    "/access-control-system": "نظام التحكم بالدخول",
    "/thermal-scanners": "أجهزة الفحص الحراري",
    "/cctv-camera": "كاميرات المراقبة",
    "/gate-automation": "أتمتة البوابات",
    "/home-automation": "المنازل الذكية",
    "/audio-video-solutions": "حلول الصوت والصورة",
    "/telephone-systems": "أنظمة الهاتف",
    "/network-and-structured-cabling-solutions":
      "الشبكات والكابلات المنظمة",
    "/ups": "أنظمة UPS",
    "/guest-room-management": "إدارة غرف الضيوف",
    "/nurse-calling-system": "نظام استدعاء الممرضات",
    "/smatv-iptv": "SMATV / IPTV",
    "/rsi-queue-management": "إدارة الطوابير",
    "/data-center-solutions": "حلول مراكز البيانات",
    "/switching-and-routing": "التبديل والتوجيه",
    "/conference-room-solution": "حلول غرف الاجتماعات",
  },
};

export const messagesByLocale: Record<Locale, MessageTree> = {
  en: enMessages,
  ar: arMessages,
};

export function getMessages(locale: Locale): MessageTree {
  return messagesByLocale[locale] ?? enMessages;
}

/** Translate a nav label; fall back to the English source label. */
export function translateNavLabel(
  locale: Locale,
  href: string | undefined,
  fallback: string,
): string {
  if (!href) return fallback;
  const key = href.startsWith("/") ? href : `/${href}`;
  return getMessages(locale).nav[key] ?? fallback;
}
