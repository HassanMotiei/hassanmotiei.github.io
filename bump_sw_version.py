"""Update the PWA cache version based on all files precached by sw.js.
Run: python bump_sw_version.py
"""
import hashlib
import pathlib
import re

here = pathlib.Path(__file__).parent
sw_path = here / "sw.js"
sw = sw_path.read_text(encoding="utf-8")
# Keep the list aligned with PRECACHE in sw.js; missing optional files are skipped.
inputs = [
    "index.html", "manifest.webmanifest",
    "assets/progress.css", "assets/progress.js",
    "assets/english-passport-days.js", "assets/daily-details-fa.js",
    "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
    "icons/apple-touch-icon.png", "icons/favicon-48.png",
]
hash_state = hashlib.sha256()
for relative in inputs:
    path = here / relative
    hash_state.update(relative.encode("utf-8"))
    hash_state.update(b"\0")
    if path.is_file():
        hash_state.update(path.read_bytes())
    else:
        hash_state.update(b"<missing>")
new_version = hash_state.hexdigest()[:12]
new, count = re.subn(r"const VERSION = '[A-Za-z0-9-]+';", f"const VERSION = '{new_version}';", sw)
assert count == 1, "VERSION line not found in sw.js"
sw_path.write_text(new, encoding="utf-8")
print("sw.js VERSION =", new_version)
