const searchContainerId = "playlist-search-container";
const highlightClass = "playlist-search-highlight";
const activeHighlightClass = "playlist-search-highlight-active";
const playlistItemSelector =
  "ytd-playlist-panel-video-renderer, ytd-playlist-video-renderer";

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
  return Array.from(document.querySelectorAll(playlistItemSelector))
    .map((item) => ({
      item,
      title: item.querySelector("#video-title, a#video-title"),
    }))
    .filter(({ title }) =>
      title?.textContent.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
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

function addSearchControl() {
  const existingContainer = document.getElementById(searchContainerId);
  const playlistId = new URLSearchParams(window.location.search).get("list");
  if (window.location.pathname !== "/playlist" || !playlistId) {
    existingContainer?.remove();
    clearHighlights();
    currentQuery = "";
    currentMatchIndex = -1;
    clearNavigationRetries();
    return false;
  }

  if (existingContainer) {
    clearNavigationRetries();
    return true;
  }

  const appendArea = document.querySelector(
    "chip-bar-view-model.ytChipBarViewModelHost",
  );
  if (!appendArea) return false;

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
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-inline-start: 12px;
      }
      #${searchContainerId} input {
        box-sizing: border-box;
        width: 200px;
        min-width: 0;
        padding: 8px 12px;
        border: 1px solid var(--yt-spec-10-percent-layer, #ccc);
        border-radius: 18px;
        background: var(--yt-spec-raised-background, #fff);
        color: var(--yt-spec-text-primary, #0f0f0f);
      }
      #${searchContainerId} button {
        padding: 8px 12px;
        border: 0;
        border-radius: 18px;
        background: var(--yt-spec-badge-chip-background, #eee);
        color: var(--yt-spec-text-primary, #0f0f0f);
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
