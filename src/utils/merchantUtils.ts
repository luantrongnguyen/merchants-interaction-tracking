import { Merchant, MerchantWithStatus, MerchantStatus } from '../types/merchant';

// Parse date from various formats (MM/DD/YYYY, YYYY-MM-DD, etc.)
// Use UTC to avoid timezone issues
const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    // Try MM/DD/YYYY format first (from call logs)
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        // Use UTC to avoid timezone issues
        return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      }
    }
    
    // Try ISO format (YYYY-MM-DD)
    if (dateString.includes('-') && dateString.length === 10) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        // Use UTC to avoid timezone issues
        return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      }
    }
    
    // Fallback: try parsing as-is
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch {
    return null;
  }
};

// Get the latest call log date
const getLatestCallLogDate = (supportLogs?: Array<{ date: string; time: string }>): Date | null => {
  if (!supportLogs || supportLogs.length === 0) {
    return null;
  }

  // Sort by date and time (newest first)
  const sortedLogs = [...supportLogs].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    // Compare dates
    const dateCompare = dateB.getTime() - dateA.getTime();
    if (dateCompare !== 0) return dateCompare;
    
    // If same date, compare times
    if (a.time && b.time) {
      return b.time.localeCompare(a.time);
    }
    
    return 0;
  });

  // Return the newest date
  const latestLog = sortedLogs[0];
  return parseDate(latestLog.date);
};

export const calculateMerchantStatus = (merchant: Merchant): MerchantWithStatus => {
  const today = new Date();
  
  // Get last interaction date from call logs if available
  const latestCallLogDate = getLatestCallLogDate(merchant.supportLogs);
  
  let lastInteractionDate: Date;
  let hasCallLogs = false;
  
  if (latestCallLogDate) {
    // Use date from latest call log
    lastInteractionDate = latestCallLogDate;
    hasCallLogs = true;
  } else {
    // No call logs, use original lastInteractionDate
    const originalDate = new Date(merchant.lastInteractionDate);
    if (isNaN(originalDate.getTime())) {
      // Invalid date, use today as fallback
      lastInteractionDate = today;
    } else {
      lastInteractionDate = originalDate;
    }
  }
  
  const timeDiff = today.getTime() - lastInteractionDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

  let status: MerchantStatus;
  
  // If no call logs, status is always "Contact" (red)
  if (!hasCallLogs) {
    status = 'red'; // Contact
  } else {
    // Calculate status based on days since last interaction (from call log)
    if (daysDiff < 7) {
      status = 'green';
    } else if (daysDiff < 14) {
      status = 'orange';
    } else {
      status = 'red';
    }
  }

  // Format date to YYYY-MM-DD using UTC date to avoid timezone issues
  const formatDateToString = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    ...merchant,
    status,
    daysSinceLastInteraction: daysDiff,
    // Update lastInteractionDate to the one from call log if available
    lastInteractionDate: hasCallLogs && latestCallLogDate 
      ? formatDateToString(latestCallLogDate)
      : merchant.lastInteractionDate,
  };
};

export const getStatusColor = (status: MerchantStatus): string => {
  switch (status) {
    case 'green':
      return '#22c55e'; // green-500
    case 'orange':
      return '#f97316'; // orange-500
    case 'red':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
};

export const getStatusText = (status: MerchantStatus): string => {
  switch (status) {
    case 'green':
      return 'Good';
    case 'orange':
      return 'Attention';
    case 'red':
      return 'Contact';
    default:
      return 'Unknown';
  }
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  // Parse date string (YYYY-MM-DD or MM/DD/YYYY)
  let date: Date;
  if (dateString.includes('/')) {
    // MM/DD/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    } else {
      date = new Date(dateString);
    }
  } else if (dateString.includes('-')) {
    // YYYY-MM-DD format
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    } else {
      date = new Date(dateString);
    }
  } else {
    date = new Date(dateString);
  }
  
  if (isNaN(date.getTime())) {
    return dateString; // Return original if invalid
  }
  
  // Format using UTC to avoid timezone issues
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${month}/${day}/${year}`;
};

// Keywords để xác định vấn đề về terminal và device
const terminalDeviceKeywords = [
  'terminal', 
  'disconnected', 
  'processing', 
  'connection', 
  'connectivity', 
  'network', 
  'offline', 
  'online',
  'device',
  'hardware',
  'equipment',
  'machine',
  'pos',
  'payment terminal',
  'pax',
  'clover',
  'a920',
];

// Kiểm tra xem category có liên quan đến terminal/device không
export const isTerminalDeviceRelated = (category: string | undefined): boolean => {
  if (!category) return false;
  const lowerCategory = category.toLowerCase();
  return terminalDeviceKeywords.some(keyword => lowerCategory.includes(keyword));
};

// Đếm số lượng vấn đề về terminal và device cho một merchant
export const countTerminalDeviceIssues = (merchant: MerchantWithStatus): number => {
  if (!merchant.supportLogs || merchant.supportLogs.length === 0) {
    return 0;
  }
  
  return merchant.supportLogs.filter(log => 
    isTerminalDeviceRelated(log.category)
  ).length;
};