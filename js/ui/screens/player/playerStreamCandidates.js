import { DirectDebridResolver } from "../../../core/debrid/directDebridResolver.js";
import { WebOsEngineFsResolver } from "../../../core/p2p/webosEngineFsResolver.js";
import { TizenStreamingServerResolver } from "../../../core/p2p/tizenStreamingServerResolver.js";

function isMagnetUrl(value = "") {
  return String(value || "").trim().toLowerCase().startsWith("magnet:");
}

function streamDebridIdentity(item = {}) {
  const resolve = item.clientResolve || item.raw?.clientResolve || {};
  const behaviorHints = item.behaviorHints || item.raw?.behaviorHints || {};
  const infoHash = item.infoHash || item.raw?.infoHash || resolve.infoHash || "";
  const magnetUri = resolve.magnetUri
    || (isMagnetUrl(item.url) ? item.url : "")
    || (isMagnetUrl(item.externalUrl) ? item.externalUrl : "");
  const hasDebridMarker = Boolean(
    item.clientResolve
      || item.raw?.clientResolve
      || item.debridCacheStatus
      || item.raw?.debridCacheStatus
      || infoHash
      || magnetUri
  );
  if (!hasDebridMarker) {
    return "";
  }
  const locator = infoHash || magnetUri || item.url || item.externalUrl || item.ytId || "";
  if (!locator) {
    return "";
  }
  return [
    String(item.addonName || "Addon"),
    String(resolve.service || item.debridCacheStatus?.providerId || item.raw?.debridCacheStatus?.providerId || ""),
    String(locator),
    String(resolve.fileIdx ?? item.fileIdx ?? item.raw?.fileIdx ?? ""),
    String(behaviorHints.filename || resolve.filename || ""),
    String(resolve.torrentName || "")
  ].join("::");
}

function streamMergeKey(item = {}) {
  const debridIdentity = streamDebridIdentity(item);
  if (debridIdentity) {
    return `debrid::${debridIdentity}`;
  }
  const locator = item.url || item.externalUrl || item.ytId || "";
  if (!locator) {
    return "";
  }
  return [
    String(item.addonName || "Addon"),
    String(locator),
    String(item.sourceType || ""),
    String(item.fileIdx ?? ""),
    String(item.behaviorHints?.filename || "")
  ].join("::");
}

function mergeStreamItem(previous = {}, next = {}) {
  const behaviorHints = {
    ...(previous.behaviorHints || {}),
    ...(next.behaviorHints || {})
  };
  return {
    ...previous,
    ...next,
    id: previous.id || next.id,
    url: next.url || previous.url || "",
    externalUrl: next.externalUrl || previous.externalUrl || null,
    ytId: next.ytId || previous.ytId || null,
    behaviorHints: Object.keys(behaviorHints).length ? behaviorHints : null,
    subtitles: Array.isArray(next.subtitles) && next.subtitles.length ? next.subtitles : previous.subtitles,
    sources: Array.isArray(next.sources) && next.sources.length ? next.sources : previous.sources
  };
}

export function normalizePlayableStreamCandidates(streams = []) {
  return (streams || []).map((stream, index) => {
    const streamUrl = stream?.url || stream?.externalUrl || "";
    const entry = {
      id: stream.id || `stream-${index}-${streamUrl}`,
      label: stream.name || stream.title || stream.label || `Source ${index + 1}`,
      name: stream.name || null,
      title: stream.title || stream.label || null,
      description: stream.description || stream.name || "",
      addonName: stream.addonName || stream.sourceName || "Addon",
      addonLogo: stream.addonLogo || null,
      mimeType: stream.mimeType || stream.raw?.mimeType || stream.type || stream.source || null,
      sourceType: stream.sourceType || stream.mimeType || stream.type || stream.source || "",
      url: streamUrl,
      ytId: stream.ytId || null,
      infoHash: stream.infoHash || null,
      fileIdx: stream.fileIdx ?? null,
      engineFs: stream.engineFs || stream.raw?.engineFs || null,
      tizenP2p: stream.tizenP2p || stream.raw?.tizenP2p || null,
      externalUrl: stream.externalUrl || null,
      behaviorHints: stream.behaviorHints || null,
      sources: Array.isArray(stream.sources) ? stream.sources : [],
      quality: stream.quality || null,
      qualityValue: Number.isFinite(Number(stream.qualityValue)) ? Number(stream.qualityValue) : -1,
      clientResolve: stream.clientResolve || stream.raw?.clientResolve || null,
      debridCacheStatus: stream.debridCacheStatus || null,
      subtitles: Array.isArray(stream.subtitles) ? stream.subtitles : [],
      raw: stream
    };
    return (
      DirectDebridResolver.shouldListStream(entry)
      || WebOsEngineFsResolver.canResolveStream(entry)
      || TizenStreamingServerResolver.canResolveStream(entry)
    ) ? entry : null;
  }).filter(Boolean);
}

export function flattenStreamGroups(streamResult) {
  if (!streamResult || streamResult.status !== "success") {
    return [];
  }
  const flattened = [];
  (streamResult.data || []).forEach((group) => {
    const addonName = group.addonName || "Addon";
    (group.streams || []).forEach((stream, index) => {
      const resolve = stream.clientResolve || stream.raw?.clientResolve || {};
      const entry = {
        id: stream.id || `${addonName}-${index}-${stream.url || stream.externalUrl || stream.ytId || stream.infoHash || resolve.infoHash || resolve.magnetUri || ""}`,
        label: stream.name || stream.title || `${addonName} stream`,
        name: stream.name || null,
        title: stream.title || null,
        description: stream.description || stream.name || "",
        addonName,
        addonLogo: group.addonLogo || stream.addonLogo || null,
        mimeType: stream.mimeType || stream.raw?.mimeType || stream.type || stream.source || null,
        sourceType: stream.sourceType || stream.mimeType || stream.type || stream.source || "",
        url: stream.url || stream.externalUrl || "",
        ytId: stream.ytId || null,
        infoHash: stream.infoHash || null,
        fileIdx: stream.fileIdx ?? null,
        engineFs: stream.engineFs || stream.raw?.engineFs || null,
        tizenP2p: stream.tizenP2p || stream.raw?.tizenP2p || null,
        externalUrl: stream.externalUrl || null,
        behaviorHints: stream.behaviorHints || null,
        sources: Array.isArray(stream.sources) ? stream.sources : [],
        quality: stream.quality || null,
        qualityValue: Number.isFinite(Number(stream.qualityValue)) ? Number(stream.qualityValue) : -1,
        clientResolve: stream.clientResolve || null,
        debridCacheStatus: stream.debridCacheStatus || null,
        subtitles: Array.isArray(stream.subtitles) ? stream.subtitles : [],
        addonOrderIndex: Number.isFinite(Number(stream.addonOrderIndex))
          ? Number(stream.addonOrderIndex)
          : Number(group.addonOrderIndex ?? Number.MAX_SAFE_INTEGER),
        raw: stream
      };
      if (
        DirectDebridResolver.shouldListStream(entry)
        || WebOsEngineFsResolver.canResolveStream(entry)
        || TizenStreamingServerResolver.canResolveStream(entry)
      ) {
        flattened.push(entry);
      }
    });
  });
  return flattened;
}

export function mergeStreamItems(existing = [], incoming = []) {
  const order = [];
  const byKey = new Map();
  const push = (item) => {
    const key = streamMergeKey(item);
    if (!key) {
      return;
    }
    if (!byKey.has(key)) {
      order.push(key);
      byKey.set(key, item);
      return;
    }
    byKey.set(key, mergeStreamItem(byKey.get(key), item));
  };
  (existing || []).forEach(push);
  (incoming || []).forEach(push);
  return order.map((key) => byKey.get(key));
}
