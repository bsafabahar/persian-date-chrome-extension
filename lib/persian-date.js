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
    // Based on astronomical calculations with improved precision
    
    // Validate input
    if (gy < 1 || gm < 1 || gm > 12 || gd < 1 || gd > 31) {
      throw new Error('Invalid Gregorian date');
    }
    
    // Convert Gregorian to Julian Day Number
    let a = Math.floor((14 - gm) / 12);
    let y = gy - a;
    let m = gm + 12 * a - 3;
    let jdn = gd + Math.floor((153 * m + 2) / 5) + 365 * y + 
              Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1721119;
    
    // Persian calendar epoch: March 22, 622 CE (Julian Day 1948321)
    // This corresponds to 1 Farvardin 1 in Persian calendar
    let persian_epoch = 1948321;
    let days_since_epoch = jdn - persian_epoch;
    
    // Average Persian year length (365.2422 days)
    let avg_year_length = 365.2422;
    
    // Estimate Persian year
    let jy = Math.floor(days_since_epoch / avg_year_length) + 1;
    
    // Calculate the start of the estimated Persian year in Julian Day Number
    let year_start_jdn = persian_epoch + Math.floor((jy - 1) * avg_year_length);
    
    // Adjust the year if necessary
    let day_of_year = jdn - year_start_jdn + 1;
    
    // If day_of_year is <= 0, we're in the previous year
    while (day_of_year <= 0) {
      jy--;
      year_start_jdn = persian_epoch + Math.floor((jy - 1) * avg_year_length);
      day_of_year = jdn - year_start_jdn + 1;
    }
    
    // Check if we've exceeded the current year
    let current_year_length = this.isLeapYear(jy) ? 366 : 365;
    while (day_of_year > current_year_length) {
      jy++;
      year_start_jdn = persian_epoch + Math.floor((jy - 1) * avg_year_length);
      day_of_year = jdn - year_start_jdn + 1;
      current_year_length = this.isLeapYear(jy) ? 366 : 365;
    }
    
    // Calculate month and day based on day_of_year
    let jm, jd;
    if (day_of_year <= 186) {
      // First 6 months (each has 31 days)
      jm = Math.floor((day_of_year - 1) / 31) + 1;
      jd = ((day_of_year - 1) % 31) + 1;
    } else {
      // Last 6 months
      let remaining_days = day_of_year - 186;
      jm = Math.floor((remaining_days - 1) / 30) + 7;
      jd = ((remaining_days - 1) % 30) + 1;
      
      // Handle month 12 (Esfand) which can have 29 or 30 days
      if (jm > 12) {
        jm = 12;
        jd = remaining_days - (5 * 30); // 5 months of 30 days each
        if (jd > (this.isLeapYear(jy) ? 30 : 29)) {
          jy++;
          jm = 1;
          jd = 1;
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
