import { Platform } from "../../../platform/index.js";
import { Environment } from "../../../platform/environment.js";
import { YOUTUBE_PROXY_URL } from "../../../config.js";

const LOCAL_YOUTUBE_PROXY_URL = "youtube-proxy.html";

function resolveYoutubeId(value = "") {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return raw;
  }
  const watchMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch?.[1]) {
    return watchMatch[1];
  }
  const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch?.[1]) {
    return shortMatch[1];
  }
  const embedMatch = raw.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch?.[1]) {
    return embedMatch[1];
  }
  return "";
}

function shouldUseDirectYoutubeEmbedOnTv() {
  return (Platform.isWebOS() || Platform.isTizen()) && !getYoutubeProxyBaseUrl();
}

function getYoutubeProxyBaseUrl() {
  const configured = String(YOUTUBE_PROXY_URL || "").trim();
  if (Platform.isWebOS() || Platform.isTizen()) {
    // The local proxy is served from a file:// origin, which YouTube rejects
    // (embed error 153). Prefer a configured https-hosted proxy when available
    // so the embedding origin is valid; otherwise fall back to the local file.
    return /^https?:\/\//i.test(configured) ? configured : LOCAL_YOUTUBE_PROXY_URL;
  }
  return configured || LOCAL_YOUTUBE_PROXY_URL;
}

export function resolveTrailerPostMessageTargetOrigin(src = "") {
  try {
    const url = new URL(String(src || ""), globalThis?.location?.href || "https://example.com/");
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.origin;
    }
  } catch (_) {
    // Fall through to wildcard for opaque/file origins.
  }
  return "*";
}

export function resolveTrailerTrustedProxyOrigin() {
  try {
    const url = new URL(getYoutubeProxyBaseUrl(), globalThis?.location?.href || "https://example.com/");
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.origin;
    }
  } catch (_) {
    // Local file origins are validated by event.source instead.
  }
  return "";
}

function buildDirectYoutubeEmbedUrl(cleanId = "", { muted = true } = {}) {
  const videoId = String(cleanId || "").trim();
  if (!videoId || !Environment.isBrowser()) {
    return "";
  }
  const params = new URLSearchParams({
    autoplay: "1",
    mute: muted ? "1" : "0",
    controls: "0",
    loop: "1",
    playlist: videoId,
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    iv_load_policy: "3"
  });
  const origin = String(globalThis?.location?.origin || "").trim();
  if (/^https?:\/\//i.test(origin)) {
    params.set("origin", origin);
  }
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function buildYoutubeEmbedUrl(ytId = "", { muted = true } = {}) {
  const cleanId = String(ytId || "").trim();
  if (!cleanId) {
    return "";
  }
  if (shouldUseDirectYoutubeEmbedOnTv()) {
    return buildDirectYoutubeEmbedUrl(cleanId, { muted: true });
  }
  const proxyBase = getYoutubeProxyBaseUrl();
  if (proxyBase) {
    try {
      const proxyUrl = new URL(proxyBase, globalThis?.location?.href || "https://example.com/");
      proxyUrl.searchParams.set("v", cleanId);
      proxyUrl.searchParams.set("autoplay", "1");
      proxyUrl.searchParams.set("muted", muted ? "1" : "0");
      proxyUrl.searchParams.set("controls", "0");
      proxyUrl.searchParams.set("loop", "1");
      proxyUrl.searchParams.set("playlist", cleanId);
      proxyUrl.searchParams.set("playsinline", "1");
      proxyUrl.searchParams.set("rel", "0");
      proxyUrl.searchParams.set("_cb", `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      return proxyUrl.toString();
    } catch (_) {
      return "";
    }
  }
  if (!Environment.isBrowser()) {
    return "";
  }
  const params = new URLSearchParams({
    autoplay: "1",
    mute: muted ? "1" : "0",
    controls: "0",
    loop: "1",
    playlist: cleanId,
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1"
  });
  const origin = String(globalThis?.location?.origin || "").trim();
  if (/^https?:\/\//i.test(origin)) {
    params.set("origin", origin);
  }
  return `https://www.youtube-nocookie.com/embed/${cleanId}?${params.toString()}`;
}

export function buildInlineYoutubePlayerUrl(ytId = "", { muted = true } = {}) {
  const cleanId = String(ytId || "").trim();
  if (!cleanId) {
    return "";
  }
  if (shouldUseDirectYoutubeEmbedOnTv()) {
    return buildDirectYoutubeEmbedUrl(cleanId, { muted });
  }
  const proxyBase = getYoutubeProxyBaseUrl();
  if (proxyBase) {
    try {
      const proxyUrl = new URL(proxyBase, globalThis?.location?.href || "https://example.com/");
      proxyUrl.searchParams.set("v", cleanId);
      proxyUrl.searchParams.set("autoplay", "1");
      proxyUrl.searchParams.set("muted", muted ? "1" : "0");
      proxyUrl.searchParams.set("controls", "0");
      proxyUrl.searchParams.set("loop", "1");
      proxyUrl.searchParams.set("playlist", cleanId);
      proxyUrl.searchParams.set("playsinline", "1");
      proxyUrl.searchParams.set("rel", "0");
      proxyUrl.searchParams.set("_cb", `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      return proxyUrl.toString();
    } catch (_) {
      return "";
    }
  }
  const params = new URLSearchParams({
    autoplay: "1",
    mute: muted ? "1" : "0",
    controls: "0",
    loop: "1",
    playlist: cleanId,
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1"
  });
  const origin = String(globalThis?.location?.origin || "").trim();
  if (/^https?:\/\//i.test(origin)) {
    params.set("origin", origin);
  }
  return `https://www.youtube-nocookie.com/embed/${cleanId}?${params.toString()}`;
}

export function resolveTrailerSource(meta = {}) {
  const trailerCandidates = [
    ...(Array.isArray(meta?.trailers) ? meta.trailers : []),
    ...(Array.isArray(meta?.videos) ? meta.videos : [])
  ];
  for (const entry of trailerCandidates) {
    const ytId = resolveYoutubeId(
      entry?.ytId
      || entry?.youtubeId
      || entry?.source
      || entry?.url
      || entry?.link
      || ""
    );
    if (ytId) {
      const embedUrl = buildYoutubeEmbedUrl(ytId);
      if (!embedUrl) {
        continue;
      }
      return {
        kind: "youtube",
        ytId,
        embedUrl
      };
    }
  }
  const ytId = resolveYoutubeId(Array.isArray(meta?.trailerYtIds) ? meta.trailerYtIds[0] : "");
  if (!ytId) {
    return null;
  }
  const embedUrl = buildYoutubeEmbedUrl(ytId);
  if (!embedUrl) {
    return null;
  }
  return {
    kind: "youtube",
    ytId,
    embedUrl
  };
}

export function resolveTrailerItems(meta = {}) {
  const candidates = [
    ...(Array.isArray(meta?.trailers) ? meta.trailers : []),
    ...(Array.isArray(meta?.trailerYtIds) ? meta.trailerYtIds.map((ytId) => ({ ytId, name: "Trailer" })) : [])
  ];
  const seen = new Set();
  return candidates.map((entry) => {
    const ytId = resolveYoutubeId(typeof entry === "string" ? entry : (entry?.ytId || entry?.youtubeId || entry?.source || entry?.url || entry?.link || ""));
    if (!ytId || seen.has(ytId)) return null;
    seen.add(ytId);
    return {
      ytId,
      name: typeof entry === "object" ? (entry.name || entry.type || "Trailer") : "Trailer",
      type: typeof entry === "object" ? (entry.type || "") : "",
      lang: typeof entry === "object" ? (entry.lang || entry.language || "") : ""
    };
  }).filter(Boolean);
}

export function normalizeTrailerProxyStatePayload(payload, fallbackMuted = false) {
  const source = payload && typeof payload === "object" ? payload : {};
  const nestedState = source.state && typeof source.state === "object" ? source.state : null;
  const candidate = nestedState || source;
  return {
    currentTime: Number(candidate.currentTime || 0),
    duration: Number(candidate.duration || 0),
    paused: Boolean(candidate.paused),
    muted: candidate.muted == null ? Boolean(fallbackMuted) : Boolean(candidate.muted),
    loading: Boolean(candidate.loading),
    controllable: candidate.controllable !== false
  };
}
