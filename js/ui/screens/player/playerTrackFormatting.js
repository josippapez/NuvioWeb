import { I18n } from "../../../i18n/index.js"

const LANGUAGE_DISPLAY_NAME_CACHE = new Map()

const AUDIO_TRACK_LANGUAGE_KEY_BY_CODE = {
  ar: "common.arabic",
  de: "common.german",
  en: "common.english",
  es: "common.spanish",
  fr: "common.french",
  hi: "common.hindi",
  hu: "common.hungarian",
  it: "common.italian",
  ja: "common.japanese",
  ko: "common.korean",
  nl: "common.dutch",
  pl: "common.polish",
  pt: "common.portuguese",
  ro: "common.romanian",
  ru: "common.russian",
  sk: "common.slovak",
  sl: "common.slovenian",
  sv: "common.swedish",
  tr: "common.turkish",
  vi: "common.vietnamese",
  zh: "common.chinese"
}

// Maps ISO 639-2 (bibliographic + terminologic) and a few legacy codes to
// the ISO 639-1 / app language ids, so subtitle and audio tracks labelled
// with 3-letter codes (common from OpenSubtitles and embedded tracks) match
// the preferred language and show the right language name.
const LANGUAGE_CODE_ALIASES = {
  afr: "af",
  alb: "sq",
  amh: "am",
  ara: "ar",
  arm: "hy",
  aze: "az",
  baq: "eu",
  bel: "be",
  ben: "bn",
  bos: "bs",
  bul: "bg",
  bur: "my",
  cat: "ca",
  ces: "cs",
  chi: "zh",
  cym: "cy",
  cze: "cs",
  dan: "da",
  deu: "de",
  dut: "nl",
  ell: "el",
  eng: "en",
  est: "et",
  eus: "eu",
  fas: "fa",
  fil: "tl",
  fin: "fi",
  fra: "fr",
  fre: "fr",
  geo: "ka",
  ger: "de",
  gle: "ga",
  glg: "gl",
  gre: "el",
  guj: "gu",
  heb: "he",
  hin: "hi",
  hrv: "hr",
  hun: "hu",
  hye: "hy",
  ice: "is",
  in: "id",
  ind: "id",
  isl: "is",
  ita: "it",
  iw: "he",
  jpn: "ja",
  kan: "kn",
  kat: "ka",
  kaz: "kk",
  khm: "km",
  kor: "ko",
  lao: "lo",
  lav: "lv",
  lit: "lt",
  mac: "mk",
  mal: "ml",
  mar: "mr",
  may: "ms",
  mkd: "mk",
  mlt: "mt",
  mon: "mn",
  msa: "ms",
  mya: "my",
  nep: "ne",
  nld: "nl",
  nor: "no",
  pan: "pa",
  pb: "pt-br",
  per: "fa",
  pob: "pt-br",
  pol: "pl",
  por: "pt",
  ptb: "pt-br",
  ron: "ro",
  rum: "ro",
  rus: "ru",
  sin: "si",
  slk: "sk",
  slo: "sk",
  slv: "sl",
  spa: "es",
  sqi: "sq",
  srp: "sr",
  swa: "sw",
  swe: "sv",
  tam: "ta",
  tel: "te",
  tgl: "tl",
  tha: "th",
  tur: "tr",
  ukr: "uk",
  und: "",
  urd: "ur",
  uzb: "uz",
  vie: "vi",
  wel: "cy",
  zho: "zh",
  zul: "zu"
}

const LANGUAGE_NAME_ALIASES = {
  arabic: "ar",
  arabo: "ar",
  chinese: "zh",
  cinese: "zh",
  deutsch: "de",
  dutch: "nl",
  english: "en",
  inglese: "en",
  french: "fr",
  francais: "fr",
  francese: "fr",
  german: "de",
  hindi: "hi",
  hungarian: "hu",
  italiano: "it",
  italian: "it",
  giapponese: "ja",
  japanese: "ja",
  korean: "ko",
  coreano: "ko",
  olandese: "nl",
  polish: "pl",
  polacco: "pl",
  brazilian: "pt-br",
  "brazilian portuguese": "pt-br",
  brasileiro: "pt-br",
  portuguese: "pt",
  "portuguese br": "pt-br",
  "portuguese brazil": "pt-br",
  "portugues brasil": "pt-br",
  "portugues do brasil": "pt-br",
  portoghese: "pt",
  romanian: "ro",
  rumeno: "ro",
  russian: "ru",
  russo: "ru",
  slovak: "sk",
  slovacco: "sk",
  slovenian: "sl",
  sloveno: "sl",
  spanish: "es",
  espanol: "es",
  spagnolo: "es",
  castellano: "es",
  swedish: "sv",
  svedese: "sv",
  turkish: "tr",
  turco: "tr",
  vietnamese: "vi",
  vietnamita: "vi"
}

export const SUBTITLE_LANGUAGE_OFF_KEY = "__off__"
export const SUBTITLE_LANGUAGE_UNKNOWN_KEY = "__unknown__"

function t(key, params = {}, fallback = key) {
  return I18n.t(key, params, { fallback })
}

function buildIndexedLabel(baseLabel, index) {
  return `${baseLabel} ${index + 1}`
}

export function subtitleLabel(index) {
  return buildIndexedLabel(t("subtitle_dialog_title", {}, "Subtitle"), index)
}

function audioLabel(index) {
  return buildIndexedLabel(t("audio_dialog_title", {}, "Audio"), index)
}

function cleanDisplayText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeComparableText(value) {
  return cleanDisplayText(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
}

function pushUniqueText(target, value) {
  const text = cleanDisplayText(value)
  if (!text) {
    return
  }
  const normalized = normalizeComparableText(text)
  if (target.some((entry) => normalizeComparableText(entry) === normalized)) {
    return
  }
  target.push(text)
}

function flattenTrackMetadata(value, into = []) {
  if (value === null || value === undefined) {
    return into
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => flattenTrackMetadata(entry, into))
    return into
  }
  if (typeof value === "object") {
    Object.values(value).forEach((entry) => flattenTrackMetadata(entry, into))
    return into
  }
  const text = cleanDisplayText(value)
  if (text) {
    into.push(text)
  }
  return into
}

function isGenericAudioTrackLabel(value) {
  const normalized = normalizeComparableText(value)
  return normalized === ""
    || /^audio\s*\d*$/.test(normalized)
    || /^track\s*\d*$/.test(normalized)
    || normalized === "soundhandler"
    || normalized === "sound handler"
}

function getTrackMetadataStrings(track = {}) {
  const values = []
  [
    track?.name,
    track?.label,
    track?.title,
    track?.language,
    track?.lang,
    track?.channels,
    track?.characteristics,
    track?.kind,
    track?.role,
    track?.accessibility,
    track?.forced,
    track?.isForced,
    track?.sdh,
    track?.isSdh,
    track?.is_sdh,
    track?.cc,
    track?.closedCaption,
    track?.closedCaptions,
    track?.closed_caption,
    track?.hearingImpaired,
    track?.hearing_impaired,
    track?.codec,
    track?.codecs,
    track?.audioCodec,
    track?.extraInfo,
    track?.attrs
  ].forEach((value) => flattenTrackMetadata(value, values))
  return values
}

export function normalizeTrackLanguageCode(value) {
  const raw = cleanDisplayText(value).toLowerCase()
  if (!raw || raw === "unknown") {
    return ""
  }
  if (!/^[a-z]{2,3}(?:[-_][a-z0-9]{2,8})*$/i.test(raw)) {
    return ""
  }
  const parts = raw.split(/[-_]/)
  const base = LANGUAGE_CODE_ALIASES[parts[0]] ?? parts[0]
  if (!base) {
    return ""
  }
  return [base, ...parts.slice(1)].join("-")
}

function normalizeLanguageNameText(value) {
  const comparable = normalizeComparableText(value)
  const asciiComparable = typeof comparable.normalize === "function"
    ? comparable.normalize("NFD")
    : comparable
  return asciiComparable
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(forced|force|forc|forzato|forzata|forzati|forzate|subtitle|subtitles|sub|sdh|cc|closed|captions?|full|normal|default|signs?|songs?|foreign|only)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function inferTrackLanguageCodeFromText(value) {
  const normalized = normalizeLanguageNameText(value)
  if (!normalized) {
    return ""
  }
  const padded = ` ${normalized} `
  const aliasEntries = Object.entries(LANGUAGE_NAME_ALIASES)
    .sort((left, right) => right[0].length - left[0].length)
  const match = aliasEntries.find(([name]) => padded.includes(` ${name} `))
  return match?.[1] || ""
}

export function getTrackLanguageValue(track = {}) {
  const candidates = [
    track?.language,
    track?.lang,
    track?.track_lang,
    track?.extraInfo?.track_lang,
    track?.extraInfo?.language
  ]
  return candidates.find((value) => cleanDisplayText(value)) || ""
}

export function getTrackLanguageLabel(track = {}) {
  const rawLanguage = cleanDisplayText(getTrackLanguageValue(track))
  if (!rawLanguage) {
    return ""
  }

  const normalizedCode = normalizeTrackLanguageCode(rawLanguage)
  const displayCode = normalizedCode ? normalizedCode.split("-")[0] : ""
  const locale = typeof I18n.getLocale === "function" ? I18n.getLocale() : "en"
  if (displayCode) {
    const cacheKey = `${locale}::${displayCode}`
    if (!LANGUAGE_DISPLAY_NAME_CACHE.has(cacheKey)) {
      let displayName = ""
      try {
        if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
          const formatter = new Intl.DisplayNames([locale], { type: "language" })
          displayName = cleanDisplayText(formatter.of(displayCode))
        }
      } catch (_) {
        displayName = ""
      }
      if (!displayName) {
        const fallbackKey = AUDIO_TRACK_LANGUAGE_KEY_BY_CODE[displayCode]
        displayName = fallbackKey ? t(fallbackKey, {}, rawLanguage.toUpperCase()) : rawLanguage.toUpperCase()
      }
      LANGUAGE_DISPLAY_NAME_CACHE.set(cacheKey, displayName)
    }
    return LANGUAGE_DISPLAY_NAME_CACHE.get(cacheKey) || ""
  }

  return rawLanguage
}

export function getMeaningfulTrackLabel(track = {}) {
  const candidates = [track?.name, track?.label, track?.title]
  for (const candidate of candidates) {
    const text = cleanDisplayText(candidate)
    if (!text || isGenericAudioTrackLabel(text)) {
      continue
    }
    if (normalizeTrackLanguageCode(text)) {
      continue
    }
    return text
  }
  return ""
}

function isTruthyTrackFlag(value) {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "number") {
    return value === 1
  }
  const text = cleanDisplayText(value).toLowerCase()
  return text === "1" || text === "true" || text === "yes" || text === "y"
}

function isSdhSubtitleTrack(track = {}) {
  if (isTruthyTrackFlag(track?.sdh)
    || isTruthyTrackFlag(track?.isSdh)
    || isTruthyTrackFlag(track?.is_sdh)
    || isTruthyTrackFlag(track?.hearingImpaired)
    || isTruthyTrackFlag(track?.hearing_impaired)) {
    return true
  }
  const searchText = getTrackMetadataStrings(track).join(" ").toLowerCase()
  return /\b(sdh|hearing impaired|hearing-impaired|hard of hearing|hoh)\b/.test(searchText)
}

function isClosedCaptionTrack(track = {}) {
  if (isTruthyTrackFlag(track?.cc)
    || isTruthyTrackFlag(track?.closedCaption)
    || isTruthyTrackFlag(track?.closedCaptions)
    || isTruthyTrackFlag(track?.closed_caption)) {
    return true
  }
  const searchText = getTrackMetadataStrings(track).join(" ").toLowerCase()
  return /\b(cc|closed captions?|closed-caption(?:ed)?|captioned)\b/.test(searchText)
}

function detectChannelLayout(value) {
  const text = cleanDisplayText(value).toLowerCase()
  if (!text) {
    return ""
  }
  const explicitLayout = text.match(/\b(7\.1|5\.1|2\.1|2\.0|1\.0)\b/)
  if (explicitLayout) {
    if (explicitLayout[1] === "2.0") {
      return t("player.track.stereo", {}, "Stereo")
    }
    return explicitLayout[1]
  }
  const numericMatch = text.match(/\b([0-9]{1,2})(?:ch| channels?)\b/) || text.match(/^([0-9]{1,2})(?:\/[a-z0-9.]+)?$/)
  if (!numericMatch) {
    return ""
  }
  const channels = Number(numericMatch[1])
  if (!Number.isFinite(channels) || channels <= 0) {
    return ""
  }
  if (channels >= 8) {
    return "7.1"
  }
  if (channels >= 6) {
    return "5.1"
  }
  if (channels === 2) {
    return t("player.track.stereo", {}, "Stereo")
  }
  if (channels === 1) {
    return "1.0"
  }
  return `${channels}ch`
}

export function getTrackDescriptorLabels(track = {}) {
  const descriptors = []
  const metadataStrings = getTrackMetadataStrings(track)
  const searchText = metadataStrings.join(" ").toLowerCase()

  const channelCandidates = [track?.channels, ...metadataStrings]
  for (const candidate of channelCandidates) {
    const channelLayout = detectChannelLayout(candidate)
    if (channelLayout) {
      pushUniqueText(descriptors, channelLayout)
      break
    }
  }

  if (!descriptors.length) {
    if (/\bstereo\b/.test(searchText)) {
      pushUniqueText(descriptors, t("player.track.stereo", {}, "Stereo"))
    } else if (/\bsurround\b/.test(searchText)) {
      pushUniqueText(descriptors, t("player.track.surround", {}, "Surround"))
    }
  }

  if (/\b(atmos|joc)\b/.test(searchText)) {
    pushUniqueText(descriptors, "Dolby Atmos")
  } else if (/\b(eac3|ec-3|ddp|dolby digital plus)\b/.test(searchText)) {
    pushUniqueText(descriptors, "Dolby Digital Plus")
  } else if (/\b(ac3|ac-3|dolby digital)\b/.test(searchText)) {
    pushUniqueText(descriptors, "Dolby Digital")
  } else if (/\b(truehd)\b/.test(searchText)) {
    pushUniqueText(descriptors, "TrueHD")
  } else if (/\b(dts:x|dts-hd|dts)\b/.test(searchText)) {
    pushUniqueText(descriptors, "DTS")
  } else if (/\b(aac|mp4a)\b/.test(searchText)) {
    pushUniqueText(descriptors, "AAC")
  } else if (/\b(opus)\b/.test(searchText)) {
    pushUniqueText(descriptors, "Opus")
  } else if (/\b(flac)\b/.test(searchText)) {
    pushUniqueText(descriptors, "FLAC")
  } else if (/\b(mp3|mpeg audio)\b/.test(searchText)) {
    pushUniqueText(descriptors, "MP3")
  }

  if (/\bforced\b/.test(searchText) || isTruthyTrackFlag(track?.forced) || isTruthyTrackFlag(track?.isForced)) {
    pushUniqueText(descriptors, t("sub_forced_lang", {}, "Forced"))
  }
  if (isSdhSubtitleTrack(track)) {
    pushUniqueText(descriptors, "SDH")
  }
  if (isClosedCaptionTrack(track)) {
    pushUniqueText(descriptors, "CC")
  }
  if (/\b(commentary)\b/.test(searchText)) {
    pushUniqueText(descriptors, t("player.track.commentary", {}, "Commentary"))
  }
  if (/\b(audio description|audio-description|describes-video|describes video|descriptive)\b/.test(searchText)) {
    pushUniqueText(descriptors, t("player.track.audioDescription", {}, "Audio description"))
  }

  return descriptors
}

export function isForcedSubtitleTrack(track = {}) {
  if (isTruthyTrackFlag(track?.forced) || isTruthyTrackFlag(track?.isForced)) {
    return true
  }
  const searchText = getTrackMetadataStrings(track).join(" ").toLowerCase()
  return /\b(forced|forc|forzato|forzata|forzati|forzate)\b/.test(searchText)
}

export function getSubtitleEntryLanguageSource(entry = {}) {
  const explicitLanguage = getTrackLanguageValue(entry)
  if (explicitLanguage) {
    return explicitLanguage
  }
  const secondaryLanguage = normalizeTrackLanguageCode(entry.secondary) ? entry.secondary : ""
  if (secondaryLanguage) {
    return secondaryLanguage
  }
  return entry.label || entry.title || ""
}

function formatAudioCodecName(value) {
  const text = cleanDisplayText(value).toLowerCase()
  if (!text) {
    return ""
  }

  if (text.includes("eac3-joc") || text.includes("ec-3-joc") || text.includes("atmos")) return "E-AC-3-JOC"
  if (text.includes("truehd")) return "TrueHD"
  if (text.includes("dts-hd")) return "DTS-HD"
  if (text.includes("dts express")) return "DTS Express"
  if (text.includes("dts")) return "DTS"
  if (text.includes("ec-3") || text.includes("eac3") || text.includes("ddp") || text.includes("dolby digital plus")) return "E-AC-3"
  if (text.includes("ac-3") || text.includes("ac3") || text.includes("dolby digital")) return "AC-3"
  if (text.includes("ac-4") || text.includes("ac4")) return "AC-4"
  if (text.includes("aac") || text.includes("mp4a")) return "AAC"
  if (text.includes("mp3") || text.includes("mpeg audio")) return "MP3"
  if (text.includes("mp2")) return "MP2"
  if (text.includes("vorbis")) return "Vorbis"
  if (text.includes("opus")) return "Opus"
  if (text.includes("flac")) return "FLAC"
  if (text.includes("alac")) return "ALAC"
  if (text.includes("wav") || text.includes("pcm")) return "WAV"
  if (text.includes("amr-wb")) return "AMR-WB"
  if (text.includes("amr-nb")) return "AMR-NB"
  if (text.includes("amr")) return "AMR"
  if (text.includes("iamf")) return "IAMF"
  if (text.includes("mpegh") || text.includes("mhm1") || text.includes("mha1")) return "MPEG-H"
  return ""
}

function formatAudioChannelLayout(value) {
  const numericValue = Number(value)
  if (Number.isFinite(numericValue) && numericValue > 0) {
    if (numericValue === 1) return "Mono"
    if (numericValue === 2) return "Stereo"
    if (numericValue === 6) return "5.1"
    if (numericValue === 8) return "7.1"
    return `${numericValue}ch`
  }

  const text = cleanDisplayText(value).toLowerCase()
  if (!text) {
    return ""
  }
  if (text.includes("mono") || text === "1" || text === "1.0") return "Mono"
  if (text.includes("stereo") || text === "2" || text === "2.0") return "Stereo"
  if (text.includes("5.1") || text === "6") return "5.1"
  if (text.includes("7.1") || text === "8") return "7.1"
  const numericMatch = text.match(/\b(\d{1,2})(?:ch| channels?)\b/) || text.match(/^(\d{1,2})$/)
  if (!numericMatch) {
    return ""
  }
  const channels = Number(numericMatch[1])
  if (!Number.isFinite(channels) || channels <= 0) {
    return ""
  }
  if (channels === 1) return "Mono"
  if (channels === 2) return "Stereo"
  if (channels === 6) return "5.1"
  if (channels === 8) return "7.1"
  return `${channels}ch`
}

export function formatAudioTrackDisplay(track = {}, index = 0) {
  const rawLabel = getMeaningfulTrackLabel(track)
  const rawLanguage = cleanDisplayText(getTrackLanguageValue(track))
  const languageLabel = getTrackLanguageLabel(track)
  const codecName = formatAudioCodecName(
    track?.sampleMimeType
    || track?.codec
    || track?.codecs
    || track?.audioCodec
    || getTrackMetadataStrings(track).join(" ")
  )
  const channelLayout = formatAudioChannelLayout(track?.channelCount || track?.channels)
  const sampleRate = Number(track?.sampleRate || track?.audioSampleRate || 0)
  const baseName = rawLabel || languageLabel || rawLanguage || audioLabel(index)
  const suffix = [codecName, channelLayout].filter(Boolean).join(" ")
  const label = suffix ? `${baseName} (${suffix})` : baseName
  const secondaryParts = []
  if (languageLabel && normalizeComparableText(languageLabel) !== normalizeComparableText(baseName)) {
    pushUniqueText(secondaryParts, languageLabel)
  }
  if (Number.isFinite(sampleRate) && sampleRate > 0) {
    pushUniqueText(secondaryParts, `${Math.round(sampleRate / 1000)} kHz`)
  }
  const secondary = secondaryParts.join(" | ")

  return { label, secondary }
}

export function normalizeSubtitleLanguageKey(value) {
  const code = normalizeTrackLanguageCode(value) || inferTrackLanguageCodeFromText(value)
  if (code) {
    return code
  }
  const cleaned = cleanDisplayText(value)
  if (!normalizeLanguageNameText(cleaned)) {
    return SUBTITLE_LANGUAGE_UNKNOWN_KEY
  }
  return cleaned ? cleaned.toLowerCase() : SUBTITLE_LANGUAGE_UNKNOWN_KEY
}

export function extractSubtitleLanguageSetting(value, fallback = SUBTITLE_LANGUAGE_OFF_KEY) {
  if (value && typeof value === "object") {
    return extractSubtitleLanguageSetting(value.id ?? value.value ?? value.code ?? value.language ?? value.languageCode, fallback)
  }
  const code = cleanDisplayText(value)
  if (!code || code.toLowerCase() === "[object object]") {
    return fallback
  }
  return code
}

export function subtitleLanguageLabel(languageKey) {
  if (languageKey === SUBTITLE_LANGUAGE_OFF_KEY) {
    return t("subtitle_none", {}, "Off")
  }
  if (languageKey === SUBTITLE_LANGUAGE_UNKNOWN_KEY) {
    return t("common.unknown", {}, "Unknown")
  }
  const locale = typeof I18n.getLocale === "function" ? I18n.getLocale() : undefined
  const normalizedCode = normalizeTrackLanguageCode(languageKey)
  const baseCode = normalizedCode?.split("-")[0] || ""
  let label = ""
  if (baseCode) {
    label = getTrackLanguageLabel({ language: baseCode })
  }
  if (!label) {
    label = getTrackLanguageLabel({ language: languageKey })
  }
  if (!label && baseCode) {
    const baseLabelKey = AUDIO_TRACK_LANGUAGE_KEY_BY_CODE[baseCode]
    label = baseLabelKey ? t(baseLabelKey, {}, baseCode.toUpperCase()) : baseCode.toUpperCase()
  }
  if (!label) {
    label = String(languageKey || "").toUpperCase()
  }
  return label
    ? `${label.charAt(0).toLocaleUpperCase(locale)}${label.slice(1)}`
    : ""
}

export function isSubtitleLanguageOnlyDetail(value, languageLabel = "", languageKey = "") {
  const text = cleanDisplayText(value)
  if (!text) {
    return true
  }
  const comparable = normalizeComparableText(text)
  const labelComparable = normalizeComparableText(languageLabel)
  if (labelComparable && comparable === labelComparable) {
    return true
  }

  const normalizedDetailCode = normalizeTrackLanguageCode(text) || inferTrackLanguageCodeFromText(text)
  const normalizedLanguageCode = normalizeTrackLanguageCode(languageKey) || inferTrackLanguageCodeFromText(languageKey)
  if (normalizedDetailCode && normalizedLanguageCode) {
    return normalizedDetailCode === normalizedLanguageCode
      || normalizedDetailCode.split("-")[0] === normalizedLanguageCode.split("-")[0]
  }

  const inferredKey = normalizeSubtitleLanguageKey(text)
  if (normalizedLanguageCode && inferredKey && inferredKey !== SUBTITLE_LANGUAGE_UNKNOWN_KEY) {
    return inferredKey === normalizedLanguageCode
      || inferredKey.split("-")[0] === normalizedLanguageCode.split("-")[0]
  }
  return false
}

export function formatSubtitleTrackDisplay(track = {}, index = 0) {
  const languageSource = getSubtitleEntryLanguageSource(track)
  const languageKey = normalizeSubtitleLanguageKey(languageSource)
  const languageLabel = subtitleLanguageLabel(languageKey)
  const descriptors = getTrackDescriptorLabels(track)
    .filter((detail) => !isSubtitleLanguageOnlyDetail(detail, languageLabel, languageKey))
  const rawLabel = getMeaningfulTrackLabel(track)
  const label = languageKey !== SUBTITLE_LANGUAGE_UNKNOWN_KEY && languageLabel
    ? languageLabel
    : (rawLabel || subtitleLabel(index))

  return {
    label,
    language: getTrackLanguageValue(track) || languageSource,
    secondary: descriptors.join(" · "),
    languageKey,
    languageLabel
  }
}
