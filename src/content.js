const searchContainerId = "playlist-search-container";
const fallbackAreaId = "playlist-search-fallback";
const highlightClass = "playlist-search-highlight";
const activeHighlightClass = "playlist-search-highlight-active";
const playlistItemSelector =
  "ytd-playlist-panel-video-renderer, ytd-playlist-video-renderer, yt-lockup-view-model";
const playlistTitleSelector =
  "#video-title, a#video-title, a.yt-lockup-metadata-view-model__title, h3 a[href*='/watch']";

let currentQuery = "";
let currentMatchIndex = -1;
let navigationRetryTimers = [];

function clearNavigationRetries() {
  navigationRetryTimers.forEach((timer) => window.clearTimeout(timer));
  navigationRetryTimers = [];
}

function handleNavigation() {
  clearNavigationRetries();
  if (addSearchControl()) return;

  [100, 250, 500, 1000, 2000].forEach((delay) => {
    const timer = window.setTimeout(() => {
      navigationRetryTimers = navigationRetryTimers.filter(
        (retryTimer) => retryTimer !== timer,
      );
      addSearchControl();
    }, delay);
    navigationRetryTimers.push(timer);
  });
}

function clearHighlights() {
  document.querySelectorAll(`mark.${highlightClass}`).forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent || ""));
  });
}

function highlightMatches(title, query, active) {
  const queryLower = query.toLocaleLowerCase();
  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let titleText = "";

  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    const text = textNode.textContent || "";
    textNodes.push({ node: textNode, start: titleText.length, text });
    titleText += text;
  }

  const titleLower = titleText.toLocaleLowerCase();
  const matchRanges = [];
  let matchIndex = titleLower.indexOf(queryLower);
  while (matchIndex !== -1) {
    matchRanges.push([matchIndex, matchIndex + query.length]);
    matchIndex = titleLower.indexOf(queryLower, matchIndex + query.length);
  }

  for (const { node, start, text } of textNodes) {
    const end = start + text.length;
    const ranges = matchRanges
      .map(([matchStart, matchEnd]) => [
        Math.max(matchStart, start),
        Math.min(matchEnd, end),
      ])
      .filter(([matchStart, matchEnd]) => matchStart < matchEnd);

    if (!ranges.length) continue;

    const fragment = document.createDocumentFragment();
    let searchFrom = 0;
    for (const [matchStart, matchEnd] of ranges) {
      const localStart = matchStart - start;
      const localEnd = matchEnd - start;
      fragment.append(document.createTextNode(text.slice(searchFrom, localStart)));

      const mark = document.createElement("mark");
      mark.className = active
        ? `${highlightClass} ${activeHighlightClass}`
        : highlightClass;
      mark.textContent = text.slice(localStart, localEnd);
      fragment.append(mark);
      searchFrom = localEnd;
    }

    fragment.append(document.createTextNode(text.slice(searchFrom)));
    node.replaceWith(fragment);
  }
}

function getPlaylistMatches(query) {
  const playlistPanel =
    window.location.pathname === "/watch"
      ? document.querySelector("ytd-playlist-panel-renderer")
      : null;
  const playlistRoot = playlistPanel || document;

  return Array.from(playlistRoot.querySelectorAll(playlistItemSelector))
    .map((item) => ({
      item,
      title:
        item.querySelector(playlistTitleSelector) ||
        Array.from(item.querySelectorAll("a[href*='/watch']")).find((link) =>
          link.textContent.trim(),
        ),
    }))
    .filter(({ title }) =>
      title?.textContent
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
    );
}

function findNextMatch(input, status) {
  const query = input.value.trim();
  clearHighlights();

  if (!query) {
    currentQuery = "";
    currentMatchIndex = -1;
    status.textContent = "";
    return;
  }

  if (query !== currentQuery) {
    currentQuery = query;
    currentMatchIndex = -1;
  }

  const matches = getPlaylistMatches(query);
  if (!matches.length) {
    currentMatchIndex = -1;
    status.textContent = "No matching videos";
    return;
  }

  currentMatchIndex = (currentMatchIndex + 1) % matches.length;
  const { item } = matches[currentMatchIndex];
  status.textContent = `Match ${currentMatchIndex + 1} of ${matches.length}`;
  matches.forEach(({ title }, index) => {
    highlightMatches(title, query, index === currentMatchIndex);
  });
  item.scrollIntoView({ behavior: "smooth", block: "center" });
}

function getSearchAppendArea() {
  const chipBar =
    window.location.pathname === "/playlist"
      ? document.querySelector(
          "chip-bar-view-model.ytChipBarViewModelHost",
        )
      : null;
  if (chipBar) {
    document.getElementById(fallbackAreaId)?.remove();
    return chipBar;
  }

  let fallbackArea = document.getElementById(fallbackAreaId);
  if (!fallbackArea) {
    fallbackArea = document.createElement("div");
    fallbackArea.id = fallbackAreaId;
  }
  const playlistContent = document.querySelector(
    "ytd-playlist-video-list-renderer, ytd-playlist-panel-video-renderer, ytd-playlist-video-renderer, yt-lockup-view-model",
  );
  if (playlistContent?.parentElement) {
    if (
      fallbackArea.parentElement !== playlistContent.parentElement ||
      fallbackArea.nextElementSibling !== playlistContent
    ) {
      playlistContent.parentElement.insertBefore(fallbackArea, playlistContent);
    }
    return fallbackArea;
  }

  const playlistMain =
    document.querySelector("#primary-inner") ||
    document.querySelector("#primary") ||
    document.querySelector('ytd-browse[page-subtype="playlist"]');
  if (!playlistMain) return null;

  const playlistHeader = playlistMain.querySelector(
    "ytd-playlist-header-renderer",
  );
  if (playlistHeader?.parentElement) {
    if (
      fallbackArea.parentElement !== playlistHeader.parentElement ||
      fallbackArea.previousElementSibling !== playlistHeader
    ) {
      playlistHeader.insertAdjacentElement("afterend", fallbackArea);
    }
  } else if (fallbackArea.parentElement !== playlistMain) {
    playlistMain.prepend(fallbackArea);
  }
  return fallbackArea;
}

function addSearchControl() {
  const existingContainer = document.getElementById(searchContainerId);
  const playlistId = new URLSearchParams(window.location.search).get("list");
  const isPlaylistRoute =
    window.location.pathname === "/playlist" ||
    window.location.pathname === "/watch";
  if (!isPlaylistRoute || !playlistId) {
    existingContainer?.remove();
    document.getElementById(fallbackAreaId)?.remove();
    clearHighlights();
    currentQuery = "";
    currentMatchIndex = -1;
    return false;
  }

  const appendArea = getSearchAppendArea();
  if (!appendArea) return false;
  if (existingContainer) {
    if (existingContainer.parentElement !== appendArea) {
      appendArea.append(existingContainer);
    }
    clearNavigationRetries();
    return true;
  }

  const container = document.createElement("div");
  container.id = searchContainerId;

  const input = document.createElement("input");
  input.type = "search";
  input.placeholder = "Search this playlist";
  input.setAttribute("aria-label", "Search playlist videos");

  const status = document.createElement("span");
  status.setAttribute("aria-live", "polite");

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Find Next";

  input.addEventListener("input", () => {
    currentQuery = "";
    currentMatchIndex = -1;
    findNextMatch(input, status);
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      findNextMatch(input, status);
    }
  });
  button.addEventListener("click", () => findNextMatch(input, status));

  container.append(input, button, status);
  appendArea.append(container);
  clearNavigationRetries();

  if (!document.getElementById("playlist-search-styles")) {
    const style = document.createElement("style");
    style.id = "playlist-search-styles";
    style.textContent = `
      #${searchContainerId} {
        --playlist-search-background: #fff;
        --playlist-search-control-background: #eee;
        --playlist-search-text: #0f0f0f;
        --playlist-search-border: #ccc;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: fit-content;
        max-width: 100%;
        box-sizing: border-box;
        margin: 12px auto;
        color: var(--playlist-search-text);
        color-scheme: light;
      }
      html[dark] #${searchContainerId} {
        --playlist-search-background: #0f0f0f;
        --playlist-search-control-background: #272727;
        --playlist-search-text: #f1f1f1;
        --playlist-search-border: #3f3f3f;
        color-scheme: dark;
      }
      #${fallbackAreaId} {
        width: 100%;
        background: var(--yt-spec-base-background, #fff);
      }
      html[dark] #${fallbackAreaId} {
        background: var(--yt-spec-base-background, #0f0f0f);
      }
      #${searchContainerId} input {
        box-sizing: border-box;
        width: 200px;
        min-width: 0;
        padding: 8px 12px;
        border: 1px solid var(--playlist-search-border);
        border-radius: 18px;
        background: var(--playlist-search-background);
        color: var(--playlist-search-text);
      }
      #${searchContainerId} input::placeholder {
        color: var(--playlist-search-text);
        opacity: 0.7;
      }
      #${searchContainerId} button {
        padding: 8px 12px;
        border: 0;
        border-radius: 18px;
        background: var(--playlist-search-control-background);
        color: var(--playlist-search-text);
        cursor: pointer;
      }
      mark.${highlightClass} {
        background: #fff176;
        color: #111;
      }
      mark.${activeHighlightClass} {
        background: #ff9800;
      }
    `;
    document.head.append(style);
  }

  return true;
}

const observer = new MutationObserver(addSearchControl);
addSearchControl();
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
document.addEventListener("yt-navigate-finish", handleNavigation);
