
async function checkDomainPermission() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'checkDomain' });
        return response?.isAllowed || false;
    } catch (error) {
        return false;
    }
}

let converterInstance = null;
checkDomainPermission().then(isAllowed => {
    if (isAllowed) {
        window.persianDateExtension = true;
        converterInstance = new PersianDateConverter();
    }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.enabled) {
        const isEnabled = changes.enabled.newValue;
        
        if (!isEnabled && converterInstance) {
            converterInstance.destroy();
            converterInstance = null;
            window.persianDateExtension = false;
        } else if (isEnabled && !converterInstance) {
            checkDomainPermission().then(isAllowed => {
                if (isAllowed) {
                    window.persianDateExtension = true;
                    converterInstance = new PersianDateConverter();
                }
            });
        }
    }
});

class PersianDateConverter {
    constructor() {
        this.convertedCount = 0;
        this.processedNodes = new WeakSet();
        this.observer = null;
        this.isDestroyed = false;
        
        this.monthNames = {
            'jan': 1, 'january': 1,
            'feb': 2, 'february': 2,
            'mar': 3, 'march': 3,
            'apr': 4, 'april': 4,
            'may': 5,
            'jun': 6, 'june': 6,
            'jul': 7, 'july': 7,
            'aug': 8, 'august': 8,
            'sep': 9, 'september': 9,
            'oct': 10, 'october': 10,
            'nov': 11, 'november': 11,
            'dec': 12, 'december': 12
        };
        
        this.init();
    }

    init() {
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
        if (!text || text.trim().length < 6) return false;
        
        const patterns = [
            // فرمت‌های عددی
            /\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b/,
            /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{4}\b/,
            // فرمت‌های با نام ماه انگلیسی
            /\b\d{1,2}[-\/](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)[-\/]\d{2,4}\b/i,
            /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)[-\/]\d{1,2}[-\/]\d{2,4}\b/i
        ];

        return patterns.some(pattern => pattern.test(text));
    }

    expandYear(yearStr) {
        const year = parseInt(yearStr);
        if (yearStr.length === 2) {
            return year <= 30 ? 2000 + year : 1900 + year;
        }
        return year;
    }
    getMonthNumber(monthName) {
        return this.monthNames[monthName.toLowerCase()] || null;
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
        }
    }

    convertDatesInText(text) {
        let convertedText = text;
        
        // فرمت YYYY-MM-DD یا YYYY/MM/DD
        convertedText = convertedText.replace(/\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/g, (match, year, month, day) => {
            const yearNum = parseInt(year);
            if (yearNum >= 1900 && yearNum <= 2100) {
                return this.convertToPersian(yearNum, parseInt(month), parseInt(day), match);
            }
            return match;
        });

        convertedText = convertedText.replace(/\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/g, (match, day, month, year) => {
            const yearNum = parseInt(year);
            if (yearNum >= 1900 && yearNum <= 2100) {
                return this.convertToPersian(yearNum, parseInt(month), parseInt(day), match);
            }
            return match;
        });

        convertedText = convertedText.replace(/\b(\d{1,2})[-\/]([a-zA-Z]{3,9})[-\/](\d{2,4})\b/g, (match, day, monthName, year) => {
            const monthNum = this.getMonthNumber(monthName);
            if (monthNum) {
                const yearNum = this.expandYear(year);
                if (yearNum >= 1900 && yearNum <= 2100) {
                    return this.convertToPersian(yearNum, monthNum, parseInt(day), match);
                }
            }
            return match;
        });

        convertedText = convertedText.replace(/\b([a-zA-Z]{3,9})[-\/](\d{1,2})[-\/](\d{2,4})\b/g, (match, monthName, day, year) => {
            const monthNum = this.getMonthNumber(monthName);
            if (monthNum) {
                const yearNum = this.expandYear(year);
                if (yearNum >= 1900 && yearNum <= 2100) {
                    return this.convertToPersian(yearNum, monthNum, parseInt(day), match);
                }
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
        
        this.processedNodes = null;
    }
}