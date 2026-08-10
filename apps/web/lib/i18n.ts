export const APP_LOCALES = ["en-ZW", "sn-ZW", "ar"] as const;
export const DEFAULT_LOCALE = APP_LOCALES[0];
export const LOCALE_COOKIE_NAME = "auto_iq_locale";

export type AppLocale = (typeof APP_LOCALES)[number];
export type TextDirection = "ltr" | "rtl";
export type MessageValues = Record<string, string | number>;

const EN_MESSAGES = {
  "app.name": "BiSell AutoIQ",
  "locale.label": "Language",
  "locale.en-ZW": "English",
  "locale.sn-ZW": "Shona",
  "locale.ar": "Arabic",
  "nav.primary": "Primary navigation",
  "nav.mobilePrimary": "Mobile primary navigation",
  "nav.buy": "Buy a car",
  "nav.sell": "Sell my car",
  "nav.browse": "Browse",
  "nav.saved": "Saved",
  "nav.quotes": "Quotes",
  "nav.requests": "Requests",
  "nav.viewings": "Viewings",
  "nav.account": "Account",
  "nav.workspace": "Workspace",
  "nav.allListings": "All listings",
  "nav.newListing": "New listing",
  "nav.buyerView": "Browse buyers' view",
  "nav.inspectionTasks": "Inspection tasks",
  "nav.marketplace": "Marketplace",
  "auth.signIn": "Sign in",
  "auth.signOut": "Sign out",
  "auth.signingOut": "Signing out...",
  "auth.signOutError": "Couldn't sign out",
  "menu.open": "Open menu",
  "menu.close": "Close menu",
  "catalogue.resultCount": "{count, plural, one {# vehicle} other {# vehicles}}",
} as const;

export type MessageKey = keyof typeof EN_MESSAGES;

const SN_MESSAGES: Record<MessageKey, string> = {
  "app.name": "BiSell AutoIQ",
  "locale.label": "Mutauro",
  "locale.en-ZW": "Chirungu",
  "locale.sn-ZW": "ChiShona",
  "locale.ar": "ChiArabhu",
  "nav.primary": "Kufamba kukuru",
  "nav.mobilePrimary": "Kufamba kukuru kwefoni",
  "nav.buy": "Tenga mota",
  "nav.sell": "Tengesa mota yangu",
  "nav.browse": "Tsvaga",
  "nav.saved": "Zvakachengetwa",
  "nav.quotes": "Mitengo",
  "nav.requests": "Zvikumbiro",
  "nav.viewings": "Kuona mota",
  "nav.account": "Akaundi",
  "nav.workspace": "Nzvimbo yebasa",
  "nav.allListings": "Mota dzose",
  "nav.newListing": "Wedzera mota",
  "nav.buyerView": "Ona sezvinoita mutengi",
  "nav.inspectionTasks": "Mabasa ekuongorora",
  "nav.marketplace": "Musika",
  "auth.signIn": "Pinda",
  "auth.signOut": "Buda",
  "auth.signingOut": "Kubuda...",
  "auth.signOutError": "Hatina kukwanisa kubuda",
  "menu.open": "Vhura menyu",
  "menu.close": "Vhara menyu",
  "catalogue.resultCount": "{count, plural, one {# mota} other {# mota}}",
};

const AR_MESSAGES: Record<MessageKey, string> = {
  "app.name": "BiSell AutoIQ",
  "locale.label": "اللغة",
  "locale.en-ZW": "الإنجليزية",
  "locale.sn-ZW": "الشونا",
  "locale.ar": "العربية",
  "nav.primary": "التنقل الرئيسي",
  "nav.mobilePrimary": "التنقل الرئيسي للجوال",
  "nav.buy": "شراء سيارة",
  "nav.sell": "بيع سيارتي",
  "nav.browse": "تصفح",
  "nav.saved": "المحفوظات",
  "nav.quotes": "العروض",
  "nav.requests": "الطلبات",
  "nav.viewings": "المعاينات",
  "nav.account": "الحساب",
  "nav.workspace": "مساحة العمل",
  "nav.allListings": "كل الإعلانات",
  "nav.newListing": "إعلان جديد",
  "nav.buyerView": "عرض واجهة المشترين",
  "nav.inspectionTasks": "مهام الفحص",
  "nav.marketplace": "السوق",
  "auth.signIn": "تسجيل الدخول",
  "auth.signOut": "تسجيل الخروج",
  "auth.signingOut": "جارٍ تسجيل الخروج...",
  "auth.signOutError": "تعذر تسجيل الخروج",
  "menu.open": "فتح القائمة",
  "menu.close": "إغلاق القائمة",
  "catalogue.resultCount": "{count, plural, one {# مركبة} other {# مركبات}}",
};

const MESSAGES: Record<AppLocale, Record<MessageKey, string>> = {
  "en-ZW": EN_MESSAGES,
  "sn-ZW": SN_MESSAGES,
  ar: AR_MESSAGES,
};

export function resolveLocale(value?: string | null): AppLocale {
  const requested = value?.split(",", 1)[0]?.split(";", 1)[0]?.trim().toLowerCase();
  if (requested?.startsWith("sn")) return "sn-ZW";
  if (requested?.startsWith("ar")) return "ar";
  return DEFAULT_LOCALE;
}

export function localeDirection(locale: AppLocale): TextDirection {
  return locale === "ar" ? "rtl" : "ltr";
}

export function normalizeReturnPath(value: unknown) {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}

export function translate(
  locale: AppLocale,
  key: MessageKey,
  values: MessageValues = {},
) {
  const withPlurals = replacePlurals(MESSAGES[locale][key], locale, values);
  return withPlurals.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(values[name] ?? `{${name}}`),
  );
}

function replacePlurals(message: string, locale: AppLocale, values: MessageValues) {
  const pattern = /\{(\w+),\s*plural,\s*one\s*\{([^{}]*)\}\s*other\s*\{([^{}]*)\}\}/g;
  return message.replace(pattern, (_, name: string, one: string, other: string) => {
    const count = Number(values[name] ?? 0);
    const template = new Intl.PluralRules(locale).select(count) === "one" ? one : other;
    return template.replaceAll("#", new Intl.NumberFormat(locale).format(count));
  });
}
