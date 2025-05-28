# 🚀 راهنمای نصب سریع

## نصب از Chrome Web Store (توصیه شده)
1. به [Chrome Web Store](https://chrome.google.com/webstore) بروید
2. "تبدیل تاریخ میلادی به شمسی" را جستجو کنید
3. روی "Add to Chrome" کلیک کنید
4. روی "Add extension" کلیک کنید

## نصب دستی (Developer Mode)

### مرحله 1: دانلود فایل‌ها
```bash
# با Git
git clone https://github.com/babaksafabahar/persian-date-chrome-extension.git

# یا دانلود ZIP
# فایل ZIP را دانلود کرده و extract کنید
```

### مرحله 2: فعال‌سازی Developer Mode
1. کروم را باز کنید
2. آدرس `chrome://extensions/` را وارد کنید
3. سوییچ "Developer mode" را در گوشه بالا راست فعال کنید

### مرحله 3: بارگذاری افزونه
1. روی دکمه "Load unpacked" کلیک کنید
2. پوشه `persian-date-chrome-extension` را انتخاب کنید
3. روی "Select Folder" کلیک کنید

### مرحله 4: تأیید نصب
- ✅ آیکون افزونه در نوار ابزار ظاهر شود
- ✅ روی آیکون کلیک کنید و popup باز شود
- ✅ یک وب‌سایت با تاریخ میلادی باز کنید و تبدیل را مشاهده کنید

## راه‌حل مشکلات رایج

### افزونه نصب نمی‌شود
- ✅ مطمئن شوید Developer mode فعال است
- ✅ پوشه صحیح (حاوی manifest.json) را انتخاب کرده‌اید
- ✅ کروم را restart کنید

### تاریخ‌ها تبدیل نمی‌شوند
- ✅ افزونه فعال است؟ (popup را چک کنید)
- ✅ دامنه جاری در لیست مجاز است؟ (تنظیمات را چک کنید)
- ✅ صفحه را reload کنید

### Manifest خطا می‌دهد
- ✅ از Chrome نسخه 88+ استفاده کنید
- ✅ فایل manifest.json معتبر است

## 🎯 تست سریع
بعد از نصب، این سایت‌ها را امتحان کنید:
- Google Search (تاریخ نتایج)
- Gmail (تاریخ ایمیل‌ها) 
- Wikipedia (تاریخ مقالات)
- GitHub (تاریخ commit ها)

## پشتیبانی
اگر مشکلی دارید:
1. فایل README.md را مطالعه کنید
2. در بخش Issues گزارش دهید
3. **توسعه‌دهنده**: Babak Safabahar
4. **ایمیل**: babak.safabahar@example.com
