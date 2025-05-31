/**
 * Persian Date Chrome Extension - Content Script
 * تبدیل تاریخ میلادی به شمسی
 * 
 * @author Babak Safabahar
 * @version 1.0.0
 */

// بررسی اولیه دامنه - اگر پشتیبانی نشده، کاری انجام نده
async function checkDomainPermission() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'checkDomain' });
        return response?.isAllowed || false;
    } catch (error) {
        return false;
    }
}

// شروع اکستنشن فقط در صورت مجاز بودن دامنه
checkDomainPermission().then(isAllowed => {
    if (isAllowed) {
        // Mark that our extension is active
        window.persianDateExtension = true;
        new PersianDateConverter();
    }
    // اگر دامنه مجاز نیست، هیچ کاری انجام نمی‌دهیم
});

class PersianDateConverter {
    constructor() {
        this.convertedCount = 0;
        this.processedNodes = new WeakSet();
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
        if (!document.body) {
            return;
        }

        this.convertDatesInDocument();
        this.setupMutationObserver();
    }

    convertDatesInDocument() {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (this.processedNodes.has(node)) {
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
            if (this.containsDate(node.textContent)) {
                textNodes.push(node);
            }
        }

        textNodes.forEach((textNode) => {
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
        try {
            const originalText = textNode.textContent;
            const convertedText = this.convertDatesInText(originalText);

            if (originalText !== convertedText) {
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
        const observer = new MutationObserver((mutations) => {
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
            
            if (hasNewText) {
                setTimeout(() => this.convertDatesInDocument(), 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Initialize the converter
const converter = new PersianDateConverter();