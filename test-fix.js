// Test script to verify the Persian date conversion fix
// Run this with: node test-fix.js

const fs = require('fs');
const path = require('path');

// Read the Persian date library
const libPath = path.join(__dirname, 'lib', 'persian-date.js');
const libContent = fs.readFileSync(libPath, 'utf8');

// Create a simple environment for the library
global.window = global;

// Extract the PersianDate class (simplified for testing)
try {
    eval(libContent);
} catch (error) {
    console.error('Error loading Persian date library:', error.message);
    process.exit(1);
}

console.log('🧪 Testing Persian Date Conversion Fix');
console.log('=====================================');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function testDate(inputDate, description) {
    totalTests++;
    
    try {
        const date = new Date(inputDate);
        if (isNaN(date.getTime())) {
            console.log(`⚠️  ${description}: Invalid input date "${inputDate}"`);
            return;
        }
        
        const [jYear, jMonth, jDay] = PersianDate.toJalali(date);
        const result = `${jYear}/${jMonth.toString().padStart(2, '0')}/${jDay.toString().padStart(2, '0')}`;
        
        // Validate the result
        let isValid = true;
        let issues = [];
        
        if (jYear < 1 || jMonth < 1 || jMonth > 12 || jDay < 1) {
            isValid = false;
            issues.push('Basic range violation');
        }
        
        if (jMonth <= 6 && jDay > 31) {
            isValid = false;
            issues.push(`Month ${jMonth} cannot have ${jDay} days (max 31)`);
        } else if (jMonth > 6 && jMonth <= 11 && jDay > 30) {
            isValid = false;
            issues.push(`Month ${jMonth} cannot have ${jDay} days (max 30)`);
        } else if (jMonth === 12) {
            const maxDays = PersianDate.isLeapYear(jYear) ? 30 : 29;
            if (jDay > maxDays) {
                isValid = false;
                issues.push(`Month 12 in year ${jYear} cannot have ${jDay} days (max ${maxDays})`);
            }
        }
        
        // Check for the specific bug we're fixing
        if (result === '1404/02/31') {
            isValid = false;
            issues.push('🚨 THE ORIGINAL BUG: 1404/02/31');
        }
        
        const status = isValid ? '✅' : '❌';
        
        if (isValid) {
            passedTests++;
        } else {
            failedTests++;
        }
        
        const issueText = issues.length > 0 ? ` - Issues: ${issues.join(', ')}` : '';
        console.log(`${status} ${description}: "${inputDate}" → ${result}${issueText}`);
        
    } catch (error) {
        failedTests++;
        console.log(`❌ ${description}: ERROR - ${error.message}`);
    }
}

// Test critical dates around where the bug was happening
console.log('\n🎯 Critical Test Cases (Where Bug Was Occurring)');
console.log('------------------------------------------------');

const criticalDates = [
    '2025-05-20', '2025-05-21', '2025-05-22', '2025-05-23', 
    '2025-05-24', '2025-05-25', '2025-05-26', '2025-05-27',
    '2025-05-28', '2025-05-29', '2025-05-30', '2025-05-31'
];

criticalDates.forEach((date, index) => {
    testDate(date, `Critical ${index + 1}`);
});

// Test user's original problematic dates
console.log('\n📋 User Reported Problem Dates');
console.log('------------------------------');

testDate('2025-04-21', 'Similar to "21/Apr/25" format');

// Test month boundaries
console.log('\n🏔️  Persian Month Boundaries');
console.log('---------------------------');

testDate('2025-04-20', 'End of Persian Month 1');
testDate('2025-04-21', 'Start of Persian Month 2');
testDate('2025-05-21', 'End of Persian Month 2');
testDate('2025-05-22', 'Start of Persian Month 3');

// Summary
console.log('\n📊 Test Summary');
console.log('===============');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The bug appears to be fixed!');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. The bug may still exist.');
    process.exit(1);
}
