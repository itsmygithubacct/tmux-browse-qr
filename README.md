# tmux-browse-qr

QR config sharing for [tmux-browse](https://github.com/itsmygithubacct/tmux-browse).
Adds the **Show QR** / **Read QR** buttons to the Config pane so an
operator can round-trip their view config — pane layout, hidden
list, hot buttons, idle alerts, mobile keys, and (when the agent
extension is present) hooks and conductor rules — between devices
by scanning a QR code on a second browser.

Lives in its own repo because QR is a peripheral: most operators on
a single machine never touch it, and keeping the SVG rendering + the
scanner UI in core would bloat it for a feature with a narrow
audience.

## What's in here

- `qr/__init__.py` — tiny stdlib-only QR SVG generator.
- `server/routes.py` — `GET /api/qr?data=<url>` returns an SVG.
- `ui_blocks.html` — the **Show QR** / **Read QR** buttons (slotted
  into Config > actions row) and the scanner modal.
- `static/qr.js` — client side. Serializes `collectViewConfig()`
  from core's `sharing.js`, shows the QR, or uses the browser's
  `BarcodeDetector` (Chrome Android) to scan a second device's QR
  and feed it through `applyViewConfig()`.

## Install

Same pattern as every other tmux-browse extension:

```bash
# One-click via the dashboard
#   Config → Extensions → QR config share → Download and enable

# Headless
cd tmux-browse
make install-extension QR=1
```

After install, restart the dashboard. The **Show QR** and
**Read QR** buttons appear in the Config pane; the `/api/qr`
endpoint is live.

## Pinned against core

`manifest.json` declares `min_tmux_browse: 0.7.1.3` — that's the
first core release that has the `config_actions_extras` and
`qr_modal` slots this extension fills. Older cores don't know
where to inject these blocks.

## Running the tests

This extension has no Python tests of its own yet — the QR
generator is exercised indirectly by core's previous suite before
the carve. If you add test cases, the layout matches the agent
extension's:

```bash
git clone https://github.com/itsmygithubacct/tmux-browse.git ../core
PYTHONPATH=$(pwd)/../core:$(pwd) python3 -m unittest discover tests
```

## License

MIT, matches core.
