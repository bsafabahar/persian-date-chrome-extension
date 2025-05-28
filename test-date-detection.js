// Test script for Persian Date Extension
// Run this in the browser console to test date detection

function testDateDetection() {
    console.log('🧪 Testing Persian Date Extension patterns...');
    
    // Test cases from user's issue
    const testCases = [
        '21/Apr/25 9:50 AM',
        '2 days ago 1:46 PM',
        '21/Apr/25 9:50 AM',
        'Created: 21/Apr/25 9:50 AM',
        'Updated: 2 days ago 1:46 PM',
        'Resolved: 21/Apr/25 9:50 AM',
        'Start date (WBSGantt): None',
        'Target end: None',
        
        // Additional test cases
        '15/Jan/24',
        '22-Feb-2024',
        'Mar/10/24',
        '05 Apr 2024',
        'May 15, 2024',
        '30 Jun 24',
        'July 08, 2024',
        '12/Aug/24',
        'Sep-20-2024',
        '25 Oct 24',
        'Nov/30/2024',
        '25 Dec 2024',
        
        // Relative dates
        'yesterday',
        'today',
        'tomorrow',
        '1 day ago',
        '3 days ago',
        '2 weeks ago',
        'a month ago',
        'a year ago',
        
        // Standard formats
        '2024-03-20',
        '20/03/2024',
        '03/20/2024'
    ];
    
    console.log('📋 Test Results:');
    console.log('================');
    
    testCases.forEach((testCase, index) => {
        // Simulate the containsDate method logic
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
        
        const detected = patterns.some(pattern => pattern.test(testCase));
        const status = detected ? '✅' : '❌';
        
        console.log(`${status} ${index + 1}. "${testCase}"`);
        
        if (detected) {
            // Show which pattern(s) matched
            const matchingPatterns = patterns.filter(pattern => pattern.test(testCase));
            console.log(`    Matched by ${matchingPatterns.length} pattern(s)`);
        }
    });
    
    console.log('================');
    console.log('🔍 Extension Status:');
    console.log('- Persian Date Extension:', !!window.persianDateExtension);
    console.log('- PersianDate Library:', typeof PersianDate !== 'undefined');
}

// Auto-run if extension is loaded
setTimeout(() => {
    if (typeof testDateDetection === 'function') {
        testDateDetection();
    }
}, 1000);
