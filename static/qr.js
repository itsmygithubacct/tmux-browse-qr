// qr.js — Config > Show QR / Read QR for round-tripping view config
// between devices via the browser camera.
//
// Hooks the two buttons added to the Config actions row via this
// extension's ui_blocks.html; relies on core's ``collectViewConfig``
// and ``applyViewConfig`` from sharing.js to serialize and import the
// payload. The extension never writes to state directly — it just
// pipes config objects through the camera.

(function () {
    if (typeof collectViewConfig !== "function" ||
        typeof applyViewConfig !== "function") {
        // Core hasn't booted yet, or sharing.js is missing. The init
        // runs on the push-queue after the core bootstrap finishes;
        // defer.
        setTimeout(initQRExtension, 100);
        return;
    }
    setTimeout(initQRExtension, 0);
})();

let _qrStream = null;

async function showConfigQR() {
    const cfg = collectViewConfig();
    const json = JSON.stringify(cfg);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const url = `${location.origin}/?import-cfg=${b64}`;

    const display = document.getElementById("qr-display");
    const status = document.getElementById("qr-status");
    const video = document.getElementById("qr-video");
    if (!display || !status || !video) return;
    video.style.display = "none";
    display.innerHTML = "";
    status.textContent = "loading QR...";

    const r = await fetch(`/api/qr?data=${encodeURIComponent(url)}`);
    if (r.ok) {
        display.innerHTML = await r.text();
        status.textContent = `${json.length} bytes of config · scan this from your phone`;
    } else {
        status.textContent = "QR generation failed — config may be too large";
    }

    document.getElementById("qr-modal").hidden = false;
    document.getElementById("qr-modal-title").textContent = "Share Config via QR";
}

async function scanConfigQR() {
    const display = document.getElementById("qr-display");
    const status = document.getElementById("qr-status");
    const video = document.getElementById("qr-video");
    if (!display || !status || !video) return;
    display.innerHTML = "";

    if (!("BarcodeDetector" in window)) {
        status.textContent = "BarcodeDetector not supported in this browser. Use Chrome on Android.";
        document.getElementById("qr-modal").hidden = false;
        document.getElementById("qr-modal-title").textContent = "Read QR";
        return;
    }

    try {
        _qrStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    } catch (e) {
        status.textContent = "Camera access denied: " + e.message;
        document.getElementById("qr-modal").hidden = false;
        document.getElementById("qr-modal-title").textContent = "Read QR";
        return;
    }

    video.srcObject = _qrStream;
    video.style.display = "block";
    status.textContent = "Point camera at QR code...";
    document.getElementById("qr-modal").hidden = false;
    document.getElementById("qr-modal-title").textContent = "Read QR";

    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scan = async () => {
        if (!_qrStream || video.style.display === "none") return;
        if (video.readyState < video.HAVE_ENOUGH_DATA) {
            requestAnimationFrame(scan);
            return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        try {
            const codes = await detector.detect(canvas);
            if (codes.length > 0) {
                const raw = codes[0].rawValue;
                const match = raw.match(/[?&]import-cfg=([A-Za-z0-9+/=]+)/);
                if (match) {
                    const json = decodeURIComponent(escape(atob(match[1])));
                    const cfg = JSON.parse(json);
                    applyViewConfig(cfg);
                    stopQRStream();
                    status.textContent = "Config imported successfully!";
                    video.style.display = "none";
                    return;
                }
            }
        } catch (e) { /* scan failed, retry */ }
        requestAnimationFrame(scan);
    };
    requestAnimationFrame(scan);
}

function stopQRStream() {
    if (_qrStream) {
        for (const track of _qrStream.getTracks()) track.stop();
        _qrStream = null;
    }
}

function closeQRModal() {
    stopQRStream();
    const modal = document.getElementById("qr-modal");
    const video = document.getElementById("qr-video");
    if (modal) modal.hidden = true;
    if (video) video.style.display = "none";
}

function initQRExtension() {
    const show = document.getElementById("cfg-qr-show-btn");
    const scan = document.getElementById("cfg-qr-scan-btn");
    const close = document.getElementById("qr-close-btn");
    if (show) show.addEventListener("click", showConfigQR);
    if (scan) scan.addEventListener("click", scanConfigQR);
    if (close) close.addEventListener("click", closeQRModal);
}
