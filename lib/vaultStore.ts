import { parseUnits } from 'viem';

export interface DiscountBidData {
  bidder: `0x${string}`;
  discountAmount: bigint;
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
}

const DEFAULT_VAULTS: CoopVaultData[] = [
  {
    address: '0x13b2A5F89c8365dBd0a1b24147A9D6c3C0334001',
    name: 'Arc Builders Cooperative',
    description: 'Weekly rotating savings with automated 5.2% USDC yield float and instant credit access.',
    contributionAmount: parseUnits('100', 18),
    cycleDuration: BigInt(7 * 24 * 3600),
    cycleDeadline: BigInt(Math.floor(Date.now() / 1000) + 3 * 24 * 3600 + 4120),
    currentCycle: BigInt(2),
    balance: parseUnits('300', 18),
    memberCount: BigInt(5),
    maxMembers: BigInt(5),
    cycleDeposits: BigInt(3),
    beneficiary: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    creator: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    members: [
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    ],
    createdAt: Date.now() - 14 * 24 * 3600 * 1000,
    yieldEnabled: true,
    yieldApy: 5.2,
    accruedYield: parseUnits('14.85', 18),
    reserveFund: parseUnits('120', 18),
    currentHighestBid: null,
    activeDebts: {},
  },
  {
    address: '0x13b2B6409890fE897D8105c3639910D779184002',
    name: 'Global Nomad Reserve',
    description: 'Automated 3-day liquidity rotation pool with emergency turn borrowing.',
    contributionAmount: parseUnits('25', 18),
    cycleDuration: BigInt(3 * 24 * 3600),
    cycleDeadline: BigInt(Math.floor(Date.now() / 1000) + 18 * 3600 + 200),
    currentCycle: BigInt(1),
    balance: parseUnits('50', 18),
    memberCount: BigInt(4),
    maxMembers: BigInt(6),
    cycleDeposits: BigInt(2),
    beneficiary: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    creator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    members: [
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    ],
    createdAt: Date.now() - 6 * 24 * 3600 * 1000,
    yieldEnabled: true,
    yieldApy: 4.8,
    accruedYield: parseUnits('4.10', 18),
    reserveFund: parseUnits('65', 18),
    currentHighestBid: null,
    activeDebts: {},
  },
  {
    address: '0x13b2C924185790Ae74136274B61198A0b0014003',
    name: 'Synergy Micro-Savers',
    description: 'Daily micro-saving group building credit and emergency liquidity without gas friction.',
    contributionAmount: parseUnits('10', 18),
    cycleDuration: BigInt(24 * 3600),
    cycleDeadline: BigInt(Math.floor(Date.now() / 1000) + 4 * 3600 + 540),
    currentCycle: BigInt(4),
    balance: parseUnits('70', 18),
    memberCount: BigInt(8),
    maxMembers: BigInt(8),
    cycleDeposits: BigInt(7),
    beneficiary: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    creator: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    members: [
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
      '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
      '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    ],
    createdAt: Date.now() - 4 * 24 * 3600 * 1000,
    yieldEnabled: true,
    yieldApy: 5.5,
    accruedYield: parseUnits('8.20', 18),
    reserveFund: parseUnits('90', 18),
    currentHighestBid: {
      bidder: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      discountAmount: parseUnits('5', 18),
    },
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
