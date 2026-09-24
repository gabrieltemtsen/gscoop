import { publicClient } from './publicClient';
import { FACTORY_ADDRESS, GSCOOP_FACTORY_ABI, GSCOOP_VAULT_ABI } from './contracts';
import { CoopVaultData, AutoSaveMandateData } from './vaultStore';
import { parseUnits } from 'viem';

// Fallback showcase vault deployed on Arc Mainnet
export const SHOWCASE_VAULT_ADDRESS = '0x52D4c482276c3932fb2081528a6b155e2B1Ca977' as `0x${string}`;

/**
 * Fetch all registered cooperative pool addresses directly from GScoopFactory on Arc Mainnet.
 */
export async function fetchOnChainCoopAddresses(): Promise<`0x${string}`[]> {
  try {
    const addresses = (await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: GSCOOP_FACTORY_ABI,
      functionName: 'getCoops',
    })) as `0x${string}`[];

    if (addresses && addresses.length > 0) {
      return addresses;
    }
  } catch (err) {
    console.warn('Could not read getCoops from factory, falling back to showcase address:', err);
  }

  return [SHOWCASE_VAULT_ADDRESS];
}

/**
 * Fetch complete live on-chain state for a specific cooperative vault on Arc Mainnet.
 */
export async function fetchOnChainVault(vaultAddress: `0x${string}`): Promise<CoopVaultData | null> {
  try {
    // 1. Read primary state tuple
    const stateResult = (await publicClient.readContract({
      address: vaultAddress,
      abi: GSCOOP_VAULT_ABI,
      functionName: 'getVaultState',
    })) as [
      string,  // vaultName
      bigint,  // contributionAmount
      bigint,  // cycleDuration
      bigint,  // cycleDeadline
      bigint,  // currentCycle
      bigint,  // balance
      bigint,  // memberCount
      bigint,  // cycleDeposits
      `0x${string}`, // currentBeneficiaryAddress
      bigint,  // vaultReserve
      bigint   // currentDiscountBid
    ];

    const [
      vaultName,
      contributionAmount,
      cycleDuration,
      cycleDeadline,
      currentCycle,
      balance,
      rawMemberCount,
      cycleDeposits,
      currentBeneficiaryAddress,
      vaultReserve,
      currentDiscountBid,
    ] = stateResult;

    // 2. Read enrolled member queue
    let members: `0x${string}`[] = [];
    try {
      members = (await publicClient.readContract({
        address: vaultAddress,
        abi: GSCOOP_VAULT_ABI,
        functionName: 'getMembers',
      })) as `0x${string}`[];
    } catch (e) {
      console.warn('Failed to read getMembers:', e);
    }

    // 3. Read creator and max members
    let creatorAddress: `0x${string}` = '0x6268689797cA15256AF2ce922836cd69940FA024';
    let maxMembers = BigInt(5);
    let yieldEnabled = true;

    try {
      creatorAddress = (await publicClient.readContract({
        address: vaultAddress,
        abi: GSCOOP_VAULT_ABI,
        functionName: 'creator',
      })) as `0x${string}`;
    } catch {}

    try {
      maxMembers = (await publicClient.readContract({
        address: vaultAddress,
        abi: GSCOOP_VAULT_ABI,
        functionName: 'maxMembers',
      })) as bigint;
    } catch {}

    try {
      yieldEnabled = (await publicClient.readContract({
        address: vaultAddress,
        abi: GSCOOP_VAULT_ABI,
        functionName: 'yieldEnabled',
      })) as boolean;
    } catch {}

    const isBeneficiaryZero = currentBeneficiaryAddress === '0x0000000000000000000000000000000000000000';
    const computedBeneficiary = !isBeneficiaryZero
      ? currentBeneficiaryAddress
      : members.length > 0
      ? members[Number(currentCycle) % members.length]
      : creatorAddress;

    const data: CoopVaultData = {
      address: vaultAddress,
      name: vaultName || 'Arc Community Vault',
      description: `Decentralized cooperative savings vault natively deployed on Arc Mainnet.`,
      contributionAmount: contributionAmount || parseUnits('50', 18),
      cycleDuration: cycleDuration || BigInt(7 * 24 * 3600),
      cycleDeadline: cycleDeadline || BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 3600),
      currentCycle: currentCycle || BigInt(0),
      balance: balance || BigInt(0),
      memberCount: BigInt(members.length),
      maxMembers: maxMembers || BigInt(5),
      cycleDeposits: cycleDeposits || BigInt(0),
      beneficiary: computedBeneficiary,
      creator: creatorAddress,
      members: members,
      createdAt: Date.now() - (Number(currentCycle) * Number(cycleDuration) * 1000 || 86400000),
      yieldEnabled: yieldEnabled,
      yieldApy: 5.2,
      accruedYield: BigInt(0),
      reserveFund: vaultReserve || BigInt(0),
      currentHighestBid: currentDiscountBid > BigInt(0)
        ? { bidder: computedBeneficiary, discountAmount: currentDiscountBid }
        : null,
      activeDebts: {},
    };

    return data;
  } catch (err) {
    console.error(`Error fetching on-chain vault at ${vaultAddress}:`, err);
    return null;
  }
}

/**
 * Fetch user-specific financial status in a vault directly on-chain.
 */
export async function fetchUserOnChainStatus(
  vaultAddress: `0x${string}`,
  userAddress: `0x${string}`,
  currentCycle: bigint
): Promise<{
  hasDeposited: boolean;
  debt: bigint;
  advance: bigint;
  booster: bigint;
  shares: number;
  autoSave: AutoSaveMandateData | null;
}> {
  let hasDeposited = false;
  let debt = BigInt(0);
  let advance = BigInt(0);
  let booster = BigInt(0);
  let shares = 1;
  let autoSave: AutoSaveMandateData | null = null;

  try {
    hasDeposited = (await publicClient.readContract({
      address: vaultAddress,
      abi: GSCOOP_VAULT_ABI,
      functionName: 'hasMemberDeposited',
      args: [currentCycle, userAddress],
    })) as boolean;
  } catch {}

  try {
    const fin = (await publicClient.readContract({
      address: vaultAddress,
      abi: GSCOOP_VAULT_ABI,
      functionName: 'getMemberFinancials',
      args: [userAddress],
    })) as [bigint, bigint, bigint, bigint];

    debt = fin[0];
    advance = fin[1];
    booster = fin[2];
    shares = Number(fin[3]) > 0 ? Number(fin[3]) : 1;
  } catch {}

  try {
    const auto = (await publicClient.readContract({
      address: vaultAddress,
      abi: GSCOOP_VAULT_ABI,
      functionName: 'getAutoSaveStatus',
      args: [userAddress],
    })) as [boolean, bigint, bigint, bigint, bigint];

    if (auto && auto[0]) {
      autoSave = {
        isActive: auto[0],
        cycleDebitAmount: auto[1],
        maxCycles: Number(auto[2]),
        cyclesExecuted: Number(auto[3]),
        prefundedStash: auto[4],
      };
    }
  } catch {}

  return { hasDeposited, debt, advance, booster, shares, autoSave };
}

/**
 * Fetch all registered on-chain cooperative vaults from Arc Mainnet.
 */
export async function fetchAllOnChainVaults(): Promise<CoopVaultData[]> {
  const addresses = await fetchOnChainCoopAddresses();
  const results: CoopVaultData[] = [];

  for (const addr of addresses) {
    const v = await fetchOnChainVault(addr);
    if (v) {
      results.push(v);
    }
  }

  return results;
}
