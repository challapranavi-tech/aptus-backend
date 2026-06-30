(() => {
if (window.__aptusPortalAuthLoaded) {
    return;
}
window.__aptusPortalAuthLoaded = true;

const SESSION_KEY = "aptusPortalSession";
const PROFILE_KEY = "aptusPortalProfile";
const PORTAL_STATE_KEY = "aptusPortalSubscriptionState";
const DEMO_USER_ID = "client-account";
const LEGACY_PORTAL_STATE_KEY = "aptusPortalSubscriptionState";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const DEFAULT_PROTECTED_PATHS = [
    "/customer/dashboard",
    "/customer/purchases",
    "/customer/subscriptions",
    "/customer/renewals",
    "/customer/profile",
];
const portalCfg = window.__aptusPortalConfig || {};
const LOGIN_URL = portalCfg.loginUrl ?? "/customer/login";
const DASHBOARD_URL = portalCfg.dashboardUrl ?? "/customer/dashboard";
const PROTECTED_PATHS = portalCfg.protectedPaths ?? DEFAULT_PROTECTED_PATHS;

function portalRoute(slug) {
    if (portalCfg.routes && Object.prototype.hasOwnProperty.call(portalCfg.routes, slug)) {
        return portalCfg.routes[slug];
    }
    const ext = portalCfg.htmlExtension || "";
    return `/customer/${slug}${ext}`;
}

const accountProfiles = [];

const portalCredentials = new Map();

const purchaseRecords = [
    {
        id: "APT-INV-24018",
        product: "Tyco access control expansion",
        category: "ELV Security",
        seats: 18,
        amount: "OMR 3,420",
        purchasedOn: "12 Feb 2026",
        status: "Delivered",
    },
    {
        id: "APT-INV-24009",
        product: "Hikvision CCTV surveillance bundle",
        category: "Video Surveillance",
        seats: 42,
        amount: "OMR 2,860",
        purchasedOn: "18 Jan 2026",
        status: "Active",
    },
    {
        id: "APT-INV-23144",
        product: "Suprema biometric access terminals",
        category: "Access Control",
        seats: 8,
        amount: "OMR 1,920",
        purchasedOn: "21 Nov 2025",
        status: "Renewed",
    },
];

const subscriptionRecords = [
    {
        product: "Tyco access control",
        plan: "Annual support plan",
        renewalDate: "12 Feb 2027",
        usage: 82,
        seats: "18 controllers covered",
        status: "Active",
    },
    {
        product: "Hikvision video surveillance",
        plan: "Quarterly maintenance",
        renewalDate: "18 Jun 2026",
        usage: 65,
        seats: "42 cameras monitored",
        status: "Active",
    },
    {
        product: "Suprema biometric access",
        plan: "Annual support",
        renewalDate: "21 Nov 2026",
        usage: 48,
        seats: "8 terminals covered",
        status: "Monitoring",
    },
];

const productCatalog = [
    {
        id: "tyco",
        name: "Tyco",
        category: "Access Control",
        icon: "TYC",
        description: "Enterprise access control, fire, and security infrastructure for commercial facilities.",
        monthlyPrice: "OMR 24",
        yearlyPrice: "OMR 20",
        monthlyPeriod: "/ month",
        yearlyPeriod: "/ month",
        renewalDate: "18 Jun 2026",
        isSubscribed: true,
        usage: 74,
    },
    {
        id: "suprema",
        name: "Suprema",
        category: "Biometric Access",
        icon: "SUP",
        description: "Biometric readers, mobile access, and identity management for secured sites.",
        monthlyPrice: "OMR 18",
        yearlyPrice: "OMR 15",
        monthlyPeriod: "/ month",
        yearlyPeriod: "/ month",
        renewalDate: "12 Feb 2027",
        isSubscribed: true,
        usage: 58,
    },
    {
        id: "hikvision",
        name: "Hikvision",
        category: "CCTV Surveillance",
        icon: "HIK",
        description: "IP cameras, NVRs, analytics, and video surveillance systems for business sites.",
        monthlyPrice: "OMR 21",
        yearlyPrice: "OMR 17",
        monthlyPeriod: "/ month",
        yearlyPeriod: "/ month",
        renewalDate: "21 Nov 2026",
        isSubscribed: true,
        usage: 66,
    },
    {
        id: "zkteco",
        name: "ZKTeco",
        category: "Time Attendance",
        icon: "ZKT",
        description: "Time attendance, access terminals, turnstiles, and workforce access solutions.",
        monthlyPrice: "OMR 16",
        yearlyPrice: "OMR 13",
        monthlyPeriod: "/ month",
        yearlyPeriod: "/ month",
        renewalDate: "",
        isSubscribed: false,
        usage: 0,
    },
    {
        id: "watchnet",
        name: "WatchNet",
        category: "Security Systems",
        icon: "WNT",
        description: "Surveillance, alarm, and access control products for integrated ELV projects.",
        monthlyPrice: "OMR 14",
        yearlyPrice: "OMR 11",
        monthlyPeriod: "/ month",
        yearlyPeriod: "/ month",
        renewalDate: "",
        isSubscribed: false,
        usage: 0,
    },
    {
        id: "autodesk",
        name: "Autodesk",
        category: "Engineering Software",
        icon: "ADS",
        description: "Design, drafting, and BIM software licensing for engineering project teams.",
        monthlyPrice: "OMR 32",
        yearlyPrice: "OMR 27",
        monthlyPeriod: "/ month",
        yearlyPeriod: "/ month",
        renewalDate: "",
        isSubscribed: false,
        usage: 0,
    },
];

/** Software subscription catalog per Product Purchase Flow diagram. */
const softwareProductCategories = [
    {
        id: "adobe",
        name: "Adobe",
        icon: "ADO",
        products: [
            { id: "photoshop", name: "Photoshop", price1Year: 95, price3Year: 240 },
            { id: "illustrator", name: "Illustrator", price1Year: 90, price3Year: 225 },
            { id: "acrobat-pro", name: "Acrobat Pro", price1Year: 75, price3Year: 190 },
            { id: "creative-cloud", name: "Creative Cloud", price1Year: 180, price3Year: 450 },
        ],
    },
    {
        id: "microsoft",
        name: "Microsoft",
        icon: "MSF",
        products: [
            { id: "microsoft-365", name: "Microsoft 365", price1Year: 110, price3Year: 280 },
            { id: "windows-server", name: "Windows Server", price1Year: 320, price3Year: 820 },
            { id: "azure", name: "Azure", price1Year: 150, price3Year: 380 },
            { id: "visio", name: "Visio", price1Year: 85, price3Year: 215 },
        ],
    },
    {
        id: "autodesk",
        name: "Autodesk",
        icon: "ADS",
        products: [
            { id: "autocad", name: "AutoCAD", price1Year: 420, price3Year: 1050 },
            { id: "revit", name: "Revit", price1Year: 480, price3Year: 1200 },
            { id: "maya", name: "Maya", price1Year: 390, price3Year: 980 },
            { id: "inventor", name: "Inventor", price1Year: 450, price3Year: 1120 },
        ],
    },
    {
        id: "antivirus",
        name: "Antivirus",
        icon: "AVS",
        products: [
            { id: "kaspersky", name: "Kaspersky Endpoint", price1Year: 45, price3Year: 115 },
            { id: "symantec", name: "Symantec Endpoint Protection", price1Year: 52, price3Year: 130 },
            { id: "bitdefender", name: "Bitdefender GravityZone", price1Year: 40, price3Year: 100 },
            { id: "mcafee", name: "McAfee Total Protection", price1Year: 38, price3Year: 95 },
        ],
    },
];

const softwareSubscriptionDurations = [
    { id: "1year", label: "1 Year" },
    { id: "3year", label: "3 Years" },
];

const groupPlans = [
    {
        id: "group-basic",
        name: "Basic",
        tagline: "For small teams getting started with essential product coverage.",
        productLimit: 3,
        monthlyPrice: "OMR 49",
        yearlyPrice: "OMR 41",
        monthlyPeriod: "/ month",
        yearlyPeriod: "/ month, billed yearly",
        badge: "",
        cta: "Choose Basic",
        isActive: false,
        isRecommended: false,
        features: ["Up to 3 products", "Team billing profile", "Shared renewal calendar", "Member-level visibility", "Email support"],
    },
    {
        id: "group-professional",
        name: "Professional",
        tagline: "For growing teams coordinating multiple product subscriptions.",
        productLimit: 5,
        monthlyPrice: "OMR 99",
        yearlyPrice: "OMR 83",
        monthlyPeriod: "/ month",
        yearlyPeriod: "/ month, billed yearly",
        badge: "Recommended",
        cta: "Current Plan",
        isActive: true,
        isRecommended: true,
        features: ["Up to 5 products", "Team billing and invoices", "Group permissions", "Admin controls", "Renewal approval workflow", "Priority support"],
    },
    {
        id: "group-enterprise",
        name: "Enterprise",
        tagline: "For large organizations needing full product coverage and governance.",
        productLimit: 7,
        monthlyPrice: "OMR 179",
        yearlyPrice: "OMR 150",
        monthlyPeriod: "/ month",
        yearlyPeriod: "/ month, billed yearly",
        badge: "Enterprise",
        cta: "Upgrade Plan",
        isActive: false,
        isRecommended: false,
        features: ["Up to 7 products", "Custom governance controls", "Dedicated success manager", "Advanced reporting", "Procurement integrations", "SLA-backed support"],
    },
    {
        id: "group-custom",
        name: "Custom",
        tagline: "Build your own subscription bundle with complete product flexibility.",
        productLimit: null,
        monthlyPrice: "Custom",
        yearlyPrice: "Custom",
        monthlyPeriod: "",
        yearlyPeriod: "",
        badge: "Flexible",
        cta: "Build Custom Plan",
        isActive: false,
        isRecommended: false,
        features: ["Unlimited product selection", "Custom pricing structure", "Tailored billing cycles", "Dedicated account manager", "Custom SLA terms"],
    },
];

const groupSubscribedProducts = ["tyco", "suprema", "hikvision"];

const subscriptionCheckoutSteps = [
    "Subscription",
    "Billing",
    "Payment",
    "Review",
];

const paymentMethods = [
    {
        id: "card",
        label: "Credit / Debit Card",
        note: "Pay securely using your business card.",
        supportsCardForm: true,
    },
    {
        id: "apple-pay",
        label: "Apple Pay",
        note: "Fast checkout on supported Apple devices.",
        supportsCardForm: false,
    },
    {
        id: "google-pay",
        label: "Google Pay",
        note: "Use a saved Google payment profile.",
        supportsCardForm: false,
    },
    {
        id: "thawani",
        label: "Thawani Pay",
        note: "Oman online payment gateway handoff.",
        supportsCardForm: false,
    },
];

const renewalSchedule = [
    {
        product: "Hikvision video surveillance",
        owner: "Sara Mathew",
        dueDate: "18 Jun 2026",
        amount: "OMR 21 / month",
        status: "Due Soon",
    },
    {
        product: "Suprema biometric access",
        owner: "Aptus Customer Success",
        dueDate: "21 Nov 2026",
        amount: "OMR 1,920",
        status: "Scheduled",
    },
    {
        product: "Tyco access control",
        owner: "Anagha R",
        dueDate: "12 Feb 2027",
        amount: "OMR 3,420",
        status: "Planned",
    },
];

const portalNotifications = [
    {
        title: "Hikvision maintenance window opens this month",
        detail: "Review camera coverage and NVR health before the June service cycle closes.",
        status: "Action Required",
    },
    {
        title: "Suprema access coverage confirmed",
        detail: "Annual biometric terminal support is aligned with the current access control estate.",
        status: "Confirmed",
    },
];

const activityLog = [
    {
        event: "Hikvision surveillance usage reviewed",
        timestamp: "29 May 2026, 09:24",
        owner: "Aptus Customer Success",
    },
    {
        event: "Invoice APT-INV-24018 delivered to billing contact",
        timestamp: "12 Feb 2026, 14:10",
        owner: "Finance Operations",
    },
    {
        event: "Tyco access controllers mapped across secured zones",
        timestamp: "13 Feb 2026, 11:35",
        owner: "Anagha R",
    },
];

function getSharedPortalRefresh() {
    if (!window.__aptusPortalRefresh) {
        window.__aptusPortalRefresh = { accessToken: null, expiresAt: 0, promise: null };
    }
    return window.__aptusPortalRefresh;
}

function storePortalAccessToken(accessToken, expiresInSec) {
    if (!accessToken || !expiresInSec) {
        return;
    }
    const shared = getSharedPortalRefresh();
    shared.accessToken = accessToken;
    shared.expiresAt = Date.now() + expiresInSec * 1000 - 30_000;
}

async function refreshPortalAccessToken() {
    const shared = getSharedPortalRefresh();
    if (shared.accessToken && Date.now() < shared.expiresAt) {
        return shared.accessToken;
    }
    if (shared.promise) {
        return shared.promise;
    }
    shared.promise = (async () => {
        try {
            const response = await fetch("/api/auth/refresh", {
                method: "POST",
                credentials: "include",
            });
            if (!response.ok) {
                shared.accessToken = null;
                shared.expiresAt = 0;
                return null;
            }
            const data = await response.json().catch(() => ({}));
            if (data.accessToken && data.expiresIn) {
                storePortalAccessToken(data.accessToken, data.expiresIn);
                return data.accessToken;
            }
            return null;
        } catch {
            shared.accessToken = null;
            shared.expiresAt = 0;
            return null;
        } finally {
            shared.promise = null;
        }
    })();
    return shared.promise;
}

async function getPortalAccessToken() {
    const shared = getSharedPortalRefresh();
    if (shared.accessToken && Date.now() < shared.expiresAt) {
        return shared.accessToken;
    }
    return refreshPortalAccessToken();
}

async function portalApiFetch(url, init = {}) {
    const headers = new Headers(init.headers || {});
    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    let token = await getPortalAccessToken();
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    let response = await fetch(url, { ...init, headers, credentials: "include" });
    if (response.status === 401) {
        token = await refreshPortalAccessToken();
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
            response = await fetch(url, { ...init, headers, credentials: "include" });
        }
    }
    return response;
}

const portalAccessGateway = {
    async verifyCredentials({ email, password, remember = true }) {
        if (portalCfg.useApiAuth !== false) {
            try {
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ email, password, remember }),
                });
                const data = await response.json().catch(() => ({}));
                if (response.ok && data.accessToken && data.expiresIn) {
                    storePortalAccessToken(data.accessToken, data.expiresIn);
                }
                if (response.status === 404 && data.code === "ACCOUNT_NOT_FOUND") {
                    return { status: "not_found", email };
                }
                if (response.status === 404 && data.code === "PARTNER_EXISTS_NO_PORTAL") {
                    return {
                        status: "partner_exists",
                        email,
                        prefill: data.prefill ?? { email },
                    };
                }
                if (response.status === 401 && data.code === "INVALID_CREDENTIALS" && data.accountExists) {
                    return {
                        status: "account_exists",
                        email,
                        maskedEmail: data.maskedEmail ?? "",
                        maskedPhone: data.maskedPhone ?? "",
                    };
                }
                if (!response.ok) {
                    return { status: "invalid_password" };
                }
                return { status: "ok", user: data.user ?? null };
            } catch {
                return { status: "invalid_password" };
            }
        }
        const account = accountProfiles.find((item) => item.email === email);
        if (!account) {
            return { status: "not_found", email };
        }
        if (portalCredentials.get(email) !== password) {
            return { status: "invalid_password" };
        }
        return { status: "ok", user: account };
    },
};

function getStorage(preferred = window.localStorage) {
    try {
        const testKey = `${SESSION_KEY}:test`;
        preferred.setItem(testKey, "1");
        preferred.removeItem(testKey);
        return preferred;
    } catch {
        return window.sessionStorage;
    }
}

function readSessionFrom(storage) {
    try {
        return JSON.parse(storage.getItem(SESSION_KEY) || "null");
    } catch {
        storage.removeItem(SESSION_KEY);
        return null;
    }
}

function getSession() {
    const stores = [window.localStorage, window.sessionStorage];
    for (const storage of stores) {
        const session = readSessionFrom(storage);
        if (!session) {
            continue;
        }
        if (!session.userId || Date.now() > Number(session.expiresAt || 0)) {
            storage.removeItem(SESSION_KEY);
            continue;
        }
        return session;
    }
    return null;
}

function getStoredProfile(user) {
    try {
        const profile = JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "{}");
        return { ...user, ...profile };
    } catch {
        return { ...user };
    }
}

function initialsFromName(name) {
    return String(name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");
}

function profileFromSession(session) {
    const name = session.name || session.email || "Customer";
    return getStoredProfile({
        id: session.userId,
        email: session.email || "",
        name,
        initials: session.initials || initialsFromName(name),
        role: session.role || "Customer",
        company: session.company || "Aptus account",
        phone: session.phone || "",
        location: session.location || "",
        accountManager: session.accountManager || "Aptus Support",
        supportTier: session.supportTier || "Standard",
        customerSince: session.customerSince || "",
        billingCycle: session.billingCycle || "",
        paymentTerms: session.paymentTerms || "",
        contactType: session.contactType || "person",
        street: session.street || "",
        street2: session.street2 || "",
        city: session.city || "",
        state: session.state || "",
        zip: session.zip || "",
        country: session.country || "",
        taxId: session.taxId || "",
        website: session.website || "",
        language: session.language || "en_US",
        tags: session.tags || "",
    });
}

function getCurrentUser() {
    const session = getSession();
    if (!session) {
        return null;
    }
    const user = accountProfiles.find((item) => item.id === session.userId);
    if (user) {
        return getStoredProfile(user);
    }
    return profileFromSession(session);
}

function setSession(user, remember = true) {
    clearSession();
    resetPortalStateCache();
    const storage = getStorage(remember ? window.localStorage : window.sessionStorage);
    const authenticatedAt = Date.now();
    storage.setItem(
        SESSION_KEY,
        JSON.stringify({
            userId: user.id,
            email: user.email,
            name: user.name,
            initials: user.initials,
            role: user.role,
            company: user.company,
            phone: user.phone,
            location: user.location,
            accountManager: user.accountManager,
            supportTier: user.supportTier,
            customerSince: user.customerSince,
            billingCycle: user.billingCycle,
            paymentTerms: user.paymentTerms,
            contactType: user.contactType,
            street: user.street,
            street2: user.street2,
            city: user.city,
            state: user.state,
            zip: user.zip,
            country: user.country,
            taxId: user.taxId,
            website: user.website,
            language: user.language,
            tags: user.tags,
            authenticatedAt,
            expiresAt: authenticatedAt + SESSION_TTL_MS,
        })
    );
    document.dispatchEvent(new CustomEvent("aptus:session-changed"));
}

function clearSession() {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    resetPortalStateCache();
    document.dispatchEvent(new CustomEvent("aptus:session-changed"));
}

function normalizePortalPath(pathname) {
    let path = String(pathname || "").split("?")[0];
    if (path.endsWith("/index.html")) {
        path = path.slice(0, -"/index.html".length);
    } else if (path.endsWith(".html")) {
        path = path.slice(0, -5);
    }
    if (!path.endsWith("/")) {
        path = `${path}/`;
    }
    return path;
}

function isProtectedPath(pathname = window.location.pathname) {
    const path = normalizePortalPath(pathname);
    return PROTECTED_PATHS.some((protectedPath) => normalizePortalPath(protectedPath) === path);
}

function getNextUrl() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
        return next;
    }
    return DASHBOARD_URL;
}

function getLoginUrlWithNext() {
    if (!isProtectedPath()) {
        return LOGIN_URL;
    }
    return `${LOGIN_URL}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}

function redirectTo(url) {
    window.location.assign(url);
}

function portalStateStorageKey(userId) {
    return userId ? `${PORTAL_STATE_KEY}:${userId}` : PORTAL_STATE_KEY;
}

function renderEmptyState(message) {
    return `<div class="aptus-empty-state"><p>${escapeHtml(message)}</p></div>`;
}

function billingSummaryText(user) {
    const parts = [user.billingCycle, user.paymentTerms ? `Payment terms: ${user.paymentTerms}` : ""].filter(Boolean);
    return parts.length ? `${parts.join(". ")}.` : "Billing details will appear after your first purchase.";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function statusClass(status) {
    return String(status ?? "unknown").toLowerCase().replace(/\s+/g, "-");
}

function maskLicenseId(licenseId) {
    if (!licenseId) {
        return "············";
    }
    return "·".repeat(Math.max(licenseId.length, 12));
}

function renderLicenseIdField(subscription) {
    if (!subscription.licenseId) {
        return "";
    }
    const masked = maskLicenseId(subscription.licenseId);
    return `
        <div class="aptus-license-id" data-aptus-license-id="${escapeHtml(subscription.id)}">
            <span>License ID</span>
            <div class="aptus-license-id__value">
                <strong data-aptus-license-display="true">${escapeHtml(masked)}</strong>
                <button type="button" class="aptus-license-id__toggle" data-aptus-license-toggle="true"
                    aria-label="Reveal license ID" aria-pressed="false" title="Show license ID">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function renderSoftwareCategoryAccordion(category, expanded = false) {
    return `
        <article class="aptus-software-category${expanded ? " is-expanded" : ""}" data-aptus-software-category="${escapeHtml(category.id)}">
            <button type="button" class="aptus-software-category__toggle" data-aptus-category-toggle="true"
                aria-expanded="${expanded ? "true" : "false"}">
                <span class="aptus-product-card__icon" aria-hidden="true">${escapeHtml(category.icon)}</span>
                <span>
                    <strong>${escapeHtml(category.name)}</strong>
                    <small>${category.products.length} products available</small>
                </span>
                <em aria-hidden="true">${expanded ? "−" : "+"}</em>
            </button>
            <div class="aptus-software-category__products" data-aptus-category-products="true"${expanded ? "" : " hidden"}>
                ${category.products.map((product) => `
                    <label class="aptus-software-product">
                        <input type="checkbox" name="aptus-software-product" value="${escapeHtml(product.id)}"
                            data-aptus-product-category="${escapeHtml(category.name)}"
                            data-aptus-product-name="${escapeHtml(product.name)}"/>
                        <span class="aptus-software-product__control"></span>
                        <span>
                            <strong>${escapeHtml(product.name)}</strong>
                            <small>${escapeHtml(category.name)}</small>
                        </span>
                        <label class="aptus-software-product__qty">
                            <span>Qty</span>
                            <input type="number" min="1" max="999" value="1" data-aptus-product-qty="${escapeHtml(product.id)}" disabled/>
                        </label>
                    </label>
                `).join("")}
            </div>
        </article>
    `;
}

function renderSoftwarePurchaseSection() {
    const user = getCurrentUser();
    return `
        <section class="aptus-dashboard-card aptus-software-purchase" data-aptus-software-purchase="true">
            <div class="aptus-dashboard-section-head">
                <div>
                    <span class="aptus-section__eyebrow">Product Purchase</span>
                    <h2>Browse software categories and place your order</h2>
                    <p>Expand a category, select one or more products, choose a subscription duration, and submit your request. Our team will review your request and provide confirmation within 48 hours. Payment is collected only after approval.</p>
                </div>
            </div>
            <div class="aptus-software-purchase__layout">
                <div class="aptus-software-purchase__catalog">
                    <h3>Product Categories</h3>
                    <div class="aptus-software-category-list">
                        ${softwareProductCategories.map((category, index) => renderSoftwareCategoryAccordion(category, index === 0)).join("")}
                    </div>
                </div>
                <aside class="aptus-software-purchase__order">
                    <h3>Order Summary</h3>
                    <div class="aptus-software-order-empty" data-aptus-order-empty="true">
                        Select products from the categories to build your order.
                    </div>
                    <div class="aptus-software-order-form" data-aptus-order-form="true" hidden>
                        <div class="aptus-software-order-selected" data-aptus-order-selected="true"></div>
                        <fieldset class="aptus-software-duration">
                            <legend>Subscription Duration</legend>
                            ${softwareSubscriptionDurations.map((duration, index) => `
                                <label class="aptus-software-duration__option">
                                    <input type="radio" name="aptus-software-duration" value="${escapeHtml(duration.id)}" ${index === 0 ? "checked" : ""}/>
                                    <span>${escapeHtml(duration.label)}</span>
                                </label>
                            `).join("")}
                        </fieldset>
                        <div class="aptus-software-contact">
                            <label>
                                <span>Contact Name</span>
                                <input type="text" name="contactName" value="${escapeHtml(user?.name || "")}"/>
                            </label>
                            <label>
                                <span>Contact Email</span>
                                <input type="email" name="contactEmail" value="${escapeHtml(user?.email || "")}"/>
                            </label>
                            <label>
                                <span>Contact Phone</span>
                                <input type="tel" name="contactPhone" value="${escapeHtml(user?.phone || "")}"/>
                            </label>
                        </div>
                        <div class="aptus-software-order-total" data-aptus-order-total="true" hidden>
                            <span>Estimated total</span>
                            <strong data-aptus-order-total-amount="true">OMR 0</strong>
                        </div>
                        <label class="aptus-software-message">
                            <span>Message for our team (optional)</span>
                            <textarea
                                name="customerMessage"
                                rows="3"
                                maxlength="2000"
                                placeholder="Add any questions, concerns, or special requirements for your order."
                            ></textarea>
                        </label>
                        <div
                            class="aptus-software-submit-alert"
                            data-aptus-order-submit-alert="true"
                            role="alert"
                            hidden
                        ></div>
                        <button type="button" class="btn btn-aptus-primary aptus-software-place-order" data-aptus-submit-request="true">
                            Submit Request
                        </button>
                    </div>
                </aside>
            </div>
        </section>
    `;
}

function renderOrderConfirmationModal() {
    return `
        <div class="aptus-order-confirm-backdrop" data-aptus-order-confirm-modal="true" role="presentation">
            <section class="aptus-order-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="aptus_order_confirm_title" tabindex="-1">
                <span class="aptus-order-confirm-modal__icon" aria-hidden="true">✓</span>
                <h2 id="aptus_order_confirm_title">Request Submitted</h2>
                <p>Your request has been submitted successfully.<br/>Our team will review your request and provide confirmation within 48 hours.</p>
                <button type="button" class="btn btn-aptus-primary" data-aptus-order-confirm-close="true">OK</button>
            </section>
        </div>
    `;
}

function renderRenewalConfirmationModal() {
    return `
        <div class="aptus-order-confirm-backdrop" data-aptus-renewal-confirm-modal="true" role="presentation">
            <section class="aptus-order-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="aptus_renewal_confirm_title" tabindex="-1">
                <span class="aptus-order-confirm-modal__icon" aria-hidden="true">✓</span>
                <h2 id="aptus_renewal_confirm_title">Renewal Request Submitted</h2>
                <p>Your renewal request has been submitted.<br/>Your subscription will be renewed within 48 hours.</p>
                <button type="button" class="btn btn-aptus-primary" data-aptus-renewal-confirm-close="true">OK</button>
            </section>
        </div>
    `;
}

function setText(root, key, value) {
    root.querySelectorAll(`[data-aptus-bind="${key}"]`).forEach((element) => {
        element.textContent = value;
    });
}

function getWelcomeText(section, user) {
    const messages = {
        purchases: `Browse software, place orders, and track purchase requests for ${user.company}.`,
        subscriptions: `Active licenses and subscriptions for ${user.company}.`,
        renewals: `Renewal pipeline for ${user.company}.`,
        notifications: "Order updates, subscription events, renewals, and account announcements.",
        profile: `Manage your account details for ${user.company}.`,
    };
    return (
        messages[section] ||
        `Welcome back, ${user.name}. Track subscriptions, renewals, purchases, and support activity from one clean workspace.`
    );
}

function hydrateDashboard(root, user) {
    const section = root.dataset.aptusDashboardSection || "dashboard";
    setText(root, "accountManager", user.accountManager);
    setText(root, "company", user.company);
    setText(root, "initials", user.initials);
    setText(root, "supportTier", user.supportTier);
    setText(root, "userName", user.name);
    setText(root, "welcomeText", getWelcomeText(section, user));
    root.querySelectorAll("[data-aptus-avatar]").forEach((avatar) => {
        if (user.avatarDataUrl) {
            avatar.style.backgroundImage = `url("${user.avatarDataUrl}")`;
            avatar.textContent = "";
            avatar.classList.add("has-image");
        } else {
            avatar.style.backgroundImage = "";
            avatar.textContent = user.initials;
            avatar.classList.remove("has-image");
        }
    });
}

function isCountableActiveSubscription(subscription) {
    return ["Active", "Expiring Soon", "Confirmed"].includes(subscription.status);
}

function getActiveSubscriptions(state) {
    return state.subscriptions.filter(isCountableActiveSubscription);
}

function mapApiSubscriptionItem(item, index) {
    const productId = String(item.productName || `product-${index}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    return {
        id: item.lineId ? `SUB-LINE-${item.lineId}` : `SUB-${productId}-${index}`,
        productId,
        productName: item.productName || "Subscription",
        plan: "Subscription",
        status: item.status || "Active",
        purchasedOnISO: item.renewalDateIso || "",
        renewalDateISO: item.renewalDateIso || "",
        usage: 0,
        seats: 1,
        amount: "",
        licenseId: item.licenseKey || "",
    };
}

function applyApiSubscriptions(apiSubscriptions) {
    const state = ensurePortalState();
    state.subscriptions = Array.isArray(apiSubscriptions)
        ? apiSubscriptions.map(mapApiSubscriptionItem)
        : [];
    setPortalState(state);
}

async function syncSubscriptionsFromApi() {
    if (portalCfg.useApiAuth === false) {
        return;
    }
    try {
        const response = await portalApiFetch("/api/subscriptions");
        if (!response.ok) {
            return;
        }
        const data = await response.json().catch(() => ({}));
        applyApiSubscriptions(data.subscriptions);
    } catch {
        /* keep existing subscription metrics on transient fetch errors */
    }
}

function dashboardSummaryData() {
    const state = ensurePortalState();
    const activeSubscriptions = getActiveSubscriptions(state);
    const renewalsDue = activeSubscriptions.filter((item) => daysUntil(item.renewalDateISO) <= 45).length;
    const nextRenewal = activeSubscriptions
        .slice()
        .sort((a, b) => new Date(a.renewalDateISO) - new Date(b.renewalDateISO))[0];
    const lastBilling = state.billingHistory[0]?.total || "OMR 0";

    return {
        activeSubscriptions: activeSubscriptions.length,
        renewalsDue,
        nextRenewal,
        lastBilling,
    };
}

function metricCard(label, value, description, modifier = "", meta = "Live") {
    const modifierClass = modifier ? ` aptus-dashboard-metric--${modifier}` : "";
    return `
        <article class="aptus-dashboard-card aptus-dashboard-metric${modifierClass}">
            <div class="aptus-dashboard-metric__top">
                <span>${escapeHtml(label)}</span>
                <em>${escapeHtml(meta)}</em>
            </div>
            <strong class="aptus-dashboard-metric__value">${escapeHtml(value)}</strong>
            <p>${escapeHtml(description)}</p>
        </article>
    `;
}

function renderMetrics() {
    const { activeSubscriptions, renewalsDue, lastBilling } = dashboardSummaryData();
    const state = ensurePortalState();
    const hasBilling = state.billingHistory.length > 0;
    return `
        <section class="aptus-dashboard-grid aptus-dashboard-grid--metrics">
            ${metricCard("Active Subscriptions", activeSubscriptions, activeSubscriptions ? "Products currently enabled for this account" : "No active subscriptions yet", "", activeSubscriptions ? "Healthy" : "New")}
            ${metricCard("Renewals Due", renewalsDue, renewalsDue ? "Active subscriptions inside the 45 day window" : "No renewals scheduled in the next 45 days", "compact", renewalsDue ? "Watch" : "Clear")}
            ${metricCard("Latest Billing", lastBilling, hasBilling ? "Most recent paid transaction total" : "No billing activity yet", "compact", hasBilling ? "Paid" : "None")}
        </section>
    `;
}

function renderOverviewHero(user) {
    const { activeSubscriptions, renewalsDue, nextRenewal, lastBilling } = dashboardSummaryData();
    const renewalText = nextRenewal
        ? `${nextRenewal.productName} renews ${formatDisplayDate(nextRenewal.renewalDateISO)}`
        : "No active renewals scheduled";
    const statusLabel = activeSubscriptions ? "Healthy" : "New";
    const workspaceText = activeSubscriptions
        ? `${user.supportTier} support with ${activeSubscriptions} active subscription${activeSubscriptions === 1 ? "" : "s"}. Your workspace is current and ready for product access, renewals, billing, and account actions.`
        : `${user.supportTier} support with no active subscriptions yet. Browse products or contact Aptus to get started.`;

    return `
        <section class="aptus-overview-hero" aria-label="Account overview">
            <article class="aptus-overview-hero__primary">
                <div>
                    <span class="aptus-overview-kicker">Account Status</span>
                    <h2>${escapeHtml(user.company)}</h2>
                    <p>${escapeHtml(workspaceText)}</p>
                </div>
                <mark class="aptus-status aptus-status--active">${escapeHtml(statusLabel)}</mark>
            </article>
            <article class="aptus-overview-hero__insight">
                <span>Next Renewal</span>
                <strong>${escapeHtml(renewalText)}</strong>
                <p>${renewalsDue ? `${renewalsDue} renewal${renewalsDue === 1 ? "" : "s"} need attention within 45 days.` : "No renewals need attention within 45 days."}</p>
            </article>
            <article class="aptus-overview-hero__insight">
                <span>Billing</span>
                <strong>${escapeHtml(lastBilling)}</strong>
                <p>${escapeHtml(billingSummaryText(user))}</p>
            </article>
        </section>
    `;
}

function renderPurchases(limit) {
    const purchases = limit ? purchaseRecords.slice(0, limit) : purchaseRecords;
    return `
        <section class="aptus-dashboard-card">
            <div class="aptus-dashboard-section-head">
                <div>
                    <span>Transaction History</span>
                    <h2>Recent software and support purchases</h2>
                </div>
                ${limit ? `<a href="${portalRoute("purchases")}">View all</a>` : ""}
            </div>
            <div class="aptus-dashboard-table" role="table" aria-label="Customer purchases">
                <div class="aptus-dashboard-table__row aptus-dashboard-table__head" role="row">
                    <span>Invoice</span>
                    <span>Product</span>
                    <span>Seats</span>
                    <span>Amount</span>
                    <span>Status</span>
                </div>
                ${purchases.length
                    ? purchases
                          .map(
                              (purchase) => `
                            <div class="aptus-dashboard-table__row" role="row">
                                <span data-label="Invoice">${escapeHtml(purchase.id)}</span>
                                <span data-label="Product"><strong>${escapeHtml(purchase.product)}</strong><small>${escapeHtml(purchase.category)} · ${escapeHtml(purchase.purchasedOn)}</small></span>
                                <span data-label="Seats">${escapeHtml(purchase.seats)}</span>
                                <span data-label="Amount">${escapeHtml(purchase.amount)}</span>
                                <span data-label="Status"><mark class="aptus-status aptus-status--${statusClass(purchase.status)}">${escapeHtml(purchase.status)}</mark></span>
                            </div>
                        `
                          )
                          .join("")
                    : renderEmptyState("No purchases yet. Completed orders and invoices will appear here.")}
            </div>
        </section>
    `;
}

function renderSubscriptions(limit) {
    const subscriptions = limit ? subscriptionRecords.slice(0, limit) : subscriptionRecords;
    if (!limit) {
        return renderSubscriptionManagement();
    }
    return `
        <section class="aptus-dashboard-card">
            <div class="aptus-dashboard-section-head">
                <div>
                    <span>Subscriptions</span>
                    <h2>Active plans and license usage</h2>
                </div>
                ${limit ? `<a href="${portalRoute("subscriptions")}">Manage view</a>` : ""}
            </div>
            <div class="aptus-subscription-list">
                ${subscriptions.length
                    ? subscriptions
                          .map(
                              (subscription) => `
                            <article class="aptus-subscription-card">
                                <div>
                                    <span>${escapeHtml(subscription.plan)}</span>
                                    <h3>${escapeHtml(subscription.product)}</h3>
                                    <p>${escapeHtml(subscription.seats)}</p>
                                </div>
                                <div class="aptus-subscription-card__meta">
                                    <mark class="aptus-status aptus-status--${statusClass(subscription.status)}">${escapeHtml(subscription.status)}</mark>
                                    <strong>Renews ${escapeHtml(subscription.renewalDate)}</strong>
                                </div>
                                <div class="aptus-progress" aria-label="${escapeHtml(subscription.product)} usage">
                                    <span style="width: ${subscription.usage}%"></span>
                                </div>
                            </article>
                        `
                          )
                          .join("")
                    : renderEmptyState("No active subscriptions yet. Browse products to subscribe.")}
            </div>
        </section>
    `;
}

function renderBillingToggle() {
    return `
        <div class="aptus-billing-toggle" role="group" aria-label="Billing cycle">
            <button type="button" class="is-active" data-aptus-billing="monthly" aria-pressed="true">Monthly</button>
            <button type="button" data-aptus-billing="yearly" aria-pressed="false">Yearly <span>Save 15%</span></button>
        </div>
    `;
}

function renderFeatureList(features) {
    return `
        <ul class="aptus-plan-features">
            ${features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}
        </ul>
    `;
}

function renderProductSlots(plan) {
    if (plan.productLimit === null) {
        return `
            <div class="aptus-plan-slots aptus-plan-slots--custom">
                <span>Unlimited products</span>
                <div class="aptus-plan-slot-row">
                    <div class="aptus-plan-slot is-used"></div>
                    <div class="aptus-plan-slot is-used"></div>
                    <div class="aptus-plan-slot is-used"></div>
                    <div class="aptus-plan-slot is-plus" aria-hidden="true">+</div>
                </div>
            </div>
        `;
    }
    const slots = Array.from({ length: plan.productLimit }, () => `<div class="aptus-plan-slot"></div>`).join("");
    return `
        <div class="aptus-plan-slots">
            <span>${plan.productLimit} product slot${plan.productLimit !== 1 ? "s" : ""} included</span>
            <div class="aptus-plan-slot-row">${slots}</div>
        </div>
    `;
}

function renderGroupPlanCard(plan) {
    const cardClass = [
        "aptus-pricing-card",
        "aptus-pricing-card--group",
        plan.isRecommended ? "is-recommended" : "",
        plan.isActive ? "is-active" : "",
    ].filter(Boolean).join(" ");

    return `
        <article class="${cardClass}" data-aptus-pricing-card="true"
            data-monthly-price="${escapeHtml(plan.monthlyPrice)}"
            data-yearly-price="${escapeHtml(plan.yearlyPrice)}"
            data-monthly-period="${escapeHtml(plan.monthlyPeriod)}"
            data-yearly-period="${escapeHtml(plan.yearlyPeriod)}">
            <div class="aptus-pricing-card__top">
                <div>
                    ${plan.badge ? `<span class="aptus-plan-badge">${escapeHtml(plan.badge)}</span>` : ""}
                    <h3>${escapeHtml(plan.name)}</h3>
                    <p>${escapeHtml(plan.tagline)}</p>
                </div>
                ${plan.isActive ? `<mark class="aptus-status aptus-status--active">Active</mark>` : ""}
            </div>
            <div class="aptus-plan-price" aria-label="${escapeHtml(plan.name)} price">
                <strong data-aptus-price="true">${escapeHtml(plan.monthlyPrice)}</strong>
                <span data-aptus-period="true">${escapeHtml(plan.monthlyPeriod)}</span>
            </div>
            ${renderProductSlots(plan)}
            ${renderFeatureList(plan.features)}
            <button type="button" class="btn ${plan.isActive ? "btn-aptus-outline" : "btn-aptus-primary"} w-100"
                data-aptus-plan-action="${plan.isActive ? "manage" : "checkout"}"
                data-aptus-plan-target="${escapeHtml(plan.id)}">
                ${escapeHtml(plan.cta)}
            </button>
        </article>
    `;
}

function renderProductCard(product) {
    const subscribedClass = product.isSubscribed ? " is-subscribed" : "";
    return `
        <article class="aptus-product-card${subscribedClass}" data-aptus-product-id="${escapeHtml(product.id)}"
            data-aptus-pricing-card="true"
            data-monthly-price="${escapeHtml(product.monthlyPrice)}"
            data-yearly-price="${escapeHtml(product.yearlyPrice)}"
            data-monthly-period="${escapeHtml(product.monthlyPeriod)}"
            data-yearly-period="${escapeHtml(product.yearlyPeriod)}">
            <div class="aptus-product-card__head">
                <div class="aptus-product-card__icon" aria-hidden="true">${escapeHtml(product.icon)}</div>
                <div class="aptus-product-card__badges">
                    <span class="aptus-product-badge">${escapeHtml(product.category)}</span>
                    ${product.isSubscribed ? `<mark class="aptus-status aptus-status--active">Active</mark>` : ""}
                </div>
            </div>
            <div class="aptus-product-card__body">
                <h3>${escapeHtml(product.name)}</h3>
                <p>${escapeHtml(product.description)}</p>
            </div>
            ${product.isSubscribed && product.usage > 0 ? `
            <div class="aptus-product-card__usage">
                <div class="aptus-product-usage-row">
                    <span>Usage</span>
                    <strong>${product.usage}%</strong>
                </div>
                <div class="aptus-progress" aria-label="${escapeHtml(product.name)} usage ${product.usage}%">
                    <span style="width: ${product.usage}%"></span>
                </div>
            </div>` : ""}
            <div class="aptus-product-card__foot">
                <div class="aptus-plan-price--sm">
                    <strong data-aptus-price="true">${escapeHtml(product.monthlyPrice)}</strong>
                    <span data-aptus-period="true">${escapeHtml(product.monthlyPeriod)}</span>
                </div>
                ${product.renewalDate ? `<small class="aptus-product-renewal">Renews ${escapeHtml(product.renewalDate)}</small>` : ""}
            </div>
            <button type="button" class="btn ${product.isSubscribed ? "btn-aptus-outline" : "btn-aptus-primary"} w-100"
                data-aptus-product-action="${product.isSubscribed ? "manage" : "subscribe"}"
                data-aptus-product-target="${escapeHtml(product.id)}">
                ${product.isSubscribed ? "Manage Subscription" : "Subscribe Now"}
            </button>
        </article>
    `;
}

function renderGroupSelectorItem(product, isSelected, isDisabled) {
    const selectedClass = isSelected ? " is-selected" : "";
    const disabledClass = isDisabled ? " is-disabled" : "";
    return `
        <label class="aptus-group-selector-item${selectedClass}${disabledClass}" aria-disabled="${isDisabled ? "true" : "false"}">
            <input type="checkbox" class="aptus-group-selector-item__check"
                ${isSelected ? "checked" : ""}
                ${isDisabled ? "disabled" : ""}
                data-aptus-group-product="${escapeHtml(product.id)}"
                aria-label="Include ${escapeHtml(product.name)} in group plan"/>
            <div class="aptus-group-selector-item__icon" aria-hidden="true">${escapeHtml(product.icon)}</div>
            <div class="aptus-group-selector-item__info">
                <strong>${escapeHtml(product.name)}</strong>
                <span>${escapeHtml(product.category)}</span>
            </div>
            ${isSelected ? `<mark class="aptus-status aptus-status--active">Included</mark>` : ""}
        </label>
    `;
}

function renderGroupProductSelector(selectedIds, limit) {
    const currentCount = selectedIds.length;
    const atLimit = limit !== null && currentCount >= limit;
    const limitText = limit !== null ? `Your plan supports up to <strong>${limit}</strong> products.` : "Custom plan — select any combination.";
    return `
        <section class="aptus-dashboard-card">
            <div class="aptus-dashboard-section-head">
                <div>
                    <span>Products in Your Plan</span>
                    <h2>Manage included products</h2>
                    <p>Select which products are included in your group subscription. ${limitText}</p>
                </div>
                <div class="aptus-group-selector-counter${atLimit ? " is-at-limit" : ""}">
                    <strong>${currentCount}</strong>
                    <span>${limit !== null ? `/ ${limit} used` : "selected"}</span>
                </div>
            </div>
            <div class="aptus-group-selector" role="group" aria-label="Product selection for group plan" data-aptus-group-selector="${limit !== null ? limit : "unlimited"}">
                ${productCatalog.map((product) => {
                    const isSelected = selectedIds.includes(product.id);
                    const isDisabled = atLimit && !isSelected;
                    return renderGroupSelectorItem(product, isSelected, isDisabled);
                }).join("")}
            </div>
            ${atLimit && limit !== null ? `
            <div class="aptus-group-selector-notice">
                Product limit reached for the <strong>Professional</strong> plan.
                <a class="btn btn-aptus-primary btn-sm" href="#">Upgrade to Enterprise</a>
            </div>` : ""}
        </section>
    `;
}

function renderPlanComparison() {
    const rows = [
        ["Product limit", "Up to 3", "Up to 5", "Up to 7"],
        ["Billing cycle", "Monthly / yearly", "Monthly / yearly", "Monthly / yearly"],
        ["Renewal management", "Reminder based", "Approval workflow", "Dedicated review"],
        ["Team permissions", "Standard access", "Admin roles", "Custom governance"],
        ["Support", "Email", "Priority", "Dedicated SLA"],
    ];
    const planLabels = ["Basic", "Professional", "Enterprise"];
    return `
        <section class="aptus-dashboard-card aptus-plan-comparison">
            <div class="aptus-dashboard-section-head">
                <div>
                    <span>Comparison</span>
                    <h2>Group plan capabilities at a glance</h2>
                </div>
            </div>
            <div class="aptus-comparison-table" role="table" aria-label="Group subscription plan comparison">
                <div class="aptus-comparison-table__row aptus-comparison-table__head" role="row">
                    <span>Capability</span>
                    ${planLabels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
                </div>
                ${rows.map((row) => `
                    <div class="aptus-comparison-table__row" role="row">
                        ${row.map((cell, i) => `<span data-label="${i === 0 ? "Capability" : planLabels[i - 1] || "Plan"}">${escapeHtml(cell)}</span>`).join("")}
                    </div>
                `).join("")}
            </div>
        </section>
    `;
}

function getActiveBillingCycle(root) {
    const activeToggle = root.querySelector("[data-aptus-billing].is-active");
    return activeToggle?.dataset.aptusBilling || "monthly";
}

function parseOmanAmount(price) {
    const match = String(price || "").match(/([\d,.]+)/);
    return match ? Number(match[1].replace(/,/g, "")) : 0;
}

function formatOmanAmount(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
        return "OMR 0";
    }
    return `OMR ${Math.round(amount).toLocaleString("en-OM")}`;
}

function addMonths(date, months) {
    const next = new Date(date.getTime());
    next.setMonth(next.getMonth() + months);
    return next;
}

function toISODate(date) {
    return date.toISOString().slice(0, 10);
}

function formatDisplayDate(isoDate) {
    if (!isoDate) {
        return "Not scheduled";
    }
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(`${isoDate}T00:00:00`));
}

function formatTimestamp(date = new Date()) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}

function daysUntil(isoDate) {
    if (!isoDate) {
        return Number.POSITIVE_INFINITY;
    }
    const today = new Date();
    const target = new Date(`${isoDate}T00:00:00`);
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function buildEmptyPortalState() {
    return {
        version: 1,
        groupPlanId: null,
        groupProductIds: [],
        subscriptions: [],
        purchases: [],
        billingHistory: [],
        activities: [],
        notifications: [],
    };
}

function buildDemoPortalState() {
    const today = new Date();
    const productDefaults = productCatalog
        .filter((product) => product.isSubscribed)
        .map((product, index) => {
            const purchasedDate = addMonths(today, -(index + 3));
            const renewalDate = addMonths(today, index === 0 ? 10 : index + 1);
            return {
                id: `SUB-${product.id.toUpperCase()}-${index + 1}`,
                productId: product.id,
                productName: product.name,
                category: product.category,
                plan: index === 0 ? "Professional coverage" : "Essential coverage",
                billingCycle: index === 1 ? "monthly" : "yearly",
                status: "Active",
                purchasedOnISO: toISODate(purchasedDate),
                renewalDateISO: toISODate(renewalDate),
                usage: product.usage || 50,
                seats: index === 0 ? 18 : index === 1 ? 8 : 42,
                amount: index === 1 ? product.monthlyPrice : formatOmanAmount(parseOmanAmount(product.yearlyPrice) * 12),
                paymentMethod: "Business card ending 4242",
                preferences: {
                    autoRenew: true,
                    renewalReminders: true,
                    procurementApproval: index === 0,
                },
            };
        });

    productDefaults.push({
        id: "SUB-ADOBE-CC-1",
        productId: "creative-cloud",
        productName: "Creative Cloud",
        category: "Adobe",
        plan: "3 Year subscription",
        billingCycle: "3year",
        status: "Confirmed",
        purchasedOnISO: toISODate(addMonths(today, -2)),
        renewalDateISO: toISODate(addMonths(today, 34)),
        usage: 72,
        seats: 5,
        amount: "Quote on file",
        paymentMethod: "Purchase order",
        licenseId: "ADOBE-CC-7842-XK9M-PQ31",
        preferences: {
            autoRenew: true,
            renewalReminders: true,
            procurementApproval: false,
        },
    });

    productDefaults.push({
        id: "SUB-MS-365-PENDING",
        productId: "microsoft-365",
        productName: "Microsoft 365",
        category: "Microsoft",
        plan: "1 Year subscription",
        billingCycle: "1year",
        status: "Submitted",
        purchasedOnISO: toISODate(today),
        renewalDateISO: toISODate(addMonths(today, 12)),
        usage: 0,
        seats: 10,
        amount: "Pending quote",
        paymentMethod: "Awaiting confirmation",
        preferences: {
            autoRenew: false,
            renewalReminders: true,
            procurementApproval: true,
        },
    });

    productDefaults.push({
        id: "SUB-LEGACY-AUTOCAD",
        productId: "autodesk",
        productName: "Autodesk",
        category: "Engineering Software",
        plan: "Legacy drafting seat",
        billingCycle: "yearly",
        status: "Expired",
        purchasedOnISO: toISODate(addMonths(today, -16)),
        renewalDateISO: toISODate(addMonths(today, -4)),
        usage: 0,
        seats: 3,
        amount: "OMR 972",
        paymentMethod: "Bank transfer",
        preferences: {
            autoRenew: false,
            renewalReminders: false,
            procurementApproval: true,
        },
    });

    return {
        version: 1,
        groupPlanId: "group-professional",
        groupProductIds: [...groupSubscribedProducts],
        subscriptions: productDefaults,
        purchases: [...purchaseRecords],
        billingHistory: [
            {
                id: "APT-BILL-26029",
                product: "Tyco",
                plan: "Professional coverage",
                billingCycle: "Yearly",
                date: formatDisplayDate(productDefaults[0]?.purchasedOnISO),
                subtotal: "OMR 240",
                tax: "OMR 12",
                total: "OMR 252",
                method: "Business card ending 4242",
                status: "Paid",
            },
            {
                id: "APT-BILL-26022",
                product: "Suprema",
                plan: "Essential coverage",
                billingCycle: "Monthly",
                date: formatDisplayDate(productDefaults[1]?.purchasedOnISO),
                subtotal: "OMR 18",
                tax: "OMR 1",
                total: "OMR 19",
                method: "Business card ending 4242",
                status: "Paid",
            },
        ],
        activities: activityLog.map((item) => ({ ...item })),
        notifications: portalNotifications.map((item) => ({ ...item })),
    };
}

function initialPortalStateForUser(user) {
    if (user?.id === DEMO_USER_ID) {
        return buildDemoPortalState();
    }
    return buildEmptyPortalState();
}

function normalizePortalState(state, user) {
    if (!state || typeof state !== "object") {
        return initialPortalStateForUser(user);
    }
    return {
        version: state.version ?? 1,
        groupPlanId: state.groupPlanId ?? null,
        groupProductIds: Array.isArray(state.groupProductIds) ? state.groupProductIds : [],
        subscriptions: Array.isArray(state.subscriptions) ? state.subscriptions : [],
        purchases: Array.isArray(state.purchases) ? state.purchases : [],
        billingHistory: Array.isArray(state.billingHistory) ? state.billingHistory : [],
        activities: Array.isArray(state.activities) ? state.activities : [],
        notifications: Array.isArray(state.notifications) ? state.notifications : [],
    };
}

function loadPortalStateForUser(user) {
    if (!user?.id) {
        return buildEmptyPortalState();
    }
    const storageKey = portalStateStorageKey(user.id);
    try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
            return normalizePortalState(JSON.parse(stored), user);
        }
        if (user.id === DEMO_USER_ID) {
            const legacy = window.localStorage.getItem(LEGACY_PORTAL_STATE_KEY);
            if (legacy) {
                const migrated = normalizePortalState(JSON.parse(legacy), user);
                window.localStorage.setItem(storageKey, JSON.stringify(migrated));
                return migrated;
            }
        }
    } catch {
        window.localStorage.removeItem(storageKey);
    }
    const initial = initialPortalStateForUser(user);
    window.localStorage.setItem(storageKey, JSON.stringify(initial));
    return initial;
}

function savePortalStateForUser(user, state) {
    if (!user?.id) {
        return state;
    }
    const normalized = normalizePortalState(state, user);
    window.localStorage.setItem(portalStateStorageKey(user.id), JSON.stringify(normalized));
    return normalized;
}

function loadPortalState() {
    const user = getCurrentUser();
    return loadPortalStateForUser(user);
}

function savePortalState(state) {
    const user = getCurrentUser();
    if (!user?.id) {
        portalState = normalizePortalState(state, user);
        return portalState;
    }
    portalState = savePortalStateForUser(user, state);
    portalStateUserId = user.id;
    syncPortalStateToLegacyViews();
    return portalState;
}

let portalState = null;
let portalStateUserId = null;

function resetPortalStateCache() {
    portalState = null;
    portalStateUserId = null;
}

function ensurePortalState() {
    const user = getCurrentUser();
    const userId = user?.id || null;
    if (!portalState || portalStateUserId !== userId) {
        portalState = loadPortalStateForUser(user);
        portalStateUserId = userId;
        syncPortalStateToLegacyViews();
    }
    return portalState;
}

function setPortalState(nextState) {
    const user = getCurrentUser();
    portalState = savePortalStateForUser(user, nextState);
    portalStateUserId = user?.id || null;
    syncPortalStateToLegacyViews();
    return portalState;
}

function pushActivity(event, owner = "Aptus Billing Operations") {
    const state = ensurePortalState();
    state.activities.unshift({
        event,
        timestamp: formatTimestamp(),
        owner,
    });
    state.activities = state.activities.slice(0, 18);
    setPortalState(state);
}

function syncPortalStateToLegacyViews() {
    const user = getCurrentUser();
    const state = portalState || loadPortalStateForUser(user);
    const activeSubscriptions = getActiveSubscriptions(state);

    productCatalog.forEach((product) => {
        const subscription = activeSubscriptions.find((item) => item.productId === product.id);
        product.isSubscribed = Boolean(subscription);
        product.renewalDate = subscription ? formatDisplayDate(subscription.renewalDateISO) : "";
        product.usage = subscription ? subscription.usage : 0;
    });

    subscriptionRecords.splice(
        0,
        subscriptionRecords.length,
        ...activeSubscriptions.map((subscription) => ({
            product: subscription.productName,
            plan: subscription.plan,
            renewalDate: formatDisplayDate(subscription.renewalDateISO),
            usage: subscription.usage,
            seats: `${subscription.seats} seats covered`,
            status: subscription.status,
        }))
    );

    purchaseRecords.splice(0, purchaseRecords.length, ...state.purchases);
    activityLog.splice(0, activityLog.length, ...state.activities);
    portalNotifications.splice(0, portalNotifications.length, ...(state.notifications || []));
    groupSubscribedProducts.splice(0, groupSubscribedProducts.length, ...state.groupProductIds);
    groupPlans.forEach((plan) => {
        plan.isActive = plan.id === state.groupPlanId;
        plan.cta = plan.isActive ? "Current Plan" : plan.id === "group-basic" ? "Switch Plan" : "Upgrade Plan";
    });

    const renewals = activeSubscriptions
        .slice()
        .sort((a, b) => new Date(a.renewalDateISO) - new Date(b.renewalDateISO))
        .map((subscription) => {
            const remainingDays = daysUntil(subscription.renewalDateISO);
            return {
                product: subscription.productName,
                owner: getCurrentUser()?.name || "Account owner",
                dueDate: formatDisplayDate(subscription.renewalDateISO),
                amount: subscription.amount,
                status: remainingDays <= 30 ? "Due Soon" : "Scheduled",
            };
        });
    renewalSchedule.splice(0, renewalSchedule.length, ...renewals);
}

function refreshDashboardViews() {
    document.querySelectorAll("[data-aptus-dashboard-page='true']").forEach((root) => {
        const user = getCurrentUser();
        if (!user) {
            return;
        }
        const section = root.dataset.aptusDashboardSection || "dashboard";
        const content = root.querySelector("[data-aptus-dashboard-content]");
        syncPortalStateToLegacyViews();
        if (content) {
            content.innerHTML = renderPage(section, user);
        }
        hydrateDashboard(root, user);
        bindDashboardInteractions(root, user);
    });
}

function notifyPortalDataChanged(scope) {
    window.dispatchEvent(
        new CustomEvent("aptus:portal-data-changed", {
            detail: { scope: scope || "all" },
        })
    );
}

function getCheckoutTotals(target) {
    const monthlyRate = parseOmanAmount(target.price);
    if (!monthlyRate) {
        return {
            subscriptionFee: 0,
            platformFee: 0,
            vat: 0,
            total: 0,
            isCustomQuote: true,
        };
    }
    const monthsDue = target.cycle === "yearly" ? 12 : 1;
    const subscriptionFee = monthlyRate * monthsDue;
    const platformFee = subscriptionFee * 0.1;
    const vat = (subscriptionFee + platformFee) * 0.05;
    const total = subscriptionFee + platformFee + vat;

    return {
        subscriptionFee,
        platformFee,
        vat,
        total,
        isCustomQuote: false,
    };
}

function renderCheckoutStepper(activeStep = 1) {
    return `
        <div class="aptus-checkout-stepper" aria-label="Checkout progress">
            ${subscriptionCheckoutSteps.map((label, index) => {
                const step = index + 1;
                const stateClass = step < activeStep ? " is-complete" : step === activeStep ? " is-active" : "";
                const marker = step < activeStep ? "✓" : step;
                return `
                    <div class="aptus-checkout-step${stateClass}" data-aptus-checkout-step-indicator="${step}">
                        <span>${marker}</span>
                        <strong>${escapeHtml(label)}</strong>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function renderPaymentMethods() {
    return `
        <div class="aptus-payment-methods" role="radiogroup" aria-label="Payment method">
            ${paymentMethods.map((method, index) => `
                <label class="aptus-payment-method${index === 0 ? " is-selected" : ""}">
                    <input type="radio" name="aptus-payment-method" value="${escapeHtml(method.id)}" ${index === 0 ? "checked" : ""}/>
                    <span class="aptus-payment-method__control"></span>
                    <span class="aptus-payment-method__content">
                        <strong>${escapeHtml(method.label)}</strong>
                        <small>${escapeHtml(method.note)}</small>
                    </span>
                </label>
            `).join("")}
        </div>
    `;
}

function renderCardPaymentFields() {
    return `
        <div class="aptus-payment-card-fields" data-aptus-card-fields="true">
            <label>
                <span>Card Number</span>
                <input type="text" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456"/>
            </label>
            <div>
                <label>
                    <span>Expiry Date</span>
                    <input type="text" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY"/>
                </label>
                <label>
                    <span>CVV</span>
                    <input type="text" inputmode="numeric" autocomplete="cc-csc" placeholder="123"/>
                </label>
            </div>
        </div>
    `;
}

function renderCheckoutSummary(target, totals) {
    if (totals.isCustomQuote) {
        return `
            <div class="aptus-checkout-summary">
                <div>
                    <span>Custom subscription scope</span>
                    <strong>To be confirmed</strong>
                </div>
                <div>
                    <span>Payment collection</span>
                    <strong>After Aptus proposal</strong>
                </div>
                <div class="aptus-checkout-summary__total">
                    <span>Total due today</span>
                    <strong>OMR 0</strong>
                </div>
            </div>
        `;
    }

    const subscriptionLabel = target.cycle === "yearly" ? "Annual subscription fee" : "Monthly subscription fee";
    return `
        <div class="aptus-checkout-summary">
            <div>
                <span>${escapeHtml(subscriptionLabel)}</span>
                <strong>${formatOmanAmount(totals.subscriptionFee)}</strong>
            </div>
            <div>
                <span>Aptus platform fee</span>
                <strong>${formatOmanAmount(totals.platformFee)}</strong>
            </div>
            <div>
                <span>VAT (5%)</span>
                <strong>${formatOmanAmount(totals.vat)}</strong>
            </div>
            <div class="aptus-checkout-summary__total">
                <span>Total due today</span>
                <strong>${formatOmanAmount(totals.total)}</strong>
            </div>
        </div>
    `;
}

function renderSubscriptionCheckoutModal(target) {
    const totals = getCheckoutTotals(target);
    const billingLabel = target.cycle === "yearly" ? "Yearly billing" : "Monthly billing";
    const renewalLabel = target.cycle === "yearly" ? "Renews annually" : "Renews monthly";
    const submitLabel = totals.isCustomQuote ? "Submit subscription request" : "Confirm payment";

    return `
        <div class="aptus-checkout-backdrop" data-aptus-checkout-modal="true" role="presentation"
            data-aptus-checkout-target-id="${escapeHtml(target.id)}"
            data-aptus-checkout-target-kind="${escapeHtml(target.kind)}"
            data-aptus-checkout-target-cycle="${escapeHtml(target.cycle)}">
            <section class="aptus-checkout-modal" role="dialog" aria-modal="true" aria-labelledby="aptus_checkout_title" tabindex="-1">
                <button type="button" class="aptus-checkout-close" data-aptus-checkout-close="true" aria-label="Close checkout">×</button>
                <header class="aptus-checkout-head">
                    <span class="aptus-section__eyebrow">Secure Subscription Checkout</span>
                    <h2 id="aptus_checkout_title">Subscribe to ${escapeHtml(target.name)}</h2>
                    <p>Review the selected plan, confirm billing details, and authorize payment to activate this subscription on your account.</p>
                </header>
                ${renderCheckoutStepper(1)}
                <div class="aptus-checkout-alert" data-aptus-checkout-alert="true" role="status" aria-live="polite"></div>
                <div class="aptus-checkout-body">
                    <section class="aptus-checkout-panel is-active" data-aptus-checkout-panel="1">
                        <div class="aptus-checkout-section-title">
                            <span>Step 1</span>
                            <h3>Confirm subscription</h3>
                        </div>
                        <label class="aptus-checkout-choice is-selected">
                            <input type="radio" name="aptus-checkout-selected-plan" checked/>
                            <span class="aptus-checkout-choice__control"></span>
                            <span>
                                <strong>${escapeHtml(target.name)}</strong>
                                <small>${escapeHtml(target.description)}</small>
                            </span>
                            <em>${escapeHtml(target.price)} ${escapeHtml(target.period)}</em>
                        </label>
                        <div class="aptus-checkout-meta-grid">
                            <div>
                                <span>Billing cycle</span>
                                <strong>${escapeHtml(billingLabel)}</strong>
                            </div>
                            <div>
                                <span>Renewal</span>
                                <strong>${escapeHtml(renewalLabel)}</strong>
                            </div>
                        </div>
                    </section>
                    <section class="aptus-checkout-panel" data-aptus-checkout-panel="2" hidden>
                        <div class="aptus-checkout-section-title">
                            <span>Step 2</span>
                            <h3>Billing details</h3>
                        </div>
                        <div class="aptus-checkout-form-grid">
                            <label>
                                <span>Company Name</span>
                                <input type="text" name="company" value="Masqat Engineering LLC"/>
                            </label>
                            <label>
                                <span>Billing Contact</span>
                                <input type="text" name="billingContact" value="Sara Mathew"/>
                            </label>
                            <label>
                                <span>Email Address</span>
                                <input type="email" name="billingEmail" value=""/>
                            </label>
                            <label>
                                <span>Billing Address</span>
                                <input type="text" name="billingAddress" value="Muscat, Oman"/>
                            </label>
                        </div>
                    </section>
                    <section class="aptus-checkout-panel" data-aptus-checkout-panel="3" hidden>
                        <div class="aptus-checkout-section-title">
                            <span>Step 3</span>
                            <h3>Payment method</h3>
                        </div>
                        ${renderPaymentMethods()}
                        ${renderCardPaymentFields()}
                    </section>
                    <section class="aptus-checkout-panel" data-aptus-checkout-panel="4" hidden>
                        <div class="aptus-checkout-section-title">
                            <span>Step 4</span>
                            <h3>Review and pay</h3>
                        </div>
                        ${renderCheckoutSummary(target, totals)}
                        <label class="aptus-checkout-terms">
                            <input type="checkbox" data-aptus-checkout-terms="true"/>
                            <span>I agree to the Aptus subscription terms, payment terms, and cancellation policy.</span>
                        </label>
                        <div class="aptus-checkout-policy">
                            <strong>Cancellation Policy</strong>
                            <p>Cancel before renewal to avoid the next billing cycle. Active subscriptions remain available until the paid period ends.</p>
                        </div>
                    </section>
                    <section class="aptus-checkout-panel aptus-checkout-success" data-aptus-checkout-panel="success" hidden>
                        <span>✓</span>
                        <h3>Subscription activated</h3>
                        <p>Your payment has been authorized and the subscription is now active in your account workspace.</p>
                    </section>
                </div>
                <footer class="aptus-checkout-actions" data-aptus-checkout-actions="true">
                    <button type="button" class="btn btn-aptus-outline" data-aptus-checkout-back="true" hidden>Back</button>
                    <button type="button" class="btn btn-aptus-outline" data-aptus-checkout-close="true">Cancel</button>
                    <button type="button" class="btn btn-aptus-primary" data-aptus-checkout-next="true">Next</button>
                    <button type="button" class="btn btn-aptus-primary" data-aptus-checkout-pay="true" disabled hidden>${submitLabel}</button>
                </footer>
            </section>
        </div>
    `;
}

function getProductCheckoutTarget(product, cycle) {
    return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: cycle === "yearly" ? product.yearlyPrice : product.monthlyPrice,
        period: cycle === "yearly" ? product.yearlyPeriod : product.monthlyPeriod,
        cycle,
        kind: "product",
    };
}

function getPlanCheckoutTarget(plan, cycle) {
    return {
        id: plan.id,
        name: `${plan.name} Group Plan`,
        description: plan.tagline,
        price: cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice,
        period: cycle === "yearly" ? plan.yearlyPeriod : plan.monthlyPeriod,
        cycle,
        kind: "group",
    };
}

function renderSubscriptionSummaryTiles(state) {
    const activeSubscriptions = getActiveSubscriptions(state);
    const active = activeSubscriptions.length;
    const expired = state.subscriptions.filter((item) => item.status === "Expired").length;
    const renewalsDue = activeSubscriptions.filter((item) => daysUntil(item.renewalDateISO) <= 45).length;
    const nextRenewal = activeSubscriptions
        .slice()
        .sort((a, b) => new Date(a.renewalDateISO) - new Date(b.renewalDateISO))[0];
    return `
        <section class="aptus-subscription-kpis" aria-label="Subscription account summary">
            ${metricCard("Active", active, "Subscriptions currently enabled", "", "AC")}
            ${metricCard("Expired", expired, "Subscriptions outside the current billing period", "compact", "EX")}
            ${metricCard("Renewals Due", renewalsDue, "Renewals inside the 45 day planning window", "compact", "RD")}
            ${metricCard("Next Renewal", nextRenewal ? formatDisplayDate(nextRenewal.renewalDateISO) : "None", "Earliest upcoming renewal date", "compact", "NR")}
        </section>
    `;
}

function renderPreferenceBadges(subscription) {
    const preferences = subscription.preferences || {};
    return `
        <div class="aptus-subscription-preferences">
            <span class="${preferences.autoRenew ? "is-enabled" : ""}">Auto-renew ${preferences.autoRenew ? "on" : "off"}</span>
            <span class="${preferences.renewalReminders ? "is-enabled" : ""}">Renewal reminders ${preferences.renewalReminders ? "on" : "off"}</span>
            <span class="${preferences.procurementApproval ? "is-enabled" : ""}">Procurement approval ${preferences.procurementApproval ? "on" : "off"}</span>
        </div>
    `;
}

function renderSubscriptionLifecycleCard(subscription) {
    const isActive = subscription.status === "Active" || subscription.status === "Confirmed";
    const isPending = ["Submitted", "Pending"].includes(subscription.status);
    const isInactive = ["Canceled", "Expired"].includes(subscription.status);
    const renewalText = isActive
        ? `Renews ${formatDisplayDate(subscription.renewalDateISO)}`
        : isPending
          ? "Pending confirmation"
          : `Ended ${formatDisplayDate(subscription.renewalDateISO)}`;
    const durationLabel = subscription.billingCycle === "3year"
        ? "3 Year"
        : subscription.billingCycle === "1year"
          ? "1 Year"
          : subscription.billingCycle === "yearly"
            ? "Yearly billing"
            : "Monthly billing";
    return `
        <article class="aptus-lifecycle-card" data-aptus-subscription-id="${escapeHtml(subscription.id)}"
            data-aptus-license-value="${escapeHtml(subscription.licenseId || "")}">
            <div class="aptus-lifecycle-card__top">
                <div class="aptus-product-card__icon" aria-hidden="true">${escapeHtml(subscription.productName.slice(0, 3).toUpperCase())}</div>
                <div>
                    <span>${escapeHtml(subscription.category)}</span>
                    <h3>${escapeHtml(subscription.productName)}</h3>
                    <p>${escapeHtml(subscription.plan)} · ${escapeHtml(durationLabel)}</p>
                </div>
                <mark class="aptus-status aptus-status--${statusClass(subscription.status)}">${escapeHtml(subscription.status)}</mark>
            </div>
            <div class="aptus-lifecycle-card__meta">
                <div>
                    <span>Product name</span>
                    <strong>${escapeHtml(subscription.productName)}</strong>
                </div>
                <div>
                    <span>Purchase date</span>
                    <strong>${formatDisplayDate(subscription.purchasedOnISO)}</strong>
                </div>
                <div>
                    <span>Renewal date</span>
                    <strong>${renewalText}</strong>
                </div>
                <div>
                    <span>Status</span>
                    <strong>${escapeHtml(subscription.status)}</strong>
                </div>
            </div>
            ${renderLicenseIdField(subscription)}
            ${isActive ? `
            <div class="aptus-progress" aria-label="${escapeHtml(subscription.productName)} usage">
                <span style="width: ${Math.min(subscription.usage, 100)}%"></span>
            </div>` : ""}
            ${renderPreferenceBadges(subscription)}
            <div class="aptus-lifecycle-card__actions">
                ${isActive ? `
                    <button type="button" class="btn btn-aptus-outline" data-aptus-subscription-action="renew">Renew</button>
                    <button type="button" class="btn btn-aptus-ghost" data-aptus-subscription-action="preferences">Update preferences</button>
                    <button type="button" class="btn btn-aptus-outline" data-aptus-subscription-action="cancel">Cancel</button>
                ` : ""}
                ${isInactive ? `<button type="button" class="btn btn-aptus-outline" data-aptus-subscription-action="remove">Remove inactive subscription</button>` : ""}
            </div>
        </article>
    `;
}

function renderSubscriptionLifecycleBoard() {
    if (portalCfg.useApiAuth !== false) {
        return "";
    }
    const state = ensurePortalState();
    const subscriptions = state.subscriptions.slice().sort((a, b) => {
        if (a.status === b.status) {
            return new Date(a.renewalDateISO) - new Date(b.renewalDateISO);
        }
        return a.status === "Active" ? -1 : 1;
    });
    return `
        <section class="aptus-dashboard-card aptus-lifecycle-board">
            <div class="aptus-dashboard-section-head">
                <div>
                    <span>My Subscriptions</span>
                    <h2>Your subscription details</h2>
                    <p>View product name, purchase date, renewal date, status, and license ID for each subscription. Click the eye icon to reveal your license ID.</p>
                </div>
            </div>
            <div class="aptus-lifecycle-grid">
                ${subscriptions.map((subscription) => renderSubscriptionLifecycleCard(subscription)).join("")}
            </div>
        </section>
    `;
}

function renderBillingHistory() {
    const state = ensurePortalState();
    return `
        <section class="aptus-dashboard-card">
            <div class="aptus-dashboard-section-head">
                <div>
                    <span>Billing History</span>
                    <h2>Invoices and subscription charges</h2>
                </div>
            </div>
            <div class="aptus-dashboard-table aptus-dashboard-table--billing" role="table" aria-label="Billing history">
                <div class="aptus-dashboard-table__row aptus-dashboard-table__head" role="row">
                    <span>Invoice</span>
                    <span>Subscription</span>
                    <span>Cycle</span>
                    <span>Total</span>
                    <span>Status</span>
                </div>
                ${state.billingHistory.map((billing) => `
                    <div class="aptus-dashboard-table__row" role="row">
                        <span data-label="Invoice">${escapeHtml(billing.id)}<small>${escapeHtml(billing.date)}</small></span>
                        <span data-label="Subscription"><strong>${escapeHtml(billing.product)}</strong><small>${escapeHtml(billing.plan)} · ${escapeHtml(billing.method)}</small></span>
                        <span data-label="Cycle">${escapeHtml(billing.billingCycle)}</span>
                        <span data-label="Total">${escapeHtml(billing.total)}</span>
                        <span data-label="Status"><mark class="aptus-status aptus-status--${statusClass(billing.status)}">${escapeHtml(billing.status)}</mark></span>
                    </div>
                `).join("")}
            </div>
        </section>
    `;
}

function renderSubscriptionManagement() {
    const state = ensurePortalState();
    const activeIndividual = productCatalog.filter((p) => p.isSubscribed);
    const activePlan = groupPlans.find((p) => p.isActive);
    const activeProductLimit = activePlan ? activePlan.productLimit : null;
    const individualCount = activeIndividual.length;
    const groupSummary = activePlan ? `${activePlan.name} · ${groupSubscribedProducts.length} products` : "No team plan";

    return `
        <section class="aptus-subscription-hero aptus-dashboard-card">
            <div>
                <span class="aptus-section__eyebrow">Subscription Management</span>
                <h2>Plans, products, and billing in one workspace</h2>
                <p>Subscribe to Aptus-supported ELV brands and software products, or manage your team's shared product plan. Switch billing cycles and compare options without leaving the portal.</p>
                <div class="aptus-sub-tabs" role="tablist" aria-label="Subscription type">
                    <button class="aptus-sub-tab is-active" type="button" role="tab" aria-selected="true"
                        id="tab-individual" data-aptus-sub-tab="individual" aria-controls="aptus-sub-zone-individual">
                        <strong>Individual</strong>
                        <span>${individualCount} product${individualCount !== 1 ? "s" : ""} active</span>
                    </button>
                    <button class="aptus-sub-tab" type="button" role="tab" aria-selected="false"
                        id="tab-group" data-aptus-sub-tab="group" aria-controls="aptus-sub-zone-group">
                        <strong>Group</strong>
                        <span>${groupSummary}</span>
                    </button>
                </div>
            </div>
            <div class="aptus-subscription-hero__panel">
                <span>Current overview</span>
                <strong>${individualCount} Individual · ${activePlan ? activePlan.name : "No group plan"}</strong>
                <p>${individualCount} individual product${individualCount !== 1 ? "s" : ""} and ${activePlan ? groupSubscribedProducts.length + " team products" : "no team products"} active.</p>
                ${renderBillingToggle()}
            </div>
        </section>

        ${renderSubscriptionSummaryTiles(state)}

        ${renderSubscriptionLifecycleBoard()}

        <div id="aptus-sub-zone-individual" class="aptus-sub-zone" role="tabpanel" aria-labelledby="tab-individual">
            <section class="aptus-subscription-section">
                <div class="aptus-subscription-section__head">
                    <div>
                        <span>Active Individual Subscriptions</span>
                        <h2>Your subscribed products${individualCount > 0 ? ` (${individualCount})` : ""}</h2>
                        <p>Manage individual ELV, security, and software subscriptions. Each product is billed separately and can be paused or cancelled at any time.</p>
                    </div>
                    ${individualCount > 0 ? `<mark class="aptus-status aptus-status--active">${individualCount} Active</mark>` : ""}
                </div>
                ${individualCount > 0 ? `
                <div class="aptus-product-grid">
                    ${activeIndividual.map((p) => renderProductCard(p)).join("")}
                </div>` : `
                <div class="aptus-empty-state">
                    <p>No individual subscriptions yet. Browse the catalog below to subscribe to your first product.</p>
                </div>`}
            </section>

            <section class="aptus-subscription-section">
                <div class="aptus-subscription-section__head">
                    <div>
                        <span>Product Catalog</span>
                        <h2>Discover and subscribe to products</h2>
                        <p>Browse Aptus-supported ELV brands, security systems, and software products. Subscribe individually to exactly what you need with no bundles required.</p>
                    </div>
                </div>
                <div class="aptus-product-grid">
                    ${productCatalog.map((p) => renderProductCard(p)).join("")}
                </div>
            </section>
        </div>

        ${renderBillingHistory()}

        <div id="aptus-sub-zone-group" class="aptus-sub-zone" role="tabpanel" aria-labelledby="tab-group" hidden>
            <section class="aptus-subscription-section" data-aptus-subscription-zone="group">
                <div class="aptus-subscription-section__head">
                    <div>
                        <span>Group Subscription</span>
                        <h2>Team-based plans with shared product access</h2>
                        <p>Choose a plan based on how many products your team needs. Each plan gives your organization shared access to the selected product catalog.</p>
                    </div>
                    <a class="btn btn-aptus-outline" href="${portalRoute("profile")}">Manage team access</a>
                </div>
                <div class="aptus-pricing-grid aptus-pricing-grid--group">
                    ${groupPlans.map((plan) => renderGroupPlanCard(plan)).join("")}
                </div>
            </section>

            ${renderGroupProductSelector(groupSubscribedProducts, activeProductLimit)}

            ${renderPlanComparison()}
        </div>
    `;
}

function renderRenewals(limit) {
    const renewals = limit ? renewalSchedule.slice(0, limit) : renewalSchedule;
    return `
        <section class="aptus-dashboard-card">
            <div class="aptus-dashboard-section-head">
                <div>
                    <span>Renewals</span>
                    <h2>Upcoming renewals and owners</h2>
                </div>
                ${limit ? `<a href="${portalRoute("renewals")}">Open renewals</a>` : ""}
            </div>
            <div class="aptus-dashboard-table aptus-dashboard-table--renewals" role="table" aria-label="Upcoming renewals">
                <div class="aptus-dashboard-table__row aptus-dashboard-table__head" role="row">
                    <span>Product</span>
                    <span>Owner</span>
                    <span>Due Date</span>
                    <span>Amount</span>
                    <span>Status</span>
                </div>
                ${renewals.length
                    ? renewals
                          .map(
                              (renewal) => `
                            <div class="aptus-dashboard-table__row" role="row">
                                <span data-label="Product"><strong>${escapeHtml(renewal.product)}</strong></span>
                                <span data-label="Owner">${escapeHtml(renewal.owner)}</span>
                                <span data-label="Due Date">${escapeHtml(renewal.dueDate)}</span>
                                <span data-label="Amount">${escapeHtml(renewal.amount)}</span>
                                <span data-label="Status"><mark class="aptus-status aptus-status--${statusClass(renewal.status)}">${escapeHtml(renewal.status)}</mark></span>
                            </div>
                        `
                          )
                          .join("")
                    : renderEmptyState("No upcoming renewals. Active subscriptions will appear here when scheduled.")}
            </div>
        </section>
    `;
}

function renderNotifications() {
    if (portalCfg.useApiAuth !== false) {
        return "";
    }
    return `
        <section class="aptus-dashboard-card">
            <div class="aptus-dashboard-section-head">
                <div>
                    <span>Notifications</span>
                    <h2>Account alerts</h2>
                </div>
            </div>
            <div class="aptus-portal-list">
                ${portalNotifications.length
                    ? portalNotifications
                          .map(
                              (notification) => `
                            <article>
                                <div>
                                    <strong>${escapeHtml(notification.title)}</strong>
                                    <p>${escapeHtml(notification.detail || notification.body || "")}</p>
                                </div>
                                <mark class="aptus-status aptus-status--${statusClass(notification.status)}">${escapeHtml(notification.status)}</mark>
                            </article>
                        `
                          )
                          .join("")
                    : renderEmptyState("No account alerts right now.")}
            </div>
        </section>
    `;
}

function renderActivityLog() {
    return `
        <section class="aptus-dashboard-card">
            <div class="aptus-dashboard-section-head">
                <div>
                    <span>Activity</span>
                    <h2>Recent account activity</h2>
                </div>
            </div>
            <div class="aptus-activity-list">
                ${activityLog.length
                    ? activityLog
                          .map(
                              (activity) => `
                            <article>
                                <span></span>
                                <div>
                                    <strong>${escapeHtml(activity.event)}</strong>
                                    <p>${escapeHtml(activity.timestamp)} · ${escapeHtml(activity.owner)}</p>
                                </div>
                            </article>
                        `
                          )
                          .join("")
                    : renderEmptyState("No recent activity yet.")}
            </div>
        </section>
    `;
}

const PROFILE_COUNTRY_OPTIONS = [
    "Oman",
    "United Arab Emirates",
    "Saudi Arabia",
    "India",
    "United States",
    "United Kingdom",
];

const PROFILE_LANGUAGE_OPTIONS = [
    { value: "en_US", label: "English (US)" },
    { value: "ar_001", label: "Arabic" },
    { value: "en_GB", label: "English (UK)" },
];

function contactProfileDefaults(user) {
    const contactType =
        user.contactType ||
        (user.company && !["Customer", "New Customer", "Aptus account"].includes(user.company)
            ? "company"
            : "person");
    return {
        contactType,
        phone: user.phone || "",
        street: user.street || "",
        street2: user.street2 || "",
        city: user.city || "",
        state: user.state || "",
        zip: user.zip || "",
        country: user.country || "Oman",
        taxId: user.taxId || "",
        website: user.website || "",
        language: user.language || "en_US",
        tags: user.tags || "",
    };
}

function profileInputField(label, name, value, type = "text", extra = "") {
    return `
        <div class="aptus-field">
            <label for="profile_${name}">${escapeHtml(label)}</label>
            <input id="profile_${name}" class="form-control" type="${escapeHtml(type)}" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${extra}/>
        </div>
    `;
}

function profileCountrySelect(selectedCountry) {
    const options = PROFILE_COUNTRY_OPTIONS.map(
        (country) =>
            `<option value="${escapeHtml(country)}"${country === selectedCountry ? " selected" : ""}>${escapeHtml(country)}</option>`,
    ).join("");
    return `
        <div class="aptus-field">
            <label for="profile_country">Country</label>
            <select id="profile_country" class="form-control form-select" name="country">
                <option value="">Country</option>
                ${options}
            </select>
        </div>
    `;
}

function profileLanguageSelect(selectedLanguage) {
    const options = PROFILE_LANGUAGE_OPTIONS.map(
        (option) =>
            `<option value="${escapeHtml(option.value)}"${option.value === selectedLanguage ? " selected" : ""}>${escapeHtml(option.label)}</option>`,
    ).join("");
    return `
        <div class="aptus-field">
            <label for="profile_language">Language</label>
            <select id="profile_language" class="form-control form-select" name="language">${options}</select>
        </div>
    `;
}

function renderAuthCardFoot(href, label) {
    return `<p class="aptus-auth-card__foot">Protected customer access for subscriptions, billing, renewals, and support workflows. <a href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`;
}

function renderProfile(user) {
    const contact = contactProfileDefaults(user);
    const isCompany = contact.contactType === "company";

    return `
        <section class="aptus-dashboard-card aptus-profile-card">
            <div class="aptus-dashboard-section-head">
                <div>
                    <span>Profile</span>
                    <h2>Edit contact</h2>
                </div>
                <mark class="aptus-status aptus-status--active">${escapeHtml(user.supportTier)} support</mark>
            </div>
            <form class="aptus-profile-form aptus-register-form" data-aptus-profile-form="true">
                <fieldset class="aptus-register-form__type">
                    <legend class="visually-hidden">Contact type</legend>
                    <label class="aptus-register-form__type-option">
                        <input type="radio" name="contactType" value="person"${contact.contactType === "person" ? " checked" : ""}/>
                        <span>Person</span>
                    </label>
                    <label class="aptus-register-form__type-option">
                        <input type="radio" name="contactType" value="company"${contact.contactType === "company" ? " checked" : ""}/>
                        <span>Company</span>
                    </label>
                </fieldset>

                <div class="aptus-register-form__identity">
                    <div class="aptus-register-form__avatar" aria-hidden="true">
                        ${
                            isCompany
                                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>'
                                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>'
                        }
                    </div>
                    <div class="aptus-register-form__identity-fields">
                        <div class="aptus-field aptus-register-form__name">
                            <label for="profile_name" class="visually-hidden">${isCompany ? "Company name" : "Contact name"}</label>
                            <input id="profile_name" class="form-control" type="text" name="name" required placeholder="${isCompany ? "e.g. Lumber Inc" : "e.g. John Doe"}" value="${escapeHtml(user.name)}"/>
                        </div>
                        <div class="aptus-register-form__contact-row">
                            ${profileInputField("Email", "email", user.email, "email", 'readonly aria-readonly="true"')}
                            ${profileInputField("Phone", "phone", contact.phone, "tel", 'placeholder="Phone"')}
                        </div>
                    </div>
                </div>

                <div class="aptus-register-form__details">
                    <p class="aptus-register-form__section-label">Address</p>
                    <div class="aptus-register-form__row">
                        ${profileInputField("Street", "street", contact.street, "text", 'placeholder="Street..."')}
                        ${profileInputField("Tax ID", "taxId", contact.taxId, "text", 'placeholder="not applicable"')}
                    </div>
                    <div class="aptus-register-form__row">
                        ${profileInputField("Street 2", "street2", contact.street2, "text", 'placeholder="Street 2..."')}
                        ${profileInputField("Website", "website", contact.website, "url", 'placeholder="e.g. https://www.example.com"')}
                    </div>
                    <div class="aptus-register-form__row">
                        <div class="aptus-register-form__split">
                            ${profileInputField("City", "city", contact.city, "text", 'placeholder="City"')}
                            ${profileInputField("State", "state", contact.state, "text", 'placeholder="State"')}
                        </div>
                        ${profileLanguageSelect(contact.language)}
                    </div>
                    <div class="aptus-register-form__row">
                        <div class="aptus-register-form__split">
                            ${profileInputField("ZIP", "zip", contact.zip, "text", 'placeholder="ZIP"')}
                            ${profileCountrySelect(contact.country)}
                        </div>
                        ${profileInputField("Tags", "tags", contact.tags, "text", 'placeholder="e.g. B2B, VIP, Consulting"')}
                    </div>
                </div>

                <div class="aptus-profile-form__actions">
                    <button type="submit" class="btn btn-aptus-primary">Save profile updates</button>
                    <span data-aptus-profile-message="true" aria-live="polite"></span>
                </div>
                ${renderAuthCardFoot(portalRoute("dashboard"), "Return to overview")}
            </form>
        </section>
    `;
}

function renderOverview(user) {
    const legacySubscriptions = portalCfg.useApiAuth === false ? renderSubscriptions(2) : "";
    const legacyNotifications = portalCfg.useApiAuth === false ? renderNotifications() : "";
    return `
        ${renderOverviewHero(user)}
        ${renderMetrics()}
        ${legacySubscriptions}
        ${legacyNotifications}
        ${renderRenewals(3)}
        ${renderPurchases(3)}
    `;
}

function renderPage(section, user) {
    if (section === "dashboard" && portalCfg.useApiAuth !== false) {
        return "";
    }
    if (section === "purchases") {
        return renderMetrics(user) + renderSoftwarePurchaseSection();
    }
    if (section === "subscriptions") {
        const legacySubscriptions = portalCfg.useApiAuth === false ? renderSubscriptions() : "";
        return renderMetrics(user) + legacySubscriptions;
    }
    if (section === "renewals") {
        return renderMetrics(user) + renderRenewals() + renderBillingHistory();
    }
    if (section === "notifications") {
        return renderMetrics(user) + renderNotifications();
    }
    if (section === "profile") {
        return renderProfile(user);
    }
    return renderOverview(user);
}

function bindProfileForm(root, user) {
    const form = root.querySelector("[data-aptus-profile-form]");
    if (!form) {
        return;
    }
    const message = form.querySelector("[data-aptus-profile-message]");
    const avatar = form.querySelector(".aptus-register-form__avatar");
    const nameInput = form.querySelector("#profile_name");

    form.querySelectorAll('input[name="contactType"]').forEach((input) => {
        input.addEventListener("change", () => {
            const isCompany = input.value === "company" && input.checked;
            if (!nameInput) {
                return;
            }
            nameInput.placeholder = isCompany ? "e.g. Lumber Inc" : "e.g. John Doe";
            if (avatar) {
                avatar.innerHTML = isCompany
                    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>'
                    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
            }
        });
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload.contactType = payload.contactType === "company" ? "company" : "person";
        delete payload.email;

        if (message) {
            message.textContent = "Saving profile…";
        }

        try {
            if (portalCfg.useApiAuth !== false) {
                const response = await portalApiFetch("/api/auth/profile", {
                    method: "PATCH",
                    body: JSON.stringify(payload),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    if (message) {
                        message.textContent = data.error || "Unable to save profile.";
                    }
                    return;
                }
                if (data.user) {
                    setSession(data.user, true);
                    hydrateDashboard(root, data.user);
                    refreshNavbar();
                    refreshDashboardViews();
                    if (message) {
                        message.textContent = "Profile updated successfully.";
                    }
                    return;
                }
            }

            const contactType = payload.contactType === "company" ? "company" : "person";
            const name = String(payload.name || user.name).trim();
            const city = String(payload.city || "").trim();
            const country = String(payload.country || "").trim();
            const profile = {
                ...user,
                ...payload,
                name,
                contactType,
                company: contactType === "company" ? name : "Customer",
                location: [city, country].filter(Boolean).join(", "),
                initials: name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part.charAt(0).toUpperCase())
                    .join(""),
            };
            window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
            setSession(profile, true);
            hydrateDashboard(root, profile);
            refreshNavbar();
            if (message) {
                message.textContent = "Profile preferences saved for this browser.";
            }
        } catch {
            if (message) {
                message.textContent = "Unable to reach the server. Please try again.";
            }
        }
    });
}

function recordSubscriptionCharge(subscription, actionLabel) {
    const state = ensurePortalState();
    state.billingHistory.unshift({
        id: makeId("APT-BILL"),
        product: subscription.productName,
        plan: subscription.plan,
        billingCycle: subscription.billingCycle === "yearly" ? "Yearly" : "Monthly",
        date: formatDisplayDate(toISODate(new Date())),
        subtotal: subscription.amount,
        tax: "Included",
        total: subscription.amount,
        method: subscription.paymentMethod || "Business payment method",
        status: "Paid",
    });
    state.billingHistory = state.billingHistory.slice(0, 24);
    pushActivity(`${subscription.productName} subscription ${actionLabel}`, getCurrentUser()?.name || "Account owner");
}

function mutateSubscription(subscriptionId, action) {
    const state = ensurePortalState();
    const subscription = state.subscriptions.find((item) => item.id === subscriptionId);
    if (!subscription) {
        return;
    }

    if (action === "cycle") {
        subscription.billingCycle = subscription.billingCycle === "yearly" ? "monthly" : "yearly";
        subscription.renewalDateISO = toISODate(addMonths(new Date(), subscription.billingCycle === "yearly" ? 12 : 1));
        subscription.amount = subscription.billingCycle === "yearly" ? "OMR 252" : "OMR 24";
        recordSubscriptionCharge(subscription, "billing cycle changed");
    }

    if (action === "upgrade") {
        subscription.plan = "Enterprise coverage";
        subscription.usage = Math.min(100, Math.max(subscription.usage, 72));
        subscription.amount = subscription.billingCycle === "yearly" ? "OMR 420" : "OMR 39";
        recordSubscriptionCharge(subscription, "upgraded");
    }

    if (action === "downgrade") {
        subscription.plan = "Essential coverage";
        subscription.usage = Math.min(subscription.usage, 60);
        subscription.amount = subscription.billingCycle === "yearly" ? "OMR 180" : "OMR 18";
        recordSubscriptionCharge(subscription, "downgraded");
    }

    if (action === "renew") {
        if (portalCfg.useApiAuth !== false) {
            void pushSubscriptionRenewToOdoo(subscription).then((ok) => {
                if (!ok) {
                    setPortalState(state);
                    refreshDashboardViews();
                }
            });
            return;
        }
        subscription.status = "Active";
        subscription.renewalDateISO = toISODate(addMonths(new Date(subscription.renewalDateISO || new Date()), subscription.billingCycle === "yearly" ? 12 : 1));
        recordSubscriptionCharge(subscription, "renewed");
    }

    if (action === "preferences") {
        subscription.preferences = {
            ...(subscription.preferences || {}),
            autoRenew: !(subscription.preferences || {}).autoRenew,
            renewalReminders: true,
            procurementApproval: !(subscription.preferences || {}).procurementApproval,
        };
        pushActivity(`${subscription.productName} billing preferences updated`, getCurrentUser()?.name || "Account owner");
    }

    if (action === "cancel") {
        subscription.status = "Canceled";
        subscription.preferences = {
            ...(subscription.preferences || {}),
            autoRenew: false,
        };
        pushActivity(`${subscription.productName} subscription cancelled`, getCurrentUser()?.name || "Account owner");
        setPortalState(state);
        refreshDashboardViews();
        void pushSubscriptionCancelToOdoo(subscription);
        return;
    }

    if (action === "remove" && ["Canceled", "Expired"].includes(subscription.status)) {
        void pushSubscriptionCancelToOdoo(subscription);
        state.subscriptions = state.subscriptions.filter((item) => item.id !== subscriptionId);
        pushActivity(`${subscription.productName} inactive subscription removed`, getCurrentUser()?.name || "Account owner");
    }

    setPortalState(state);
    refreshDashboardViews();
}

function bindSubscriptionLifecycleActions(root) {
    root.querySelectorAll("[data-aptus-subscription-action]").forEach((button) => {
        if (button.dataset.aptusLifecycleBound === "true") {
            return;
        }
        button.dataset.aptusLifecycleBound = "true";
        button.addEventListener("click", () => {
            const card = button.closest("[data-aptus-subscription-id]");
            const subscriptionId = card?.dataset.aptusSubscriptionId;
            if (!subscriptionId) {
                return;
            }
            mutateSubscription(subscriptionId, button.dataset.aptusSubscriptionAction);
        });
    });
}

function bindSubscriptionControls(root) {
    const toggles = root.querySelectorAll("[data-aptus-billing]");
    if (!toggles.length) {
        return;
    }

    const setBillingCycle = (cycle) => {
        toggles.forEach((button) => {
            const isActive = button.dataset.aptusBilling === cycle;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        root.querySelectorAll("[data-aptus-pricing-card]").forEach((card) => {
            const price = card.querySelector("[data-aptus-price]");
            const period = card.querySelector("[data-aptus-period]");
            if (price) {
                price.textContent = card.dataset[`${cycle}Price`] || "";
            }
            if (period) {
                period.textContent = card.dataset[`${cycle}Period`] || "";
            }
            card.classList.add("is-cycle-changing");
            window.setTimeout(() => card.classList.remove("is-cycle-changing"), 220);
        });

        document.dispatchEvent(
            new CustomEvent("aptus:subscription-billing-changed", {
                detail: { root, cycle },
            })
        );
    };

    toggles.forEach((button) => {
        button.addEventListener("click", () => {
            setBillingCycle(button.dataset.aptusBilling || "monthly");
        });
    });
}

function updateCheckoutStep(modal, step) {
    modal.querySelectorAll("[data-aptus-checkout-panel]").forEach((panel) => {
        const isTarget = panel.dataset.aptusCheckoutPanel === String(step);
        panel.classList.toggle("is-active", isTarget);
        if (isTarget) {
            panel.removeAttribute("hidden");
        } else {
            panel.setAttribute("hidden", "hidden");
        }
    });

    modal.querySelectorAll("[data-aptus-checkout-step-indicator]").forEach((indicator) => {
        const indicatorStep = Number(indicator.dataset.aptusCheckoutStepIndicator);
        indicator.classList.toggle("is-active", indicatorStep === step);
        indicator.classList.toggle("is-complete", indicatorStep < step);
        const marker = indicator.querySelector("span");
        if (marker) {
            marker.textContent = indicatorStep < step ? "✓" : String(indicatorStep);
        }
    });

    const back = modal.querySelector("[data-aptus-checkout-back]");
    const next = modal.querySelector("[data-aptus-checkout-next]");
    const pay = modal.querySelector("[data-aptus-checkout-pay]");
    back?.toggleAttribute("hidden", step <= 1);
    next?.toggleAttribute("hidden", step >= 4);
    pay?.toggleAttribute("hidden", step !== 4);
    modal.dataset.aptusCheckoutStep = String(step);
}

function closeSubscriptionCheckout(modal) {
    modal?.remove();
    document.body.classList.remove("aptus-checkout-open");
}

function showCheckoutSuccess(modal) {
    modal.querySelectorAll("[data-aptus-checkout-panel]").forEach((panel) => {
        const isSuccess = panel.dataset.aptusCheckoutPanel === "success";
        panel.classList.toggle("is-active", isSuccess);
        panel.toggleAttribute("hidden", !isSuccess);
    });
    modal.querySelector("[data-aptus-checkout-actions]")?.setAttribute("hidden", "hidden");
    modal.querySelector(".aptus-checkout-stepper")?.setAttribute("hidden", "hidden");
}

function getPaymentMethodLabel(modal) {
    const selected = modal.querySelector(".aptus-payment-method input:checked");
    const label = selected?.closest(".aptus-payment-method")?.querySelector("strong")?.textContent;
    return label || "Business payment method";
}

function addBillingRecord(target, totals, modal) {
    const state = ensurePortalState();
    const today = new Date();
    const billingCycle = target.cycle === "yearly" ? "Yearly" : "Monthly";
    const method = getPaymentMethodLabel(modal);
    state.billingHistory.unshift({
        id: makeId("APT-BILL"),
        product: target.name,
        plan: target.kind === "group" ? "Team subscription" : "Product subscription",
        billingCycle,
        date: formatDisplayDate(toISODate(today)),
        subtotal: formatOmanAmount(totals.subscriptionFee),
        tax: formatOmanAmount(totals.vat),
        total: formatOmanAmount(totals.total),
        method,
        status: totals.isCustomQuote ? "Pending approval" : "Paid",
    });
    state.billingHistory = state.billingHistory.slice(0, 24);
    return method;
}

function activateProductSubscription(target, totals, modal) {
    const state = ensurePortalState();
    const product = productCatalog.find((item) => item.id === target.id);
    if (!product) {
        return;
    }

    const today = new Date();
    const nextRenewal = addMonths(today, target.cycle === "yearly" ? 12 : 1);
    const existing = state.subscriptions.find((item) => item.productId === product.id);
    const subscription = {
        id: existing?.id || makeId("SUB"),
        productId: product.id,
        productName: product.name,
        category: product.category,
        plan: target.cycle === "yearly" ? "Professional coverage" : "Essential coverage",
        billingCycle: target.cycle,
        status: "Active",
        purchasedOnISO: existing?.purchasedOnISO || toISODate(today),
        renewalDateISO: toISODate(nextRenewal),
        usage: existing?.usage || Math.max(product.usage || 0, 36),
        seats: existing?.seats || 1,
        amount: formatOmanAmount(totals.total),
        paymentMethod: getPaymentMethodLabel(modal),
        preferences: existing?.preferences || {
            autoRenew: true,
            renewalReminders: true,
            procurementApproval: false,
        },
    };

    if (existing) {
        Object.assign(existing, subscription);
    } else {
        state.subscriptions.unshift(subscription);
    }

    state.purchases.unshift({
        id: makeId("APT-INV"),
        product: product.name,
        category: product.category,
        seats: subscription.seats,
        amount: formatOmanAmount(totals.total),
        purchasedOn: formatDisplayDate(toISODate(today)),
        status: "Active",
    });
    state.purchases = state.purchases.slice(0, 24);
    pushActivity(`${product.name} subscription purchased`, getCurrentUser()?.name || "Account owner");
}

function activateGroupSubscription(target, totals, modal) {
    const state = ensurePortalState();
    const plan = groupPlans.find((item) => item.id === target.id);
    if (!plan) {
        return;
    }
    state.groupPlanId = plan.id;
    addBillingRecord(target, totals, modal);
    pushActivity(`${plan.name} group plan activated`, getCurrentUser()?.name || "Account owner");
}

async function pushSubscriptionToOdoo(target, totals, modal) {
    if (portalCfg.useApiAuth === false) {
        return;
    }
    const productName = target.kind === "group" ? `Group plan: ${target.name}` : target.name;
    try {
        const response = await portalApiFetch("/api/subscriptions/create", {
            method: "POST",
            body: JSON.stringify({
                productName,
                notes: `Portal checkout. Billing: ${target.cycle}. Total: ${formatOmanAmount(totals.total)}. Payment: ${getPaymentMethodLabel(modal)}.`,
            }),
        });
        if (response.ok) {
            const data = await response.json();
            const state = ensurePortalState();
            const subscription = target.kind === "group"
                ? null
                : state.subscriptions.find((item) => item.productId === target.id);
            if (subscription) {
                if (data.leadId) {
                    subscription.odooLeadId = data.leadId;
                }
                if (data.saleOrderId) {
                    subscription.odooSaleOrderId = data.saleOrderId;
                }
                setPortalState(state);
            }
            pushActivity(
                data.message || `${productName} sent to Odoo`,
                getCurrentUser()?.name || "Account owner",
            );
            notifyPortalDataChanged("subscriptions");
        }
    } catch {
        /* Odoo sync is best-effort; portal state already saved locally */
    }
}

async function pushSubscriptionRenewToOdoo(subscription) {
    if (portalCfg.useApiAuth === false || !subscription?.productName) {
        return false;
    }
    try {
        const response = await portalApiFetch("/api/subscriptions/request", {
            method: "POST",
            body: JSON.stringify({
                productName: subscription.productName,
                requestType: "renew",
                orderId: subscription.odooSaleOrderId || subscription.orderId || undefined,
                lineId: subscription.lineId || undefined,
                renewalDateIso: subscription.renewalDateISO || undefined,
            }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            pushActivity(
                data.error || `${subscription.productName} renewal request failed`,
                getCurrentUser()?.name || "Account owner",
            );
            return false;
        }
        pushActivity(
            data.message || `${subscription.productName} renewal request submitted`,
            getCurrentUser()?.name || "Account owner",
        );
        if (data.showConfirmationModal) {
            showRenewalConfirmationModal();
        }
        notifyPortalDataChanged("subscriptions");
        return true;
    } catch {
        pushActivity(
            `${subscription.productName} renewal request failed; API unavailable`,
            getCurrentUser()?.name || "Account owner",
        );
        return false;
    }
}

async function pushSubscriptionCancelToOdoo(subscription) {
    if (portalCfg.useApiAuth === false || !subscription?.productName) {
        return;
    }
    try {
        const response = await portalApiFetch("/api/subscriptions/cancel", {
            method: "POST",
            body: JSON.stringify({
                productName: subscription.productName,
                leadId: subscription.odooLeadId || undefined,
                saleOrderId: subscription.odooSaleOrderId || undefined,
            }),
        });
        if (response.ok) {
            const data = await response.json();
            pushActivity(
                data.message || `${subscription.productName} cancellation sent to Odoo`,
                getCurrentUser()?.name || "Account owner",
            );
            notifyPortalDataChanged("subscriptions");
            setPortalState(ensurePortalState());
        } else {
            const data = await response.json().catch(() => ({}));
            pushActivity(
                data.error || `${subscription.productName} cancelled locally; Odoo sync failed`,
                getCurrentUser()?.name || "Account owner",
            );
            setPortalState(ensurePortalState());
        }
    } catch {
        pushActivity(
            `${subscription.productName} cancelled locally; Odoo sync unavailable`,
            getCurrentUser()?.name || "Account owner",
        );
        setPortalState(ensurePortalState());
    }
}

function completeCheckout(target, modal) {
    const totals = getCheckoutTotals(target);
    if (target.kind === "group") {
        activateGroupSubscription(target, totals, modal);
    } else {
        activateProductSubscription(target, totals, modal);
        addBillingRecord(target, totals, modal);
    }
    setPortalState(ensurePortalState());
    refreshNavbar();
    refreshDashboardViews();
    notifyPortalDataChanged("all");
    void pushSubscriptionToOdoo(target, totals, modal);
}

function bindCheckoutModal(modal, target) {
    const dialog = modal.querySelector(".aptus-checkout-modal");
    const alert = modal.querySelector("[data-aptus-checkout-alert]");
    const terms = modal.querySelector("[data-aptus-checkout-terms]");
    const payButton = modal.querySelector("[data-aptus-checkout-pay]");
    const cardFields = modal.querySelector("[data-aptus-card-fields]");

    modal.dataset.aptusCheckoutStep = "1";
    dialog?.focus?.();

    modal.querySelectorAll("[data-aptus-checkout-close]").forEach((button) => {
        button.addEventListener("click", () => closeSubscriptionCheckout(modal));
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeSubscriptionCheckout(modal);
        }
    });

    modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSubscriptionCheckout(modal);
        }
    });

    modal.querySelector("[data-aptus-checkout-next]")?.addEventListener("click", () => {
        const currentStep = Number(modal.dataset.aptusCheckoutStep || "1");
        updateCheckoutStep(modal, Math.min(currentStep + 1, 4));
    });

    modal.querySelector("[data-aptus-checkout-back]")?.addEventListener("click", () => {
        const currentStep = Number(modal.dataset.aptusCheckoutStep || "1");
        updateCheckoutStep(modal, Math.max(currentStep - 1, 1));
    });

    terms?.addEventListener("change", () => {
        if (payButton) {
            payButton.disabled = !terms.checked;
        }
    });

    modal.querySelectorAll(".aptus-payment-method input").forEach((input) => {
        input.addEventListener("change", () => {
            modal.querySelectorAll(".aptus-payment-method").forEach((method) => {
                method.classList.toggle("is-selected", method.contains(input) && input.checked);
            });
            if (cardFields) {
                cardFields.toggleAttribute("hidden", input.value !== "card");
            }
        });
    });

    payButton?.addEventListener("click", () => {
        if (terms && !terms.checked) {
            if (alert) {
                alert.textContent = "Please accept the subscription terms before submitting payment.";
                alert.classList.add("is-error");
            }
            return;
        }
        completeCheckout(target, modal);
        showCheckoutSuccess(modal);
        window.setTimeout(() => closeSubscriptionCheckout(modal), 1800);
    });
}

function openSubscriptionCheckout(target) {
    document.querySelectorAll("[data-aptus-checkout-modal]").forEach((modal) => closeSubscriptionCheckout(modal));
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderSubscriptionCheckoutModal(target).trim();
    const modal = wrapper.firstElementChild;
    if (!modal) {
        return;
    }
    document.body.appendChild(modal);
    document.body.classList.add("aptus-checkout-open");
    bindCheckoutModal(modal, target);
}

function bindSubscriptionActions(root) {
    root.querySelectorAll("[data-aptus-product-action='manage']").forEach((button) => {
        button.addEventListener("click", () => {
            const subscription = ensurePortalState().subscriptions.find((item) => item.productId === button.dataset.aptusProductTarget && item.status === "Active");
            const targetCard = subscription ? root.querySelector(`[data-aptus-subscription-id="${subscription.id}"]`) : null;
            targetCard?.scrollIntoView({ behavior: "smooth", block: "center" });
            targetCard?.classList.add("is-highlighted");
            window.setTimeout(() => targetCard?.classList.remove("is-highlighted"), 1200);
        });
    });

    root.querySelectorAll("[data-aptus-product-action='subscribe']").forEach((button) => {
        button.addEventListener("click", () => {
            const product = productCatalog.find((item) => item.id === button.dataset.aptusProductTarget);
            if (!product) {
                return;
            }
            openSubscriptionCheckout(getProductCheckoutTarget(product, getActiveBillingCycle(root)));
        });
    });

    root.querySelectorAll("[data-aptus-plan-action='checkout']").forEach((button) => {
        button.addEventListener("click", () => {
            const plan = groupPlans.find((item) => item.id === button.dataset.aptusPlanTarget);
            const card = button.closest(".aptus-pricing-card");
            if (!plan || !card) {
                return;
            }
            root.querySelectorAll(".aptus-pricing-card.is-selected").forEach((selectedCard) => {
                selectedCard.classList.remove("is-selected");
            });
            card.classList.add("is-selected");
            openSubscriptionCheckout(getPlanCheckoutTarget(plan, getActiveBillingCycle(root)));
        });
    });

    root.querySelectorAll("[data-aptus-plan-action='manage']").forEach((button) => {
        button.addEventListener("click", () => {
            root.querySelector("[data-aptus-group-selector]")?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    });
}

function bindSubscriptionTabs(root) {
    const tabs = root.querySelectorAll("[data-aptus-sub-tab]");
    if (!tabs.length) {
        return;
    }
    const getZone = (id) => root.querySelector(`#aptus-sub-zone-${id}`);

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const targetId = tab.dataset.aptusSubTab;
            tabs.forEach((t) => {
                const isTarget = t.dataset.aptusSubTab === targetId;
                t.classList.toggle("is-active", isTarget);
                t.setAttribute("aria-selected", isTarget ? "true" : "false");
            });
            root.querySelectorAll(".aptus-sub-zone").forEach((zone) => {
                if (zone.id === `aptus-sub-zone-${targetId}`) {
                    zone.removeAttribute("hidden");
                } else {
                    zone.setAttribute("hidden", "hidden");
                }
            });
            document.dispatchEvent(
                new CustomEvent("aptus:subscription-tab-changed", {
                    detail: { root, zone: targetId },
                })
            );
        });
    });

    root.querySelectorAll("[data-aptus-group-selector]").forEach((selector) => {
        const limit = selector.dataset.aptusGroupSelector === "unlimited" ? null : parseInt(selector.dataset.aptusGroupSelector, 10);
        selector.addEventListener("change", (event) => {
            const checkbox = event.target.closest("[data-aptus-group-product]");
            if (!checkbox) {
                return;
            }
            const checked = selector.querySelectorAll("[data-aptus-group-product]:checked");
            const count = checked.length;
            if (limit !== null && count > limit) {
                checkbox.checked = false;
                return;
            }
            selector.querySelectorAll(".aptus-group-selector-item__check:not(:checked)").forEach((unchecked) => {
                const atMax = limit !== null && count >= limit;
                unchecked.disabled = atMax;
                unchecked.closest(".aptus-group-selector-item")?.classList.toggle("is-disabled", atMax);
            });
            const counter = root.querySelector(".aptus-group-selector-counter strong");
            if (counter) {
                counter.textContent = count;
            }
            const state = ensurePortalState();
            state.groupProductIds = Array.from(checked).map((item) => item.dataset.aptusGroupProduct);
            pushActivity("Group subscription product selection updated", getCurrentUser()?.name || "Account owner");
            setPortalState(state);
            selector.querySelectorAll("[data-aptus-group-product]:checked").forEach((cb) => {
                cb.closest(".aptus-group-selector-item")?.classList.add("is-selected");
                cb.closest(".aptus-group-selector-item")?.classList.remove("is-disabled");
            });
            selector.querySelectorAll("[data-aptus-group-product]:not(:checked)").forEach((cb) => {
                cb.closest(".aptus-group-selector-item")?.classList.remove("is-selected");
            });
        });
    });
}

function findSoftwareProduct(productId) {
    for (const category of softwareProductCategories) {
        const product = category.products.find((item) => item.id === productId);
        if (product) {
            return { ...product, category: category.name };
        }
    }
    return null;
}

function getSoftwareOrderDuration(root) {
    const durationInput = root.querySelector('input[name="aptus-software-duration"]:checked');
    return durationInput?.value === "3year" ? "3year" : "1year";
}

function getSoftwareOrderTotals(items, duration) {
    let subscriptionFee = 0;
    items.forEach((item) => {
        const product = findSoftwareProduct(item.productId);
        if (!product) {
            return;
        }
        const unitPrice = duration === "3year" ? product.price3Year : product.price1Year;
        subscriptionFee += unitPrice * item.quantity;
    });
    const platformFee = subscriptionFee * 0.1;
    const vat = (subscriptionFee + platformFee) * 0.05;
    const total = subscriptionFee + platformFee + vat;
    return {
        subscriptionFee,
        platformFee,
        vat,
        total,
        isCustomQuote: subscriptionFee <= 0,
    };
}

function collectSoftwareOrderSelections(root) {
    const items = [];
    root.querySelectorAll('input[name="aptus-software-product"]:checked').forEach((input) => {
        const qtyInput = root.querySelector(`[data-aptus-product-qty="${input.value}"]`);
        const quantity = Math.max(1, Number(qtyInput?.value) || 1);
        const product = findSoftwareProduct(input.value);
        items.push({
            category: input.dataset.aptusProductCategory || product?.category || "",
            productName: input.dataset.aptusProductName || product?.name || "",
            productId: input.value,
            quantity,
            unitPrice: product
                ? getSoftwareOrderDuration(root) === "3year"
                    ? product.price3Year
                    : product.price1Year
                : 0,
        });
    });
    return items;
}

function buildSoftwareOrderContext(root) {
    const items = collectSoftwareOrderSelections(root);
    const duration = getSoftwareOrderDuration(root);
    const totals = getSoftwareOrderTotals(items, duration);
    const user = getCurrentUser();
    return {
        kind: "software",
        items,
        duration,
        totals,
        contact: {
            name: root.querySelector('[name="contactName"]')?.value?.trim() || user?.name || "",
            email: root.querySelector('[name="contactEmail"]')?.value?.trim() || user?.email || "",
            phone: root.querySelector('[name="contactPhone"]')?.value?.trim() || user?.phone || "",
            company: user?.company || "",
        },
        customerMessage: root.querySelector('[name="customerMessage"]')?.value?.trim() || "",
    };
}

function renderSoftwareCheckoutSummary(orderContext) {
    const totals = orderContext.totals;
    const durationLabel = orderContext.duration === "3year" ? "3 Year subscription" : "1 Year subscription";
    return `
        <div class="aptus-checkout-summary">
            <div>
                <span>${escapeHtml(durationLabel)}</span>
                <strong>${formatOmanAmount(totals.subscriptionFee)}</strong>
            </div>
            ${orderContext.items.map((item) => `
                <div>
                    <span>${escapeHtml(item.productName)} × ${item.quantity}</span>
                    <strong>${formatOmanAmount(item.unitPrice * item.quantity)}</strong>
                </div>
            `).join("")}
            <div>
                <span>Aptus platform fee</span>
                <strong>${formatOmanAmount(totals.platformFee)}</strong>
            </div>
            <div>
                <span>VAT (5%)</span>
                <strong>${formatOmanAmount(totals.vat)}</strong>
            </div>
            <div class="aptus-checkout-summary__total">
                <span>Total due today</span>
                <strong>${formatOmanAmount(totals.total)}</strong>
            </div>
        </div>
    `;
}

function renderSoftwareCheckoutModal(orderContext) {
    const durationLabel = orderContext.duration === "3year" ? "3 Years" : "1 Year";
    const user = getCurrentUser();
    return `
        <div class="aptus-checkout-backdrop" data-aptus-software-checkout-modal="true" role="presentation">
            <section class="aptus-checkout-modal" role="dialog" aria-modal="true" aria-labelledby="aptus_software_checkout_title" tabindex="-1">
                <button type="button" class="aptus-checkout-close" data-aptus-software-checkout-close="true" aria-label="Close checkout">×</button>
                <header class="aptus-checkout-head">
                    <span class="aptus-section__eyebrow">Secure Payment Checkout</span>
                    <h2 id="aptus_software_checkout_title">Complete your software order</h2>
                    <p>Review your selected products, enter billing details, and authorize payment. Your order will be submitted after payment is processed.</p>
                </header>
                ${renderCheckoutStepper(1)}
                <div class="aptus-checkout-alert" data-aptus-software-checkout-alert="true" role="status" aria-live="polite"></div>
                <div class="aptus-checkout-body">
                    <section class="aptus-checkout-panel is-active" data-aptus-software-checkout-panel="1">
                        <div class="aptus-checkout-section-title">
                            <span>Step 1</span>
                            <h3>Review order</h3>
                        </div>
                        <ul class="aptus-software-order-list">
                            ${orderContext.items.map((item) => `
                                <li>
                                    <strong>${escapeHtml(item.productName)}</strong>
                                    <span>${escapeHtml(item.category)} · Qty ${item.quantity} · ${escapeHtml(durationLabel)}</span>
                                </li>
                            `).join("")}
                        </ul>
                        <div class="aptus-checkout-meta-grid">
                            <div>
                                <span>Subscription duration</span>
                                <strong>${escapeHtml(durationLabel)}</strong>
                            </div>
                            <div>
                                <span>Products selected</span>
                                <strong>${orderContext.items.length}</strong>
                            </div>
                        </div>
                    </section>
                    <section class="aptus-checkout-panel" data-aptus-software-checkout-panel="2" hidden>
                        <div class="aptus-checkout-section-title">
                            <span>Step 2</span>
                            <h3>Billing details</h3>
                        </div>
                        <div class="aptus-checkout-form-grid">
                            <label>
                                <span>Company Name</span>
                                <input type="text" name="softwareCompany" value="${escapeHtml(orderContext.contact.company || user?.company || "")}"/>
                            </label>
                            <label>
                                <span>Billing Contact</span>
                                <input type="text" name="softwareBillingContact" value="${escapeHtml(orderContext.contact.name)}"/>
                            </label>
                            <label>
                                <span>Email Address</span>
                                <input type="email" name="softwareBillingEmail" value="${escapeHtml(orderContext.contact.email)}"/>
                            </label>
                            <label>
                                <span>Phone Number</span>
                                <input type="tel" name="softwareBillingPhone" value="${escapeHtml(orderContext.contact.phone)}"/>
                            </label>
                            <label>
                                <span>Billing Address</span>
                                <input type="text" name="softwareBillingAddress" value="${escapeHtml(user?.location || "Muscat, Oman")}"/>
                            </label>
                        </div>
                    </section>
                    <section class="aptus-checkout-panel" data-aptus-software-checkout-panel="3" hidden>
                        <div class="aptus-checkout-section-title">
                            <span>Step 3</span>
                            <h3>Payment method</h3>
                        </div>
                        ${renderPaymentMethods()}
                        ${renderCardPaymentFields()}
                    </section>
                    <section class="aptus-checkout-panel" data-aptus-software-checkout-panel="4" hidden>
                        <div class="aptus-checkout-section-title">
                            <span>Step 4</span>
                            <h3>Review and pay</h3>
                        </div>
                        ${renderSoftwareCheckoutSummary(orderContext)}
                        <label class="aptus-checkout-terms">
                            <input type="checkbox" data-aptus-software-checkout-terms="true"/>
                            <span>I agree to the Aptus subscription terms, payment terms, and cancellation policy.</span>
                        </label>
                        <div class="aptus-checkout-policy">
                            <strong>Order confirmation</strong>
                            <p>Payment will be processed now. Order confirmation for your software licenses will be provided within 48 hours.</p>
                        </div>
                    </section>
                </div>
                <footer class="aptus-checkout-actions" data-aptus-software-checkout-actions="true">
                    <button type="button" class="btn btn-aptus-outline" data-aptus-software-checkout-back="true" hidden>Back</button>
                    <button type="button" class="btn btn-aptus-outline" data-aptus-software-checkout-close="true">Cancel</button>
                    <button type="button" class="btn btn-aptus-primary" data-aptus-software-checkout-next="true">Next</button>
                    <button type="button" class="btn btn-aptus-primary" data-aptus-software-checkout-pay="true" disabled hidden>Confirm payment</button>
                </footer>
            </section>
        </div>
    `;
}

function refreshSoftwareOrderSummary(root) {
    const empty = root.querySelector("[data-aptus-order-empty]");
    const form = root.querySelector("[data-aptus-order-form]");
    const selected = root.querySelector("[data-aptus-order-selected]");
    const totalWrap = root.querySelector("[data-aptus-order-total]");
    const totalAmount = root.querySelector("[data-aptus-order-total-amount]");
    if (!empty || !form || !selected) {
        return;
    }
    const items = collectSoftwareOrderSelections(root);
    const duration = getSoftwareOrderDuration(root);
    const totals = getSoftwareOrderTotals(items, duration);
    if (!items.length) {
        empty.removeAttribute("hidden");
        form.setAttribute("hidden", "hidden");
        selected.innerHTML = "";
        totalWrap?.setAttribute("hidden", "hidden");
        return;
    }
    empty.setAttribute("hidden", "hidden");
    form.removeAttribute("hidden");
    totalWrap?.removeAttribute("hidden");
    if (totalAmount) {
        totalAmount.textContent = formatOmanAmount(totals.total);
    }
    const durationLabel = duration === "3year" ? "3 Years" : "1 Year";
    selected.innerHTML = `
        <ul class="aptus-software-order-list">
            ${items.map((item) => `
                <li>
                    <strong>${escapeHtml(item.productName)}</strong>
                    <span>${escapeHtml(item.category)} · Qty ${item.quantity} · ${escapeHtml(durationLabel)}</span>
                </li>
            `).join("")}
        </ul>
    `;
}

function renderPaymentProcessingLoader(message = "Processing payment…") {
    return `
        <div class="aptus-payment-processing" data-aptus-payment-processing="true" role="alertdialog" aria-modal="true" aria-busy="true" aria-live="polite" aria-label="Processing order">
            <div class="aptus-payment-processing__card">
                <div class="aptus-payment-processing__spinner" aria-hidden="true"></div>
                <strong data-aptus-payment-processing-message="true">${escapeHtml(message)}</strong>
                <p>Please wait while we secure your payment and submit your order.</p>
            </div>
        </div>
    `;
}

function showPaymentProcessingLoader(message = "Processing payment…") {
    hidePaymentProcessingLoader();
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderPaymentProcessingLoader(message).trim();
    const loader = wrapper.firstElementChild;
    if (!loader) {
        return;
    }
    document.body.appendChild(loader);
    document.body.classList.add("aptus-payment-processing-open");
}

function updatePaymentProcessingLoader(message) {
    document.querySelector("[data-aptus-payment-processing-message]")?.replaceChildren(
        document.createTextNode(message),
    );
}

function hidePaymentProcessingLoader() {
    document.querySelectorAll("[data-aptus-payment-processing]").forEach((loader) => loader.remove());
    document.body.classList.remove("aptus-payment-processing-open");
}

function showOrderConfirmationModal() {
    hidePaymentProcessingLoader();
    document.querySelectorAll("[data-aptus-order-confirm-modal]").forEach((modal) => modal.remove());
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderOrderConfirmationModal().trim();
    const modal = wrapper.firstElementChild;
    if (!modal) {
        return;
    }
    document.body.appendChild(modal);
    document.body.classList.add("aptus-order-confirm-open");
    const close = () => {
        modal.remove();
        document.body.classList.remove("aptus-order-confirm-open");
    };
    modal.querySelector("[data-aptus-order-confirm-close]")?.addEventListener("click", close);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            close();
        }
    });
    modal.querySelector(".aptus-order-confirm-modal")?.focus?.();
}

function showRenewalConfirmationModal() {
    document.querySelectorAll("[data-aptus-renewal-confirm-modal]").forEach((modal) => modal.remove());
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderRenewalConfirmationModal().trim();
    const modal = wrapper.firstElementChild;
    if (!modal) {
        return;
    }
    document.body.appendChild(modal);
    document.body.classList.add("aptus-order-confirm-open");
    const close = () => {
        modal.remove();
        document.body.classList.remove("aptus-order-confirm-open");
    };
    modal.querySelector("[data-aptus-renewal-confirm-close]")?.addEventListener("click", close);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            close();
        }
    });
    modal.querySelector(".aptus-order-confirm-modal")?.focus?.();
}

function validateSoftwarePaymentForm(modal) {
    const selected = modal.querySelector(".aptus-payment-method input:checked");
    if (!selected || selected.value !== "card") {
        return null;
    }
    const cardNumber = modal.querySelector('[autocomplete="cc-number"]')?.value?.replace(/\s+/g, "") || "";
    const expiry = modal.querySelector('[autocomplete="cc-exp"]')?.value?.trim() || "";
    const cvv = modal.querySelector('[autocomplete="cc-csc"]')?.value?.trim() || "";
    if (cardNumber.length < 13) {
        return "Enter a valid card number.";
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        return "Enter expiry date as MM/YY.";
    }
    if (cvv.length < 3) {
        return "Enter a valid CVV.";
    }
    return null;
}

function updateSoftwareCheckoutStep(modal, step) {
    modal.querySelectorAll("[data-aptus-software-checkout-panel]").forEach((panel) => {
        const isTarget = panel.dataset.aptusSoftwareCheckoutPanel === String(step);
        panel.classList.toggle("is-active", isTarget);
        if (isTarget) {
            panel.removeAttribute("hidden");
        } else {
            panel.setAttribute("hidden", "hidden");
        }
    });

    modal.querySelectorAll("[data-aptus-checkout-step-indicator]").forEach((indicator) => {
        const indicatorStep = Number(indicator.dataset.aptusCheckoutStepIndicator);
        indicator.classList.toggle("is-active", indicatorStep === step);
        indicator.classList.toggle("is-complete", indicatorStep < step);
        const marker = indicator.querySelector("span");
        if (marker) {
            marker.textContent = indicatorStep < step ? "✓" : String(indicatorStep);
        }
    });

    const back = modal.querySelector("[data-aptus-software-checkout-back]");
    const next = modal.querySelector("[data-aptus-software-checkout-next]");
    const pay = modal.querySelector("[data-aptus-software-checkout-pay]");
    back?.toggleAttribute("hidden", step <= 1);
    next?.toggleAttribute("hidden", step >= 4);
    pay?.toggleAttribute("hidden", step !== 4);
    modal.dataset.aptusSoftwareCheckoutStep = String(step);
}

function closeSoftwareCheckout(modal) {
    modal?.remove();
    document.body.classList.remove("aptus-checkout-open");
}

function getSoftwarePaymentMethodLabel(modal) {
    const selected = modal.querySelector(".aptus-payment-method input:checked");
    const label = selected?.closest(".aptus-payment-method")?.querySelector("strong")?.textContent;
    return label || "Business payment method";
}

async function processSoftwarePayment(modal, orderContext) {
    const alert = modal.querySelector("[data-aptus-software-checkout-alert]");
    const payButton = modal.querySelector("[data-aptus-software-checkout-pay]");
    const paymentError = validateSoftwarePaymentForm(modal);
    if (paymentError) {
        if (alert) {
            alert.textContent = paymentError;
            alert.classList.add("is-error");
        }
        return false;
    }

    if (payButton) {
        payButton.disabled = true;
        payButton.textContent = "Processing payment…";
    }

    const amountBaisa = Math.max(50, Math.round(orderContext.totals.total * 1000));
    let paymentIntentId = null;

    try {
        if (portalCfg.useApiAuth !== false) {
            const response = await portalApiFetch("/api/payments/checkout", {
                method: "POST",
                body: JSON.stringify({
                    amount: amountBaisa,
                    currency: "omr",
                    idempotencyKey: makeId("PAY"),
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (alert) {
                    alert.textContent = data.error || "Payment could not be processed. Please try again.";
                    alert.classList.add("is-error");
                }
                if (payButton) {
                    payButton.disabled = false;
                    payButton.textContent = "Confirm payment";
                }
                return false;
            }
            paymentIntentId = data.paymentIntentId || null;
        }
    } catch {
        if (alert) {
            alert.textContent = "Payment service unavailable. Please try again.";
            alert.classList.add("is-error");
        }
        if (payButton) {
            payButton.disabled = false;
            payButton.textContent = "Confirm payment";
        }
        return false;
    }

    orderContext.payment = {
        method: getSoftwarePaymentMethodLabel(modal),
        amount: formatOmanAmount(orderContext.totals.total),
        paymentIntentId,
        paidAt: new Date().toISOString(),
    };
    orderContext.contact = {
        name: modal.querySelector('[name="softwareBillingContact"]')?.value?.trim() || orderContext.contact.name,
        email: modal.querySelector('[name="softwareBillingEmail"]')?.value?.trim() || orderContext.contact.email,
        phone: modal.querySelector('[name="softwareBillingPhone"]')?.value?.trim() || orderContext.contact.phone,
        company: modal.querySelector('[name="softwareCompany"]')?.value?.trim() || orderContext.contact.company,
    };
    return true;
}

function setSoftwareOrderSubmitAlert(purchaseSection, message, isError = true) {
    const alert = purchaseSection?.querySelector("[data-aptus-order-submit-alert]");
    if (!alert) {
        return;
    }
    if (!message) {
        alert.textContent = "";
        alert.setAttribute("hidden", "hidden");
        alert.classList.remove("is-error");
        return;
    }
    alert.textContent = message;
    alert.classList.toggle("is-error", isError);
    alert.removeAttribute("hidden");
}

async function completeSoftwareOrderRequest(purchaseSection, orderContext) {
    const { items, duration, totals, contact, customerMessage } = orderContext;
    const today = new Date();
    const state = ensurePortalState();
    let reference = makeId("ORD");
    let orderPlacedViaApi = false;

    setSoftwareOrderSubmitAlert(purchaseSection, "");

    try {
        if (portalCfg.useApiAuth !== false) {
            const response = await portalApiFetch("/api/orders/place", {
                method: "POST",
                body: JSON.stringify({
                    duration,
                    items: items.map((item) => ({
                        category: item.category,
                        productName: item.productName,
                        quantity: item.quantity,
                    })),
                    contactName: contact.name,
                    contactEmail: contact.email,
                    contactPhone: contact.phone,
                    customerMessage: customerMessage || undefined,
                }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const errorMessage =
                    data.error ||
                    (response.status === 401
                        ? "Your session expired. Please sign in again and resubmit your request."
                        : "Software request submission failed");
                pushActivity(errorMessage, getCurrentUser()?.name || "Account owner");
                setSoftwareOrderSubmitAlert(purchaseSection, errorMessage, true);
                return false;
            }
            reference = data.reference || reference;
            orderPlacedViaApi = true;
        }
    } catch {
        const errorMessage = "Could not reach the portal server. Check your connection and try again.";
        if (portalCfg.useApiAuth !== false) {
            pushActivity(errorMessage, getCurrentUser()?.name || "Account owner");
            setSoftwareOrderSubmitAlert(purchaseSection, errorMessage, true);
            return false;
        }
    }

    if (portalCfg.useApiAuth !== false && !orderPlacedViaApi) {
        setSoftwareOrderSubmitAlert(
            purchaseSection,
            "Your request could not be submitted. Please sign in and try again.",
            true,
        );
        return false;
    }

    if (portalCfg.useApiAuth === false || !orderPlacedViaApi) {
        items.forEach((item) => {
            state.purchases.unshift({
                id: reference,
                product: `${item.category} — ${item.productName}`,
                category: item.category,
                seats: item.quantity,
                amount: formatOmanAmount(item.unitPrice * item.quantity),
                purchasedOn: formatDisplayDate(toISODate(today)),
                status: "Submitted",
            });
        });
        state.purchases = state.purchases.slice(0, 24);
    } else {
        items.forEach((item) => {
            state.purchases.unshift({
                id: reference,
                product: `${item.category} — ${item.productName}`,
                category: item.category,
                seats: item.quantity,
                amount: formatOmanAmount(item.unitPrice * item.quantity),
                purchasedOn: formatDisplayDate(toISODate(today)),
                status: "Submitted",
            });
        });
        state.purchases = state.purchases.slice(0, 24);
    }
    setPortalState(state);
    pushActivity(
        `Software request ${reference} submitted (${items.length} product${items.length !== 1 ? "s" : ""})`,
        getCurrentUser()?.name || "Account owner",
    );

    purchaseSection.querySelectorAll('input[name="aptus-software-product"]:checked').forEach((input) => {
        input.checked = false;
        const qtyInput = purchaseSection.querySelector(`[data-aptus-product-qty="${input.value}"]`);
        if (qtyInput) {
            qtyInput.disabled = true;
            qtyInput.value = "1";
        }
    });
    const messageInput = purchaseSection.querySelector('[name="customerMessage"]');
    if (messageInput) {
        messageInput.value = "";
    }
    refreshSoftwareOrderSummary(purchaseSection);
    refreshDashboardViews();
    notifyPortalDataChanged("all");
    showOrderConfirmationModal();
    return true;
}

async function submitSoftwareOrderRequest(purchaseSection) {
    const orderContext = buildSoftwareOrderContext(purchaseSection);
    if (!orderContext.items.length || orderContext.totals.isCustomQuote) {
        return;
    }

    showPaymentProcessingLoader("Submitting your request…");
    try {
        const ok = await completeSoftwareOrderRequest(purchaseSection, orderContext);
        if (!ok) {
            return;
        }
    } finally {
        hidePaymentProcessingLoader();
    }
}

function bindSoftwareCheckoutModal(modal, orderContext, purchaseSection) {
    const dialog = modal.querySelector(".aptus-checkout-modal");
    const alert = modal.querySelector("[data-aptus-software-checkout-alert]");
    const terms = modal.querySelector("[data-aptus-software-checkout-terms]");
    const payButton = modal.querySelector("[data-aptus-software-checkout-pay]");
    const cardFields = modal.querySelector("[data-aptus-card-fields]");

    modal.dataset.aptusSoftwareCheckoutStep = "1";
    dialog?.focus?.();

    modal.querySelectorAll("[data-aptus-software-checkout-close]").forEach((button) => {
        button.addEventListener("click", () => closeSoftwareCheckout(modal));
    });

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeSoftwareCheckout(modal);
        }
    });

    modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSoftwareCheckout(modal);
        }
    });

    modal.querySelector("[data-aptus-software-checkout-next]")?.addEventListener("click", () => {
        const currentStep = Number(modal.dataset.aptusSoftwareCheckoutStep || "1");
        updateSoftwareCheckoutStep(modal, Math.min(currentStep + 1, 4));
    });

    modal.querySelector("[data-aptus-software-checkout-back]")?.addEventListener("click", () => {
        const currentStep = Number(modal.dataset.aptusSoftwareCheckoutStep || "1");
        updateSoftwareCheckoutStep(modal, Math.max(currentStep - 1, 1));
    });

    terms?.addEventListener("change", () => {
        if (payButton) {
            payButton.disabled = !terms.checked;
        }
    });

    modal.querySelectorAll(".aptus-payment-method input").forEach((input) => {
        input.addEventListener("change", () => {
            modal.querySelectorAll(".aptus-payment-method").forEach((method) => {
                method.classList.toggle("is-selected", method.contains(input) && input.checked);
            });
            if (cardFields) {
                cardFields.toggleAttribute("hidden", input.value !== "card");
            }
        });
    });

    payButton?.addEventListener("click", async () => {
        if (alert) {
            alert.textContent = "Payment is collected after your request is approved. Use Make Payment on approved requests in My Orders.";
            alert.classList.add("is-error");
        }
    });
}

function openSoftwareCheckout(purchaseSection) {
    const orderContext = buildSoftwareOrderContext(purchaseSection);
    if (!orderContext.items.length || orderContext.totals.isCustomQuote) {
        return;
    }
    document.querySelectorAll("[data-aptus-software-checkout-modal]").forEach((modal) => closeSoftwareCheckout(modal));
    const wrapper = document.createElement("div");
    wrapper.innerHTML = renderSoftwareCheckoutModal(orderContext).trim();
    const modal = wrapper.firstElementChild;
    if (!modal) {
        return;
    }
    document.body.appendChild(modal);
    document.body.classList.add("aptus-checkout-open");
    bindSoftwareCheckoutModal(modal, orderContext, purchaseSection);
}

function bindSoftwarePurchaseActions(root) {
    const section = root.querySelector("[data-aptus-software-purchase]");
    if (!section || section.dataset.aptusSoftwareBound === "true") {
        return;
    }
    section.dataset.aptusSoftwareBound = "true";

    section.querySelectorAll("[data-aptus-category-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
            const card = button.closest("[data-aptus-software-category]");
            const products = card?.querySelector("[data-aptus-category-products]");
            const expanded = card?.classList.toggle("is-expanded");
            button.setAttribute("aria-expanded", expanded ? "true" : "false");
            const marker = button.querySelector("em");
            if (marker) {
                marker.textContent = expanded ? "−" : "+";
            }
            if (products) {
                products.toggleAttribute("hidden", !expanded);
            }
        });
    });

    section.querySelectorAll('input[name="aptus-software-product"]').forEach((input) => {
        input.addEventListener("change", () => {
            const qtyInput = section.querySelector(`[data-aptus-product-qty="${input.value}"]`);
            if (qtyInput) {
                qtyInput.disabled = !input.checked;
            }
            refreshSoftwareOrderSummary(section);
        });
    });

    section.querySelectorAll("[data-aptus-product-qty]").forEach((input) => {
        input.addEventListener("input", () => refreshSoftwareOrderSummary(section));
    });

    section.querySelectorAll('input[name="aptus-software-duration"]').forEach((input) => {
        input.addEventListener("change", () => refreshSoftwareOrderSummary(section));
    });

    section.querySelector("[data-aptus-submit-request]")?.addEventListener("click", () => {
        void submitSoftwareOrderRequest(section);
    });
}

function bindLicenseReveal(root) {
    root.querySelectorAll("[data-aptus-license-toggle]").forEach((button) => {
        if (button.dataset.aptusLicenseBound === "true") {
            return;
        }
        button.dataset.aptusLicenseBound = "true";
        button.addEventListener("click", () => {
            const card = button.closest("[data-aptus-subscription-id]");
            const display = card?.querySelector("[data-aptus-license-display]");
            const licenseId = card?.dataset.aptusLicenseValue || "";
            if (!display || !licenseId) {
                return;
            }
            const revealed = button.getAttribute("aria-pressed") === "true";
            if (revealed) {
                display.textContent = maskLicenseId(licenseId);
                button.setAttribute("aria-pressed", "false");
                button.setAttribute("aria-label", "Reveal license ID");
                button.setAttribute("title", "Show license ID");
            } else {
                display.textContent = licenseId;
                button.setAttribute("aria-pressed", "true");
                button.setAttribute("aria-label", "Hide license ID");
                button.setAttribute("title", "Hide license ID");
            }
        });
    });
}

function bindDashboardInteractions(root, user) {
    bindProfileForm(root, user);
    bindSubscriptionControls(root);
    bindSubscriptionActions(root);
    bindSubscriptionTabs(root);
    bindSubscriptionLifecycleActions(root);
    bindSoftwarePurchaseActions(root);
    bindLicenseReveal(root);
    bindAccountMenus(root);
}

function setLoginFieldState(form, fieldName, message = "") {
    const field = form.querySelector(`[data-aptus-field="${fieldName}"]`);
    const input = field?.querySelector("input");
    const error = form.querySelector(`[data-aptus-field-error="${fieldName}"]`);
    if (!field || !input || !error) {
        return;
    }

    field.classList.toggle("is-invalid", Boolean(message));
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    error.textContent = message;
}

function resetLoginState(form, message) {
    form.classList.remove("is-submitting", "is-success");
    setLoginFieldState(form, "email");
    setLoginFieldState(form, "password");
    if (message) {
        message.textContent = "";
        message.classList.remove("is-error", "is-success");
    }
}

async function authenticateCustomer(email, password, remember = true) {
    return portalAccessGateway.verifyCredentials({ email, password, remember });
}

async function initLogin(root) {
    if (getSession()) {
        if (portalCfg.useApiAuth !== false) {
            try {
                const response = await fetch("/api/auth/me", { credentials: "include" });
                if (!response.ok) {
                    clearSession();
                } else {
                    redirectTo(getNextUrl());
                    return;
                }
            } catch {
                clearSession();
            }
        } else {
            redirectTo(getNextUrl());
            return;
        }
    }
    const form = root.querySelector("[data-aptus-login-form]");
    const message = root.querySelector("[data-aptus-login-message]");
    const submit = root.querySelector("[data-aptus-login-submit]");
    if (!form) {
        return;
    }
    form.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", () => {
            setLoginFieldState(form, input.name);
            if (message) {
                message.textContent = "";
                message.classList.remove("is-error", "is-success");
            }
        });
    });
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        resetLoginState(form, message);
        const formData = new FormData(form);
        const email = String(formData.get("email") || "").trim().toLowerCase();
        const password = String(formData.get("password") || "");
        const remember = formData.get("remember") === "persistent";
        let hasError = false;

        if (!email) {
            setLoginFieldState(form, "email", "Please enter your email address.");
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setLoginFieldState(form, "email", "Enter a valid email address.");
            hasError = true;
        }
        if (!password) {
            setLoginFieldState(form, "password", "Please enter your password.");
            hasError = true;
        }
        if (hasError) {
            form.querySelector(".is-invalid")?.focus();
            return;
        }

        const result = await authenticateCustomer(email, password, remember);

        if (result?.status === "not_found") {
            const registerUrl = `${portalCfg.registerUrl ?? "/register"}?email=${encodeURIComponent(email)}&reason=no_account`;
            redirectTo(registerUrl);
            return;
        }

        if (result?.status === "partner_exists") {
            const prefill = result.prefill ?? { email };
            const params = new URLSearchParams({
                email: prefill.email || email,
                reason: "existing_partner",
            });
            if (prefill.name) params.set("name", prefill.name);
            if (prefill.phone) params.set("phone", prefill.phone);
            if (prefill.crNumber) params.set("cr", prefill.crNumber);
            if (prefill.company) params.set("company", prefill.company);
            redirectTo(`${portalCfg.registerUrl ?? "/register"}?${params.toString()}`);
            return;
        }

        if (result?.status === "account_exists") {
            setLoginFieldState(form, "email");
            setLoginFieldState(form, "password", "This email is already registered.");
            if (message) {
                message.innerHTML = [
                    "<strong>Account already registered.</strong>",
                    ` Email: ${result.maskedEmail || "on file"}.`,
                    ` Phone: ${result.maskedPhone || "on file"}.`,
                    " Check your password or",
                    ` <a href="${portalCfg.registerUrl ?? "/register"}?recover=1&email=${encodeURIComponent(email)}">recover access</a>.`,
                ].join("");
                message.classList.add("is-error");
            }
            return;
        }

        const user = result?.status === "ok" ? result.user : null;

        if (!user) {
            setLoginFieldState(form, "email");
            setLoginFieldState(form, "password", "Check your password and try again.");
            if (message) {
                message.textContent = "Incorrect password. Please try again.";
                message.classList.add("is-error");
            }
            return;
        }

        form.classList.add("is-submitting", "is-success");
        if (submit) {
            submit.textContent = "Signing in...";
        }
        if (message) {
            message.textContent = "Success. Opening your customer workspace...";
            message.classList.add("is-success");
        }
        setSession(user, remember);
        refreshNavbar();
        window.setTimeout(() => redirectTo(getNextUrl()), 450);
    });
}

function initDashboard(root) {
    const user = getCurrentUser();
    if (!user) {
        redirectTo(getLoginUrlWithNext());
        return;
    }

    ensurePortalState();
    const section = root.dataset.aptusDashboardSection || "dashboard";
    const content = root.querySelector("[data-aptus-dashboard-content]");
    if (content) {
        content.innerHTML = renderPage(section, user);
        document.dispatchEvent(
            new CustomEvent("aptus:dashboard-rendered", {
                detail: { root },
            })
        );
    }

    root.querySelectorAll(`[data-aptus-section-link="${section}"]`).forEach((link) => {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
    });

    root.querySelectorAll("[data-aptus-logout]").forEach((button) => {
        button.addEventListener("click", () => {
            logout();
        });
    });

    hydrateDashboard(root, user);
    bindDashboardInteractions(root, user);
}

function renderSignedOutActions() {
    return `
        <a class="btn btn-aptus-cta aptus-navbar__cta aptus-login-link" href="${LOGIN_URL}">Sign In</a>
    `;
}

function renderSignedInActions(user) {
    return `
        <button type="button" class="btn btn-aptus-ghost aptus-logout-link" data-aptus-logout="true">Log out</button>
        <div class="aptus-user-menu">
            <button type="button" class="aptus-user-menu__trigger" data-aptus-account-menu-toggle="true" aria-expanded="false" aria-label="Open account menu">
                <span class="aptus-user-menu__avatar ${user.avatarDataUrl ? "has-image" : ""}" style="${user.avatarDataUrl ? `background-image: url('${escapeHtml(user.avatarDataUrl)}')` : ""}">${user.avatarDataUrl ? "" : escapeHtml(user.initials)}</span>
            </button>
            <div class="aptus-user-menu__panel" hidden>
                <strong>${escapeHtml(user.company)}</strong>
                <a href="${portalRoute("profile")}">Profile settings</a>
                <a href="${portalRoute("subscriptions")}">Subscriptions</a>
                <button type="button" data-aptus-logout="true">Log out</button>
            </div>
        </div>
    `;
}

function closeAccountMenus(scope = document) {
    scope.querySelectorAll(".aptus-user-menu.is-open").forEach((menu) => {
        menu.classList.remove("is-open");
        const trigger = menu.querySelector("[data-aptus-account-menu-toggle]");
        const panel = menu.querySelector(".aptus-user-menu__panel");
        trigger?.setAttribute("aria-expanded", "false");
        panel?.setAttribute("hidden", "hidden");
    });
}

function bindAccountMenus(root = document) {
    root.querySelectorAll("[data-aptus-account-menu-toggle]").forEach((trigger) => {
        if (trigger.dataset.aptusMenuBound === "true") {
            return;
        }
        trigger.dataset.aptusMenuBound = "true";
        trigger.addEventListener("click", (event) => {
            event.stopPropagation();
            const menu = trigger.closest(".aptus-user-menu");
            const panel = menu?.querySelector(".aptus-user-menu__panel");
            if (!menu || !panel) {
                return;
            }
            const willOpen = !menu.classList.contains("is-open");
            closeAccountMenus(document);
            menu.classList.toggle("is-open", willOpen);
            trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
            if (willOpen) {
                panel.removeAttribute("hidden");
            } else {
                panel.setAttribute("hidden", "hidden");
            }
        });
    });
}

function refreshNavbar() {
    const actions = document.querySelector(".aptus-navbar__actions");
    if (!actions) {
        return;
    }
    const user = getCurrentUser();
    actions.innerHTML = user ? renderSignedInActions(user) : renderSignedOutActions();
    actions.querySelectorAll("[data-aptus-logout]").forEach((button) => {
        button.addEventListener("click", () => {
            logout();
        });
    });
    bindAccountMenus(actions);
}

function protectCurrentPage() {
    if (isProtectedPath() && !getCurrentUser()) {
        redirectTo(getLoginUrlWithNext());
    }
}

async function logout() {
    if (portalCfg.useApiAuth !== false) {
        try {
            await portalApiFetch("/api/auth/logout", { method: "POST" });
        } catch {
            /* ignore network errors during sign-out */
        }
    }
    portalAccessToken = null;
    portalAccessTokenExpiresAt = 0;
    clearSession();
    refreshNavbar();
    redirectTo(LOGIN_URL);
}

async function refreshPortalPages() {
    await syncSessionFromApi();
    await syncSubscriptionsFromApi();
    refreshNavbar();
    protectCurrentPage();
    document.querySelectorAll("[data-aptus-auth-page='login']").forEach(initLogin);
    document.querySelectorAll("[data-aptus-dashboard-page='true']").forEach(initDashboard);
}

function exposePortalAuth() {
    window.aptusPortalAuth = {
        clearSession,
        getCurrentUser,
        getSession,
        logout,
        refreshPortal: refreshPortalPages,
        refreshDashboardViews,
        setSubscriptions(apiSubscriptions) {
            applyApiSubscriptions(apiSubscriptions);
            refreshDashboardViews();
        },
    };
}

async function syncSessionFromApi() {
    if (portalCfg.useApiAuth === false || getSession()) {
        return;
    }
    try {
        const response = await portalApiFetch("/api/auth/me");
        if (!response.ok) {
            return;
        }
        const data = await response.json();
        if (data.accessToken && data.expiresIn) {
            storePortalAccessToken(data.accessToken, data.expiresIn);
        }
        if (data.user) {
            setSession(data.user, true);
        }
    } catch {
        /* session sync is best-effort */
    }
}

function boot() {
    exposePortalAuth();
    refreshPortalPages()
        .catch(() => {
            /* dashboard refresh is best-effort */
        })
        .finally(() => {
            document.dispatchEvent(new CustomEvent("aptus:portal-ready"));
        });
    document.addEventListener("click", (event) => {
        const logoutButton = event.target.closest?.("[data-aptus-logout]");
        if (logoutButton) {
            event.preventDefault();
            logout();
            return;
        }
        if (!event.target.closest?.(".aptus-user-menu")) {
            closeAccountMenus(document);
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeAccountMenus(document);
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
    boot();
}
})();
