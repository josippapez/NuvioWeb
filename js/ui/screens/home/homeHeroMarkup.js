import {
  isCollectionFolderItem,
  normalizeCollectionFolderItem
} from "./homeCollectionFolders.js";

export function buildHeroIdentity(item = null, { normalizeCatalogItem } = {}) {
  const normalized = isCollectionFolderItem(item)
    ? normalizeCollectionFolderItem(item)
    : normalizeCatalogItem(item || null, "movie");
  if (!normalized) {
    return "";
  }
  return [
    normalized.id || normalized.videoId || normalized.contentId || normalized.title || normalized.name || "",
    normalized.type || normalized.apiType || "",
    normalized.season ?? "",
    normalized.episode ?? ""
  ].join("|");
}

export function buildHeroDisplayModel(hero, layoutMode, {
  firstNonEmpty,
  buildHeroBackdropSources,
  extractYear,
  resolveImdbRating,
  toTitleCase,
  formatRuntimeText
} = {}) {
  if (isCollectionFolderItem(hero)) {
    const normalized = normalizeCollectionFolderItem(hero);
    return {
      title: normalized?.heroTitle || normalized?.name || normalized?.collectionTitle || "Untitled",
      description: " ",
      logo: firstNonEmpty(normalized?.titleLogoUrl, normalized?.logo),
      backdrop: firstNonEmpty(normalized?.heroBackdropUrl, normalized?.background, normalized?.backdrop, normalized?.poster),
      backdropFallbacks: buildHeroBackdropSources(normalized).slice(1),
      metaPrimary: [],
      metaSecondary: [],
      chips: []
    };
  }
  const year = extractYear(hero);
  const imdb = resolveImdbRating(hero);
  const genres = Array.isArray(hero?.genres) ? hero.genres.filter(Boolean).slice(0, 3) : [];
  const typeLabel = toTitleCase(hero?.type || hero?.apiType || "movie") || "Movie";
  const isContinueWatchingHero = hero?.heroSource === "continueWatching";
  const metaPrimary = [];
  const metaSecondary = [];
  let chips = [];

  if (layoutMode === "modern") {
    if (isContinueWatchingHero) {
      const episodeLabel = [hero?.episodeCode, hero?.episodeTitle].filter(Boolean).join(" · ");
      metaPrimary.push(episodeLabel || typeLabel, genres[0], year);
      metaSecondary.push(String(hero?.progressStatus || "").toUpperCase());
      if (imdb) {
        metaSecondary.push({ imdb });
      }
    } else {
      metaPrimary.push(typeLabel, genres[0], formatRuntimeText(hero), year);
      if (imdb) {
        metaSecondary.push({ imdb });
      }
      chips = [];
    }
  } else {
    if (imdb) {
      metaPrimary.push({ imdb });
    }
    if (year) {
      metaPrimary.push(year);
    }
    chips = genres;
  }

  return {
    title: hero?.name || "Untitled",
    description: firstNonEmpty(hero?.description) || " ",
    logo: firstNonEmpty(hero?.logo),
    backdrop: buildHeroBackdropSources(hero)[0] || "",
    backdropFallbacks: buildHeroBackdropSources(hero).slice(1),
    metaPrimary: metaPrimary.filter(Boolean),
    metaSecondary: metaSecondary.filter(Boolean),
    chips
  };
}

export function renderMetaTokens(tokens = [], escapeHtml) {
  return tokens.map((token) => {
    if (token && typeof token === "object" && token.imdb) {
      return `
        <span class="home-hero-imdb">
          <img src="assets/icons/imdb_logo_2016.svg" alt="IMDb" />
          <span>${escapeHtml(token.imdb)}</span>
        </span>
      `;
    }
    return `<span>${escapeHtml(token)}</span>`;
  }).join('<span class="home-hero-dot">•</span>');
}

export function buildHeroIndicators(items = [], activeItem) {
  if (!Array.isArray(items) || items.length <= 1) {
    return "";
  }
  const activeId = String(activeItem?.id || "");
  const matchedIndex = items.findIndex((item) => String(item?.id || "") === activeId);
  const activeIndex = matchedIndex >= 0 ? matchedIndex : 0;
  return items.map((_, index) => `
    <span class="home-hero-indicator${index === activeIndex ? " is-active" : ""}"></span>
  `).join("");
}

export function renderHeroMarkup(layoutMode, heroItem, heroCandidates, {
  buildHeroDisplayModel: createHeroDisplayModel,
  renderHeroBackdropImage,
  renderMetaTokens: createMetaTokens,
  buildHeroIndicators: createHeroIndicators,
  escapeHtml,
  escapeAttribute
} = {}) {
  const display = createHeroDisplayModel(heroItem, layoutMode);
  const isInteractive = layoutMode !== "modern";
  return `
    <section class="home-hero home-hero-${escapeAttribute(layoutMode)}">
      <article class="home-hero-card${isInteractive ? " focusable" : ""}"
               ${isInteractive ? 'tabindex="0"' : ""}
               ${isInteractive ? 'data-nav-zone="main" data-nav-row="0" data-nav-col="0" data-nav-row-key="__hero__"' : ""}
               ${isInteractive ? `data-action="openDetail"
               data-item-id="${escapeAttribute(heroItem?.id || "")}"
               data-item-type="${escapeAttribute(heroItem?.type || "movie")}"
               data-item-title="${escapeAttribute(heroItem?.name || "Untitled")}"` : ""}>
        <div class="home-hero-backdrop-wrap">
          ${renderHeroBackdropImage(display)}
        </div>
        <div class="home-hero-copy">
          <div class="home-hero-brand">
            ${display.logo ? `<img class="home-hero-logo" src="${escapeAttribute(display.logo)}" alt="${escapeAttribute(display.title)}" decoding="async" fetchpriority="high" />` : ""}
            <h1 class="home-hero-title-text${display.logo ? " is-hidden" : ""}">${escapeHtml(display.title)}</h1>
          </div>
          <div class="home-hero-meta-primary${display.metaPrimary.length ? "" : " is-empty"}">${createMetaTokens(display.metaPrimary)}</div>
          <div class="home-hero-chip-row${display.chips.length ? "" : " is-empty"}">${display.chips.map((chip) => `<span class="home-hero-chip">${escapeHtml(chip)}</span>`).join("")}</div>
          <div class="home-hero-meta-secondary${display.metaSecondary.length ? "" : " is-empty"}">${createMetaTokens(display.metaSecondary)}</div>
          <p class="home-hero-description">${escapeHtml(display.description)}</p>
        </div>
        <div class="home-hero-indicators">${createHeroIndicators(heroCandidates, heroItem)}</div>
      </article>
    </section>
  `;
}
