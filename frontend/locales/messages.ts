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
    "/aptus-policy": "Our Policies",
    "/why-aptus-infotech": "Why Aptus Infotech",
    "/winning-together": "Winning together",
    "/aptus-infotech-iso-certifications": "Aptus Infotech ISO Certifications",
    "/careers": "Careers",
    "/contact-us": "Contact Us",
    "/faq": "FAQ",
    "/software-solutions": "Software",
    "/autodesk": "Autodesk",
    "/adobe": "Adobe",
    "/microsoft": "Microsoft",
    "/multimedia-software-solutions": "Multimedia",
    "/cyber-security-solution": "Cyber Security Solutions",
    "/elv-solutions": "ELV Solutions",
    "/aptus-solar": "Aptus Solar",
    "https://www.aptussolartech.com/": "Aptus Solar",
    "/aptus-case-studies": "Solutions in Action",
    "/customer-stories": "Solutions in Action",
    "/cctv-camera": "CCTV",
    "/access-control-system": "Access Control System",
    "/gate-automation": "Gate Automation",
    "/audio-video-solutions": "Audio/Video Solutions",
    "/home-automation": "Smart Homes",
    "/telephone-systems": "Telephone Systems",
    "/network-and-structured-cabling-solutions":
      "Network and Structured Cabling Solutions",
    "/thermal-scanners": "Thermal Scanners",
    "/ups": "UPS",
    "/guest-room-management": "Guest Room Management",
    "/nurse-calling-system": "Nurse Calling System",
    "/conference-room-solution": "Conference Room Solution",
    "/smatv-iptv": "SMATV/IPTV",
    "/switching-and-routing": "Switching and Routing",
    "/data-center-solutions": "Data Center Solutions",
    "/rsi-queue-management": "Queue Management",
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
    "/aptus-policy": "سياساتنا",
    "/why-aptus-infotech": "لماذا أبتس إنفوتك",
    "/winning-together": "ننجح معاً",
    "/aptus-infotech-iso-certifications": "شهادات الأيزو",
    "/careers": "الوظائف",
    "/contact-us": "اتصل بنا",
    "/faq": "الأسئلة الشائعة",
    "/software-solutions": "البرمجيات",
    "/autodesk": "Autodesk",
    "/adobe": "Adobe",
    "/microsoft": "Microsoft",
    "/multimedia-software-solutions": "الوسائط المتعددة",
    "/cyber-security-solution": "حلول الأمن السيبراني",
    "/elv-solutions": "حلول الأنظمة منخفضة الجهد",
    "/aptus-solar": "أبتوس سولار",
    "https://www.aptussolartech.com/": "أبتوس سولار",
    "/aptus-case-studies": "حلول في الميدان",
    "/customer-stories": "حلول في الميدان",
    "/cctv-camera": "كاميرات المراقبة",
    "/access-control-system": "نظام التحكم بالدخول",
    "/gate-automation": "أتمتة البوابات",
    "/audio-video-solutions": "حلول الصوت والصورة",
    "/home-automation": "المنازل الذكية",
    "/telephone-systems": "أنظمة الهاتف",
    "/network-and-structured-cabling-solutions":
      "الشبكات والكابلات المنظمة",
    "/thermal-scanners": "أجهزة الفحص الحراري",
    "/ups": "أنظمة UPS",
    "/guest-room-management": "إدارة غرف الضيوف",
    "/nurse-calling-system": "نظام استدعاء الممرضات",
    "/conference-room-solution": "حلول غرف الاجتماعات",
    "/smatv-iptv": "SMATV/IPTV",
    "/switching-and-routing": "التبديل والتوجيه",
    "/data-center-solutions": "حلول مراكز البيانات",
    "/rsi-queue-management": "إدارة الطوابير",
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
  const key = /^https?:\/\//i.test(href) ? href : href.startsWith("/") ? href : `/${href}`;
  return getMessages(locale).nav[key] ?? fallback;
}
