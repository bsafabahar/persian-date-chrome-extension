
const DEFAULT_SETTINGS = {
  enabled: true,
  allowedDomains: ['*'],
  convertedCount: 0
};

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkDomain') {
    checkDomainPermission(sender.tab.url).then(isAllowed => {
      sendResponse({ isAllowed });
    });
    return true;
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
async function checkDomainPermission(url) {
  try {
    const settings = await chrome.storage.sync.get(['enabled', 'allowedDomains']);
    
    if (!settings.enabled) {
      return false;
    }
    
    const allowedDomains = settings.allowedDomains || ['*'];
    
    if (allowedDomains.includes('*')) {
      return true;
    }
    
    const urlObj = new URL(url);
    const currentDomain = urlObj.hostname;
    
    const isAllowed = allowedDomains.some(domain => {
      if (domain.startsWith('*.')) {
        const baseDomain = domain.substring(2);
        return currentDomain.endsWith(baseDomain);
      }
      return currentDomain === domain || currentDomain.includes(domain);
    });
    
    return isAllowed;
  } catch (error) {
    return false;
  }
}

async function incrementConvertedCount() {
  try {
    const result = await chrome.storage.sync.get(['convertedCount']);
    const newCount = (result.convertedCount || 0) + 1;
    await chrome.storage.sync.set({ convertedCount: newCount });
  } catch (error) {
  }
}
async function getSettings() {
  try {
    return await chrome.storage.sync.get(DEFAULT_SETTINGS);
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

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
    });
  } catch (error) {
  }
}
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.enabled) {
    updateIcon();
  }
});

updateIcon();
