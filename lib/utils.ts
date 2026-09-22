import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatUnits, parseUnits } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSDC(amount: bigint | string | number | undefined): string {
  if (amount === undefined || amount === null) return '0.00';
  try {
    const bigVal = typeof amount === 'bigint' ? amount : BigInt(amount);
    const formatted = formatUnits(bigVal, 18);
    const num = parseFloat(formatted);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return '0.00';
  }
}

export function parseUSDC(amount: string | number): bigint {
  try {
    return parseUnits(amount.toString(), 18);
  } catch {
    return BigInt(0);
  }
}

export function formatAddress(address?: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatDuration(seconds: number | bigint): string {
  const secs = Number(seconds);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)} mins`;
  if (secs < 86400) return `${(secs / 3600).toFixed(1)} hrs`;
  const days = Math.round(secs / 86400);
  return `${days} day${days > 1 ? 's' : ''}`;
}

export function formatTimeRemaining(deadlineTimestamp: number | bigint): {
  formatted: string;
  isExpired: boolean;
  secondsRemaining: number;
} {
  const deadline = Number(deadlineTimestamp);
  const now = Math.floor(Date.now() / 1000);
  const remaining = deadline - now;

  if (remaining <= 0) {
    return { formatted: 'Ready for Settlement', isExpired: true, secondsRemaining: 0 };
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  if (days > 0) {
    return { formatted: `${days}d ${hours}h ${minutes}m`, isExpired: false, secondsRemaining: remaining };
  }
  if (hours > 0) {
    return { formatted: `${hours}h ${minutes}m ${seconds}s`, isExpired: false, secondsRemaining: remaining };
  }
  return { formatted: `${minutes}m ${seconds}s`, isExpired: false, secondsRemaining: remaining };
}
