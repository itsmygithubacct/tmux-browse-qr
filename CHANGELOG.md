# Changelog

## 0.7.2-qr — 2026-04-24

Initial carve from `tmux-browse` core. Moves `lib/qr.py`, the
`/api/qr` endpoint, the Show QR / Read QR Config buttons, and the
scanner modal into this standalone extension.

Targets `tmux-browse >= 0.7.1.3` — the core release that adds the
`config_actions_extras` and `qr_modal` slots where this extension's
UI drops in.

### Contents

- SVG QR generator (stdlib only, no pip deps).
- `GET /api/qr?data=<url>` handler.
- Show QR / Read QR buttons in Config > actions row.
- Scanner modal using the browser's `BarcodeDetector` API
  (Chrome on Android has it; Safari doesn't as of 2025).
- Serializer hooks into core's existing `collectViewConfig()` /
  `applyViewConfig()` so the feature round-trips the full view
  config exactly the way `?import-cfg=<b64>` URLs do.

### Not included

- Any QR-generator dependency. The SVG is computed by `qr/__init__.py`
  using stdlib only.
- A tests directory. The QR round-trip is manually tested against a
  phone browser; server-side generation is pure-function and
  covered by type invariants.
