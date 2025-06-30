/**
 * Persian Date Chrome Extension - Content Script (Clean Version)
 * تبدیل تاریخ میلادی به شمسی
 * 
 * @author Babak Safabahar
 * @version 1.1.0
 */

// بررسی اولیه دامنه و وضعیت افزونه
async function checkExtensionEnabled() {
    try {
        const settings = await chrome.storage.sync.get(['enabled']);
        return settings.enabled || false;
    } catch (error) {
        return false;
    }
}

// متغیر برای نگهداری instance converter
let converterInstance = null;

// شروع اکستنشن فقط در صورت فعال بودن
checkExtensionEnabled().then(isEnabled => {
    if (isEnabled) {
        window.persianDateExtension = true;
        converterInstance = new PersianDateConverter();
    }
});

// گوش دادن به تغییرات storage برای enable/disable
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.enabled) {
        const isEnabled = changes.enabled.newValue;
        
        if (!isEnabled && converterInstance) {
            // متوقف کردن converter
            converterInstance.destroy();
            converterInstance = null;
            window.persianDateExtension = false;
        } else if (isEnabled && !converterInstance) {
            // شروع دوباره converter
            window.persianDateExtension = true;
            converterInstance = new PersianDateConverter();
        }
    }
});

class PersianDateConverter {
    constructor() {
        this.convertedCount = 0;
        this.processedNodes = new WeakSet();
        this.observer = null;
        this.isDestroyed = false;
        this.init();
    }

    init() {
        // Wait for DOM and libraries to be ready
        this.waitForReady(() => {
            if (this.checkLibrary()) {
                this.startConversion();
            }
        });
    }

    waitForReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(callback, 300);
            });
        } else {
            setTimeout(callback, 300);
        }
    }

    checkLibrary() {
        if (typeof PersianDate === 'undefined') {
            return false;
        }
        
        try {
            const [jYear, jMonth, jDay] = PersianDate.toJalali(new Date(2024, 2, 20));
            return true;
        } catch (error) {
            return false;
        }
    }

    startConversion() {
        if (this.isDestroyed || !document.body) {
            return;
        }

        this.convertDatesInDocument();
        this.setupMutationObserver();
    }

    convertDatesInDocument() {
        if (this.isDestroyed || !document.body) return;
        
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (this.isDestroyed || this.processedNodes.has(node)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    const parent = node.parentElement;
                    if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (this.isDestroyed) break;
            if (this.containsDate(node.textContent)) {
                textNodes.push(node);
            }
        }

        textNodes.forEach((textNode) => {
            if (this.isDestroyed) return;
            this.processTextNode(textNode);
        });
    }

    containsDate(text) {
        if (!text || text.trim().length < 8) return false;
        
        const patterns = [
            /\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b/,
            /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{4}\b/
        ];

        return patterns.some(pattern => pattern.test(text));
    }

    processTextNode(textNode) {
        if (this.isDestroyed) return;
        
        try {
            const originalText = textNode.textContent;
            const convertedText = this.convertDatesInText(originalText);

            if (originalText !== convertedText && !this.isDestroyed) {
                textNode.textContent = convertedText;
                this.processedNodes.add(textNode);
            }
        } catch (error) {
            // Silently handle errors
        }
    }

    convertDatesInText(text) {
        let convertedText = text;
        
        convertedText = convertedText.replace(/\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/g, (match, year, month, day) => {
            return this.convertToPersian(parseInt(year), parseInt(month), parseInt(day), match);
        });

        convertedText = convertedText.replace(/\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/g, (match, day, month, year) => {
            const yearNum = parseInt(year);
            if (yearNum >= 1900 && yearNum <= 2100) {
                return this.convertToPersian(yearNum, parseInt(month), parseInt(day), match);
            }
            return match;
        });

        return convertedText;
    }

    convertToPersian(year, month, day, originalMatch) {
        try {
            const gregorianDate = new Date(year, month - 1, day);
            
            if (gregorianDate.getFullYear() !== year || 
                gregorianDate.getMonth() !== month - 1 || 
                gregorianDate.getDate() !== day) {
                return originalMatch;
            }
            
            const [jYear, jMonth, jDay] = PersianDate.toJalali(gregorianDate);
            const result = `${jYear}/${jMonth.toString().padStart(2, '0')}/${jDay.toString().padStart(2, '0')}`;
            
            this.convertedCount++;
            return result;
        } catch (error) {
            return originalMatch;
        }
    }

    setupMutationObserver() {
        if (this.isDestroyed) return;
        
        this.observer = new MutationObserver((mutations) => {
            if (this.isDestroyed) return;
            
            let hasNewText = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.TEXT_NODE && this.containsDate(node.textContent)) {
                            hasNewText = true;
                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                            const walker = document.createTreeWalker(
                                node,
                                NodeFilter.SHOW_TEXT
                            );
                            let textNode;
                            while (textNode = walker.nextNode()) {
                                if (this.containsDate(textNode.textContent)) {
                                    hasNewText = true;
                                    break;
                                }
                            }
                        }
                    });
                }
            });
            
            if (hasNewText && !this.isDestroyed) {
                setTimeout(() => {
                    if (!this.isDestroyed) {
                        this.convertDatesInDocument();
                    }
                }, 100);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    destroy() {
        this.isDestroyed = true;
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // پاک کردن WeakSet (اختیاری، چون garbage collected می‌شود)
        this.processedNodes = null;
    }
}
