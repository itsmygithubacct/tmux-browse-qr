"""HTTP route for the QR extension.

Exposes ``GET /api/qr?data=<url-encoded>`` returning an SVG QR code.
Used by the ``Show QR`` button in Config; the scanner side is
client-only and doesn't hit the server.
"""

from __future__ import annotations

from urllib.parse import ParseResult, parse_qs

import qr as qr_mod

from lib.extensions import Registration


def _h_qr(handler, parsed: ParseResult) -> None:
    query = parse_qs(parsed.query)
    data = (query.get("data", [""])[0] or "").strip()
    if not data:
        handler._send_json(
            {"ok": False, "error": "missing 'data'"}, status=400)
        return
    try:
        svg = qr_mod.generate_svg(data)
    except ValueError as e:
        handler._send_json(
            {"ok": False, "error": str(e)}, status=400)
        return
    body = svg.encode("utf-8")
    handler.send_response(200)
    handler.send_header("Content-Type", "image/svg+xml")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def register() -> Registration:
    """Loader entry point. Merges ``GET /api/qr`` into core's route table."""
    reg = Registration(name="qr")
    reg.get_routes["/api/qr"] = _h_qr
    return reg
