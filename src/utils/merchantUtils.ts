import { Merchant, MerchantWithStatus, MerchantStatus } from '../types/merchant';

export const calculateMerchantStatus = (merchant: Merchant): MerchantWithStatus => {
  const today = new Date();
  const lastInteractionDate = new Date(merchant.lastInteractionDate);
  const timeDiff = today.getTime() - lastInteractionDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

  let status: MerchantStatus;
  if (daysDiff < 7) {
    status = 'green';
  } else if (daysDiff < 14) {
    status = 'orange';
  } else {
    status = 'red';
  }

  return {
    ...merchant,
    status,
    daysSinceLastInteraction: daysDiff,
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
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US');
};
