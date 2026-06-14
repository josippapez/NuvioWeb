/**
 * Pure helpers for building hero / card backdrop image sources and markup.
 *
 * These builders perform string, URL, and DOM-string math only and hold no
 * reference to screen state. Screen-local dependencies (for example
 * `escapeAttribute`) are injected by the caller, matching the deps-injection
 * pattern used by the sibling home hero modules.
 */

/**
 * Trim, de-duplicate, and drop empty values while preserving input order.
 * @param {Array<unknown>} [values]
 * @returns {string[]}
 */
export function uniqueNonEmptyValues(values = []) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    result.push(normalized);
  });
  return result;
}

/**
 * Collect the ordered, de-duplicated list of backdrop image sources for an item.
 * @param {Record<string, unknown> | null} [item]
 * @returns {string[]}
 */
export function buildHeroBackdropSources(item = null) {
  return uniqueNonEmptyValues([
    item?.background,
    item?.backdrop,
    item?.backdropUrl,
    item?.landscapePoster,
    item?.poster,
    item?.thumbnail,
    item?.episodeThumbnail
  ]);
}

/**
 * Encode a fallback source queue into the `|`-delimited form used by the
 * inline `onerror` image fallback handler.
 * @param {string[]} [sources]
 * @returns {string}
 */
export function encodeHeroBackdropFallbacks(sources = []) {
  return sources.map((source) => encodeURIComponent(source)).join("|");
}

/**
 * Inline `onerror` handler that walks the encoded fallback queue, swapping the
 * image src to the next candidate before falling back to a placeholder.
 * @returns {string}
 */
export function getHeroBackdropErrorHandler() {
  return "var q=(this.dataset.fallbackSrcs||'').split('|').filter(Boolean);var next=q.shift();if(next){this.dataset.fallbackSrcs=q.join('|');this.src=decodeURIComponent(next);return;}this.removeAttribute('src');this.classList.add('placeholder');";
}

/**
 * Render the hero backdrop image (or placeholder) markup for a display model.
 * @param {{ backdrop?: string, backdropFallbacks?: string[], title?: string }} display
 * @param {{ escapeAttribute: (value: unknown) => string }} deps
 * @returns {string}
 */
export function renderHeroBackdropImage(display, { escapeAttribute } = {}) {
  if (!display?.backdrop) {
    return '<div class="home-hero-backdrop placeholder"></div>';
  }
  const fallbackQueue = encodeHeroBackdropFallbacks(display.backdropFallbacks || []);
  const fallbackAttribute = fallbackQueue ? ` data-fallback-srcs="${escapeAttribute(fallbackQueue)}"` : "";
  return `<img class="home-hero-backdrop" src="${escapeAttribute(display.backdrop)}"${fallbackAttribute} alt="${escapeAttribute(display.title)}" decoding="async" fetchpriority="high" onerror="${getHeroBackdropErrorHandler()}" />`;
}
