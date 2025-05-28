/**
 * Persian Date Library - Simplified version for Chrome Extension
 * تبدیل تاریخ میلادی به شمسی
 */

class PersianDate {
  constructor(date) {
    this.date = date || new Date();
    
    // محاسبه تاریخ شمسی در زمان ساخت شیء
    const [jy, jm, jd] = PersianDate.toJalali(this.date);
    this._year = jy;
    this._month = jm;
    this._day = jd;
  }
  
  year() {
    return this._year;
  }
  
  month() {
    return this._month;
  }
  
  date() {
    return this._day;
  }
  
  format(formatStr = 'YYYY/MM/DD') {
    return formatStr
      .replace(/YYYY/g, this._year.toString())
      .replace(/MM/g, this._month.toString().padStart(2, '0'))
      .replace(/DD/g, this._day.toString().padStart(2, '0'))
      .replace(/YY/g, this._year.toString().slice(-2))
      .replace(/M/g, this._month.toString())
      .replace(/D/g, this._day.toString());
  }

  static isLeapYear(year) {
    const breaks = [
      -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
      1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
    ];
    
    const gy = year + 1595;
    let leap = -14;
    let jp = breaks[0];
    
    let jump = 0;
    for (let j = 1; j <= 19; j++) {
      const jm = breaks[j];
      jump = jm - jp;
      if (year < jm) break;
      leap += Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
      jp = jm;
    }
    
    let n = year - jp;
    if (n < jump) {
      leap += Math.floor(n / 33) * 8 + Math.floor((n % 33 + 3) / 4);
      if ((jump % 33) === 4 && (jump - n) === 4) leap++;
    }
    
    return (leap + 4) % 33 < 5;
  }  static gregorianToJalali(gy, gm, gd) {
    // Accurate Gregorian to Jalali conversion algorithm
    // Based on Kazimierz M. Borkowski algorithm
    
    const g_d = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    
    let gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = 365 * gy + parseInt((gy2 + 3) / 4) - parseInt((gy2 + 99) / 100) + parseInt((gy2 + 399) / 400) - 80 + gd + g_d[gm - 1];
    
    let jy = -1029 + 33 * parseInt(days / 12053);
    days %= 12053;
    
    jy += 4 * parseInt(days / 1461);
    days %= 1461;
    
    if (days >= 366) {
      jy += parseInt((days - 1) / 365);
      days = (days - 1) % 365;
    }
      let jm, jd;
    if (days < 186) {
      // First 6 months (each has 31 days)
      jm = 1 + parseInt(days / 31);
      jd = 1 + (days % 31);
      
      // Handle edge case where day calculation results in 0
      if (jd === 1 && days % 31 === 0 && jm > 1) {
        jm = jm - 1;
        jd = 31;
      }
    } else {
      // Last 6 months (months 7-11 have 30 days, month 12 has 29/30)
      const remainingDays = days - 186;
      jm = 7 + parseInt(remainingDays / 30);
      jd = 1 + (remainingDays % 30);
      
      // Handle edge case where day calculation results in 0
      if (jd === 1 && remainingDays % 30 === 0 && jm > 7) {
        jm = jm - 1;
        jd = 30;
      }
    }
    
    // Final validation to prevent invalid dates
    if (jm > 12) {
      jy += parseInt((jm - 1) / 12);
      jm = ((jm - 1) % 12) + 1;
    }
    
    if (jd === 0) {
      if (jm === 1) {
        jy -= 1;
        jm = 12;
        jd = PersianDate.isLeapYear(jy) ? 30 : 29;
      } else {
        jm -= 1;
        if (jm <= 6) {
          jd = 31;
        } else if (jm <= 11) {
          jd = 30;
        } else {
          jd = PersianDate.isLeapYear(jy) ? 30 : 29;
        }
      }
    }
    
    return [jy, jm, jd];
  }

  static toJalali(date) {
    const gDate = new Date(date);
    const gy = gDate.getFullYear();
    const gm = gDate.getMonth() + 1;
    const gd = gDate.getDate();
    
    return this.gregorianToJalali(gy, gm, gd);
  }

  static formatJalali(jy, jm, jd, format) {
    const monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    
    const monthNamesShort = [
      'فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر',
      'مهر', 'آبا', 'آذر', 'دی', 'بهم', 'اسف'
    ];

    // تشخیص فرمت و تبدیل
    if (format.includes('yyyy') || format.includes('YYYY')) {
      return format
        .replace(/yyyy|YYYY/g, jy.toString())
        .replace(/mm|MM/g, jm.toString().padStart(2, '0'))
        .replace(/dd|DD/g, jd.toString().padStart(2, '0'))
        .replace(/yy|YY/g, jy.toString().slice(-2))
        .replace(/m|M/g, jm.toString())
        .replace(/d|D/g, jd.toString());
    }
    
    // فرمت پیش‌فرض فارسی
    return `${jd} ${monthNames[jm - 1]} ${jy}`;
  }

  static convertDateInText(text) {
    // الگوهای تاریخ میلادی
    const patterns = [
      // yyyy-mm-dd
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,
      // dd/mm/yyyy
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
      // mm/dd/yyyy
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g,
      // dd-mm-yyyy
      /\b(\d{1,2})-(\d{1,2})-(\d{4})\b/g,
      // yyyy/mm/dd
      /\b(\d{4})\/(\d{1,2})\/(\d{1,2})\b/g,
      // نام ماه انگلیسی
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
      // اختصار ماه انگلیسی
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})\b/gi
    ];

    const monthMap = {
      'january': 1, 'jan': 1,
      'february': 2, 'feb': 2,
      'march': 3, 'mar': 3,
      'april': 4, 'apr': 4,
      'may': 5,
      'june': 6, 'jun': 6,
      'july': 7, 'jul': 7,
      'august': 8, 'aug': 8,
      'september': 9, 'sep': 9,
      'october': 10, 'oct': 10,
      'november': 11, 'nov': 11,
      'december': 12, 'dec': 12
    };

    let result = text;

    // تبدیل تاریخ‌های عددی
    patterns.slice(0, 5).forEach(pattern => {
      result = result.replace(pattern, (match, p1, p2, p3) => {
        try {
          let year, month, day;
          
          if (pattern.source.includes('(\\d{4})')) {
            // فرمت‌هایی که سال در ابتدا یا انتها است
            if (match.indexOf(p1) === 0) {
              // yyyy-mm-dd یا yyyy/mm/dd
              year = parseInt(p1);
              month = parseInt(p2);
              day = parseInt(p3);
            } else {
              // dd/mm/yyyy یا dd-mm-yyyy
              day = parseInt(p1);
              month = parseInt(p2);
              year = parseInt(p3);
            }
          }
          
          if (year && month && day && year > 1000 && month <= 12 && day <= 31) {
            const [jy, jm, jd] = PersianDate.gregorianToJalali(year, month, day);
            const separator = match.includes('-') ? '-' : '/';
            
            if (match.indexOf(year.toString()) === 0) {
              return `${jy}${separator}${jm.toString().padStart(2, '0')}${separator}${jd.toString().padStart(2, '0')}`;
            } else {
              return `${jd.toString().padStart(2, '0')}${separator}${jm.toString().padStart(2, '0')}${separator}${jy}`;
            }
          }
        } catch (e) {
          console.warn('خطا در تبدیل تاریخ:', e);
        }
        return match;
      });
    });

    // تبدیل تاریخ‌های با نام ماه
    patterns.slice(5).forEach(pattern => {
      result = result.replace(pattern, (match, monthName, day, year) => {
        try {
          const month = monthMap[monthName.toLowerCase()];
          if (month && year && day) {
            const [jy, jm, jd] = PersianDate.gregorianToJalali(parseInt(year), month, parseInt(day));
            return PersianDate.formatJalali(jy, jm, jd);
          }
        } catch (e) {
          console.warn('خطا در تبدیل تاریخ:', e);
        }
        return match;
      });
    });

    return result;
  }
}

// Export برای استفاده در content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PersianDate;
} else if (typeof window !== 'undefined') {
  window.PersianDate = PersianDate;
}
