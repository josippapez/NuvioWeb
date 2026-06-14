import {
  SUBTITLE_LANGUAGE_OFF_KEY,
  SUBTITLE_LANGUAGE_UNKNOWN_KEY,
  subtitleLanguageLabel
} from "./playerTrackFormatting.js"

/**
 * Groups subtitle option items by their language key and returns the ordered
 * language rail entries.
 *
 * Pure transform over the supplied arrays: it groups options by `languageKey`,
 * tallies counts, marks the group selected when any member option is selected,
 * ensures an "Off" group exists, and sorts the groups with "Off" first, the
 * "Unknown" group sunk below real languages, preferred languages ranked by the
 * supplied targets, then alphabetically by label and finally by key.
 *
 * @param {Array<{languageKey: string, languageLabel?: string, selected?: boolean}>} options
 *   Subtitle option items to group.
 * @param {Object} [context]
 * @param {string} [context.selectedLanguageKey] Currently selected language key,
 *   used to mark the synthesized "Off" group as selected.
 * @param {string[]} [context.preferredTargets] Startup preferred subtitle
 *   language targets, in priority order, used to rank groups.
 * @param {string} [context.offLabel] Localized label for the "Off" group.
 * @param {string} [context.locale] Locale used for label comparison.
 * @returns {Array<{key: string, label: string, selected: boolean, count: number}>}
 *   Sorted language rail group entries.
 */
export function buildSubtitleLanguageRailGroups(options = [], context = {}) {
  const {
    selectedLanguageKey = SUBTITLE_LANGUAGE_OFF_KEY,
    preferredTargets = [],
    offLabel = "Off",
    locale = undefined
  } = context

  const groups = new Map()
  options.forEach((option) => {
    if (!groups.has(option.languageKey)) {
      groups.set(option.languageKey, {
        key: option.languageKey,
        label: option.languageLabel || subtitleLanguageLabel(option.languageKey),
        selected: false,
        count: 0
      })
    }
    const group = groups.get(option.languageKey)
    group.count += 1
    group.selected = group.selected || Boolean(option.selected)
  })
  if (!groups.has(SUBTITLE_LANGUAGE_OFF_KEY)) {
    groups.set(SUBTITLE_LANGUAGE_OFF_KEY, {
      key: SUBTITLE_LANGUAGE_OFF_KEY,
      label: offLabel,
      selected: selectedLanguageKey === SUBTITLE_LANGUAGE_OFF_KEY,
      count: 1
    })
  }
  const preferredRankCache = new Map()
  const getPreferredRank = (entry) => {
    const key = String(entry?.key || "")
    if (!key || key === SUBTITLE_LANGUAGE_OFF_KEY) {
      return Number.MAX_SAFE_INTEGER
    }
    if (preferredRankCache.has(key)) {
      return preferredRankCache.get(key)
    }
    const keyBase = key.split("-")[0]
    const rank = preferredTargets.findIndex((target) => {
      const targetKey = String(target || "")
      const targetBase = targetKey.split("-")[0]
      return key === targetKey || (keyBase && targetBase && keyBase === targetBase)
    })
    const resolvedRank = rank >= 0 ? rank : Number.MAX_SAFE_INTEGER
    preferredRankCache.set(key, resolvedRank)
    return resolvedRank
  }
  return Array.from(groups.values()).sort((left, right) => {
    if (left.key === right.key) return 0
    if (left.key === SUBTITLE_LANGUAGE_OFF_KEY) return -1
    if (right.key === SUBTITLE_LANGUAGE_OFF_KEY) return 1
    // Sink the "Unknown" group below the real languages instead of letting
    // its label sort it into the middle of the alphabetical list.
    const leftUnknown = left.key === SUBTITLE_LANGUAGE_UNKNOWN_KEY
    const rightUnknown = right.key === SUBTITLE_LANGUAGE_UNKNOWN_KEY
    if (leftUnknown !== rightUnknown) {
      return leftUnknown ? 1 : -1
    }
    const preferredDelta = getPreferredRank(left) - getPreferredRank(right)
    if (preferredDelta !== 0) {
      return preferredDelta
    }
    const labelDelta = String(left.label || "").localeCompare(String(right.label || ""), locale, { sensitivity: "base" })
    if (labelDelta !== 0) {
      return labelDelta
    }
    return String(left.key || "").localeCompare(String(right.key || ""), "en", { sensitivity: "base" })
  })
}

/**
 * Filters subtitle option items to a single language and sorts them.
 *
 * Pure transform: it keeps only options whose `languageKey` matches the
 * supplied key (excluding the "Off" key), then sorts by source type
 * (internal, addon, off), secondary text, and finally title.
 *
 * @param {Array<{languageKey: string, sourceType?: string, secondary?: string, title?: string}>} options
 *   Subtitle option items to filter and sort.
 * @param {string} languageKey Normalized language key to filter by.
 * @param {Object} [context]
 * @param {string} [context.locale] Locale used for text comparison.
 * @returns {Array<object>} Filtered, sorted option items for the language.
 */
export function filterSubtitleOptionsForLanguage(options = [], languageKey = SUBTITLE_LANGUAGE_OFF_KEY, context = {}) {
  const { locale = undefined } = context
  const sourceRank = { internal: 0, addon: 1, off: 2 }
  return options
    .filter((entry) => entry.languageKey === languageKey && entry.languageKey !== SUBTITLE_LANGUAGE_OFF_KEY)
    .sort((left, right) => {
      const sourceDelta = (sourceRank[left.sourceType] ?? 99) - (sourceRank[right.sourceType] ?? 99)
      if (sourceDelta !== 0) {
        return sourceDelta
      }
      const secondaryDelta = String(left.secondary || "").localeCompare(String(right.secondary || ""), locale, { sensitivity: "base" })
      if (secondaryDelta !== 0) {
        return secondaryDelta
      }
      return String(left.title || "").localeCompare(String(right.title || ""), locale, { sensitivity: "base" })
    })
}
