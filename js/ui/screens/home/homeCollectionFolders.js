import { buildCollectionHomeKey } from "../../../data/local/collectionsStore.js";

function firstNonEmpty(...values) {
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (normalized) {
      return normalized;
    }
  }
  return "";
}

export function normalizeCollectionPosterShape(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "POSTER") {
    return "POSTER";
  }
  if (normalized === "LANDSCAPE" || normalized === "WIDE") {
    return "LANDSCAPE";
  }
  return "SQUARE";
}

function normalizeAnimatedCollectionAssetUrl(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }
  if (/\.gifv(?:$|[?#])/i.test(normalized)) {
    return normalized.replace(/\.gifv(?=(?:$|[?#]))/i, ".gif");
  }
  return normalized;
}

export function isCollectionFolderItem(item = {}) {
  return String(item?.heroSource || "").toLowerCase() === "collection"
    || String(item?.type || item?.apiType || "").toLowerCase() === "collection_folder"
    || Boolean(item?.collectionId && item?.folderId);
}

export function normalizeCollectionFolderItem(item, collectionMeta = null) {
  if (!item) {
    return null;
  }
  const collectionId = firstNonEmpty(item.collectionId, collectionMeta?.id);
  const folderId = firstNonEmpty(item.folderId, item.id);
  const title = firstNonEmpty(item.rawTitle, item.folderTitle, item.title, item.name, item.heroTitle);
  if (!collectionId || !folderId || !title) {
    return null;
  }
  const collectionTitle = firstNonEmpty(item.collectionTitle, collectionMeta?.title);
  const coverImageUrl = firstNonEmpty(item.coverImageUrl, item.coverImage);
  const focusGifUrl = normalizeAnimatedCollectionAssetUrl(firstNonEmpty(item.focusGifUrl));
  const focusGifEnabled = item.focusGifEnabled !== false;
  const hideTitle = Boolean(item.hideTitle);
  const tileShape = normalizeCollectionPosterShape(item.tileShape || item.posterShape);
  const coverEmoji = firstNonEmpty(item.coverEmoji);
  const cardImage = focusGifEnabled
    ? firstNonEmpty(coverImageUrl, collectionMeta?.backdropImageUrl)
    : firstNonEmpty(focusGifUrl, coverImageUrl, collectionMeta?.backdropImageUrl);
  const heroBackdrop = firstNonEmpty(item.heroBackdropUrl, coverImageUrl, collectionMeta?.backdropImageUrl);
  return {
    ...item,
    id: `collection:${collectionId}:${folderId}`,
    type: "collection_folder",
    apiType: "collection_folder",
    heroSource: "collection",
    rawTitle: title,
    name: hideTitle ? "" : title,
    title: hideTitle ? "" : title,
    heroTitle: hideTitle ? "" : (coverEmoji ? `${coverEmoji}  ${title}` : title),
    subtitle: hideTitle ? "" : collectionTitle,
    poster: cardImage,
    background: heroBackdrop,
    backdrop: heroBackdrop,
    landscapePoster: heroBackdrop,
    logo: firstNonEmpty(item.titleLogoUrl),
    description: "",
    genres: [],
    collectionId,
    collectionTitle,
    folderId,
    coverImageUrl,
    focusGifUrl,
    focusGifEnabled,
    coverEmoji,
    tileShape,
    hideTitle,
    heroBackdropUrl: firstNonEmpty(item.heroBackdropUrl),
    heroVideoUrl: firstNonEmpty(item.heroVideoUrl),
    titleLogoUrl: firstNonEmpty(item.titleLogoUrl)
  };
}

export function buildCollectionHomeRow(collection = {}) {
  const rowKey = buildCollectionHomeKey(collection);
  return {
    rowKind: "collection",
    collectionId: collection.id,
    collectionTitle: collection.title,
    collection,
    type: "collection_folder",
    homeCatalogKey: rowKey,
    homeCatalogDisableKey: rowKey,
    pinToTop: Boolean(collection.pinToTop),
    focusGlowEnabled: collection.focusGlowEnabled !== false,
    viewMode: String(collection.viewMode || "TABBED_GRID"),
    showAllTab: collection.showAllTab !== false,
    result: {
      status: "success",
      data: {
        items: (Array.isArray(collection.folders) ? collection.folders : [])
          .map((folder) => normalizeCollectionFolderItem({
            ...folder,
            collectionId: collection.id,
            collectionTitle: collection.title
          }, collection))
          .filter(Boolean)
      }
    }
  };
}
