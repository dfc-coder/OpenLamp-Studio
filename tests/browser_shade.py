#!/usr/bin/env python3
"""Interactive test of the seven basic shade silhouettes (Chromium, no WebGL)."""
from pathlib import Path
import json
import os
import struct
import subprocess

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 8787


def main():
    server = subprocess.Popen(
        ["python3", "-m", "http.server", str(PORT), "--bind", "127.0.0.1", "--directory", str(ROOT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=True, executable_path=os.environ.get("CHROME_PATH") or None,
                args=["--disable-webgl", "--no-sandbox", "--disable-dev-shm-usage"],
            )
            try:
                page = browser.new_page(accept_downloads=True, viewport={"width": 1600, "height": 900})
                page.route("https://cdn.plot.ly/**", lambda route: route.abort())
                page.goto(f"http://127.0.0.1:{PORT}/", wait_until="domcontentloaded", timeout=90000)
                page.wait_for_selector(".ol-step-nav.active", timeout=30000)
                assert page.locator(".ol-step-nav").count() == 5
                assert page.locator("#presets .preset:not(:disabled)").count() == 7
                assert page.locator("#presets .preset:disabled").count() == 0
                assert page.locator("#presets .preset .glyph svg path").count() == 7
                assert "Torus" not in page.locator("#presets").inner_text()
                assert "Free Curve" not in page.locator("#presets").inner_text()
                patterns = page.locator("#presets .preset .glyph svg path")
                assert len(set(patterns.evaluate_all("(nodes) => nodes.map(n => n.getAttribute('d'))"))) == 7
                page.wait_for_function("() => window.OpenLampBridge?.getStatus().shadeValid === true", timeout=90000)
                baseline = page.evaluate("() => window.OpenLampBridge.getShadeInterface().mount.innerRadiusMm")
                assert abs(baseline - 35.044) < 0.002
                assert page.evaluate("() => window.OpenLampBridge.getShadeInterface().mount.socketType") == "hidden-internal"
                folder = ROOT / "artifacts" / "shade"
                folder.mkdir(parents=True, exist_ok=True)
                page.locator("#presets").screenshot(path=str(folder / "shape-gallery.png"))
                for shape in ["cylinder", "cone", "dome", "bell", "sphere", "pear", "disc"]:
                    page.locator(f"#presets .preset[data-id='basic_{shape}']").click()
                    page.wait_for_function("(name) => window.OpenLampBridge.getProject().params.id === 'basic_'+name", arg=shape)
                    page.wait_for_function("() => window.OpenLampBridge.getStatus().shadeValid === true", timeout=90000)
                    assert page.evaluate("() => window.OpenLampBridge.getShadeInterface().mount.innerRadiusMm") == baseline
                    page.locator("#presets").screenshot(path=str(folder / f"{shape}-selector.png"))
                page.locator("#presets .preset[data-id='basic_cone']").click()
                page.wait_for_selector("#basic-topDiameter")
                page.locator("#basic-topDiameter").fill("108")
                page.locator("#basic-topDiameter").dispatch_event("input")
                page.wait_for_function("() => window.OpenLampBridge.getProject().params.basicOptions.topDiameter === 108")
                page.locator("button[data-step='surface']").click()
                page.locator("#ol-surface-recipe").select_option("soft")
                page.wait_for_function("() => window.OpenLampBridge.getProject().params.surfaceIntensity === .91")
                page.locator("button[data-step='shade']").click()
                page.locator("#reset-design").click()
                assert page.evaluate("() => window.OpenLampBridge.getProject().params.surfaceIntensity") == .91
                page.wait_for_function("() => window.OpenLampBridge.getStatus().shadeValid === true", timeout=90000)
                page.locator("button[data-step='make']").click()
                page.wait_for_selector("#ol-checklist")
                assert "Conjunto no habilitado" in page.locator("#ol-checklist").inner_text()
                with page.expect_download() as d:
                    page.locator("#download-shade").click()
                data = Path(d.value.path()).read_bytes()
                assert len(data) > 84
                count = struct.unpack_from("<I", data, 80)[0]
                assert count > 10000 and len(data) == 84 + count * 50
                with page.expect_download() as d:
                    page.locator("#save-json").click()
                project = json.loads(Path(d.value.path()).read_text())
                assert project["version"] == 9
                assert project["params"]["id"].startswith("basic_")
                # Switching to Wibble must change SHADE geometry, not add green solid.
                page.locator("button[data-step='base']").click()
                page.locator(".base-preset[data-base='wibble']").click()
                page.wait_for_function(
                    "() => window.OpenLampBridge.getStatus().integratedMount && window.OpenLampBridge.getStatus().shadeValid",
                    timeout=90000,
                )
                details = page.evaluate("() => window.OpenLampBridge.getShadeInterface().mount")
                assert details["baseId"] == "wibble"
                assert details["kind"] == "integrated-saddle"
                assert details["adapterRequired"] is False
                assert details["socketType"] == "wibble-integrated-saddle"
                assert page.locator("#download-adapter").count() == 0
                assert page.locator("#presets .preset[data-id='basic_cylinder']").is_enabled()
                assert page.locator("#presets .preset[data-id='basic_sphere']").is_disabled()
                assert page.locator("#presets .preset[data-id='basic_disc']").is_disabled()
                assert "Diámetro mínimo" in page.locator("#mount-warning").inner_text()
                page.locator("button[data-step='make']").click()
                assert "Wibble" in page.locator("#ol-checklist").inner_text()
                with page.expect_download() as dl:
                    page.locator("#download-shade").click()
                wibble_shade = Path(dl.value.path()).read_bytes()
                wibble_triangles = struct.unpack_from("<I", wibble_shade, 80)[0]
                assert len(wibble_shade) == 84 + 50*wibble_triangles
                page.locator("button[data-step='base']").click()
                page.locator(".base-preset[data-base='flat']").click()
                page.wait_for_function(
                    "() => window.OpenLampBridge.getStatus().baseId === 'flat' && !window.OpenLampBridge.getStatus().integratedMount",
                    timeout=90000,
                )
                assert page.evaluate("() => window.OpenLampBridge.getShadeInterface().mount.kind") == "direct"
                page.locator("button[data-step='make']").click()
                with page.expect_download() as dl:
                    page.locator("#download-shade").click()
                taller_shade = Path(dl.value.path()).read_bytes()
                assert len(taller_shade) > 84
                assert wibble_shade != taller_shade, "Changing base must change the integrated Shade STL"
                print("PASS browser: seven silhouettes, two-solid Wibble and Taller, base-dependent Shade STL and JSON v9")
            finally:
                browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()


if __name__ == "__main__":
    main()
