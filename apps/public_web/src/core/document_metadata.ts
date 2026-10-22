import type { SupportedLocale } from "@mbc/api-contracts";

export type LandingMetadataInput = {
  hero: {
    imageUrl: string;
  };
  identity: {
    englishName: string;
    logoUrl: string;
    mission: string;
    name: string;
  };
  locale: SupportedLocale;
  updatedAt: string;
};

export type LandingDocumentMetadata = {
  canonicalUrl: string;
  description: string;
  iconUrl: string | null;
  openGraphLocale: string;
  shareImageUrl: string | null;
  structuredData: Record<string, unknown>;
  title: string;
};

const openGraphLocales: Record<SupportedLocale, string> = {
  en: "en_US",
  es: "es_US",
  "zh-Hans": "zh_CN",
  "zh-Hant": "zh_TW"
};

export function createLandingDocumentMetadata(
  content: LandingMetadataInput,
  pageUrl: string
): LandingDocumentMetadata {
  const canonical = new URL(pageUrl);
  canonical.hash = "";
  canonical.search = "";

  const description = localizedDescription(
    content.locale,
    content.identity.name,
    content.identity.mission
  );
  const iconUrl = versionAssetUrl(
    content.identity.logoUrl,
    content.updatedAt,
    canonical
  );
  const shareImageUrl = versionAssetUrl(
    content.hero.imageUrl || content.identity.logoUrl,
    content.updatedAt,
    canonical
  );

  return {
    canonicalUrl: canonical.toString(),
    description,
    iconUrl,
    openGraphLocale: openGraphLocales[content.locale],
    shareImageUrl,
    structuredData: compactRecord({
      "@context": "https://schema.org",
      "@type": "Church",
      name: content.identity.name,
      alternateName:
        content.identity.englishName.trim() || content.identity.name,
      description,
      url: canonical.toString(),
      logo: iconUrl ?? undefined,
      image: shareImageUrl ?? undefined
    }),
    title: content.identity.name
  };
}

export function applyLandingDocumentMetadata(
  document: Document,
  metadata: LandingDocumentMetadata
) {
  document.title = metadata.title;
  setNamedMeta(document, "description", metadata.description);
  setPropertyMeta(document, "og:type", "website");
  setPropertyMeta(document, "og:title", metadata.title);
  setPropertyMeta(document, "og:description", metadata.description);
  setPropertyMeta(document, "og:url", metadata.canonicalUrl);
  setPropertyMeta(document, "og:locale", metadata.openGraphLocale);
  setNamedMeta(document, "twitter:card", "summary_large_image");
  setNamedMeta(document, "twitter:title", metadata.title);
  setNamedMeta(document, "twitter:description", metadata.description);
  setLink(document, "canonical", metadata.canonicalUrl);

  if (metadata.iconUrl) {
    setLink(document, "icon", metadata.iconUrl, "image/png");
    setLink(document, "apple-touch-icon", metadata.iconUrl);
  }
  if (metadata.shareImageUrl) {
    setPropertyMeta(document, "og:image", metadata.shareImageUrl);
    setNamedMeta(document, "twitter:image", metadata.shareImageUrl);
  }

  let script = document.head.querySelector<HTMLScriptElement>(
    "#public-landing-structured-data"
  );
  if (!script) {
    script = document.createElement("script");
    script.id = "public-landing-structured-data";
    script.type = "application/ld+json";
    document.head.append(script);
  }
  script.textContent = JSON.stringify(metadata.structuredData);
}

function localizedDescription(
  locale: SupportedLocale,
  name: string,
  mission: string
) {
  if (locale === "zh-Hans" || locale === "zh-Hant") {
    return `${trimSentence(name)}，${trimSentence(mission)}。`;
  }
  return `${trimSentence(name)}. ${trimSentence(mission)}.`;
}

function trimSentence(value: string) {
  return value.trim().replace(/[,.，。]+$/u, "");
}

function versionAssetUrl(
  value: string,
  version: string,
  pageUrl: URL
) {
  if (!value.trim()) {
    return null;
  }
  const assetUrl = new URL(value, pageUrl.origin);
  assetUrl.searchParams.set("v", version);
  return assetUrl.toString();
}

function setNamedMeta(document: Document, name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`
  );
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.append(element);
  }
  element.content = content;
}

function setPropertyMeta(document: Document, property: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.append(element);
  }
  element.content = content;
}

function setLink(document: Document, rel: string, href: string, type?: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`
  );
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.append(element);
  }
  element.href = href;
  if (type) {
    element.type = type;
  }
}

function compactRecord(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  );
}
