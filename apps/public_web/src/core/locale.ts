import {
  supportedLocales,
  type SupportedLocale
} from "@mbc/api-contracts";
import { computed, ref, watchEffect } from "vue";

const storageKey = "mbc_public_locale";

export type PublicLocaleOption = {
  title: string;
  value: SupportedLocale;
};

const localeTitles: Record<SupportedLocale, string> = {
  en: "English",
  es: "Español",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文"
};

const publicMessages: Record<SupportedLocale, Record<string, string>> = {
  en: {
    changeLanguage: "Change language",
    loadingError:
      "Website content is temporarily unavailable. Please try again later.",
    openNavigation: "Open navigation",
    primaryNavigation: "Primary navigation"
  },
  es: {
    changeLanguage: "Cambiar idioma",
    loadingError:
      "El contenido del sitio no está disponible temporalmente. Inténtalo de nuevo más tarde.",
    openNavigation: "Abrir navegación",
    primaryNavigation: "Navegación principal"
  },
  "zh-Hans": {
    changeLanguage: "切换语言",
    loadingError: "官网内容暂时无法载入，请稍后再试。",
    openNavigation: "打开导航",
    primaryNavigation: "主要导航"
  },
  "zh-Hant": {
    changeLanguage: "切換語言",
    loadingError: "官網內容暫時無法載入，請稍後再試。",
    openNavigation: "打開導航",
    primaryNavigation: "主要導航"
  }
};

const currentLocale = ref<SupportedLocale>(readInitialLocale());

watchEffect(() => {
  document.documentElement.lang = currentLocale.value;
});

export function usePublicLocale() {
  const localeOptions = computed<PublicLocaleOption[]>(() =>
    supportedLocales.map((locale) => ({
      title: localeTitles[locale],
      value: locale
    }))
  );

  function setLocale(locale: SupportedLocale) {
    currentLocale.value = locale;
    localStorage.setItem(storageKey, locale);
  }

  function t(key: string) {
    return (
      publicMessages[currentLocale.value][key] ??
      publicMessages.en[key] ??
      key
    );
  }

  return {
    locale: currentLocale,
    localeOptions,
    setLocale,
    t
  };
}

function readInitialLocale(): SupportedLocale {
  const stored = localStorage.getItem(storageKey);
  const storedLocale = normalizeLocale(stored);
  if (storedLocale) {
    return storedLocale;
  }

  for (const language of navigator.languages ?? [navigator.language]) {
    const locale = normalizeLocale(language);
    if (locale) {
      return locale;
    }
  }

  return "zh-Hans";
}

function normalizeLocale(
  value: string | null | undefined
): SupportedLocale | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace("_", "-").toLowerCase();
  if (
    normalized === "zh-hant" ||
    normalized.startsWith("zh-tw") ||
    normalized.startsWith("zh-hk")
  ) {
    return "zh-Hant";
  }
  if (
    normalized === "zh-hans" ||
    normalized.startsWith("zh-cn") ||
    normalized.startsWith("zh-sg") ||
    normalized === "zh"
  ) {
    return "zh-Hans";
  }
  if (normalized.startsWith("es")) {
    return "es";
  }
  if (normalized.startsWith("en")) {
    return "en";
  }
  return null;
}
