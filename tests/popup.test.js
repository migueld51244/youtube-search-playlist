import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { JSDOM } from "jsdom";

const popupScript = readFileSync(
  new URL("../src/popup/popup.js", import.meta.url),
  "utf8",
);
const popupHtml = readFileSync(
  new URL("../src/popup/popup.html", import.meta.url),
  "utf8",
);

describe("popup status indicator", () => {
  it("shows success for a YouTube tab", async () => {
    const dom = createPopup("https://www.youtube.com/playlist?list=PL123");
    await flushPromises();

    assert.equal(
      dom.window.document.querySelector(".status-p").textContent,
      "Status: Working! User is on YouTube",
    );
    assert.equal(
      dom.window.document.querySelector(".status").style.borderColor,
      "green",
    );
    assert.equal(
      dom.window.document.querySelector(".status-img").getAttribute("src"),
      "../assets/success-status-icon.svg",
    );
    dom.window.close();
  });

  it("shows an error for a non-YouTube tab", async () => {
    const dom = createPopup("https://example.com/");
    await flushPromises();

    assert.equal(
      dom.window.document.querySelector(".status-p").textContent,
      "Status: Error! Not on YouTube page",
    );
    assert.equal(
      dom.window.document.querySelector(".status").style.borderColor,
      "red",
    );
    assert.equal(
      dom.window.document.querySelector(".status-img").getAttribute("src"),
      "../assets/error-status-icon.svg",
    );
    dom.window.close();
  });

  it("uses Firefox's browser API when available", async () => {
    const dom = createPopup(
      "https://www.youtube.com/playlist?list=PL123",
      "browser",
    );
    await flushPromises();

    assert.equal(
      dom.window.document.querySelector(".status-p").textContent,
      "Status: Working! User is on YouTube",
    );
    dom.window.close();
  });
});

function createPopup(url, apiName = "chrome") {
  const dom = new JSDOM(popupHtml, {
    url: "https://extension.test/popup/popup.html",
    runScripts: "outside-only",
  });
  dom.window[apiName] = {
    tabs: {
      query: async () => [{ url }],
    },
  };
  dom.window.eval(popupScript);
  return dom;
}

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
