import { I18n } from "../../../i18n/index.js";

const APP_LANGUAGE_NATIVE_LABELS = {
  ar: "العربية",
  bs: "Bosanski",
  cs: "Čeština",
  de: "Deutsch",
  en: "English",
  el: "Ελληνικά",
  es: "Español",
  "es-419": "Español (Latinoamérica)",
  fr: "Français",
  he: "עברית",
  hi: "हिन्दी",
  hu: "Magyar",
  id: "Bahasa Indonesia",
  it: "Italiano",
  ja: "日本語",
  lt: "Lietuvių",
  nl: "Nederlands",
  no: "Norsk",
  pl: "Polski",
  "pt-br": "Português (Brasil)",
  "pt-pt": "Português (Portugal)",
  ro: "Română",
  ru: "Русский",
  sk: "Slovenčina",
  sl: "Slovenščina",
  sv: "Svenska",
  ta: "தமிழ்",
  tr: "Türkçe",
  vi: "Tiếng Việt",
  "zh-cn": "简体中文"
};

export function appLanguageOptionLabel(localeId) {
  const normalized = String(localeId || "").trim().toLowerCase();
  if (!normalized) {
    return "System Default";
  }
  return APP_LANGUAGE_NATIVE_LABELS[normalized] || normalized.toUpperCase();
}

export const LANGUAGE_OPTIONS = [
  { id: null, labelKey: "common.systemDefault" },
  ...I18n.getSupportedLocales()
    .map((localeId) => ({
      id: localeId,
      label: appLanguageOptionLabel(localeId)
    }))
    .sort((left, right) => String(left.label || "").localeCompare(String(right.label || "")))
];

// Shared language catalogue used to build the subtitle, audio and TMDB
// language pickers below.
const AVAILABLE_LANGUAGES = [
  { id: "af", label: "Afrikaans" },
  { id: "sq", label: "Albanian" },
  { id: "am", label: "Amharic" },
  { id: "ar", label: "Arabic" },
  { id: "hy", label: "Armenian" },
  { id: "az", label: "Azerbaijani" },
  { id: "eu", label: "Basque" },
  { id: "be", label: "Belarusian" },
  { id: "bn", label: "Bengali" },
  { id: "bs", label: "Bosnian" },
  { id: "bg", label: "Bulgarian" },
  { id: "my", label: "Burmese" },
  { id: "ca", label: "Catalan" },
  { id: "zh", label: "Chinese" },
  { id: "zh-cn", label: "Chinese (Simplified)" },
  { id: "zh-tw", label: "Chinese (Traditional)" },
  { id: "hr", label: "Croatian" },
  { id: "cs", label: "Czech" },
  { id: "da", label: "Danish" },
  { id: "nl", label: "Dutch" },
  { id: "en", label: "English" },
  { id: "et", label: "Estonian" },
  { id: "tl", label: "Filipino" },
  { id: "fi", label: "Finnish" },
  { id: "fr", label: "French" },
  { id: "gl", label: "Galician" },
  { id: "ka", label: "Georgian" },
  { id: "de", label: "German" },
  { id: "el", label: "Greek" },
  { id: "gu", label: "Gujarati" },
  { id: "he", label: "Hebrew" },
  { id: "hi", label: "Hindi" },
  { id: "hu", label: "Hungarian" },
  { id: "is", label: "Icelandic" },
  { id: "id", label: "Indonesian" },
  { id: "ga", label: "Irish" },
  { id: "it", label: "Italian" },
  { id: "ja", label: "Japanese" },
  { id: "kn", label: "Kannada" },
  { id: "kk", label: "Kazakh" },
  { id: "km", label: "Khmer" },
  { id: "ko", label: "Korean" },
  { id: "lo", label: "Lao" },
  { id: "lv", label: "Latvian" },
  { id: "lt", label: "Lithuanian" },
  { id: "mk", label: "Macedonian" },
  { id: "ms", label: "Malay" },
  { id: "ml", label: "Malayalam" },
  { id: "mt", label: "Maltese" },
  { id: "mr", label: "Marathi" },
  { id: "mn", label: "Mongolian" },
  { id: "ne", label: "Nepali" },
  { id: "no", label: "Norwegian" },
  { id: "pa", label: "Punjabi" },
  { id: "fa", label: "Persian" },
  { id: "pl", label: "Polish" },
  { id: "pt", label: "Portuguese (Portugal)" },
  { id: "pt-br", label: "Portuguese (Brazil)" },
  { id: "ro", label: "Romanian" },
  { id: "ru", label: "Russian" },
  { id: "sr", label: "Serbian" },
  { id: "si", label: "Sinhala" },
  { id: "sk", label: "Slovak" },
  { id: "sl", label: "Slovenian" },
  { id: "es", label: "Spanish" },
  { id: "es-419", label: "Spanish (Latin America)" },
  { id: "sw", label: "Swahili" },
  { id: "sv", label: "Swedish" },
  { id: "ta", label: "Tamil" },
  { id: "te", label: "Telugu" },
  { id: "th", label: "Thai" },
  { id: "tr", label: "Turkish" },
  { id: "uk", label: "Ukrainian" },
  { id: "ur", label: "Urdu" },
  { id: "uz", label: "Uzbek" },
  { id: "vi", label: "Vietnamese" },
  { id: "cy", label: "Welsh" },
  { id: "zu", label: "Zulu" }
].sort((left, right) => left.label.localeCompare(right.label));

export const PREFERRED_SUBTITLE_LANGUAGE_OPTIONS = [
  { id: "off", label: "Off" },
  ...AVAILABLE_LANGUAGES
];

// Preferred audio language previously only offered System / English / Italian.
// The selected value is matched generically against each stream's audio tracks,
// so the full shared language catalogue can be offered.
export const PREFERRED_PLAYBACK_LANGUAGE_OPTIONS = [
  { id: "system", labelKey: "common.system" },
  // "None" never auto-selects an audio track, leaving the stream's own
  // default playing (the player already treats "none" as no preference).
  { id: "none", labelKey: "common.none" },
  ...AVAILABLE_LANGUAGES
];

export const TMDB_LANGUAGE_OPTIONS = [
  { id: "en-US", label: "English" },
  { id: "en-AU", label: "English (Australia)" },
  { id: "en-CA", label: "English (Canada)" },
  { id: "en-GB", label: "English (United Kingdom)" },
  ...AVAILABLE_LANGUAGES.filter((option) => option.id !== "en")
].sort((left, right) => String(left.label || "").localeCompare(String(right.label || "")));

export function normalizeSelectableSubtitleLanguageCode(language) {
  const code = String(language ?? "").trim().toLowerCase();
  if (!code) {
    return "off";
  }
  switch (code) {
    case "pt-br":
    case "pt_br":
    case "br":
    case "pob":
      return "pt-br";
    case "pt-pt":
    case "pt_pt":
    case "por":
      return "pt";
    case "forced":
    case "force":
    case "forc":
      return "forced";
    case "none":
    case "off":
      return "off";
    default:
      return code;
  }
}

export function normalizeTmdbLanguageCode(language) {
  const code = String(language ?? "").trim().replace(/_/g, "-");
  if (!code) {
    return "en-US";
  }

  switch (code.toLowerCase()) {
    case "en":
    case "en-us":
      return "en-US";
    case "en-au":
      return "en-AU";
    case "en-ca":
      return "en-CA";
    case "en-gb":
      return "en-GB";
    case "it-it":
      return "it";
    case "es-es":
      return "es";
    case "pt-pt":
      return "pt";
    default:
      return code.toLowerCase();
  }
}

export function subtitleLanguageOptionCode(option) {
  const normalized = normalizeSelectableSubtitleLanguageCode(option?.id);
  if (!normalized || normalized === "off") {
    return "";
  }
  return normalized.toUpperCase();
}
