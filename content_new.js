/**
 * Persian Date Chrome Extension - Content Script
 * تبدیل تاریخ میلادی به شمسی
 * 
 * @author Babak Safabahar
 * @version 1.0.0
 */

console.log('🚀 Persian Date Extension: Content script loaded');

// Test PersianDate library availability
setTimeout(() => {
  console.log('🧪 Testing PersianDate library:', typeof PersianDate);
  if (typeof PersianDate !== 'undefined') {
    console.log('✅ PersianDate library loaded successfully');
    
    // Simple test conversion
    try {
      const testDate = new PersianDate(new Date(2024, 2, 20)); // March 20, 2024
      console.log('🧪 Test conversion:', testDate.format('YYYY/MM/DD'));
    } catch (error) {
      console.error('❌ Test conversion failed:', error);
    }
  } else {
    console.error('❌ PersianDate library not found!');
  }
}, 100);

class SimpleDateConverter {
  constructor() {
    this.processedNodes = new WeakSet();
    this.convertedCount = 0;
    this.init();
  }

  init() {
    console.log('🔧 Initializing Simple Date Converter...');
    
    // Wait a bit for PersianDate to load
    setTimeout(() => {
      if (typeof PersianDate !== 'undefined') {
        this.startConversion();
      } else {
        console.error('❌ Cannot start - PersianDate library not available');
      }
    }, 200);
  }

  startConversion() {
    console.log('🚀 Starting date conversion...');
    this.convertDatesInDocument();
  }

  convertDatesInDocument() {
    console.log('📄 Converting dates in document...');
    
    if (!document.body) {
      console.log('⚠️ Document body not ready');
      return;
    }

    // Find all text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (this.containsDate(node.textContent) && !this.processedNodes.has(node)) {
        textNodes.push(node);
      }
    }

    console.log(`📝 Found ${textNodes.length} text nodes with dates`);

    // Convert dates
    textNodes.forEach(textNode => {
      this.convertDatesInTextNode(textNode);
    });
  }

  containsDate(text) {
    if (!text || text.trim().length < 8) return false;
    
    // Simple date patterns
    const patterns = [
      /\b\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\b/,  // 2024-03-20
      /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{4}\b/   // 20/03/2024
    ];

    return patterns.some(pattern => pattern.test(text));
  }

  convertDatesInTextNode(textNode) {
    try {
      const originalText = textNode.textContent;
      console.log('🔄 Processing:', originalText.substring(0, 50));
      
      const convertedText = this.convertDatesInText(originalText);

      if (originalText !== convertedText) {
        textNode.textContent = convertedText;
        this.processedNodes.add(textNode);
        this.convertedCount++;
        
        console.log('✅ Converted:', originalText, '→', convertedText);
      }
    } catch (error) {
      console.error('❌ Error converting:', error);
    }
  }

  convertDatesInText(text) {
    // Convert YYYY-MM-DD format
    text = text.replace(/\b(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\b/g, (match, year, month, day) => {
      console.log(`📅 Converting: ${match}`);
      return this.gregorianToPersian(parseInt(year), parseInt(month), parseInt(day));
    });

    // Convert DD/MM/YYYY format
    text = text.replace(/\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/g, (match, day, month, year) => {
      if (parseInt(year) >= 1900 && parseInt(year) <= 2100) {
        console.log(`📅 Converting: ${match}`);
        return this.gregorianToPersian(parseInt(year), parseInt(month), parseInt(day));
      }
      return match;
    });

    return text;
  }

  gregorianToPersian(year, month, day) {
    try {
      console.log(`🔢 Converting: ${year}/${month}/${day}`);
      
      const gregorianDate = new Date(year, month - 1, day);
      const persianDate = new PersianDate(gregorianDate);
      
      const pYear = persianDate.year();
      const pMonth = persianDate.month();
      const pDay = persianDate.date();

      const result = `${pYear}/${pMonth}/${pDay}`;
      console.log(`🔢 Result: ${result}`);
      
      return result;
    } catch (error) {
      console.error('❌ Conversion error:', error);
      return `${year}-${month}-${day}`;
    }
  }
}

// Initialize when DOM is ready
function initConverter() {
  console.log('🎯 DOM ready, initializing converter...');
  new SimpleDateConverter();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initConverter);
} else {
  initConverter();
}