// Normalizes a cast photo reference into an absolute https URL. Stremio/TMDB
// metas expose cast images in several shapes: protocol-relative ("//..."),
// bare TMDB profile paths ("/abc.jpg"), insecure http:// URLs, or already-valid
// https:// URLs. Anything else is passed through untouched.
function toPhoto(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }
  if (raw.startsWith("http://")) {
    return `https://${raw.slice("http://".length)}`;
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  if (raw.startsWith("/")) {
    return `https://image.tmdb.org/t/p/w300${raw}`;
  }
  return raw;
}

function normalizeCastValue(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// When two entries describe the same person, prefer the one carrying more
// supporting data (a photo and/or a TMDB id) so merged results keep imagery.
function selectBetterCastEntry(current, candidate) {
  if (!candidate) {
    return current;
  }
  if (!current) {
    return candidate;
  }
  const currentScore = Number(Boolean(current.photo)) + Number(Boolean(current.tmdbId));
  const candidateScore = Number(Boolean(candidate.photo)) + Number(Boolean(candidate.tmdbId));
  return candidateScore > currentScore ? candidate : current;
}

// Enriches the primary cast list with character/photo/tmdbId values pulled from
// a supplemental source, matching first on name+character and then on name
// alone. Primary entries always win for fields they already populate.
function mergeCastEntries(primary = [], supplemental = []) {
  if (!primary.length) {
    return supplemental;
  }
  if (!supplemental.length) {
    return primary;
  }

  const exactMatches = new Map();
  const nameMatches = new Map();
  supplemental.forEach((entry) => {
    const normalizedName = normalizeCastValue(entry?.name);
    if (!normalizedName) {
      return;
    }
    const normalizedCharacter = normalizeCastValue(entry?.character);
    if (normalizedCharacter) {
      const exactKey = `${normalizedName}|${normalizedCharacter}`;
      exactMatches.set(exactKey, selectBetterCastEntry(exactMatches.get(exactKey), entry));
    }
    nameMatches.set(normalizedName, selectBetterCastEntry(nameMatches.get(normalizedName), entry));
  });

  return primary.map((entry) => {
    const normalizedName = normalizeCastValue(entry?.name);
    const normalizedCharacter = normalizeCastValue(entry?.character);
    const exactKey = normalizedName && normalizedCharacter ? `${normalizedName}|${normalizedCharacter}` : "";
    const match = (exactKey ? exactMatches.get(exactKey) : null) || (normalizedName ? nameMatches.get(normalizedName) : null);
    return {
      ...entry,
      character: entry?.character || match?.character || "",
      photo: entry?.photo || match?.photo || "",
      tmdbId: entry?.tmdbId || match?.tmdbId || null
    };
  });
}

function mapCastEntries(items = [], mapper) {
  return (Array.isArray(items) ? items : [])
    .map(mapper)
    .filter((entry) => Boolean(entry?.name));
}

// Builds the normalized cast list shown on the detail screen by merging the
// three sources a meta can expose (castMembers, cast, credits.cast), preferring
// the richest available source and capping the result. Pure: depends only on
// the provided meta.
export function extractCast(meta = {}) {
  const members = Array.isArray(meta.castMembers) ? meta.castMembers : [];
  const memberEntries = mapCastEntries(members, (entry) => ({
    name: entry?.name || "",
    character: entry?.character || entry?.role || "",
    photo: toPhoto(
      entry?.photo
      || entry?.profilePath
      || entry?.profile_path
      || entry?.avatar
      || entry?.image
      || entry?.poster
      || ""
    ),
    tmdbId: entry?.tmdbId || entry?.id || null
  }));

  const direct = Array.isArray(meta.cast) ? meta.cast : [];
  const directEntries = mapCastEntries(direct, (entry) => {
    if (typeof entry === "string") {
      return { name: entry, character: "", photo: "", tmdbId: null };
    }
    return {
      name: entry?.name || "",
      character: entry?.character || "",
      photo: toPhoto(
        entry?.photo
        || entry?.profilePath
        || entry?.profile_path
        || entry?.avatar
        || entry?.image
        || entry?.poster
        || ""
      ),
      tmdbId: entry?.tmdbId || entry?.id || null
    };
  });

  const credits = meta.credits?.cast;
  const creditEntries = mapCastEntries(credits, (entry) => ({
    name: entry?.name || entry?.character || "",
    character: entry?.character || "",
    photo: toPhoto(
      entry?.profile_path
      || entry?.photo
      || entry?.profilePath
      || entry?.avatar_path
      || entry?.avatar
      || entry?.image
      || ""
    ),
    tmdbId: entry?.id || null
  }));

  if (memberEntries.length) {
    return mergeCastEntries(memberEntries, [...directEntries, ...creditEntries]).slice(0, 18);
  }
  if (directEntries.length) {
    return mergeCastEntries(directEntries, creditEntries).slice(0, 12);
  }
  if (creditEntries.length) {
    return creditEntries.slice(0, 12);
  }

  return [];
}
