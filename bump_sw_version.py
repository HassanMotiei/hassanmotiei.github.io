"""بعد از هر تغییر در index.html این فایل را اجرا کنید:  python bump_sw_version.py
نسخهٔ cache داخل sw.js را از روی محتوای index.html به‌روز می‌کند تا گوشی نسخهٔ جدید را بگیرد."""
import hashlib, re, pathlib
here = pathlib.Path(__file__).parent
ver = hashlib.sha256((here / "index.html").read_bytes()).hexdigest()[:10]
sw = (here / "sw.js").read_text(encoding="utf-8")
new, n = re.subn(r"const VERSION = '[0-9a-f]+';", f"const VERSION = '{ver}';", sw)
assert n == 1, "VERSION line not found in sw.js"
(here / "sw.js").write_text(new, encoding="utf-8")
print("sw.js VERSION =", ver)
