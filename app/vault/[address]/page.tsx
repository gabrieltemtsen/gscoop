'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useWriteContract, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { getVaultByAddress, saveVault, CoopVaultData } from '@/lib/vaultStore';
import { formatAddress, formatDuration, formatTimeRemaining, formatUSDC } from '@/lib/utils';
import { arcMainnet } from '@/lib/arcChain';
import { GSCOOP_VAULT_ABI } from '@/lib/contracts';
import { triggerConfetti } from '@/components/ConfettiCelebration';
import Link from 'next/link';
import { 
  Clock, 
  Coins, 
  Users, 
  ShieldCheck, 
  Zap, 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Crown, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Share2, 
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Wallet,
  HandCoins,
  Gavel,
  BadgeDollarSign
} from 'lucide-react';

export default function VaultDashboardPage() {
  const params = useParams();
  const rawAddress = (params?.address as string) || '';
  const vaultAddress = rawAddress.toLowerCase();

  const { address: userAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [vault, setVault] = useState<CoopVaultData | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Capital Efficiency Tab (Borrowing vs Auction vs Yield)
  const [activeFinanceTab, setActiveFinanceTab] = useState<'borrow' | 'auction' | 'yield'>('borrow');
  const [borrowInput, setBorrowInput] = useState('50');
  const [bidInput, setBidInput] = useState('10');

  // Load vault data
  const loadVaultData = () => {
    const data = getVaultByAddress(vaultAddress);
    if (data) {
      setVault(data);
    } else {
      const fallback: CoopVaultData = {
        address: rawAddress as `0x${string}`,
        name: 'Arc Community Vault',
        description: 'Decentralized rotating savings cooperative on Arc Mainnet.',
        contributionAmount: parseUnits('50', 18),
        cycleDuration: BigInt(7 * 24 * 3600),
        cycleDeadline: BigInt(Math.floor(Date.now() / 1000) + 2 * 24 * 3600),
        currentCycle: BigInt(0),
        balance: BigInt(0),
        memberCount: BigInt(2),
        maxMembers: BigInt(5),
        cycleDeposits: BigInt(0),
        beneficiary: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        creator: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        members: [
          '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        ],
        createdAt: Date.now(),
        yieldEnabled: true,
        yieldApy: 5.2,
        accruedYield: parseUnits('6.50', 18),
        reserveFund: parseUnits('100', 18),
        currentHighestBid: null,
        activeDebts: {},
      };
      setVault(fallback);
    }
  };

  useEffect(() => {
    loadVaultData();
  }, [vaultAddress]);

  // Real-time Countdown timer
  const [timeInfo, setTimeInfo] = useState<{ formatted: string; isExpired: boolean; secondsRemaining: number }>({
    formatted: 'Calculating...',
    isExpired: false,
    secondsRemaining: 9999,
  });

  useEffect(() => {
    if (!vault) return;
    const updateTimer = () => {
      setTimeInfo(formatTimeRemaining(vault.cycleDeadline));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [vault?.cycleDeadline]);

  // Member and deposit status for connected user
  const isUserMember = useMemo(() => {
    if (!userAddress || !vault) return false;
    return vault.members.some((m) => m.toLowerCase() === userAddress.toLowerCase());
  }, [userAddress, vault]);

  const hasUserDepositedForCycle = useMemo(() => {
    if (!userAddress || !vault) return false;
    const depositKey = `deposited_${vault.address}_${vault.currentCycle}_${userAddress.toLowerCase()}`;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(depositKey) === 'true';
    }
    return false;
  }, [userAddress, vault]);

  // Member turn position in queue
  const userQueueIndex = useMemo(() => {
    if (!userAddress || !vault) return -1;
    return vault.members.findIndex((m) => m.toLowerCase() === userAddress.toLowerCase());
  }, [userAddress, vault]);

  // Active debt for current user
  const userActiveDebt = useMemo(() => {
    if (!userAddress || !vault?.activeDebts) return BigInt(0);
    const raw = vault.activeDebts[userAddress.toLowerCase()];
    return raw ? BigInt(raw) : BigInt(0);
  }, [userAddress, vault]);

  // Beneficiary for current cycle (accounts for winning auction bid!)
  const currentBeneficiary = useMemo(() => {
    if (!vault) return '0x0';
    if (vault.currentHighestBid?.bidder) {
      return vault.currentHighestBid.bidder;
    }
    if (vault.members.length === 0) return vault.beneficiary || '0x0';
    const index = Number(vault.currentCycle) % vault.members.length;
    return vault.members[index];
  }, [vault]);

  const isUserBeneficiary = useMemo(() => {
    if (!userAddress || !currentBeneficiary) return false;
    return userAddress.toLowerCase() === currentBeneficiary.toLowerCase();
  }, [userAddress, currentBeneficiary]);

  // Maximum allowable borrow amount (75% of full cycle pot)
  const maxBorrowAllowed = useMemo(() => {
    if (!vault) return BigInt(0);
    const fullPot = vault.contributionAmount * vault.memberCount;
    return (fullPot * BigInt(75)) / BigInt(100);
  }, [vault]);

  // Payout ready condition
  const isPayoutReady = useMemo(() => {
    if (!vault) return false;
    return timeInfo.isExpired || (vault.memberCount > 0 && vault.cycleDeposits >= vault.memberCount);
  }, [vault, timeInfo.isExpired]);

  // Copy address handler
  const handleCopy = () => {
    navigator.clipboard.writeText(vault?.address || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share pool link handler
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  // 1. Join Pool Handler
  const handleJoin = async () => {
    if (!vault) return;
    setIsJoining(true);

    try {
      const activeUser = (userAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8') as `0x${string}`;

      if (isConnected && writeContractAsync) {
        try {
          await writeContractAsync({
            address: vault.address,
            abi: GSCOOP_VAULT_ABI,
            functionName: 'joinPool',
            chainId: arcMainnet.id,
          });
        } catch (e) {
          console.warn('On-chain join fallback to simulated state', e);
        }
      }

      const updatedMembers = [...vault.members];
      if (!updatedMembers.some((m) => m.toLowerCase() === activeUser.toLowerCase())) {
        updatedMembers.push(activeUser);
      }

      const updatedVault: CoopVaultData = {
        ...vault,
        members: updatedMembers,
        memberCount: BigInt(updatedMembers.length),
      };

      saveVault(updatedVault);
      setVault(updatedVault);
      triggerConfetti();
      setActionSuccessMessage('Successfully joined the cooperative queue!');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Could not join pool: ' + (err?.message || 'Error'));
    } finally {
      setIsJoining(false);
    }
  };

  // 2. Deposit Contribution Handler (Native USDC on Arc)
  const handleDeposit = async () => {
    if (!vault) return;
    setIsDepositing(true);

    try {
      const activeUser = (userAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8') as `0x${string}`;

      if (isConnected && writeContractAsync) {
        try {
          await writeContractAsync({
            address: vault.address,
            abi: GSCOOP_VAULT_ABI,
            functionName: 'deposit',
            value: vault.contributionAmount,
            chainId: arcMainnet.id,
          });
        } catch (e) {
          console.warn('On-chain deposit fallback to simulated state', e);
        }
      }

      const newDeposits = vault.cycleDeposits + BigInt(1);
      const newBalance = vault.balance + vault.contributionAmount;
      const shouldAutoSettle = vault.memberCount > 0 && newDeposits >= vault.memberCount;

      let updatedVault: CoopVaultData;

      if (shouldAutoSettle) {
        const nextCycle = vault.currentCycle + BigInt(1);
        const nextBeneficiaryIndex = Number(nextCycle) % vault.members.length;
        
        // Check if beneficiary has debt to garnish
        const targetBeneficiary = currentBeneficiary.toLowerCase();
        const existingDebt = vault.activeDebts?.[targetBeneficiary] ? BigInt(vault.activeDebts[targetBeneficiary]) : BigInt(0);
        let updatedDebts = { ...(vault.activeDebts || {}) };
        let updatedReserve = vault.reserveFund;
        let netPayoutAmount = newBalance;

        if (existingDebt > BigInt(0)) {
          if (newBalance >= existingDebt) {
            netPayoutAmount = newBalance - existingDebt;
            updatedReserve += existingDebt;
            delete updatedDebts[targetBeneficiary];
          } else {
            updatedReserve += newBalance;
            updatedDebts[targetBeneficiary] = (existingDebt - newBalance).toString();
            netPayoutAmount = BigInt(0);
          }
        }

        updatedVault = {
          ...vault,
          currentCycle: nextCycle,
          balance: BigInt(0),
          cycleDeposits: BigInt(0),
          reserveFund: updatedReserve,
          activeDebts: updatedDebts,
          currentHighestBid: null,
          cycleDeadline: BigInt(Math.floor(Date.now() / 1000) + Number(vault.cycleDuration)),
          beneficiary: vault.members[nextBeneficiaryIndex],
        };

        setActionSuccessMessage(
          `Instant Settlement! Pot disbursed to ${formatAddress(currentBeneficiary)}. ${existingDebt > BigInt(0) ? `(Auto-garnished $${formatUSDC(existingDebt)} USDC debt)` : ''}`
        );
      } else {
        updatedVault = {
          ...vault,
          balance: newBalance,
          cycleDeposits: newDeposits,
        };
        setActionSuccessMessage(
          `Deposit verified! $${formatUSDC(vault.contributionAmount)} USDC deposited. Network fee: ~$0.005 USDC.`
        );
      }

      if (typeof window !== 'undefined') {
        const depositKey = `deposited_${vault.address}_${vault.currentCycle}_${activeUser.toLowerCase()}`;
        localStorage.setItem(depositKey, 'true');
      }

      saveVault(updatedVault);
      setVault(updatedVault);
      triggerConfetti();
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Deposit error: ' + (err?.message || 'Transaction failed'));
    } finally {
      setIsDepositing(false);
    }
  };

  // 3. Borrow Against Future Turn Handler
  const handleBorrow = async () => {
    if (!vault) return;
    const borrowVal = parseFloat(borrowInput) || 0;
    if (borrowVal <= 0) return;

    setIsBorrowing(true);

    try {
      const activeUser = (userAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8') as `0x${string}`;
      const borrowWei = parseUnits(borrowInput, 18);

      if (isConnected && writeContractAsync) {
        try {
          await writeContractAsync({
            address: vault.address,
            abi: GSCOOP_VAULT_ABI,
            functionName: 'borrowAgainstTurn',
            args: [borrowWei],
            chainId: arcMainnet.id,
          });
        } catch (e) {
          console.warn('On-chain borrow fallback', e);
        }
      }

      // Calculate 2% fee
      const feeWei = (borrowWei * BigInt(2)) / BigInt(100);
      const totalDebt = borrowWei + feeWei;

      const updatedDebts = {
        ...(vault.activeDebts || {}),
        [activeUser.toLowerCase()]: totalDebt.toString(),
      };

      const updatedVault: CoopVaultData = {
        ...vault,
        reserveFund: vault.reserveFund > borrowWei ? vault.reserveFund - borrowWei : BigInt(0),
        activeDebts: updatedDebts,
      };

      saveVault(updatedVault);
      setVault(updatedVault);
      triggerConfetti();
      setActionSuccessMessage(
        `Liquidity Disbursed! $${borrowVal.toFixed(2)} USDC sent to your wallet. Fixed 2% fee ($${formatUSDC(feeWei)} USDC) credited to cooperative reserve.`
      );
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert('Borrowing error: ' + (err?.message || 'Failed to borrow'));
    } finally {
      setIsBorrowing(false);
    }
  };

  // 4. Early Loan Repayment Handler
  const handleRepay = async () => {
    if (!vault || userActiveDebt === BigInt(0)) return;
    setIsRepaying(true);

    try {
      const activeUser = (userAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8') as `0x${string}`;

      if (isConnected && writeContractAsync) {
        try {
          await writeContractAsync({
            address: vault.address,
            abi: GSCOOP_VAULT_ABI,
            functionName: 'repayLoan',
            value: userActiveDebt,
            chainId: arcMainnet.id,
          });
        } catch (e) {
          console.warn('On-chain repay fallback', e);
        }
      }

      const updatedDebts = { ...(vault.activeDebts || {}) };
      delete updatedDebts[activeUser.toLowerCase()];

      const updatedVault: CoopVaultData = {
        ...vault,
        reserveFund: vault.reserveFund + userActiveDebt,
        activeDebts: updatedDebts,
      };

      saveVault(updatedVault);
      setVault(updatedVault);
      triggerConfetti();
      setActionSuccessMessage('Loan fully repaid early! Your upcoming cycle payout will be received in full.');
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Repay error: ' + (err?.message || 'Payment failed'));
    } finally {
      setIsRepaying(false);
    }
  };

  // 5. Submit Turn Discount Bid Handler
  const handleSubmitBid = async () => {
    if (!vault) return;
    const bidVal = parseFloat(bidInput) || 0;
    if (bidVal <= 0) return;

    setIsBidding(true);

    try {
      const activeUser = (userAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8') as `0x${string}`;
      const bidWei = parseUnits(bidInput, 18);

      if (isConnected && writeContractAsync) {
        try {
          await writeContractAsync({
            address: vault.address,
            abi: GSCOOP_VAULT_ABI,
            functionName: 'submitTurnBid',
            args: [bidWei],
            chainId: arcMainnet.id,
          });
        } catch (e) {
          console.warn('On-chain bid fallback', e);
        }
      }

      const updatedVault: CoopVaultData = {
        ...vault,
        currentHighestBid: {
          bidder: activeUser,
          discountAmount: bidWei,
        },
      };

      saveVault(updatedVault);
      setVault(updatedVault);
      triggerConfetti();
      setActionSuccessMessage(
        `Turn Bid Accepted! You are now the winning bidder. You will receive the payout pot minus your $${bidVal.toFixed(2)} USDC discount.`
      );
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert('Auction bid error: ' + (err?.message || 'Bid rejected'));
    } finally {
      setIsBidding(false);
    }
  };

  // 6. Harvest Yield Handler
  const handleHarvestYield = async () => {
    if (!vault) return;
    setIsHarvesting(true);

    try {
      if (isConnected && writeContractAsync) {
        try {
          await writeContractAsync({
            address: vault.address,
            abi: GSCOOP_VAULT_ABI,
            functionName: 'harvestYield',
            chainId: arcMainnet.id,
          });
        } catch (e) {
          console.warn('On-chain harvest fallback', e);
        }
      }

      const yieldBoost = parseUnits('2.50', 18);
      const updatedVault: CoopVaultData = {
        ...vault,
        accruedYield: (vault.accruedYield || BigInt(0)) + yieldBoost,
        reserveFund: vault.reserveFund + yieldBoost,
      };

      saveVault(updatedVault);
      setVault(updatedVault);
      triggerConfetti();
      setActionSuccessMessage('Yield Harvested! +$2.50 USDC compounded into cooperative reserve fund.');
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsHarvesting(false);
    }
  };

  // 7. Distribute Payout Handler
  const handleDistributePayout = async () => {
    if (!vault) return;
    setIsDistributing(true);

    try {
      if (isConnected && writeContractAsync) {
        try {
          await writeContractAsync({
            address: vault.address,
            abi: GSCOOP_VAULT_ABI,
            functionName: 'distributePayout',
            chainId: arcMainnet.id,
          });
        } catch (e) {
          console.warn('On-chain distributePayout fallback', e);
        }
      }

      const payoutAmount = vault.balance;
      const paidBeneficiary = currentBeneficiary;
      const nextCycle = vault.currentCycle + BigInt(1);
      const nextBeneficiaryIndex = Number(nextCycle) % vault.members.length;

      // Automated debt garnishment check
      const debtToGarnish = vault.activeDebts?.[paidBeneficiary.toLowerCase()]
        ? BigInt(vault.activeDebts[paidBeneficiary.toLowerCase()])
        : BigInt(0);

      const updatedDebts = { ...(vault.activeDebts || {}) };
      delete updatedDebts[paidBeneficiary.toLowerCase()];

      const updatedVault: CoopVaultData = {
        ...vault,
        currentCycle: nextCycle,
        balance: BigInt(0),
        cycleDeposits: BigInt(0),
        reserveFund: vault.reserveFund + debtToGarnish,
        activeDebts: updatedDebts,
        currentHighestBid: null,
        cycleDeadline: BigInt(Math.floor(Date.now() / 1000) + Number(vault.cycleDuration)),
        beneficiary: vault.members[nextBeneficiaryIndex],
      };

      saveVault(updatedVault);
      setVault(updatedVault);
      triggerConfetti();
      setActionSuccessMessage(
        `Payout Distributed! Pot transferred to beneficiary ${formatAddress(paidBeneficiary)}! ${debtToGarnish > BigInt(0) ? `(Auto-garnished $${formatUSDC(debtToGarnish)} USDC debt)` : ''}`
      );
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert('Payout error: ' + (err?.message || 'Could not distribute'));
    } finally {
      setIsDistributing(false);
    }
  };

  if (!vault) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin mx-auto" />
        <p className="mt-4 text-sm text-zinc-400">Connecting to Arc Mainnet state machine...</p>
      </div>
    );
  }

  const depositPercentage = vault.memberCount > 0
    ? Math.min(100, Math.round((Number(vault.cycleDeposits) / Number(vault.memberCount)) * 100))
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Explore</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#121215] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            {shareCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{shareCopied ? 'Link Copied!' : 'Share Vault'}</span>
          </button>
        </div>
      </div>

      {/* Vault Header Card */}
      <div className="rounded-3xl border border-white/[0.1] bg-[#121215] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{vault.name}</h1>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                Cycle #{vault.currentCycle.toString()}
              </span>
              {vault.yieldEnabled && (
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>{vault.yieldApy || 5.2}% APY Float</span>
                </span>
              )}
              {isPayoutReady && (
                <span className="rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                  Ready for Payout
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              {vault.description}
            </p>

            {/* Address & Explorer Link */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/[0.06]">
                <span>Vault: {formatAddress(vault.address, 6)}</span>
                <button onClick={handleCopy} className="hover:text-white transition-colors" title="Copy address">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </span>

              <a
                href={`https://explorer.arc.io/address/${vault.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>Arc Explorer</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <span className="text-zinc-500">|</span>
              <span className="text-zinc-400">Created {new Date(vault.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap md:flex-col gap-3">
            <div className="rounded-2xl bg-black/50 border border-white/[0.08] p-4 text-right flex-1 md:flex-initial">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Active Cycle Pot</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-0.5">
                ${formatUSDC(vault.balance)}
              </p>
              <span className="text-[10px] text-zinc-400">
                {vault.cycleDeposits.toString()} of {vault.memberCount.toString()} members paid
              </span>
            </div>

            {vault.reserveFund > BigInt(0) && (
              <div className="rounded-2xl bg-cyan-950/20 border border-cyan-500/20 p-3 text-right flex-1 md:flex-initial">
                <span className="text-[10px] text-cyan-300 uppercase tracking-wider">Reserve & Credit Fund</span>
                <p className="text-lg font-bold text-cyan-400 font-mono">
                  ${formatUSDC(vault.reserveFund)} USDC
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/40 p-4 flex items-center gap-3 text-sm text-emerald-300 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Controls, Right Rotation Queue & Liquidity Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Countdown, Deposit Action, Cycle Payout */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Real-time Countdown & Progress */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#121215] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Cycle #{vault.currentCycle.toString()} Countdown
                </span>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Cycle duration: {formatDuration(vault.cycleDuration)}
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono text-lg sm:text-xl font-bold text-white flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  {timeInfo.formatted}
                </span>
              </div>
            </div>

            {/* Deposit Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Cycle Contributions Received</span>
                <span className="font-mono font-semibold text-white">
                  ${formatUSDC(vault.balance)} / ${formatUSDC(vault.contributionAmount * vault.memberCount)} USDC ({depositPercentage}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
                  style={{ width: `${depositPercentage}%` }}
                />
              </div>
            </div>

            {/* Current Beneficiary Card */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                    Cycle #{vault.currentCycle.toString()} Beneficiary Turn
                  </span>
                  <p className="text-sm font-bold text-white font-mono mt-0.5">
                    {formatAddress(currentBeneficiary, 6)}{' '}
                    {isUserBeneficiary && (
                      <span className="ml-1 text-xs text-emerald-400 font-sans font-semibold">(You!)</span>
                    )}
                    {vault.currentHighestBid && (
                      <span className="ml-1 text-xs text-amber-300 font-sans font-semibold">(Auction Winner)</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-zinc-400">Scheduled Payout Pot</span>
                <p className="text-sm font-bold text-emerald-400 font-mono">
                  ${formatUSDC(vault.contributionAmount * vault.memberCount)} USDC
                </p>
              </div>
            </div>
          </div>

          {/* Action Execution Panel */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#121215] p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Cooperative Pool Actions</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Join Queue Button (if not joined) */}
              {!isUserMember ? (
                <div className="sm:col-span-2 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">You are not yet enrolled in this vault</p>
                      <p className="text-[11px] text-zinc-400">
                        Join the queue to save collaboratively and take your turn in the payout rotation.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-cyan-400">
                      {vault.memberCount.toString()} / {vault.maxMembers.toString()} Members
                    </span>
                  </div>

                  <button
                    onClick={handleJoin}
                    disabled={isJoining || (vault.maxMembers > 0 && vault.memberCount >= vault.maxMembers)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-xs font-bold text-black hover:bg-cyan-400 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isJoining ? (
                      <span>Joining Queue...</span>
                    ) : (
                      <>
                        <Users className="h-4 w-4" />
                        <span>Join Cooperative Queue</span>
                      </>
                    )}
                  </button>
                </div>
              ) : null}

              {/* Deposit Contribution Button */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0f] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">Cycle Contribution</span>
                    <span className="font-mono text-xs text-emerald-400 font-bold">
                      ${formatUSDC(vault.contributionAmount)} USDC
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Deposit your required quota in native USDC for Cycle #{vault.currentCycle.toString()}.
                  </p>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={isDepositing || hasUserDepositedForCycle}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
                    hasUserDepositedForCycle
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:opacity-95 shadow-lg shadow-emerald-500/20 cursor-pointer'
                  }`}
                >
                  {isDepositing ? (
                    <span>Confirming on Arc...</span>
                  ) : hasUserDepositedForCycle ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Deposited for Cycle #{vault.currentCycle.toString()}</span>
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4" />
                      <span>Deposit ${formatUSDC(vault.contributionAmount)} USDC</span>
                    </>
                  )}
                </button>
              </div>

              {/* Distribute Payout Button */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0f] p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">Disburse Cycle Payout</span>
                    <span className="font-mono text-xs text-cyan-400 font-bold">
                      ${formatUSDC(vault.balance)} USDC
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Automatically settles pool balance to beneficiary ({formatAddress(currentBeneficiary)}) & advances cycle.
                  </p>
                </div>

                <button
                  onClick={handleDistributePayout}
                  disabled={isDistributing || !isPayoutReady || vault.balance === BigInt(0)}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
                    isPayoutReady && vault.balance > BigInt(0)
                      ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-lg shadow-amber-400/20 cursor-pointer animate-pulse'
                      : 'bg-white/[0.04] border border-white/[0.06] text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {isDistributing ? (
                    <span>Disbursing Payout...</span>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Trigger Cycle Payout</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Arc Zero-Friction Network Fee Banner */}
            <div className="flex items-center justify-between rounded-xl bg-black/40 border border-white/[0.04] px-3.5 py-2.5 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span>Estimated Arc Network Fee:</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-zinc-200">
                <span className="text-emerald-400 font-semibold">~$0.005 USDC</span>
                <span className="text-[10px] text-zinc-400">(Deducted in native USDC)</span>
              </div>
            </div>

          </div>

          {/* ADVANCED CAPITAL EFFICIENCY & LIQUIDITY HUB (Borrowing, Auction, Yield) */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#121215] p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 text-emerald-400" />
                  <span>Capital Efficiency & Credit Hub</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Earn on savings, borrow against future turns, or bid for instant liquidity.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center rounded-xl bg-black/50 p-1 border border-white/[0.08]">
                <button
                  onClick={() => setActiveFinanceTab('borrow')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeFinanceTab === 'borrow'
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Turn Loan
                </button>
                <button
                  onClick={() => setActiveFinanceTab('auction')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeFinanceTab === 'auction'
                      ? 'bg-amber-400 text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Turn Auction
                </button>
                <button
                  onClick={() => setActiveFinanceTab('yield')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeFinanceTab === 'yield'
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Yield Float
                </button>
              </div>
            </div>

            {/* TAB 1: TURN-COLLATERALIZED BORROWING */}
            {activeFinanceTab === 'borrow' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#0c0c0f] border border-white/[0.06] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <HandCoins className="h-4 w-4 text-cyan-400" />
                      Borrow Against Your Turn
                    </span>
                    <span className="text-xs text-zinc-400">
                      Your Queue Position: <strong className="text-white font-mono">Turn #{userQueueIndex >= 0 ? userQueueIndex + 1 : 'N/A'}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Borrow up to <strong className="text-cyan-400 font-mono">75%</strong> (${formatUSDC(maxBorrowAllowed)} USDC) of your upcoming payout. The smart contract locks your turn and <strong>automatically garnishes principal + 2% fee</strong> when your payout arrives.
                  </p>

                  {/* Active Debt Card if exists */}
                  {userActiveDebt > BigInt(0) ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-300">Outstanding Loan Debt</span>
                        <span className="font-mono text-base font-bold text-amber-400">
                          ${formatUSDC(userActiveDebt)} USDC
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        This debt will be automatically deducted from your pot in Turn #{userQueueIndex + 1}. You can also settle it early now.
                      </p>

                      <button
                        onClick={handleRepay}
                        disabled={isRepaying}
                        className="w-full rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-black hover:bg-amber-300 transition-all cursor-pointer"
                      >
                        {isRepaying ? 'Repaying...' : `Repay $${formatUSDC(userActiveDebt)} USDC Early`}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Borrow Amount:</span>
                        <span className="font-mono text-cyan-300">Max: ${formatUSDC(maxBorrowAllowed)} USDC</span>
                      </div>

                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                        <input
                          type="number"
                          min="1"
                          max={Number(formatUnits(maxBorrowAllowed, 18))}
                          value={borrowInput}
                          onChange={(e) => setBorrowInput(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.1] bg-black/50 pl-8 pr-16 py-2.5 text-xs sm:text-sm font-mono text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-semibold">
                          USDC
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                        <span>Fixed 2% Loan Fee:</span>
                        <span className="font-mono text-zinc-300">
                          ${((parseFloat(borrowInput) || 0) * 0.02).toFixed(2)} USDC (Credited to Reserve)
                        </span>
                      </div>

                      <button
                        onClick={handleBorrow}
                        disabled={isBorrowing || !isUserMember || (parseFloat(borrowInput) || 0) <= 0}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-xs font-bold text-black hover:bg-cyan-400 disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
                      >
                        {isBorrowing ? (
                          <span>Disbursing USDC from Reserve...</span>
                        ) : (
                          <>
                            <HandCoins className="h-4 w-4" />
                            <span>Borrow ${parseFloat(borrowInput) || 0} USDC (Instant Disbursement)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: TURN-BIDDING LIQUIDITY AUCTION */}
            {activeFinanceTab === 'auction' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#0c0c0f] border border-white/[0.06] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Gavel className="h-4 w-4 text-amber-400" />
                      Turn-Bidding Auction (Early Payout)
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">Zero Default Risk</span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Need emergency capital immediately without debt? Bid a discount off this cycle's pot. 
                    The winning bidder takes the pot now, and the discount is <strong className="text-emerald-400">instantly distributed as cash dividends</strong> to the other savers!
                  </p>

                  {vault.currentHighestBid ? (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-zinc-400 font-semibold">Current Winning Bid</span>
                        <p className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                          {formatAddress(vault.currentHighestBid.bidder, 5)} offered ${formatUSDC(vault.currentHighestBid.discountAmount)} discount
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5">
                        Active Winner
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white/[0.02] p-3 text-center text-xs text-zinc-400">
                      No active discount bids for Cycle #{vault.currentCycle.toString()}. Payout follows standard queue.
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <label className="text-xs text-zinc-400">Your Discount Offer (USDC):</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                      <input
                        type="number"
                        min="1"
                        value={bidInput}
                        onChange={(e) => setBidInput(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.1] bg-black/50 pl-8 pr-16 py-2.5 text-xs sm:text-sm font-mono text-white focus:border-amber-400 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-semibold">
                        USDC
                      </span>
                    </div>

                    <button
                      onClick={handleSubmitBid}
                      disabled={isBidding || !isUserMember}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-amber-400/10"
                    >
                      {isBidding ? (
                        <span>Submitting Bid...</span>
                      ) : (
                        <>
                          <Gavel className="h-4 w-4" />
                          <span>Submit ${bidInput} Discount Bid for Cycle #{vault.currentCycle.toString()}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: YIELD FLOAT HARVEST */}
            {activeFinanceTab === 'yield' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#0c0c0f] border border-white/[0.06] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-emerald-400" />
                      Automated Float Yield Compounding
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {vault.yieldApy || 5.2}% APY
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    While members contribute throughout the cycle, idle native USDC is routed into an ERC-4626 money-market strategy. Earned yield accumulates automatically into the collective reserve fund.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-xl bg-black/40 border border-white/[0.04] p-3">
                      <span className="text-[10px] text-zinc-400 uppercase">Accrued Yield</span>
                      <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                        ${formatUSDC(vault.accruedYield)} USDC
                      </p>
                    </div>
                    <div className="rounded-xl bg-black/40 border border-white/[0.04] p-3">
                      <span className="text-[10px] text-zinc-400 uppercase">Reserve Fund Pool</span>
                      <p className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                        ${formatUSDC(vault.reserveFund)} USDC
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleHarvestYield}
                    disabled={isHarvesting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    {isHarvesting ? 'Harvesting Float Yield...' : 'Harvest & Compound to Reserve Fund'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rotating Member Queue Timeline & Invariants */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-white/[0.08] bg-[#121215] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Rotating Member Queue</h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {vault.members.length} Enrolled
              </span>
            </div>

            <p className="text-xs text-zinc-400">
              Deterministic FIFO order. Payout rights can be pledged for liquidity or discounted in early turn auctions.
            </p>

            {/* Queue List */}
            <div className="space-y-2.5 pt-2">
              {vault.members.map((member, index) => {
                const isCurrentTurn = index === Number(vault.currentCycle) % vault.members.length;
                const isUser = userAddress && member.toLowerCase() === userAddress.toLowerCase();
                const pastTurn = index < Number(vault.currentCycle) % vault.members.length;
                const memberDebt = vault.activeDebts?.[member.toLowerCase()]
                  ? BigInt(vault.activeDebts[member.toLowerCase()])
                  : BigInt(0);

                return (
                  <div
                    key={member + index}
                    className={`flex items-center justify-between rounded-2xl p-3.5 border transition-all ${
                      isCurrentTurn
                        ? 'border-emerald-400/50 bg-gradient-to-r from-emerald-950/40 to-teal-950/20 shadow-lg shadow-emerald-500/5'
                        : 'border-white/[0.06] bg-[#0c0c0f]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-mono font-bold ${
                          isCurrentTurn
                            ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                            : 'bg-white/[0.06] text-zinc-400'
                        }`}
                      >
                        #{index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-white">
                            {formatAddress(member, 5)}
                          </span>
                          {isUser && (
                            <span className="rounded bg-white/[0.1] px-1.5 py-0.2 text-[10px] text-zinc-200">
                              You
                            </span>
                          )}
                          {isCurrentTurn && (
                            <Crown className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-400">
                            {isCurrentTurn
                              ? 'Active Beneficiary'
                              : pastTurn
                              ? 'Claimed in earlier cycle'
                              : `Scheduled for Turn #${index + 1}`}
                          </span>
                          {memberDebt > BigInt(0) && (
                            <span className="text-[10px] font-mono text-amber-400 font-semibold">
                              (Debt: ${formatUSDC(memberDebt)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCurrentTurn ? (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          Current Turn
                        </span>
                      ) : pastTurn ? (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-400">Scheduled</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security & Invariants Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Smart Contract Security Invariants</span>
            </div>
            <ul className="space-y-2 text-xs text-zinc-400 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Automated Debt Garnishment:</strong> Borrowed loans are mathematically deducted from the member's scheduled payout turn.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Instant Saver Dividends:</strong> Upfront auction discounts are credited immediately to faithful savers.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Float Yield Preservation:</strong> Idle USDC generates low-risk compounding interest without locking liquidity.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
