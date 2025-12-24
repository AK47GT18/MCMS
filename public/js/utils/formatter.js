/**
 * Data Formatting Utilities
 */
const Formatter = {
  /**
   * Format currency
   */
  currency(value, currency = 'MWK') {
    const number = parseFloat(value);
    if (isNaN(number)) return value;

    return new Intl.NumberFormat('en-MW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number).replace('MWK', 'MWK ');
  },

  /**
   * Format number
   */
  number(value, decimals = 0) {
    const number = parseFloat(value);
    if (isNaN(number)) return value;

    return new Intl.NumberFormat('en-MW', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  },

  /**
   * Format date
   */
  date(value, format = 'YYYY-MM-DD') {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  relativeTime(value) {
    const date = new Date(value);
    const now = new Date();
    const diff = now - date;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  },

  /**
   * Format phone number
   */
  phone(value) {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    
    return value;
  },

  /**
   * Format percentage
   */
  percentage(value, decimals = 0) {
    const number = parseFloat(value);
    if (isNaN(number)) return value;

    return `${number.toFixed(decimals)}%`;
  },

  /**
   * Format file size
   */
  fileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Truncate text
   */
  truncate(text, length = 50, suffix = '...') {
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
  },

  /**
   * Capitalize first letter
   */
  capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  /**
   * Title case
   */
  titleCase(text) {
    return text.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
};