#!/usr/bin/env python3
"""Browser smoke for Shade: test actual user interaction, not a simulated DOM."""
from __future__ import annotations

import http.server
import os
from pathlib import Path
import socketserver
import subprocess
import time

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 8787


def main() -> None:
    server = subprocess.Popen(
        ["python3", "-m", "http.server", str(PORT), "--bind", "127.0.0.1", "--directory", str(ROOT)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=True,
                args=["--disable-webgl", "--no-sandbox", "--disable-dev-shm-usage"],
                executable_path=os.environ.get("CHROME_PATH") or None,
            )
            try:
                page = browser.new_page(accept_downloads=True)
                # UI smoke tests do not require rendering the 684k-face model in WebGL.
                page.route("https://cdn.plot.ly/**", lambda route: route.abort())
                page.goto(f"http://127.0.0.1:{PORT}/", wait_until="domcontentloaded", timeout=90000)
                page.wait_for_selector(".ol-step-nav.active", timeout=30000)
                assert page.locator(".ol-step-nav").count() == 5
                page.wait_for_selector("#ol-family-select")
                page.locator("#ol-family-select").select_option("soft")
                page.wait_for_function(
                    "() => window.OpenLampBridge?.getProject().params.shadeDesign.family === 'soft'"
                )
                assert page.locator("#ol-profile-svg circle[data-handle]").count() == 5
                page.wait_for_function(
                    "() => window.OpenLampBridge.getStatus().shadeValid === true",
                    timeout=90000,
                )
                mount_before = page.evaluate(
                    "() => window.OpenLampBridge.getShadeInterface().mount.innerRadiusMm"
                )
                page.locator("button[data-step='surface']").click()
                page.locator("#ol-surface-recipe").select_option("soft")
                page.wait_for_function(
                    "() => window.OpenLampBridge.getProject().params.surfaceIntensity === 0.91"
                )
                page.locator("button[data-step='shade']").click()
                page.locator("#reset-design").click()
                page.wait_for_function(
                    "() => window.OpenLampBridge.getProject().params.shadeDesign.family === 'original'"
                )
                assert page.evaluate(
                    "() => window.OpenLampBridge.getProject().params.surfaceIntensity"
                ) == 0.91, "Shade reset modified Surface"
                assert (
                    page.evaluate(
                        "() => window.OpenLampBridge.getShadeInterface().mount.innerRadiusMm"
                    )
                    == mount_before
                )
                page.locator("button[data-step='make']").click()
                page.wait_for_selector("#ol-checklist")
                assert page.locator("#ol-checklist").inner_text()
                # Deterministic family-sheet previews (2D SVG; no claim of WebGL verification).
                page.locator("button[data-step='shade']").click()
                screenshots = ROOT / "artifacts" / "shade"
                screenshots.mkdir(parents=True, exist_ok=True)
                for family in ["original", "vertical", "soft", "flared"]:
                    page.locator("#ol-family-select").select_option(family)
                    page.wait_for_function(
                        "(family) => window.OpenLampBridge.getProject().params.shadeDesign.family === family",
                        arg=family,
                    )
                    page.locator(".ol-profile-editor").screenshot(
                        path=str(screenshots / f"{family}-profile.png")
                    )
                print("PASS Browser Shade: 5 steps, family selection, surface isolation, reset, mount contract and Make.")
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
