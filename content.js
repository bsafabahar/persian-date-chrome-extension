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
    }    containsDate(text) {
        if (!text || text.trim().length < 6) return false;
        
        // Look for comprehensive date patterns
        const patterns = [
            /\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b/,  // 2024-03-20 or 2024/03/20
            /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{4}\b/,  // 20-03-2024 or 20/03/2024
            /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2}\b/,  // 20/03/24 or 20-03-24
            // Month abbreviations with year
            /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\/\s]\d{1,2}[-\/\s]\d{2,4}\b/i,
            /\b\d{1,2}[-\/\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\/\s]\d{2,4}\b/i,
            // Full month names
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i,
            /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i,
            // Time patterns that often accompany dates
            /\b\d{1,2}:\d{2}\s*(AM|PM|am|pm)\b/,
            // Relative time expressions
            /\b(today|yesterday|tomorrow)\b/i,
            /\b\d+\s+(day|days|week|weeks|month|months|year|years)\s+ago\b/i,
            /\b(a|an)\s+(day|week|month|year)\s+ago\b/i
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
    }    convertDatesInText(text) {
        let convertedText = text;
        
        // Month name mapping
        const monthMap = {
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
        
        // Convert DD/MM/YY format (2-digit year)
        convertedText = convertedText.replace(/\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})\b/g, (match, day, month, year) => {
            const yearNum = parseInt(year);
            // Convert 2-digit year to 4-digit (assume 20xx for years 00-30, 19xx for 31-99)
            const fullYear = yearNum <= 30 ? 2000 + yearNum : 1900 + yearNum;
            if (parseInt(month) <= 12 && parseInt(day) <= 31) {
                return this.convertToPersian(fullYear, parseInt(month), parseInt(day), match);
            }
            return match;
        });
        
        // Convert formats with month abbreviations: DD/MMM/YY or DD-MMM-YY
        convertedText = convertedText.replace(/\b(\d{1,2})[-\/\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\/\s](\d{2,4})\b/gi, (match, day, monthName, year) => {
            const month = monthMap[monthName.toLowerCase()];
            if (month) {
                let yearNum = parseInt(year);
                // Handle 2-digit years
                if (yearNum < 100) {
                    yearNum = yearNum <= 30 ? 2000 + yearNum : 1900 + yearNum;
                }
                return this.convertToPersian(yearNum, month, parseInt(day), match);
            }
            return match;
        });
        
        // Convert formats: MMM/DD/YY or MMM-DD-YY
        convertedText = convertedText.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-\/\s](\d{1,2})[-\/\s](\d{2,4})\b/gi, (match, monthName, day, year) => {
            const month = monthMap[monthName.toLowerCase()];
            if (month) {
                let yearNum = parseInt(year);
                // Handle 2-digit years
                if (yearNum < 100) {
                    yearNum = yearNum <= 30 ? 2000 + yearNum : 1900 + yearNum;
                }
                return this.convertToPersian(yearNum, month, parseInt(day), match);
            }
            return match;
        });

        // Convert full month names: Month DD, YYYY
        convertedText = convertedText.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi, (match, monthName, day, year) => {
            const month = monthMap[monthName.toLowerCase()];
            if (month) {
                return this.convertToPersian(parseInt(year), month, parseInt(day), match);
            }
            return match;
        });        // Convert DD Month YYYY format
        convertedText = convertedText.replace(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi, (match, day, monthName, year) => {
            const month = monthMap[monthName.toLowerCase()];
            if (month) {
                return this.convertToPersian(parseInt(year), month, parseInt(day), match);
            }
            return match;
        });

        // Convert relative date expressions
        const today = new Date();
        
        // Handle "X days ago", "X weeks ago", etc.
        convertedText = convertedText.replace(/\b(\d+)\s+(day|days|week|weeks|month|months|year|years)\s+ago\b/gi, (match, number, unit) => {
            try {
                const targetDate = new Date(today);
                const num = parseInt(number);
                
                switch (unit.toLowerCase()) {
                    case 'day':
                    case 'days':
                        targetDate.setDate(targetDate.getDate() - num);
                        break;
                    case 'week':
                    case 'weeks':
                        targetDate.setDate(targetDate.getDate() - (num * 7));
                        break;
                    case 'month':
                    case 'months':
                        targetDate.setMonth(targetDate.getMonth() - num);
                        break;
                    case 'year':
                    case 'years':
                        targetDate.setFullYear(targetDate.getFullYear() - num);
                        break;
                }
                
                const [jYear, jMonth, jDay] = PersianDate.toJalali(targetDate);
                return `${jYear}/${jMonth.toString().padStart(2, '0')}/${jDay.toString().padStart(2, '0')}`;
            } catch (error) {
                console.warn('Error converting relative date:', match, error);
                return match;
            }
        });
        
        // Handle "a/an X ago"
        convertedText = convertedText.replace(/\b(a|an)\s+(day|week|month|year)\s+ago\b/gi, (match, article, unit) => {
            try {
                const targetDate = new Date(today);
                
                switch (unit.toLowerCase()) {
                    case 'day':
                        targetDate.setDate(targetDate.getDate() - 1);
                        break;
                    case 'week':
                        targetDate.setDate(targetDate.getDate() - 7);
                        break;
                    case 'month':
                        targetDate.setMonth(targetDate.getMonth() - 1);
                        break;
                    case 'year':
                        targetDate.setFullYear(targetDate.getFullYear() - 1);
                        break;
                }
                
                const [jYear, jMonth, jDay] = PersianDate.toJalali(targetDate);
                return `${jYear}/${jMonth.toString().padStart(2, '0')}/${jDay.toString().padStart(2, '0')}`;
            } catch (error) {
                console.warn('Error converting relative date:', match, error);
                return match;
            }
        });
        
        // Handle simple keywords
        convertedText = convertedText.replace(/\byesterday\b/gi, (match) => {
            try {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const [jYear, jMonth, jDay] = PersianDate.toJalali(yesterday);
                return `${jYear}/${jMonth.toString().padStart(2, '0')}/${jDay.toString().padStart(2, '0')}`;
            } catch (error) {
                return match;
            }
        });
        
        convertedText = convertedText.replace(/\btoday\b/gi, (match) => {
            try {
                const [jYear, jMonth, jDay] = PersianDate.toJalali(today);
                return `${jYear}/${jMonth.toString().padStart(2, '0')}/${jDay.toString().padStart(2, '0')}`;
            } catch (error) {
                return match;
            }
        });
        
        convertedText = convertedText.replace(/\btomorrow\b/gi, (match) => {
            try {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const [jYear, jMonth, jDay] = PersianDate.toJalali(tomorrow);
                return `${jYear}/${jMonth.toString().padStart(2, '0')}/${jDay.toString().padStart(2, '0')}`;
            } catch (error) {
                return match;
            }
        });

        return convertedText;
    }convertToPersian(year, month, day, originalMatch) {
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
