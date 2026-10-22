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
    loadingErrorTitle: "We couldn't load the website",
    loadingError:
      "Please check your connection and try again.",
    loadingMessage: "Gathering the latest church information for you.",
    loadingTitle: "Preparing your welcome",
    openNavigation: "Open navigation",
    primaryNavigation: "Primary navigation",
    refreshError: "The new language could not be loaded.",
    retry: "Try again"
  },
  es: {
    changeLanguage: "Cambiar idioma",
    loadingErrorTitle: "No pudimos cargar el sitio",
    loadingError:
      "Comprueba tu conexión e inténtalo de nuevo.",
    loadingMessage: "Reuniendo la información más reciente de la iglesia.",
    loadingTitle: "Preparando tu bienvenida",
    openNavigation: "Abrir navegación",
    primaryNavigation: "Navegación principal",
    refreshError: "No se pudo cargar el nuevo idioma.",
    retry: "Reintentar"
  },
  "zh-Hans": {
    changeLanguage: "切换语言",
    loadingErrorTitle: "暂时无法载入官网",
    loadingError: "请检查网络连接后重试。",
    loadingMessage: "正在为你获取最新的教会信息。",
    loadingTitle: "正在准备欢迎页面",
    openNavigation: "打开导航",
    primaryNavigation: "主要导航",
    refreshError: "暂时无法载入所选语言。",
    retry: "重新载入"
  },
  "zh-Hant": {
    changeLanguage: "切換語言",
    loadingErrorTitle: "暫時無法載入官網",
    loadingError: "請檢查網路連線後重試。",
    loadingMessage: "正在為你取得最新的教會資訊。",
    loadingTitle: "正在準備歡迎頁面",
    openNavigation: "打開導航",
    primaryNavigation: "主要導航",
    refreshError: "暫時無法載入所選語言。",
    retry: "重新載入"
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
