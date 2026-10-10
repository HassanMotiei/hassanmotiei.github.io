"""Update the PWA cache version from all English Passport progress assets.
Run: python bump_sw_version.py
The service worker is versioned whenever the HTML shell, dashboard CSS/JS, or
180-day plan data changes, so installed PWA clients fetch the new assets.
"""
import hashlib
import pathlib
import re

here = pathlib.Path(__file__).parent
inputs = [
    "index.html",
    "assets/progress.css",
    "assets/progress.js",
    "assets/english-passport-days.js",
]
hash_state = hashlib.sha256()
for relative in inputs:
    path = here / relative
    hash_state.update(relative.encode("utf-8"))
    hash_state.update(b"\0")
    hash_state.update(path.read_bytes())
version = hash_state.hexdigest()[:10]
service_worker = here / "sw.js"
sw = service_worker.read_text(encoding="utf-8")
new, count = re.subn(r"const VERSION = '[A-Za-z0-9-]+';", f"const VERSION = '{version}';", sw)
assert count == 1, "VERSION line not found in sw.js"
service_worker.write_text(new, encoding="utf-8")
print("sw.js VERSION =", version)
