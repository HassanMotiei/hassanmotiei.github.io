# English Passport — نسخهٔ نصب‌پذیر (PWA)

فایل‌ها (همه باید کنار هم در ریشهٔ مخزن باشند):
`index.html` · `manifest.webmanifest` · `sw.js` · پوشهٔ `icons/`

## انتشار روی GitHub Pages
1. در github.com مخزن جدید بسازید (مثلاً `english-passport`).
2. فایل‌ها و پوشهٔ `icons` را با Add file ← Upload files آپلود کنید.
3. Settings ← Pages ← Source: «Deploy from a branch» ← شاخهٔ main و پوشهٔ `/ (root)`.
4. بعد از ۱ تا ۲ دقیقه آدرس `https://USERNAME.github.io/english-passport/` فعال می‌شود.
نکته: مخزن عمومی یعنی محتوای درس‌ها برای همه قابل دیدن است.

## انتقال پیشرفت (قبل از هر کاری)
حافظهٔ برنامه برای هر آدرس جداست. در نسخهٔ فعلی بکاپ JSON کامل بگیرید، سپس در آدرس جدید ایمپورت کنید.

## نصب
اندروید: Chrome ← منو ← Install app. آیفون: فقط Safari ← Share ← Add to Home Screen.

## به‌روزرسانی
بعد از هر تغییر در `index.html`: `python bump_sw_version.py`، سپس `index.html` و `sw.js` را با هم آپلود کنید.
