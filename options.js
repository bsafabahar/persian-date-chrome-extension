class OptionsManager {
  constructor() {
    this.elements = {};
    this.settings = {};
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.loadSettings();
  }

  setupElements() {
    this.elements = {
      notification: document.getElementById('notification'),
      enableBtn: document.getElementById('enableBtn'),
      disableBtn: document.getElementById('disableBtn'),
      domainInput: document.getElementById('domainInput'),
      addDomainBtn: document.getElementById('addDomainBtn'),
      allowAllBtn: document.getElementById('allowAllBtn'),
      domainList: document.getElementById('domainList'),
      totalConverted: document.getElementById('totalConverted'),
      totalDomains: document.getElementById('totalDomains'),
      resetStatsBtn: document.getElementById('resetStatsBtn'),
      resetAllBtn: document.getElementById('resetAllBtn')
    };
  }

  setupEventListeners() {
    this.elements.enableBtn.addEventListener('click', () => {
      this.setExtensionStatus(true);
    });

    this.elements.disableBtn.addEventListener('click', () => {
      this.setExtensionStatus(false);
    });

    this.elements.addDomainBtn.addEventListener('click', () => {
      this.addDomain();
    });

    this.elements.allowAllBtn.addEventListener('click', () => {
      this.allowAllDomains();
    });

    this.elements.domainInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addDomain();
      }
    });

    this.elements.resetStatsBtn.addEventListener('click', () => {
      this.resetStats();
    });

    this.elements.resetAllBtn.addEventListener('click', () => {
      this.resetAll();
    });
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

      if (this.settings.enabled === undefined) {
        this.settings.enabled = true;
      }
      if (!this.settings.allowedDomains) {
        this.settings.allowedDomains = ['*'];
      }
      if (!this.settings.convertedCount) {
        this.settings.convertedCount = 0;
      }

      this.updateUI();
    } catch (error) {
      
      this.showNotification('خطا در بارگذاری تنظیمات', 'error');
    }
  }

  updateUI() {
    if (this.settings.enabled) {
      this.elements.enableBtn.classList.add('btn-primary');
      this.elements.enableBtn.classList.remove('btn-secondary');
      this.elements.disableBtn.classList.add('btn-secondary');
      this.elements.disableBtn.classList.remove('btn-primary');
    } else {
      this.elements.enableBtn.classList.add('btn-secondary');
      this.elements.enableBtn.classList.remove('btn-primary');
      this.elements.disableBtn.classList.add('btn-primary');
      this.elements.disableBtn.classList.remove('btn-secondary');
    }

    this.updateDomainList();

    this.elements.totalConverted.textContent = this.formatNumber(this.settings.convertedCount);
    this.elements.totalDomains.textContent = this.settings.allowedDomains.length;
  }
  updateDomainList() {
    const container = this.elements.domainList;
    container.innerHTML = '';

    if (this.settings.allowedDomains.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">هیچ دامنه‌ای اضافه نشده است</div>';
      return;
    }

    this.settings.allowedDomains.forEach((domain, index) => {
      const domainItem = document.createElement('div');
      domainItem.className = 'domain-item';

      const domainName = document.createElement('span');
      domainName.className = 'domain-name';
      domainName.textContent = domain;

      const removeButton = document.createElement('button');
      removeButton.className = 'domain-remove';
      removeButton.title = 'حذف دامنه';
      removeButton.textContent = '❌';
      removeButton.addEventListener('click', () => {
        this.removeDomain(index);
      });

      domainItem.appendChild(domainName);
      domainItem.appendChild(removeButton);
      container.appendChild(domainItem);
    });
  }

  async setExtensionStatus(enabled) {
    try {
      await chrome.storage.sync.set({ enabled });
      this.settings.enabled = enabled;
      this.updateUI();
      
      this.showNotification(
        enabled ? 'افزونه فعال شد' : 'افزونه غیرفعال شد',
        'success'
      );
    } catch (error) {
      
      this.showNotification('خطا در تغییر وضعیت', 'error');
    }
  }

  async addDomain() {
    const domainInput = this.elements.domainInput;
    const domain = domainInput.value.trim();

    if (!domain) {
      this.showNotification('لطفاً دامنه را وارد کنید', 'error');
      return;
    }

    if (!this.isValidDomain(domain)) {
      this.showNotification('فرمت دامنه معتبر نیست', 'error');
      return;
    }

    if (this.settings.allowedDomains.includes(domain)) {
      this.showNotification('این دامنه قبلاً اضافه شده است', 'error');
      return;
    }

    try {
      let newDomains = [...this.settings.allowedDomains];
      if (domain !== '*' && newDomains.includes('*')) {
        newDomains = newDomains.filter(d => d !== '*');
      }

      newDomains.push(domain);

      await chrome.storage.sync.set({ allowedDomains: newDomains });
      this.settings.allowedDomains = newDomains;
      
      domainInput.value = '';
      this.updateUI();
      this.showNotification('دامنه با موفقیت اضافه شد', 'success');
    } catch (error) {
      
      this.showNotification('خطا در افزودن دامنه', 'error');
    }
  }

  async removeDomain(index) {
    if (!confirm('آیا از حذف این دامنه مطمئن هستید؟')) {
      return;
    }

    try {
      const newDomains = [...this.settings.allowedDomains];
      newDomains.splice(index, 1);

      if (newDomains.length === 0) {
        newDomains.push('*');
      }

      await chrome.storage.sync.set({ allowedDomains: newDomains });
      this.settings.allowedDomains = newDomains;
      
      this.updateUI();
      this.showNotification('دامنه با موفقیت حذف شد', 'success');
    } catch (error) {
      
      this.showNotification('خطا در حذف دامنه', 'error');
    }
  }

  async allowAllDomains() {
    try {
      await chrome.storage.sync.set({ allowedDomains: ['*'] });
      this.settings.allowedDomains = ['*'];
      
      this.updateUI();
      this.showNotification('اجازه دسترسی به همه دامنه‌ها داده شد', 'success');
    } catch (error) {
      
      this.showNotification('خطا در تنظیم دامنه‌ها', 'error');
    }
  }

  async resetStats() {
    if (!confirm('آیا از پاک کردن آمار مطمئن هستید؟')) {
      return;
    }

    try {
      await chrome.storage.sync.set({ convertedCount: 0 });
      this.settings.convertedCount = 0;
      
      this.updateUI();
      this.showNotification('آمار با موفقیت پاک شد', 'success');
    } catch (error) {
      
      this.showNotification('خطا در پاک کردن آمار', 'error');
    }
  }

  async resetAll() {
    if (!confirm('آیا از بازنشانی همه تنظیمات مطمئن هستید؟ این عمل قابل بازگشت نیست.')) {
      return;
    }

    try {
      const defaultSettings = {
        enabled: true,
        allowedDomains: ['*'],
        convertedCount: 0
      };

      await chrome.storage.sync.set(defaultSettings);
      this.settings = defaultSettings;
      
      this.updateUI();
      this.showNotification('همه تنظیمات بازنشانی شد', 'success');
    } catch (error) {
      
      this.showNotification('خطا در بازنشانی تنظیمات', 'error');
    }
  }

  isValidDomain(domain) {
    if (domain === '*') {
      return true;
    }

    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(domain)) {
      return domain.split('.').every(part => {
        const num = parseInt(part);
        return num >= 0 && num <= 255;
      });
    }

    const domainPattern = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainPattern.test(domain);
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
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('fa-IR');
  }

  showNotification(message, type) {
    const notification = this.elements.notification;
    notification.textContent = message;
    notification.className = `notification notification-${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
      notification.style.display = 'none';
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
