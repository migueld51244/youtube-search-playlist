# YouTube Playlist Searcher

A browser extension that adds a lightweight search box directly to YouTube playlists so you can quickly find a video without endless manual scrolling.

This project is still in active development, so things may evolve quickly as features are refined and the experience is improved.

## Why this extension?

YouTube playlists are useful, but searching within a large playlist is not always intuitive. This extension injects a focused search control into the playlist UI, highlighting matching titles and jumping to the next result.

## Features

- Search directly inside a YouTube playlist page
- Find videos in both classic and newer playlist layouts
- Adds the search box when navigating to a playlist without refreshing
- Places the search box directly above playlist actions in owned and unowned playlists
- Show the search box on dedicated playlist pages and playlist watch pages, not unrelated pages
- Highlights matching video titles in-place
- Adapts the search controls to YouTube's light and dark themes
- Finds the next match and scrolls to it smoothly
- Works with playlist views that load videos dynamically
- Lightweight browser extension with no backend required
- Popup status indicator to confirm when the current tab is a YouTube page

## Current status

This project is in early development and is being iterated on. Some features may be incomplete, and the extension may change in appearance or behavior over time.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/migueld51244/youtube-search-playlist.git
   cd youtube-search-playlist
   ```
2. Open your Chromium-based browser and go to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. Enable Developer mode.
4. Click Load unpacked.
5. Select the `src` directory in this project.
6. Open any YouTube playlist and the search UI should appear.

## Usage

1. Open a YouTube playlist.
2. A search box appears in the playlist controls area.
3. Type a keyword or partial title.
4. Press Enter or click Find Next to move through matching videos.
5. Matching titles are highlighted and the browser will scroll to the active result.

## Project structure

```text
youtube-search-playlist/
├── LICENSE
├── README.md
├── package.json
├── tests/
│   ├── content.test.js
│   └── popup.test.js
├── src/
│   ├── manifest.json
│   ├── content.js
│   ├── assets/
│   └── popup/
│       ├── popup.html
│       ├── popup.css
│       └── popup.js
└── .gitignore
```

## Tests

Run the automated extension tests with Node.js:

```bash
npm install
npm test
```

The tests use jsdom to exercise playlist search behavior and popup status updates.

## How it works

The extension uses a content script to watch YouTube playlist pages and inject a search control when the playlist UI is available. It then:

- finds video title elements in the current playlist
- filters them against the user's query
- highlights matches directly in the DOM
- jumps to the next result and scrolls the relevant item into view

## Limitations

Because YouTube uses lazy loading, the extension can only search videos that have already been loaded into the current page state. As you scroll, additional videos become searchable.

This is also a small, focused extension, so it does not yet include broader polish such as a full build pipeline or extended configuration settings.

## Roadmap

Planned improvements include:

- better keyboard navigation
- more robust search behavior across loaded playlist items
- improved styling and accessibility
- support for additional YouTube playlist patterns
- extension packaging and release workflow

## Contributing

Contributions are welcome as the project continues to evolve. If you want to help:

- open an issue for a bug or feature request
- submit a pull request with a focused improvement
- keep changes small and targeted

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
