# تغییرات داشبورد پیگیری ۱۸۰ روزه

- افزودن ورودی داشبورد به صفحهٔ اصلی English Passport.
- افزودن چک‌لیست ۱۸۰ روز با بازشدن ترتیبی روزها.
- افزودن شاخص‌های روزانه Listening، Speaking، Naturalness و IELTS در بازهٔ ۰ تا ۱۰۰.
- افزودن خلاصهٔ پیشرفت کل، ۶ مرحله با بازه‌های اصلی برنامه (۶۰، ۳۰، ۳۰، ۳۰، ۲۰ و ۱۰ روز)، نمودار روند و نمودار میانگین شاخص‌ها.
- افزودن خروجی و بازیابی پشتیبان مخصوص داشبورد.
- افزودن دارایی‌های ماژول به فهرست precache سرویس‌ورکر برای استفادهٔ آفلاین.
- حفظ `index.html` و داده‌های اصلی برنامه به‌جز افزودن ورودی و اتصال فایل‌های ماژول؛ `backup.json` بدون تغییر باقی مانده است.

## محدودیت شناخته‌شده

عنوان‌ها و تاریخ‌های برنامهٔ اصلی از دیتابیس Tasks در Notion وارد `assets/english-passport-days.js` شده‌اند. جزئیات کامل هر صفحه همچنان در Notion باقی می‌ماند؛ این داشبورد برنامه را بازنویسی یا جایگزین نمی‌کند.

- نسخهٔ جدید: جایگزینی شش بازهٔ قبلی با شش مرحلهٔ دقیق ۳۰روزه مطابق چک‌لیست ارسالی کاربر.
- افزودن جدول ارزیابی روزهای ۱، ۳۰، ۶۰، ۹۰، ۱۲۰، ۱۵۰ و ۱۸۰، چهار معیار ارزیابی و یادداشت محدودیت تیک‌زدن روزها.
- افزودن دستور قابل‌کپی برای جلسهٔ ۵۰ دقیقه‌ای مربی هوش مصنوعی.
- به‌روزرسانی نسخهٔ Service Worker برای دریافت تغییرات جدید در PWA.

## نسخهٔ تکمیل رابط کاربری — 2026-10-10

- اصلاح شش مرحله به بازه‌های دقیق ۱–۳۰، ۳۱–۶۰، ۶۱–۹۰، ۹۱–۱۲۰، ۱۲۱–۱۵۰ و ۱۵۱–۱۸۰ در runtime واقعی برنامه.
- اضافه‌شدن جستجوی روز، باز/بستن همهٔ مراحل، نمایش روزهای باقی‌مانده، پرش مستقیم به ارزیابی‌ها و کپی عنوان روز برای پیدا کردن صفحهٔ متناظر در Notion.
- اضافه‌شدن جدول ارزیابی‌های هفت‌گانه، چهار معیار Listening/Speaking/Naturalness/IELTS، پرامپت مربی ۵۰دقیقه‌ای و یادآوری بکاپ/نگهداری جداگانهٔ نتایج.
- توضیحات کامل هر روز عمداً از Notion بازنویسی نشده‌اند؛ عنوان/تاریخ‌ها آفلاین‌اند و شرح کامل همچنان در صفحهٔ مرجع Notion است.


## v10
- Re-themed the whole 180-day module with the app tokens (light + dark); fixed unreadable dark mode, clipped header, overflowing assessment table, overlapping chart labels and the always-visible empty toast.
- New state fields (backward compatible): `tasks`, `notes`, `doneAt`, `startDate`. Old saves load unchanged.
- New tools: checkable tasks, daily notes, today/ahead/behind chips and streak, start-date control, catch-up to day N, Leitner mini-add, ideal-pace line on the trend chart, dashboard-card progress.
- Included in the complete workspace backup as `epPlan180`.
- Persian (Solar Hijri) date formatting.
