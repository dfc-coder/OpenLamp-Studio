"""Browser regression: stand preset loads compressed mesh and downloads valid STL.
WebGL test intentionally excluded; HTML fallback is tested with no Plotly.
"""
import json,re
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text();html=re.sub(r'<script defer src="[^"]+"></script>','',html)
html=html.replace('<link rel="stylesheet" href="styles.css" />','').replace('<head>','<head><base href="https://openlamp.local/"/>')
css=(ROOT/'styles.css').read_text();js=(ROOT/'app.js').read_text();gz=(ROOT/'assets/stands/wibble-stand.olmesh.gz').read_bytes()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 context=browser.new_context(accept_downloads=True)
 context.route('https://openlamp.local/assets/stands/wibble-stand.olmesh.gz',lambda route: route.fulfill(status=200,body=gz,headers={'Content-Type':'application/gzip','Access-Control-Allow-Origin':'*'}))
 page=context.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
 page.goto('about:blank');page.set_content(html);page.add_style_tag(content=css);page.add_script_tag(content=js)
 page.evaluate('window.dispatchEvent(new Event("load"))')
 page.locator('#download-shade:not([disabled])').wait_for(timeout=60000)
 page.locator('.base-preset[data-base="wibble"]').click()
 page.wait_for_function('document.querySelector("#status").textContent.includes("Wibble") || document.querySelector("#status").textContent.includes("no verificado")', timeout=60000)
 page.locator('#download-base:not([disabled])').wait_for(timeout=60000)
 state=page.locator('#status').inner_text()
 assert 'Montaje NO verificado' in state or 'Acople no verificado' in state,state
 assert not page.locator('#mount-warning').is_hidden()
 assert page.locator('.base-preset[data-base="wibble"]').get_attribute('aria-pressed')=='true'
 with page.expect_download(timeout=30000) as d:page.locator('#download-base').click()
 target=ROOT/'tests'/'wibble-stand-from-browser.stl';d.value.save_as(target)
 data=target.read_bytes();n=int.from_bytes(data[80:84],'little');assert n==19220 and len(data)==84+50*n
 with page.expect_download(timeout=30000) as d:page.locator('#save-json').click()
 obj=ROOT/'tests'/'wibble-project.json';d.value.save_as(obj)
 parsed=json.loads(obj.read_text());assert parsed['baseId']=='wibble'
 page.locator('.base-preset[data-base="flat"]').click()
 page.locator('#download-base:not([disabled])').wait_for(timeout=60000)
 page.locator('#json-file').set_input_files(str(obj))
 page.locator('.base-preset[data-base="wibble"][aria-pressed="true"]').wait_for(timeout=30000)
 assert not errors,errors
 page.screenshot(path=str(ROOT/'tests'/'stand-browser.png'),full_page=True)
 print('PASS browser: two base presets, Wibble async loading, valid STL download, JSON roundtrip, no JS errors')
 browser.close()
