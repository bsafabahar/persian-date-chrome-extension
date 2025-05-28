/**
 * Persian Date Chrome Extension - Content Script
 * تبدیل تاریخ میلادی به شمسی
 * 
 * @author Babak Safabahar
 * @version 1.0.0
 */

console.log('🚀 PERSIAN DATE EXTENSION: Content script loaded!');
console.log('📍 Page URL:', window.location.href);

// Mark that our extension is active
window.persianDateExtension = true;

class PersianDateConverter {
    constructor() {
        this.convertedCount = 0;
        this.processedNodes = new WeakSet();
        this.init();
    }

    init() {
        console.log('🔧 Initializing Persian Date Converter...');
        
        // Wait for DOM and libraries to be ready
        this.waitForReady(() => {
            this.checkLibrary();
            this.startConversion();
        });
    }

    waitForReady(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(callback, 300); // Extra delay for library loading
            });
        } else {
            setTimeout(callback, 300);
        }
    }    checkLibrary() {
        if (typeof PersianDate === 'undefined') {
            console.error('❌ PersianDate library not found!');
            console.log('🔍 Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('persian')));
            return false;
        }
        
        console.log('✅ PersianDate library is available');
        
        // Test the library
        try {
            const [jYear, jMonth, jDay] = PersianDate.toJalali(new Date(2024, 2, 20)); // March 20, 2024
            console.log('✅ Library test successful:', '2024-03-20 →', `${jYear}/${jMonth}/${jDay}`);
            return true;
        } catch (error) {
            console.error('❌ Library test failed:', error);
            return false;
        }
    }

    startConversion() {
        console.log('🔄 Starting date conversion process...');
        
        if (!document.body) {
            console.warn('⚠️ No document body found');
            return;
        }

        this.convertDatesInDocument();
        
        // Set up observer for dynamic content
        this.setupMutationObserver();
    }

    convertDatesInDocument() {
        console.log('📄 Scanning document for dates...');
        
        // Get all text nodes in the document
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip already processed nodes
                    if (this.processedNodes.has(node)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Skip nodes in script/style tags
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

        console.log(`📝 Found ${textNodes.length} text nodes with potential dates`);

        // Process each text node
        textNodes.forEach((textNode, index) => {
            this.processTextNode(textNode, index);
        });

        console.log(`✅ Conversion complete! Converted ${this.convertedCount} dates total.`);
    }

    containsDate(text) {
        if (!text || text.trim().length < 8) return false;
        
        // Look for common date patterns
        const patterns = [
            /\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b/,  // 2024-03-20 or 2024/03/20
            /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{4}\b/   // 20-03-2024 or 20/03/2024
        ];

        return patterns.some(pattern => pattern.test(text));
    }

    processTextNode(textNode, index) {
        try {
            const originalText = textNode.textContent;
            const convertedText = this.convertDatesInText(originalText);

            if (originalText !== convertedText) {
                textNode.textContent = convertedText;
                this.processedNodes.add(textNode);
                console.log(`✅ Node ${index} converted:`, originalText.trim(), '→', convertedText.trim());
            }
        } catch (error) {
            console.error(`❌ Error processing node ${index}:`, error);
        }
    }

    convertDatesInText(text) {
        let convertedText = text;
        
        // Convert YYYY-MM-DD and YYYY/MM/DD formats
        convertedText = convertedText.replace(/\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/g, (match, year, month, day) => {
            return this.convertToPersian(parseInt(year), parseInt(month), parseInt(day), match);
        });

        // Convert DD-MM-YYYY and DD/MM/YYYY formats
        convertedText = convertedText.replace(/\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/g, (match, day, month, year) => {
            const yearNum = parseInt(year);
            // Only convert if it's a reasonable year range
            if (yearNum >= 1900 && yearNum <= 2100) {
                return this.convertToPersian(yearNum, parseInt(month), parseInt(day), match);
            }
            return match;
        });

        return convertedText;
    }    convertToPersian(year, month, day, originalMatch) {
        try {
            console.log(`📅 Converting: ${originalMatch} (${year}/${month}/${day})`);
            
            const gregorianDate = new Date(year, month - 1, day);
            
            // Validate the date
            if (gregorianDate.getFullYear() !== year || 
                gregorianDate.getMonth() !== month - 1 || 
                gregorianDate.getDate() !== day) {
                console.warn(`⚠️ Invalid date: ${originalMatch}`);
                return originalMatch;
            }
            
            // استفاده از متد استاتیک کتابخانه
            const [jYear, jMonth, jDay] = PersianDate.toJalali(gregorianDate);
            const result = `${jYear}/${jMonth.toString().padStart(2, '0')}/${jDay.toString().padStart(2, '0')}`;
            
            this.convertedCount++;
            console.log(`✅ ${originalMatch} → ${result}`);
            
            return result;
        } catch (error) {
            console.error(`❌ Conversion error for ${originalMatch}:`, error);
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
                            // Check if element contains text nodes with dates
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
                console.log('🔄 New content detected, re-scanning...');
                setTimeout(() => this.convertDatesInDocument(), 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('👀 Mutation observer set up for dynamic content');
    }
}

// Initialize the converter
const converter = new PersianDateConverter();
