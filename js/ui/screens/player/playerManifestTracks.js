function cleanDisplayText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripQuotes(value) {
  const text = String(value || "").trim();
  if (text.startsWith("\"") && text.endsWith("\"")) {
    return text.slice(1, -1);
  }
  return text;
}

function parseHlsAttributeList(value) {
  const raw = String(value || "");
  const attributes = {};
  const regex = /([A-Z0-9-]+)=("[^"]*"|[^,]*)/gi;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const key = String(match[1] || "").toUpperCase();
    const attributeValue = stripQuotes(match[2] || "");
    if (!key) {
      continue;
    }
    attributes[key] = attributeValue;
  }
  return attributes;
}

function resolveUrl(baseUrl, maybeRelativeUrl) {
  try {
    return new URL(String(maybeRelativeUrl || ""), String(baseUrl || "")).toString();
  } catch (_) {
    return String(maybeRelativeUrl || "");
  }
}

export function parseHlsManifestTracks(manifestText, manifestUrl) {
  const lines = String(manifestText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const audioTracks = [];
  const subtitleTracks = [];
  const variants = [];
  let pendingVariantAttributes = null;

  lines.forEach((line) => {
    if (line.startsWith("#EXT-X-MEDIA:")) {
      const attributes = parseHlsAttributeList(line.slice("#EXT-X-MEDIA:".length));
      const mediaType = String(attributes.TYPE || "").toUpperCase();
      const groupId = String(attributes["GROUP-ID"] || "").trim();
      const name = String(attributes.NAME || attributes.LANGUAGE || "").trim();
      const language = String(attributes.LANGUAGE || "").trim();
      const channels = String(attributes.CHANNELS || "").trim();
      const characteristics = String(attributes.CHARACTERISTICS || "").trim();
      const uri = attributes.URI ? resolveUrl(manifestUrl, attributes.URI) : null;
      const isDefault = String(attributes.DEFAULT || "").toUpperCase() === "YES";
      const forced = String(attributes.FORCED || "").toUpperCase() === "YES";
      const autoselect = String(attributes.AUTOSELECT || "").toUpperCase() === "YES";
      const trackId = `${mediaType || "TRACK"}::${groupId || "main"}::${name || language || "default"}`;

      if (mediaType === "AUDIO") {
        audioTracks.push({
          id: trackId,
          groupId,
          name: name || `Audio ${audioTracks.length + 1}`,
          language,
          channels,
          characteristics,
          uri,
          isDefault,
          forced,
          autoselect
        });
        return;
      }

      if (mediaType === "SUBTITLES") {
        subtitleTracks.push({
          id: trackId,
          groupId,
          name: name || `Subtitle ${subtitleTracks.length + 1}`,
          language,
          characteristics,
          uri,
          isDefault,
          forced,
          autoselect
        });
        return;
      }
      return;
    }

    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      pendingVariantAttributes = parseHlsAttributeList(line.slice("#EXT-X-STREAM-INF:".length));
      return;
    }

    if (line.startsWith("#")) {
      return;
    }

    if (!pendingVariantAttributes) {
      return;
    }

    variants.push({
      uri: resolveUrl(manifestUrl, line),
      audioGroupId: String(pendingVariantAttributes.AUDIO || "").trim() || null,
      subtitleGroupId: String(pendingVariantAttributes.SUBTITLES || "").trim() || null,
      codecs: String(pendingVariantAttributes.CODECS || "").trim(),
      bandwidth: Number(pendingVariantAttributes.BANDWIDTH || 0),
      resolution: String(pendingVariantAttributes.RESOLUTION || "").trim()
    });
    pendingVariantAttributes = null;
  });

  const codecsByAudioGroup = new Map();
  variants.forEach((variant) => {
    const groupId = cleanDisplayText(variant?.audioGroupId);
    const codecs = cleanDisplayText(variant?.codecs);
    if (!groupId || !codecs) {
      return;
    }
    const existing = codecsByAudioGroup.get(groupId) || [];
    if (!existing.includes(codecs)) {
      existing.push(codecs);
      codecsByAudioGroup.set(groupId, existing);
    }
  });
  audioTracks.forEach((track) => {
    const codecs = codecsByAudioGroup.get(cleanDisplayText(track?.groupId));
    if (codecs?.length) {
      track.codecs = codecs.join(", ");
    }
  });

  return {
    audioTracks,
    subtitleTracks,
    variants
  };
}

export function parseDashManifestTracks(manifestText) {
  const parseErrorResult = {
    audioTracks: [],
    subtitleTracks: [],
    variants: []
  };

  const parser = typeof DOMParser === "function" ? new DOMParser() : null;
  if (!parser) {
    return parseErrorResult;
  }

  let xmlDocument = null;
  try {
    xmlDocument = parser.parseFromString(String(manifestText || ""), "application/xml");
  } catch (_) {
    return parseErrorResult;
  }
  if (!xmlDocument) {
    return parseErrorResult;
  }
  if (xmlDocument.getElementsByTagName("parsererror").length > 0) {
    return parseErrorResult;
  }

  const adaptationSets = Array.from(xmlDocument.getElementsByTagName("AdaptationSet"));
  if (!adaptationSets.length) {
    return parseErrorResult;
  }

  const audioTracks = [];
  const subtitleTracks = [];
  adaptationSets.forEach((adaptationSet, setIndex) => {
    const contentType = String(adaptationSet.getAttribute("contentType") || "").toLowerCase();
    const mimeType = String(adaptationSet.getAttribute("mimeType") || "").toLowerCase();
    const representation = adaptationSet.getElementsByTagName("Representation")[0] || null;
    const codecs = String(
      adaptationSet.getAttribute("codecs")
      || representation?.getAttribute("codecs")
      || ""
    ).toLowerCase();
    const roleValues = Array.from(adaptationSet.getElementsByTagName("Role"))
      .map((node) => String(node.getAttribute("value") || "").trim())
      .filter(Boolean);
    const accessibilityValues = Array.from(adaptationSet.getElementsByTagName("Accessibility"))
      .map((node) => String(node.getAttribute("value") || "").trim())
      .filter(Boolean);
    const audioChannelConfiguration = adaptationSet.getElementsByTagName("AudioChannelConfiguration")[0]
      || representation?.getElementsByTagName("AudioChannelConfiguration")?.[0]
      || null;
    const language = String(
      adaptationSet.getAttribute("lang")
      || representation?.getAttribute("lang")
      || ""
    ).trim();
    const label = String(
      adaptationSet.getAttribute("label")
      || representation?.getAttribute("label")
      || roleValues[0]
      || ""
    ).trim();
    const setId = String(adaptationSet.getAttribute("id") || setIndex).trim();
    const channels = String(audioChannelConfiguration?.getAttribute("value") || "").trim();
    const role = roleValues.join(" ");
    const accessibility = accessibilityValues.join(" ");

    const isAudio = contentType === "audio" || mimeType.startsWith("audio/");
    const isSubtitle = contentType === "text"
      || mimeType.startsWith("text/")
      || mimeType.includes("ttml")
      || mimeType.includes("vtt")
      || codecs.includes("stpp")
      || codecs.includes("wvtt");

    if (isAudio) {
      audioTracks.push({
        id: `DASH::AUDIO::${setId}::${language || label || audioTracks.length + 1}`,
        groupId: setId,
        name: label || `Audio ${audioTracks.length + 1}`,
        language,
        channels,
        role,
        accessibility,
        codecs,
        uri: null,
        isDefault: audioTracks.length === 0
      });
    } else if (isSubtitle) {
      subtitleTracks.push({
        id: `DASH::SUBTITLES::${setId}::${language || label || subtitleTracks.length + 1}`,
        groupId: setId,
        name: label || `Subtitle ${subtitleTracks.length + 1}`,
        language,
        role,
        accessibility,
        uri: null,
        isDefault: subtitleTracks.length === 0
      });
    }
  });

  return {
    audioTracks,
    subtitleTracks,
    variants: []
  };
}

export function parseManifestTracks(manifestText, manifestUrl) {
  const text = String(manifestText || "");
  if (!text) {
    return { audioTracks: [], subtitleTracks: [], variants: [] };
  }
  if (text.includes("#EXTM3U")) {
    return parseHlsManifestTracks(text, manifestUrl);
  }
  if (/<\s*MPD[\s>]/i.test(text)) {
    return parseDashManifestTracks(text);
  }
  return { audioTracks: [], subtitleTracks: [], variants: [] };
}
