/**
 * Persian Date Chrome Extension - Background Script
 * تبدیل تاریخ میلادی به شمسی
 * 
 * @author Babak Safabahar
 * @version 1.0.0
 */

/**
 * Background Script - Service Worker برای افزونه تبدیل تاریخ
 */

// تنظیمات پیش‌فرض
const DEFAULT_SETTINGS = {
  enabled: true,
  allowedDomains: ['*'], // * به معنای همه دامنه‌ها
  convertedCount: 0
};

// نصب افزونه
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // تنظیم مقادیر پیش‌فرض
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
  }
});

// دریافت پیام از content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkDomain') {
    checkDomainPermission(sender.tab.url).then(isAllowed => {
      sendResponse({ isAllowed });
    });
    return true; // برای async response
  }
  
  if (request.action === 'incrementCounter') {
    incrementConvertedCount();
  }
  
  if (request.action === 'getSettings') {
    getSettings().then(settings => {
      sendResponse(settings);
    });
    return true;
  }
});

// بررسی مجوز دامنه
async function checkDomainPermission(url) {
  try {
    const settings = await chrome.storage.sync.get(['enabled', 'allowedDomains']);
    
    console.log('Background: Checking domain permission for:', url);
    console.log('Background: Extension enabled:', settings.enabled);
    console.log('Background: Allowed domains:', settings.allowedDomains);
    
    if (!settings.enabled) {
      console.log('Background: Extension is disabled');
      return false;
    }
    
    const allowedDomains = settings.allowedDomains || ['*'];
    
    // اگر * در لیست باشد، همه دامنه‌ها مجاز هستند
    if (allowedDomains.includes('*')) {
      console.log('Background: All domains allowed (*)');
      return true;
    }
    
    const urlObj = new URL(url);
    const currentDomain = urlObj.hostname;
    console.log('Background: Current domain:', currentDomain);
    
    // بررسی دامنه‌های مجاز
    const isAllowed = allowedDomains.some(domain => {
      if (domain.startsWith('*.')) {
        // پشتیبانی از wildcard subdomains
        const baseDomain = domain.substring(2);
        const matches = currentDomain.endsWith(baseDomain);
        console.log(`Background: Checking wildcard ${domain} against ${currentDomain}:`, matches);
        return matches;
      }
      const matches = currentDomain === domain || currentDomain.includes(domain);
      console.log(`Background: Checking exact ${domain} against ${currentDomain}:`, matches);
      return matches;
    });
    
    console.log('Background: Domain permission result:', isAllowed);
    return isAllowed;
  } catch (error) {
    console.error('Background: Error checking domain permission:', error);
    return false;
  }
}

// افزایش شمارنده تبدیل‌ها
async function incrementConvertedCount() {
  try {
    const result = await chrome.storage.sync.get(['convertedCount']);
    const newCount = (result.convertedCount || 0) + 1;
    await chrome.storage.sync.set({ convertedCount: newCount });  } catch (error) {
    // خطا در به‌روزرسانی شمارنده
  }
}

// دریافت تنظیمات
async function getSettings() {
  try {
    return await chrome.storage.sync.get(DEFAULT_SETTINGS);  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

// به‌روزرسانی آیکون براساس وضعیت
async function updateIcon() {
  try {
    const settings = await chrome.storage.sync.get(['enabled']);
    const iconPath = settings.enabled ? 'icons/icon16.png' : 'icons/icon16-disabled.png';
    
    await chrome.action.setIcon({
      path: {
        '16': iconPath,
        '48': iconPath.replace('16', '48'),
        '128': iconPath.replace('16', '128')
      }
    });  } catch (error) {
    // خطا در به‌روزرسانی آیکون
  }
}

// نظارت بر تغییرات تنظیمات
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.enabled) {
    updateIcon();
  }
});

// بررسی و به‌روزرسانی آیکون در شروع
updateIcon();
