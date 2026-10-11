const searchContainerId = "playlist-search-container";
const highlightClass = "playlist-search-highlight";
const activeHighlightClass = "playlist-search-highlight-active";
const playlistItemSelector =
  "ytd-playlist-panel-video-renderer, ytd-playlist-video-renderer";

let currentQuery = "";
let currentMatchIndex = -1;

function clearHighlights() {
  document.querySelectorAll(`mark.${highlightClass}`).forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent || ""));
  });
}

function highlightMatches(title, query, active) {
  const queryLower = query.toLocaleLowerCase();
  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim()) {
      textNodes.push(walker.currentNode);
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent;
    const textLower = text.toLocaleLowerCase();
    let searchFrom = 0;
    let matchIndex = textLower.indexOf(queryLower, searchFrom);

    if (matchIndex === -1) continue;

    const fragment = document.createDocumentFragment();
    while (matchIndex !== -1) {
      fragment.append(document.createTextNode(text.slice(searchFrom, matchIndex)));

      const mark = document.createElement("mark");
      mark.className = active
        ? `${highlightClass} ${activeHighlightClass}`
        : highlightClass;
      mark.textContent = text.slice(matchIndex, matchIndex + query.length);
      fragment.append(mark);

      searchFrom = matchIndex + query.length;
      matchIndex = textLower.indexOf(queryLower, searchFrom);
    }

    fragment.append(document.createTextNode(text.slice(searchFrom)));
    textNode.replaceWith(fragment);
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
  const { item, title } = matches[currentMatchIndex];
  status.textContent = `Match ${currentMatchIndex + 1} of ${matches.length}`;
  highlightMatches(title, query, true);
  item.scrollIntoView({ behavior: "smooth", block: "center" });
}

function addSearchControl() {
  const appendArea = document.querySelector(
    "chip-bar-view-model.ytChipBarViewModelHost",
  );
  if (!appendArea || document.getElementById(searchContainerId)) return;

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
}

const observer = new MutationObserver(addSearchControl);
addSearchControl();
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
