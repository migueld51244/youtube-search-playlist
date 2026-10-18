import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { JSDOM } from "jsdom";

const contentScript = readFileSync(
  new URL("../src/content.js", import.meta.url),
  "utf8",
);
const openWindows = new Set();

afterEach(() => {
  for (const window of openWindows) window.close();
  openWindows.clear();
});

function loadContentScript(url, body) {
  const dom = new JSDOM(`<!doctype html><html><body>${body}</body></html>`, {
    url,
    runScripts: "outside-only",
  });
  openWindows.add(dom.window);
  dom.window.HTMLElement.prototype.scrollIntoView = function () {
    this.dataset.scrolledIntoView = "true";
  };
  dom.window.eval(contentScript);
  return dom.window;
}

function playlistMarkup(items) {
  return `
    <ytd-playlist-header-renderer>
      <div class="play-menu"></div>
    </ytd-playlist-header-renderer>
    ${items
      .map(
        (title) => `
          <ytd-playlist-video-renderer>
            <a id="video-title">${title}</a>
          </ytd-playlist-video-renderer>
        `,
      )
      .join("")}
  `;
}

describe("playlist search content script", () => {
  it("adds one search control and cycles through case-insensitive matches", () => {
    const window = loadContentScript(
      "https://www.youtube.com/playlist?list=PL123",
      playlistMarkup(["Alpha song", "Unrelated song", "An alphabet"]),
    );

    const containers = window.document.querySelectorAll(
      "#playlist-search-container",
    );
    assert.equal(containers.length, 1);
    const container = containers[0];
    assert.equal(
      container.nextElementSibling,
      window.document.querySelector(".play-menu"),
    );

    const input = container.querySelector("input");
    const status = container.querySelector('[aria-live="polite"]');
    input.value = "ALPHA";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));

    assert.equal(status.textContent, "Match 1 of 2");
    assert.equal(
      window.document.querySelectorAll("mark.playlist-search-highlight")
        .length,
      2,
    );
    assert.equal(
      window.document.querySelectorAll(
        "mark.playlist-search-highlight-active",
      ).length,
      1,
    );

    const button = container.querySelector("button");
    button.click();
    assert.equal(status.textContent, "Match 2 of 2");
    assert.equal(
      window.document.querySelector(
        "ytd-playlist-video-renderer:last-of-type",
      ).dataset.scrolledIntoView,
      "true",
    );

    const enter = new window.KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(enter);
    assert.equal(enter.defaultPrevented, true);
    assert.equal(status.textContent, "Match 1 of 2");
  });

  it("reports no results and clears highlights when the query is cleared", () => {
    const window = loadContentScript(
      "https://www.youtube.com/playlist?list=PL123",
      playlistMarkup(["Alpha song"]),
    );
    const input = window.document.querySelector(
      "#playlist-search-container input",
    );
    const status = window.document.querySelector(
      "#playlist-search-container [aria-live]",
    );

    input.value = "missing";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    assert.equal(status.textContent, "No matching videos");
    assert.equal(
      window.document.querySelectorAll("mark.playlist-search-highlight")
        .length,
      0,
    );

    input.value = " ";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    assert.equal(status.textContent, "");
    assert.equal(
      window.document.querySelectorAll("mark.playlist-search-highlight")
        .length,
      0,
    );
  });

  it("limits watch-page searches to the playlist panel", () => {
    const window = loadContentScript(
      "https://www.youtube.com/watch?v=video&list=PL123",
      `
        <ytd-playlist-panel-renderer>
          <div class="play-menu"></div>
          <ytd-playlist-panel-video-renderer>
            <a id="video-title">Alpha in playlist</a>
          </ytd-playlist-panel-video-renderer>
        </ytd-playlist-panel-renderer>
        <ytd-playlist-video-renderer>
          <a id="video-title">Alpha outside playlist</a>
        </ytd-playlist-video-renderer>
      `,
    );

    const input = window.document.querySelector(
      "#playlist-search-container input",
    );
    const status = window.document.querySelector(
      "#playlist-search-container [aria-live]",
    );
    input.value = "alpha";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));

    assert.equal(status.textContent, "Match 1 of 1");
    assert.equal(
      window.document.querySelectorAll("mark.playlist-search-highlight")
        .length,
      1,
    );
  });

  it("does not add a search control outside a playlist route", () => {
    const window = loadContentScript(
      "https://www.youtube.com/results?search_query=music",
      playlistMarkup(["Alpha song"]),
    );

    assert.equal(
      window.document.querySelector("#playlist-search-container"),
      null,
    );
  });
});
