import { parseUnits } from 'viem';

export interface DiscountBidData {
  bidder: `0x${string}`;
  discountAmount: bigint;
}

export interface AutoSaveMandateData {
  isActive: boolean;
  cycleDebitAmount: bigint;
  maxCycles: number;
  cyclesExecuted: number;
  prefundedStash: bigint;
}

export interface CoopVaultData {
  address: `0x${string}`;
  name: string;
  description: string;
  contributionAmount: bigint;
  cycleDuration: bigint;
  cycleDeadline: bigint;
  currentCycle: bigint;
  balance: bigint;
  memberCount: bigint;
  maxMembers: bigint;
  cycleDeposits: bigint;
  beneficiary: `0x${string}`;
  creator: `0x${string}`;
  members: `0x${string}`[];
  createdAt: number;
  // Yield & Lending Extensions
  yieldEnabled?: boolean;
  yieldApy?: number;
  accruedYield?: bigint;
  reserveFund: bigint;
  currentHighestBid?: DiscountBidData | null;
  activeDebts?: Record<string, string>; // member address -> debt in stringified bigint
  // Flexible Timing & Multi-Share Cooperative Extensions
  season?: number;
  advanceBalances?: Record<string, string>; // member address -> advance balance in stringified bigint
  boosterBalances?: Record<string, string>; // member address -> booster savings in stringified bigint
  memberShares?: Record<string, number>;    // member address -> share count
  totalBoosterSavings?: bigint;
  // Recurring Auto-Save Subscriptions
  autoSaveMandates?: Record<string, AutoSaveMandateData>;
}

const DEFAULT_VAULTS: CoopVaultData[] = [
  {
    address: '0x7bA5860a36A89ed9eB753afc1d99482BE548AdD3',
    name: 'Arc Global Synergy Alpha',
    description: 'Official showcase cooperative vault deployed natively on Arc Mainnet with automated rotating payouts, turn loans, and float yield.',
    contributionAmount: parseUnits('50', 18),
    cycleDuration: BigInt(7 * 24 * 3600),
    cycleDeadline: BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 3600),
    currentCycle: BigInt(0),
    balance: parseUnits('0', 18),
    memberCount: BigInt(1),
    maxMembers: BigInt(5),
    cycleDeposits: BigInt(0),
    beneficiary: '0x6268689797cA15256AF2ce922836cd69940FA024',
    creator: '0x6268689797cA15256AF2ce922836cd69940FA024',
    members: [
      '0x6268689797cA15256AF2ce922836cd69940FA024',
    ],
    createdAt: Date.now(),
    yieldEnabled: true,
    yieldApy: 5.2,
    accruedYield: parseUnits('0', 18),
    reserveFund: parseUnits('0', 18),
    currentHighestBid: null,
    activeDebts: {},
  },
];

const STORAGE_KEY = 'gscoop_local_vaults';

export function getStoredVaults(): CoopVaultData[] {
  if (typeof window === 'undefined') return DEFAULT_VAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeVaults(DEFAULT_VAULTS)));
      return DEFAULT_VAULTS;
    }
    const parsed = JSON.parse(raw);
    return deserializeVaults(parsed);
  } catch (err) {
    console.error('Error loading stored vaults', err);
    return DEFAULT_VAULTS;
  }
}

export function saveVault(vault: CoopVaultData): void {
  if (typeof window === 'undefined') return;
  const current = getStoredVaults();
  const index = current.findIndex((v) => v.address.toLowerCase() === vault.address.toLowerCase());
  if (index >= 0) {
    current[index] = vault;
  } else {
    current.unshift(vault);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeVaults(current)));
}

export function getVaultByAddress(address: string): CoopVaultData | undefined {
  const vaults = getStoredVaults();
  return vaults.find((v) => v.address.toLowerCase() === address.toLowerCase());
}

function serializeVaults(vaults: CoopVaultData[]) {
  return vaults.map((v) => ({
    ...v,
    contributionAmount: v.contributionAmount.toString(),
    cycleDuration: v.cycleDuration.toString(),
    cycleDeadline: v.cycleDeadline.toString(),
    currentCycle: v.currentCycle.toString(),
    balance: v.balance.toString(),
    memberCount: v.memberCount.toString(),
    maxMembers: v.maxMembers.toString(),
    cycleDeposits: v.cycleDeposits.toString(),
    reserveFund: v.reserveFund.toString(),
    accruedYield: v.accruedYield ? v.accruedYield.toString() : '0',
    currentHighestBid: v.currentHighestBid
      ? {
          bidder: v.currentHighestBid.bidder,
          discountAmount: v.currentHighestBid.discountAmount.toString(),
        }
      : null,
    activeDebts: v.activeDebts || {},
  }));
}

function deserializeVaults(rawList: any[]): CoopVaultData[] {
  return rawList.map((item) => ({
    ...item,
    contributionAmount: BigInt(item.contributionAmount),
    cycleDuration: BigInt(item.cycleDuration),
    cycleDeadline: BigInt(item.cycleDeadline),
    currentCycle: BigInt(item.currentCycle),
    balance: BigInt(item.balance),
    memberCount: BigInt(item.memberCount),
    maxMembers: BigInt(item.maxMembers || 10),
    cycleDeposits: BigInt(item.cycleDeposits),
    reserveFund: BigInt(item.reserveFund || '0'),
    accruedYield: BigInt(item.accruedYield || '0'),
    currentHighestBid: item.currentHighestBid
      ? {
          bidder: item.currentHighestBid.bidder,
          discountAmount: BigInt(item.currentHighestBid.discountAmount),
        }
      : null,
    activeDebts: item.activeDebts || {},
  }));
}
