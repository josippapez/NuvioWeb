import {
  isCollectionFolderItem,
  normalizeCollectionFolderItem
} from "./homeCollectionFolders.js";

function renderImdbToken(value, escapeHtml) {
  return `
    <span class="home-hero-imdb">
      <img src="assets/icons/imdb_logo_2016.svg" alt="IMDb" />
      <span>${escapeHtml(value)}</span>
    </span>
  `;
}

function renderModernHeroMetaGroup(tokens = [], escapeHtml) {
  return tokens
    .filter(Boolean)
    .map((token) => `<span>${escapeHtml(token)}</span>`)
    .join('<span class="home-hero-dot">•</span>');
}

export function buildModernHeroPresentation(hero, {
  normalizeContinueWatchingItem,
  normalizeCatalogItem,
  firstNonEmpty,
  toTitleCase,
  formatRuntimeText,
  extractReleaseDateText,
  resolveImdbRating,
  buildHeroBackdropSources
} = {}) {
  if (isCollectionFolderItem(hero)) {
    const normalizedCollection = normalizeCollectionFolderItem(hero);
    if (!normalizedCollection) {
      return null;
    }
    return {
      title: normalizedCollection.heroTitle || normalizedCollection.name || normalizedCollection.rawTitle || "",
      logo: firstNonEmpty(normalizedCollection.titleLogoUrl, normalizedCollection.logo),
      description: "",
      backdrop: buildHeroBackdropSources(normalizedCollection)[0] || "",
      backdropFallbacks: buildHeroBackdropSources(normalizedCollection).slice(1),
      leadingMeta: [],
      trailingMeta: [],
      secondaryHighlightText: "",
      badges: [],
      languageText: "",
      showImdbPrimary: false,
      showImdbSecondary: false,
      imdbText: ""
    };
  }

  const isContinueWatchingHero = hero?.heroSource === "continueWatching";
  const normalized = isContinueWatchingHero
    ? normalizeContinueWatchingItem(hero)
    : normalizeCatalogItem(hero);
  if (!normalized) {
    return null;
  }

  const isSeries = String(normalized.type || normalized.apiType || "").toLowerCase() === "series";
  const genres = Array.isArray(normalized.genres) ? normalized.genres.filter(Boolean) : [];
  const contentTypeText = toTitleCase(normalized.type || normalized.apiType || "movie");
  const runtimeText = formatRuntimeText(normalized);
  const yearText = extractReleaseDateText(normalized);
  const imdbText = resolveImdbRating(normalized);
  const statusBadge = firstNonEmpty(normalized.status).toUpperCase();
  const ageRatingBadge = firstNonEmpty(normalized.ageRating);
  const languageText = firstNonEmpty(normalized.language).toUpperCase();
  const secondaryHighlightText = isContinueWatchingHero
    ? firstNonEmpty(normalized.progressStatus).toUpperCase()
    : "";
  const leadingMeta = isContinueWatchingHero
    ? [[normalized.episodeCode, normalized.episodeTitle, genres[0]].filter(Boolean).join(" · ") || contentTypeText].filter(Boolean)
    : [contentTypeText, genres[0]].filter(Boolean);
  const trailingMeta = isContinueWatchingHero
    ? [yearText].filter(Boolean)
    : [runtimeText, yearText].filter(Boolean);
  const badges = isContinueWatchingHero ? [] : [ageRatingBadge, statusBadge].filter(Boolean);
  const showImdbPrimary = Boolean(imdbText) && !isSeries && !badges.length && !secondaryHighlightText;
  const showImdbSecondary = Boolean(imdbText) && !showImdbPrimary;

  return {
    title: normalized.name || "Untitled",
    logo: firstNonEmpty(normalized.logo),
    description: firstNonEmpty(
      isContinueWatchingHero ? normalized.episodeDescription : null,
      normalized.description
    ) || "",
    backdrop: buildHeroBackdropSources(normalized)[0] || "",
    backdropFallbacks: buildHeroBackdropSources(normalized).slice(1),
    leadingMeta,
    trailingMeta,
    secondaryHighlightText,
    badges,
    languageText,
    showImdbPrimary,
    showImdbSecondary,
    imdbText
  };
}

export function renderModernHeroPrimary(display, escapeHtml) {
  const left = renderModernHeroMetaGroup(display.leadingMeta, escapeHtml);
  const rightTokens = display.trailingMeta
    .filter(Boolean)
    .map((token) => `<span>${escapeHtml(token)}</span>`);
  if (display.showImdbPrimary) {
    rightTokens.push(renderImdbToken(display.imdbText, escapeHtml));
  }
  const hasRight = rightTokens.length > 0;
  return `
    <div class="home-modern-hero-meta-group home-modern-hero-meta-group-leading">${left}</div>
    ${left && hasRight ? '<span class="home-hero-dot">•</span>' : ""}
    <div class="home-modern-hero-meta-group home-modern-hero-meta-group-trailing">${rightTokens.join('<span class="home-hero-dot">•</span>')}</div>
  `;
}

export function renderModernHeroSecondary(display, escapeHtml) {
  const parts = [];
  if (display.secondaryHighlightText) {
    parts.push(`<span class="home-modern-hero-highlight">${escapeHtml(display.secondaryHighlightText)}</span>`);
  }
  display.badges.forEach((badge) => {
    parts.push(`<span class="home-modern-hero-badge">${escapeHtml(badge)}</span>`);
  });
  if (display.showImdbSecondary) {
    parts.push(renderImdbToken(display.imdbText, escapeHtml));
  }
  if (display.languageText) {
    parts.push(`<span class="home-modern-hero-secondary-detail">${escapeHtml(display.languageText)}</span>`);
  }
  return parts.join('<span class="home-hero-dot">•</span>');
}
