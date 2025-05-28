/**
 * Persian Date Chrome Extension - Popup Script
 * تبدیل تاریخ میلادی به شمسی
 * 
 * @author Babak Safabahar
 * @version 1.0.0
 */

/**
 * Popup Script - اسکریپت رابط کاربری popup
 */

class PopupManager {
  constructor() {
    this.elements = {};
    this.settings = {};
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.loadSettings();
    this.updateCurrentDomain();
  }

  setupElements() {
    this.elements = {
      enableToggle: document.getElementById('enableToggle'),
      statusText: document.getElementById('statusText'),
      convertedCount: document.getElementById('convertedCount'),
      currentDomain: document.getElementById('currentDomain'),
      refreshBtn: document.getElementById('refreshBtn'),
      optionsBtn: document.getElementById('optionsBtn'),
      domainStatus: document.getElementById('domainStatus'),
      domainIndicator: document.getElementById('domainIndicator'),
      domainText: document.getElementById('domainText')
    };
  }

  setupEventListeners() {
    // تغییر وضعیت افزونه
    this.elements.enableToggle.addEventListener('change', (e) => {
      this.toggleExtension(e.target.checked);
    });

    // دکمه تازه‌سازی
    this.elements.refreshBtn.addEventListener('click', () => {
      this.refreshCurrentTab();
    });

    // دکمه تنظیمات
    this.elements.optionsBtn.addEventListener('click', () => {
      this.openOptionsPage();
    });

    // گوش دادن به تغییرات storage
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync') {
        this.handleStorageChange(changes);
      }
    });
  }

  async loadSettings() {
    try {
      this.settings = await chrome.storage.sync.get([
        'enabled',
        'allowedDomains',
        'convertedCount'
      ]);

      this.updateUI();
    } catch (error) {
      
      this.showError('خطا در بارگذاری تنظیمات');
    }
  }

  updateUI() {
    // وضعیت افزونه
    const isEnabled = this.settings.enabled || false;
    this.elements.enableToggle.checked = isEnabled;
    
    this.elements.statusText.textContent = isEnabled ? 'فعال' : 'غیرفعال';
    this.elements.statusText.className = `status-text ${isEnabled ? 'enabled' : ''}`;

    // شمارنده تبدیل‌ها
    this.elements.convertedCount.textContent = this.formatNumber(this.settings.convertedCount || 0);

    // وضعیت دامنه فعلی
    this.checkCurrentDomainStatus();
  }

  async updateCurrentDomain() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const url = new URL(tab.url);
        const domain = url.hostname;
        this.elements.currentDomain.textContent = domain || 'نامشخص';
      }
    } catch (error) {
      
      this.elements.currentDomain.textContent = 'خطا';
    }
  }

  async checkCurrentDomainStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        this.updateDomainStatus('نامشخص', '⚪');
        return;
      }

      const url = new URL(tab.url);
      const domain = url.hostname;
      const allowedDomains = this.settings.allowedDomains || ['*'];

      let isAllowed = false;
      if (allowedDomains.includes('*')) {
        isAllowed = true;
      } else {
        isAllowed = allowedDomains.some(allowedDomain => {
          if (allowedDomain.startsWith('*.')) {
            const baseDomain = allowedDomain.substring(2);
            return domain.endsWith(baseDomain);
          }
          return domain === allowedDomain || domain.includes(allowedDomain);
        });
      }

      if (isAllowed) {
        this.updateDomainStatus('دامنه مجاز', '🟢');
      } else {
        this.updateDomainStatus('دامنه غیرمجاز', '🔴');
      }
    } catch (error) {
      
      this.updateDomainStatus('خطا در بررسی', '⚪');
    }
  }

  updateDomainStatus(text, indicator) {
    this.elements.domainText.textContent = text;
    this.elements.domainIndicator.textContent = indicator;
    
    // اضافه کردن کلاس مناسب
    this.elements.domainIndicator.className = 'domain-indicator';
    if (text.includes('مجاز')) {
      this.elements.domainIndicator.classList.add('allowed');
    } else if (text.includes('غیرمجاز')) {
      this.elements.domainIndicator.classList.add('blocked');
    }
  }

  async toggleExtension(enabled) {
    try {
      await chrome.storage.sync.set({ enabled });
      this.settings.enabled = enabled;
      this.updateUI();
      
      // نمایش پیام موفقیت
      this.showSuccess(enabled ? 'افزونه فعال شد' : 'افزونه غیرفعال شد');
    } catch (error) {
      
      this.showError('خطا در تغییر وضعیت');
      
      // برگرداندن وضعیت قبلی
      this.elements.enableToggle.checked = !enabled;
    }
  }

  async refreshCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.reload(tab.id);
        this.showSuccess('صفحه تازه‌سازی شد');
        
        // بستن popup بعد از 1 ثانیه
        setTimeout(() => {
          window.close();
        }, 1000);
      }
    } catch (error) {
      
      this.showError('خطا در تازه‌سازی صفحه');
    }
  }

  openOptionsPage() {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  handleStorageChange(changes) {
    let shouldUpdate = false;

    Object.keys(changes).forEach(key => {
      if (this.settings.hasOwnProperty(key)) {
        this.settings[key] = changes[key].newValue;
        shouldUpdate = true;
      }
    });

    if (shouldUpdate) {
      this.updateUI();
    }
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return Math.floor(num / 1000000) + 'M';
    } else if (num >= 1000) {
      return Math.floor(num / 1000) + 'K';
    }
    return num.toString();
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type) {
    // ایجاد نوتیفیکیشن ساده
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // استایل نوتیفیکیشن
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      left: 10px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      text-align: center;
      z-index: 1000;
      animation: slideDown 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // حذف نوتیفیکیشن بعد از 3 ثانیه
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  }
}

// اضافه کردن انیمیشن‌های نوتیفیکیشن
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// شروع popup
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
