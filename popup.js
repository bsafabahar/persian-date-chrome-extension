class PopupManager {
  constructor() {
    this.elements = {};
    this.settings = {};
    this.currentPage = 1;
    this.pendingOperations = new Set();
    this.debounceTimers = new Map();
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
      settingsBtn: document.getElementById('settingsBtn'),
      domainStatus: document.getElementById('domainStatus'),
      domainIndicator: document.getElementById('domainIndicator'),
      domainText: document.getElementById('domainText'),
      addCurrentDomainBtn: document.getElementById('addCurrentDomainBtn'),
      backBtn: document.getElementById('backBtn'),
      domainInput: document.getElementById('domainInput'),
      addDomainBtn: document.getElementById('addDomainBtn'),
      allowAllBtn: document.getElementById('allowAllBtn'),
      domainList: document.getElementById('domainList'),
      resetStatsBtn: document.getElementById('resetStatsBtn'),
      resetAllBtn: document.getElementById('resetAllBtn'),
      page1: document.getElementById('page1'),
      page2: document.getElementById('page2')
    };
  }
  setupEventListeners() {
    this.elements.enableToggle.addEventListener('change', (e) => {
      this.toggleExtension(e.target.checked);
    });

    this.elements.refreshBtn.addEventListener('click', () => {
      this.refreshCurrentTab();
    });

    this.elements.settingsBtn.addEventListener('click', () => {
      this.showPage(2);
    });

    this.elements.backBtn.addEventListener('click', () => {
      this.showPage(1);
    });

    this.elements.addCurrentDomainBtn.addEventListener('click', () => {
      this.addCurrentDomain();
    });

    this.elements.addDomainBtn.addEventListener('click', () => {
      this.addDomain();
    });

    this.elements.allowAllBtn.addEventListener('click', () => {
      this.allowAllDomains();
    });

    this.elements.resetStatsBtn.addEventListener('click', () => {
      this.resetStats();
    });

    this.elements.resetAllBtn.addEventListener('click', () => {
      this.resetAll();
    });

    this.elements.domainInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addDomain();
      }
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

      this.updateUI();
    } catch (error) {
      
      this.showError('خطا در بارگذاری تنظیمات');
    }
  }
  updateUI() {
    const isEnabled = this.settings.enabled || false;
    this.elements.enableToggle.checked = isEnabled;
    
    this.elements.statusText.textContent = isEnabled ? 'فعال' : 'غیرفعال';
    this.elements.statusText.className = `status-text ${isEnabled ? 'enabled' : ''}`;

    this.elements.convertedCount.textContent = this.formatNumber(this.settings.convertedCount || 0);

    this.checkCurrentDomainStatus();

    this.updateDomainList();
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
      }      if (isAllowed) {
        this.updateDomainStatus('افزونه برای این دامنه فعال است', '🟢');
      } else {
        this.updateDomainStatus('افزونه برای این دامنه فعال نیست', '🔴');
        this.elements.addCurrentDomainBtn.style.display = 'inline-flex';
      }
    } catch (error) {
      
      this.updateDomainStatus('خطا در بررسی', '⚪');
    }
  }
  updateDomainStatus(text, indicator) {
    this.elements.domainText.textContent = text;
    this.elements.domainIndicator.textContent = indicator;
    
    this.elements.addCurrentDomainBtn.style.display = 'none';
    this.elements.domainIndicator.className = 'domain-indicator';
    if (text.includes('فعال است')) {
      this.elements.domainIndicator.classList.add('allowed');
    } else if (text.includes('فعال نیست')) {
      this.elements.domainIndicator.classList.add('blocked');
    }
  }
  async toggleExtension(enabled) {
    try {
      await this.safeStorageSet({ enabled });
      this.settings.enabled = enabled;
      this.updateUI();
      
      this.showSuccess(enabled ? 'افزونه فعال شد' : 'افزونه غیرفعال شد');
    } catch (error) {
      this.showError('خطا در تغییر وضعیت');
      
      this.elements.enableToggle.checked = !enabled;
    }
  }

  async refreshCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.tabs.reload(tab.id);
        this.showSuccess('صفحه تازه‌سازی شد');
        
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

  showPage(pageNumber) {
    this.elements.page1.classList.remove('active');
    this.elements.page2.classList.remove('active');

    if (pageNumber === 1) {
      this.elements.page1.classList.add('active');
      this.currentPage = 1;
    } else if (pageNumber === 2) {
      this.elements.page2.classList.add('active');
      this.currentPage = 2;
      this.updateDomainList();
    }
  }

  async getCurrentDomain() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const url = new URL(tab.url);
        return url.hostname;
      }
    } catch (error) {
    }
    return null;
  }
  async addCurrentDomain() {
    try {
      const domain = await this.getCurrentDomain();
      if (!domain) {
        this.showError('نتوانستم دامنه فعلی را تشخیص دهم');
        return;
      }

      const allowedDomains = this.settings.allowedDomains || [];
      
      // بررسی اینکه دامنه قبلاً اضافه نشده باشد
      if (allowedDomains.includes(domain)) {
        this.showError('این دامنه قبلاً اضافه شده است');
        return;
      }

      // اضافه کردن دامنه
      allowedDomains.push(domain);
      await this.safeStorageSet({ allowedDomains });
      this.settings.allowedDomains = allowedDomains;

      this.showSuccess(`دامنه ${domain} اضافه شد`);
      this.updateUI();
    } catch (error) {
      this.showError('خطا در افزودن دامنه');
    }
  }
  async addDomain() {
    const domain = this.elements.domainInput.value.trim();
    if (!domain) {
      this.showError('لطفاً دامنه را وارد کنید');
      return;
    }

    try {
      const allowedDomains = this.settings.allowedDomains || [];
      
      if (allowedDomains.includes(domain)) {
        this.showError('این دامنه قبلاً اضافه شده است');
        return;
      }

      allowedDomains.push(domain);
      await this.safeStorageSet({ allowedDomains });
      this.settings.allowedDomains = allowedDomains;

      this.elements.domainInput.value = '';
      this.showSuccess(`دامنه ${domain} اضافه شد`);
      this.updateDomainList();
    } catch (error) {
      this.showError('خطا در افزودن دامنه');
    }
  }
  async allowAllDomains() {
    try {
      await this.safeStorageSet({ allowedDomains: ['*'] });
      this.settings.allowedDomains = ['*'];
      this.showSuccess('همه دامنه‌ها مجاز شدند');
      this.updateDomainList();
      this.updateUI();
    } catch (error) {
      this.showError('خطا در تنظیم دامنه‌ها');
    }
  }
  async removeDomain(domain) {
    const operationKey = `remove_${domain}`;
    if (this.pendingOperations.has(operationKey)) {
      return;
    }

    try {
      this.pendingOperations.add(operationKey);
      
      const allowedDomains = this.settings.allowedDomains || [];
      const updatedDomains = allowedDomains.filter(d => d !== domain);
      
      await this.safeStorageSet({ allowedDomains: updatedDomains });
      this.settings.allowedDomains = updatedDomains;
      
      this.showSuccess(`دامنه ${domain} حذف شد`);
      this.updateDomainList();
      this.updateUI();
    } catch (error) {
      
      if (error.message && error.message.includes('QUOTA_BYTES_PER_ITEM')) {
        this.showError('حجم داده زیاد است. لطفاً تعداد دامنه‌ها را کاهش دهید');
      } else if (error.message && error.message.includes('MAX_WRITE_OPERATIONS')) {
        this.showError('تعداد عملیات زیاد است. لطفاً کمی صبر کنید');
      } else {
        this.showError('خطا در حذف دامنه');
      }
    } finally {
      this.pendingOperations.delete(operationKey);
    }
  }  updateDomainList() {
    const domainList = this.elements.domainList;
    const allowedDomains = this.settings.allowedDomains || [];

    if (allowedDomains.length === 0) {
      domainList.innerHTML = '<div class="domain-item">هیچ دامنه‌ای تنظیم نشده</div>';
      return;
    }

    domainList.innerHTML = allowedDomains.map(domain => `
      <div class="domain-item">
        <span class="domain-name">${domain}</span>
        <button class="domain-remove" data-domain="${domain}" title="حذف دامنه">
          ✕
        </button>
      </div>
    `).join('');

    domainList.removeEventListener('click', this.domainListClickHandler);
    this.domainListClickHandler = (e) => {
      if (e.target.classList.contains('domain-remove')) {
        const domain = e.target.getAttribute('data-domain');
        this.debouncedRemoveDomain(domain);
      }
    };
    domainList.addEventListener('click', this.domainListClickHandler);
  }
  async resetStats() {
    if (confirm('آیا از پاک کردن آمار اطمینان دارید؟')) {
      try {
        await this.safeStorageSet({ convertedCount: 0 });
        this.settings.convertedCount = 0;
        this.showSuccess('آمار پاک شد');
        this.updateUI();
      } catch (error) {
        this.showError('خطا در پاک کردن آمار');
      }
    }
  }

  async resetAll() {
    if (confirm('آیا از بازنشانی همه تنظیمات اطمینان دارید؟ این عمل قابل بازگشت نیست.')) {
      try {
        await chrome.storage.sync.clear();
        this.settings = {};
        this.showSuccess('همه تنظیمات بازنشانی شد');
        this.loadSettings();
                } catch (error) {
        this.showError('خطا در بازنشانی تنظیمات');
      }
    }
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

  async safeStorageSet(data) {
    try {
      await chrome.storage.sync.set(data);
    } catch (error) {
      if (error.message && error.message.includes('MAX_WRITE_OPERATIONS')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await chrome.storage.sync.set(data);
      } else {
        throw error;
      }
    }
  }

  debouncedRemoveDomain(domain) {
    const key = `removeDomain_${domain}`;
    
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      this.removeDomain(domain);
      this.debounceTimers.delete(key);
    }, 300);
    
    this.debounceTimers.set(key, timer);
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
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
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

  cleanup() {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.pendingOperations.clear();
    
    if (this.domainListClickHandler && this.elements.domainList) {
      this.elements.domainList.removeEventListener('click', this.domainListClickHandler);
    }
  }
}

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

let popupManager;
document.addEventListener('DOMContentLoaded', () => {
  popupManager = new PopupManager();
});

window.addEventListener('beforeunload', () => {
  if (popupManager) {
    popupManager.cleanup();
  }
});
