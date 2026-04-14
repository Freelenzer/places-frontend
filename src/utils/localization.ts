/**
 * Returns the best available translation for the current browser locale.
 * Falls back to English, then the first available translation.
 */
export function getLocalized(
  translation: Record<string, string> | null | undefined
): string {
  if (!translation) return "";

  // e.g. "de-DE" → "german", "zh-CN" → "chinese"
  const localeMap: Record<string, string> = {
    de: "german",
    en: "english",
    fr: "french",
    fa: "persian",
    zh: "chinese",
    pt: "portuguese",
    nl: "dutch",
    ja: "japanese",
    es: "spanish",
    ko: "korean",
    hr: "croatian",
  };

  const browserLang = navigator.language?.split("-")[0]?.toLowerCase();
  const preferredKey = localeMap[browserLang];

  return (
    (preferredKey && translation[preferredKey]) ||
    translation["english"] ||
    Object.values(translation).find(
      (v) => typeof v === "string" && v.length > 0
    ) ||
    ""
  );
}
