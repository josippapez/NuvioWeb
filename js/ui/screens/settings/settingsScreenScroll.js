const SETTINGS_RAIL_SCROLL_TARGET_RATIO = 0.42;
const SETTINGS_RAIL_SCROLL_STIFFNESS = 180;
const SETTINGS_RAIL_SCROLL_DAMPING_RATIO = 0.95;

function clampScrollValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scrollIntoNearestView(node) {
  if (!node || typeof node.scrollIntoView !== "function") {
    return;
  }
  try {
    node.scrollIntoView({
      block: "nearest",
      inline: "nearest"
    });
  } catch (_) {
    node.scrollIntoView();
  }
}

function getScrollMax(node, axis = "y") {
  if (!node) {
    return 0;
  }
  return Math.max(0, axis === "x" ? node.scrollWidth - node.clientWidth : node.scrollHeight - node.clientHeight);
}

function getScrollPosition(node, axis = "y") {
  return Number(axis === "x" ? node?.scrollLeft || 0 : node?.scrollTop || 0);
}

function setScrollPosition(node, value, axis = "y") {
  if (!node) {
    return;
  }
  if (axis === "x") {
    node.scrollLeft = value;
    return;
  }
  node.scrollTop = value;
}

function animateSettingsScroll(container, nextPosition, axis = "y") {
  if (!container) {
    return;
  }

  const frameKey = axis === "x" ? "settingsScrollAnimationFrameX" : "settingsScrollAnimationFrameY";
  if (container[frameKey]) {
    cancelAnimationFrame(container[frameKey]);
    container[frameKey] = null;
  }

  const startPosition = getScrollPosition(container, axis);
  if (Math.abs(nextPosition - startPosition) < 1 || typeof requestAnimationFrame !== "function") {
    setScrollPosition(container, nextPosition, axis);
    updateSettingsScrollIndicators(container);
    return;
  }

  let position = startPosition;
  let velocity = 0;
  let lastTime = performance.now();
  const damping = 2 * SETTINGS_RAIL_SCROLL_DAMPING_RATIO * Math.sqrt(SETTINGS_RAIL_SCROLL_STIFFNESS);
  const step = (now) => {
    const deltaSeconds = Math.min(0.034, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    const displacement = position - nextPosition;
    const acceleration = (-SETTINGS_RAIL_SCROLL_STIFFNESS * displacement) - (damping * velocity);
    velocity += acceleration * deltaSeconds;
    position += velocity * deltaSeconds;
    setScrollPosition(container, position, axis);
    updateSettingsScrollIndicators(container);

    if (Math.abs(position - nextPosition) > 0.5 || Math.abs(velocity) > 0.5) {
      container[frameKey] = requestAnimationFrame(step);
    } else {
      setScrollPosition(container, nextPosition, axis);
      container[frameKey] = null;
      updateSettingsScrollIndicators(container);
    }
  };

  container[frameKey] = requestAnimationFrame(step);
}

function scrollSettingsNodeIntoContainer(node, container, axis = "y") {
  if (!node || !container) {
    return;
  }

  const maxScroll = getScrollMax(container, axis);
  if (maxScroll <= 0) {
    updateSettingsScrollIndicators(container);
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const nodeRect = node.getBoundingClientRect();
  const containerSize = axis === "x" ? container.clientWidth : container.clientHeight;
  const nodeStart = axis === "x" ? nodeRect.left - containerRect.left : nodeRect.top - containerRect.top;
  const nodeSize = axis === "x" ? nodeRect.width || node.offsetWidth || 0 : nodeRect.height || node.offsetHeight || 0;
  const itemCenterInViewport = nodeStart + (nodeSize / 2);
  const targetCenter = containerSize * SETTINGS_RAIL_SCROLL_TARGET_RATIO;
  const nextPosition = clampScrollValue(getScrollPosition(container, axis) + itemCenterInViewport - targetCenter, 0, maxScroll);

  if (Math.abs(getScrollPosition(container, axis) - nextPosition) < 1) {
    updateSettingsScrollIndicators(container);
    return;
  }
  animateSettingsScroll(container, nextPosition, axis);
}

export function scrollSettingsContentItem(node) {
  if (!node) {
    return;
  }

  const dialogContainer = node.closest?.(".settings-dialog-list");
  if (dialogContainer) {
    scrollSettingsNodeIntoContainer(node, dialogContainer, "y");
    return;
  }

  const horizontalContainer = node.closest?.(".settings-theme-row");
  if (horizontalContainer) {
    scrollSettingsNodeIntoContainer(node, horizontalContainer, "x");
  }

  const verticalContainer = node.closest?.(".settings-content, .settings-group-card-fill, .settings-trakt-scroll-area, .supporters-list");
  if (verticalContainer) {
    scrollSettingsNodeIntoContainer(node, verticalContainer, "y");
    return;
  }

  scrollIntoNearestView(node);
}

function updateSettingsScrollIndicators(container) {
  if (!container) {
    return;
  }

  const verticalFrame = container.closest?.(".settings-content-frame, .settings-sidebar-frame, .settings-trakt-scroll-frame");
  if (
    verticalFrame
    && (
      container.classList?.contains("settings-content")
      || container.classList?.contains("settings-sidebar")
      || container.classList?.contains("settings-trakt-scroll-area")
    )
  ) {
    const maxScroll = getScrollMax(container, "y");
    const scrollTop = getScrollPosition(container, "y");
    verticalFrame.classList.toggle("can-scroll-backward", scrollTop > 1);
    verticalFrame.classList.toggle("can-scroll-forward", maxScroll > 1 && scrollTop < maxScroll - 1);
  }

  const horizontalFrame = container.closest?.(".settings-horizontal-scroll-frame");
  if (horizontalFrame && container.classList?.contains("settings-theme-row")) {
    const maxScroll = getScrollMax(container, "x");
    const scrollLeft = getScrollPosition(container, "x");
    horizontalFrame.classList.toggle("can-scroll-backward", scrollLeft > 1);
    horizontalFrame.classList.toggle("can-scroll-forward", maxScroll > 1 && scrollLeft < maxScroll - 1);
  }
}

export function updateSettingsScrollIndicatorsSoon(container) {
  if (!container) {
    return;
  }
  requestAnimationFrame(() => updateSettingsScrollIndicators(container));
}

export function bindSettingsScrollIndicators(root) {
  if (!root) {
    return;
  }

  root.querySelectorAll?.(".settings-sidebar, .settings-content, .settings-theme-row, .settings-trakt-scroll-area").forEach((container) => {
    if (!container.settingsScrollIndicatorBound) {
      container.settingsScrollIndicatorBound = true;
      container.addEventListener("scroll", () => updateSettingsScrollIndicators(container), { passive: true });
    }
    updateSettingsScrollIndicatorsSoon(container);
  });
}

export function settingsScrollIndicatorMarkup(axis = "vertical") {
  if (axis === "horizontal") {
    return `
      <span class="settings-scroll-indicator settings-scroll-indicator-left" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false"><path d="M14.6 7.4 10 12l4.6 4.6" /></svg>
      </span>
      <span class="settings-scroll-indicator settings-scroll-indicator-right" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false"><path d="m9.4 7.4 4.6 4.6-4.6 4.6" /></svg>
      </span>
    `;
  }
  return `
    <span class="settings-scroll-indicator settings-scroll-indicator-up" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false"><path d="M7.4 14.6 12 10l4.6 4.6" /></svg>
    </span>
    <span class="settings-scroll-indicator settings-scroll-indicator-down" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false"><path d="m7.4 9.4 4.6 4.6 4.6-4.6" /></svg>
    </span>
  `;
}

export function scrollSettingsRailItem(node) {
  const rail = node?.closest?.(".settings-sidebar");
  if (!rail || !node) {
    return;
  }

  const clientHeight = rail.clientHeight || 0;
  const maxScroll = Math.max(0, rail.scrollHeight - clientHeight);
  if (!clientHeight || maxScroll <= 0) {
    return;
  }

  const railRect = rail.getBoundingClientRect();
  const itemRect = node.getBoundingClientRect();
  const itemCenterInViewport = (itemRect.top - railRect.top) + ((itemRect.height || node.offsetHeight || 0) / 2);
  const targetCenter = clientHeight * SETTINGS_RAIL_SCROLL_TARGET_RATIO;
  const nextScrollTop = clampScrollValue(rail.scrollTop + itemCenterInViewport - targetCenter, 0, maxScroll);

  if (Math.abs(rail.scrollTop - nextScrollTop) < 1) {
    return;
  }
  animateSettingsRailScroll(rail, nextScrollTop);
}

function animateSettingsRailScroll(rail, nextScrollTop) {
  if (!rail) {
    return;
  }

  if (rail.settingsScrollAnimationFrame) {
    cancelAnimationFrame(rail.settingsScrollAnimationFrame);
    rail.settingsScrollAnimationFrame = null;
  }

  const startTop = Number(rail.scrollTop || 0);
  if (Math.abs(nextScrollTop - startTop) < 1 || typeof requestAnimationFrame !== "function") {
    rail.scrollTop = nextScrollTop;
    updateSettingsRailIndicators(rail);
    return;
  }

  let position = startTop;
  let velocity = 0;
  let lastTime = performance.now();
  const damping = 2 * SETTINGS_RAIL_SCROLL_DAMPING_RATIO * Math.sqrt(SETTINGS_RAIL_SCROLL_STIFFNESS);
  const step = (now) => {
    const deltaSeconds = Math.min(0.034, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    const displacement = position - nextScrollTop;
    const acceleration = (-SETTINGS_RAIL_SCROLL_STIFFNESS * displacement) - (damping * velocity);
    velocity += acceleration * deltaSeconds;
    position += velocity * deltaSeconds;
    rail.scrollTop = position;
    updateSettingsRailIndicators(rail);

    if (Math.abs(position - nextScrollTop) > 0.5 || Math.abs(velocity) > 0.5) {
      rail.settingsScrollAnimationFrame = requestAnimationFrame(step);
    } else {
      rail.scrollTop = nextScrollTop;
      rail.settingsScrollAnimationFrame = null;
      updateSettingsRailIndicators(rail);
    }
  };

  rail.settingsScrollAnimationFrame = requestAnimationFrame(step);
}

export function updateSettingsRailIndicators(rail) {
  if (!rail) {
    return;
  }

  const frame = rail.closest?.(".settings-sidebar-frame");
  if (!frame) {
    return;
  }

  const maxScroll = Math.max(0, rail.scrollHeight - rail.clientHeight);
  const scrollTop = Number(rail.scrollTop || 0);
  frame.classList.toggle("can-scroll-backward", scrollTop > 1);
  frame.classList.toggle("can-scroll-forward", maxScroll > 1 && scrollTop < maxScroll - 1);
}

export function updateSettingsRailIndicatorsSoon(rail) {
  if (!rail) {
    return;
  }
  requestAnimationFrame(() => updateSettingsRailIndicators(rail));
}

export function focusSettingsNode(node) {
  if (!node || typeof node.focus !== "function") {
    return;
  }

  try {
    node.focus({ preventScroll: true });
  } catch (_) {
    node.focus();
  }
}

export function isScrollContainerAtBoundary(node, direction) {
  if (!node) {
    return true;
  }

  const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
  if (maxScrollTop <= 0) {
    return true;
  }

  const scrollTop = Number(node.scrollTop || 0);
  if (direction === "up") {
    return scrollTop <= 1;
  }
  if (direction === "down") {
    return scrollTop >= maxScrollTop - 1;
  }
  return false;
}

export function captureSettingsScrollState(contentNode) {
  if (!contentNode) {
    return null;
  }

  const fillScrollers = Array.from(contentNode.querySelectorAll(".settings-group-card-fill, .settings-trakt-scroll-area"));
  const horizontalScrollers = Array.from(contentNode.querySelectorAll(".settings-theme-row"));
  return {
    contentScrollTop: Number(contentNode.scrollTop || 0),
    fillScrollTops: fillScrollers.map((node) => Number(node.scrollTop || 0)),
    horizontalScrollLefts: horizontalScrollers.map((node) => Number(node.scrollLeft || 0))
  };
}

export function restoreSettingsScrollState(contentNode, scrollState) {
  if (!contentNode || !scrollState) {
    return;
  }

  contentNode.scrollTop = Number(scrollState.contentScrollTop || 0);
  Array.from(contentNode.querySelectorAll(".settings-group-card-fill, .settings-trakt-scroll-area")).forEach((node, index) => {
    node.scrollTop = Number(scrollState.fillScrollTops?.[index] || 0);
  });
  Array.from(contentNode.querySelectorAll(".settings-theme-row")).forEach((node, index) => {
    node.scrollLeft = Number(scrollState.horizontalScrollLefts?.[index] || 0);
  });
}
