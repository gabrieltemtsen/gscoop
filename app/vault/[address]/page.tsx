'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAccount, useWriteContract, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { getVaultByAddress, saveVault, CoopVaultData, AutoSaveMandateData } from '@/lib/vaultStore';
import { fetchOnChainVault, fetchUserOnChainStatus } from '@/lib/onChainVaults';
import { publicClient } from '@/lib/publicClient';
import { formatAddress, formatDuration, formatTimeRemaining, formatUSDC } from '@/lib/utils';
import { arcMainnet } from '@/lib/arcChain';
import { ensureArcNetwork } from '@/lib/switchNetwork';
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
  ArrowRight,
  ExternalLink, 
  Copy, 
  Check, 
  Crown, 
  AlertCircle, 
  AlertTriangle,
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
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const isWrongNetwork = isConnected && chainId !== arcMainnet.id;
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const ensureArcChain = async () => {
    if (chainId !== arcMainnet.id) {
      await ensureArcNetwork(switchChainAsync);
    }
  };

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

  // Capital Efficiency & Cooperative Growth Tabs
  const [activeFinanceTab, setActiveFinanceTab] = useState<
    'borrow' | 'auction' | 'yield' | 'autosave' | 'advance' | 'booster' | 'shares' | 'dividends'
  >('borrow');
  const [borrowInput, setBorrowInput] = useState('50');
  const [bidInput, setBidInput] = useState('10');
  const [advanceInput, setAdvanceInput] = useState('100');
  const [boosterInput, setBoosterInput] = useState('100');
  const [sharesInput, setSharesInput] = useState('1');
  const [dividendInput, setDividendInput] = useState('30');
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isBoosterDepositing, setIsBoosterDepositing] = useState(false);
  const [isBuyingShares, setIsBuyingShares] = useState(false);
  const [isDistributingDividends, setIsDistributingDividends] = useState(false);
  const [autoSaveCycles, setAutoSaveCycles] = useState<number>(5);
  const [isSettingUpAutoSave, setIsSettingUpAutoSave] = useState(false);
  const [isCancellingAutoSave, setIsCancellingAutoSave] = useState(false);
  const [isExecutingDebit, setIsExecutingDebit] = useState(false);
  const [isLoadingOnChain, setIsLoadingOnChain] = useState(true);
  const [onChainUserStatus, setOnChainUserStatus] = useState<{
    hasDeposited: boolean;
    debt: bigint;
    advance: bigint;
    booster: bigint;
    shares: number;
    autoSave: AutoSaveMandateData | null;
  } | null>(null);

  // Load vault data directly on-chain from Arc Mainnet
  const loadVaultData = async () => {
    setIsLoadingOnChain(true);
    try {
      const liveVault = await fetchOnChainVault(rawAddress as `0x${string}`);
      if (liveVault) {
        setVault(liveVault);
        if (userAddress) {
          const userStatus = await fetchUserOnChainStatus(rawAddress as `0x${string}`, userAddress, liveVault.currentCycle);
          setOnChainUserStatus(userStatus);
        }
      } else {
        const stored = getVaultByAddress(vaultAddress);
        if (stored) {
          setVault(stored);
        }
      }
    } catch (err) {
      console.warn('Error loading on-chain vault:', err);
      const stored = getVaultByAddress(vaultAddress);
      if (stored) setVault(stored);
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  useEffect(() => {
    loadVaultData();
  }, [vaultAddress, userAddress]);

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
    if (onChainUserStatus?.hasDeposited) return true;
    if (!userAddress || !vault) return false;
    const depositKey = `deposited_${vault.address}_${vault.currentCycle}_${userAddress.toLowerCase()}`;
    if (typeof window !== 'undefined') {
      return localStorage.getItem(depositKey) === 'true';
    }
    return false;
  }, [userAddress, vault, onChainUserStatus]);

  // Member turn position in queue
  const userQueueIndex = useMemo(() => {
    if (!userAddress || !vault) return -1;
    return vault.members.findIndex((m) => m.toLowerCase() === userAddress.toLowerCase());
  }, [userAddress, vault]);

  // Active debt for current user
  const userActiveDebt = useMemo(() => {
    if (onChainUserStatus?.debt && onChainUserStatus.debt > BigInt(0)) {
      return onChainUserStatus.debt;
    }
    if (!userAddress || !vault?.activeDebts) return BigInt(0);
    const raw = vault.activeDebts[userAddress.toLowerCase()];
    return raw ? BigInt(raw) : BigInt(0);
  }, [userAddress, vault, onChainUserStatus]);

  // Cooperative Season & Cycle Position Calculations
  const currentSeason = useMemo(() => {
    if (!vault || vault.members.length === 0) return 1;
    return Math.floor(Number(vault.currentCycle) / vault.members.length) + 1;
  }, [vault]);

  const cycleInSeason = useMemo(() => {
    if (!vault || vault.members.length === 0) return 1;
    return (Number(vault.currentCycle) % vault.members.length) + 1;
  }, [vault]);

  const userAdvanceBalance = useMemo(() => {
    if (onChainUserStatus?.advance && onChainUserStatus.advance > BigInt(0)) {
      return onChainUserStatus.advance;
    }
    if (!userAddress || !vault?.advanceBalances) return BigInt(0);
    const raw = vault.advanceBalances[userAddress.toLowerCase()];
    return raw ? BigInt(raw) : BigInt(0);
  }, [userAddress, vault, onChainUserStatus]);

  const userBoosterSavings = useMemo(() => {
    if (onChainUserStatus?.booster && onChainUserStatus.booster > BigInt(0)) {
      return onChainUserStatus.booster;
    }
    if (!userAddress || !vault?.boosterBalances) return BigInt(0);
    const raw = vault.boosterBalances[userAddress.toLowerCase()];
    return raw ? BigInt(raw) : BigInt(0);
  }, [userAddress, vault, onChainUserStatus]);

  const userShares = useMemo(() => {
    if (onChainUserStatus?.shares && onChainUserStatus.shares > 1) {
      return onChainUserStatus.shares;
    }
    if (!userAddress || !vault?.memberShares) return 1;
    return vault.memberShares[userAddress.toLowerCase()] || 1;
  }, [userAddress, vault, onChainUserStatus]);

  const userAutoSave = useMemo(() => {
    if (onChainUserStatus?.autoSave) {
      return onChainUserStatus.autoSave;
    }
    if (!userAddress || !vault?.autoSaveMandates) return null;
    return vault.autoSaveMandates[userAddress.toLowerCase()] || null;
  }, [userAddress, vault, onChainUserStatus]);

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
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet (Chain ID: 5042) to join this cooperative.');
      return;
    }
    setIsJoining(true);

    try {
      await ensureArcChain();
      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'joinPool',
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage('Successfully joined the cooperative queue on Arc Mainnet!');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Could not join pool: ' + (err?.shortMessage || err?.message || 'Error'));
    } finally {
      setIsJoining(false);
    }
  };

  // 2. Deposit Contribution Handler (Native USDC on Arc)
  const handleDeposit = async () => {
    if (!vault) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet (Chain ID: 5042) to deposit.');
      return;
    }
    setIsDepositing(true);

    try {
      await ensureArcChain();
      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'deposit',
          value: vault.contributionAmount,
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      if (typeof window !== 'undefined') {
        const depositKey = `deposited_${vault.address}_${vault.currentCycle}_${userAddress.toLowerCase()}`;
        localStorage.setItem(depositKey, 'true');
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(
        `Deposit confirmed on Arc Mainnet! $${formatUSDC(vault.contributionAmount)} USDC deposited.`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Deposit error: ' + (err?.shortMessage || err?.message || 'Transaction failed'));
    } finally {
      setIsDepositing(false);
    }
  };

  // 3. Borrow Against Future Turn Handler
  const handleBorrow = async () => {
    if (!vault) return;
    const borrowVal = parseFloat(borrowInput) || 0;
    if (borrowVal <= 0) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to borrow against your turn.');
      return;
    }

    setIsBorrowing(true);

    try {
      await ensureArcChain();
      const borrowWei = parseUnits(borrowInput, 18);

      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'borrowAgainstTurn',
          args: [borrowWei],
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(
        `Liquidity Disbursed on Arc! $${borrowVal.toFixed(2)} USDC sent to your wallet.`
      );
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert('Borrowing error: ' + (err?.shortMessage || err?.message || 'Failed to borrow'));
    } finally {
      setIsBorrowing(false);
    }
  };

  // 4. Early Loan Repayment Handler
  const handleRepay = async () => {
    if (!vault || userActiveDebt === BigInt(0)) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to repay your loan.');
      return;
    }
    setIsRepaying(true);

    try {
      await ensureArcChain();
      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'repayLoan',
          value: userActiveDebt,
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage('Loan fully repaid on Arc Mainnet! Your upcoming cycle payout will be received in full.');
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Repay error: ' + (err?.shortMessage || err?.message || 'Payment failed'));
    } finally {
      setIsRepaying(false);
    }
  };

  // 5. Submit Turn Discount Bid Handler
  const handleSubmitBid = async () => {
    if (!vault) return;
    const bidVal = parseFloat(bidInput) || 0;
    if (bidVal <= 0) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to place an auction bid.');
      return;
    }

    setIsBidding(true);

    try {
      await ensureArcChain();
      const bidWei = parseUnits(bidInput, 18);

      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'submitTurnBid',
          args: [bidWei],
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(
        `Turn Bid Accepted! You are now the winning bidder with a $${bidVal.toFixed(2)} USDC discount bid.`
      );
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert('Auction bid error: ' + (err?.shortMessage || err?.message || 'Bid rejected'));
    } finally {
      setIsBidding(false);
    }
  };

  // 6. Harvest Yield Handler
  const handleHarvestYield = async () => {
    if (!vault) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to harvest yield.');
      return;
    }
    setIsHarvesting(true);

    try {
      await ensureArcChain();
      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'harvestYield',
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage('Yield Harvested on Arc Mainnet! Compounded into cooperative reserve fund.');
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Harvest yield error: ' + (err?.shortMessage || err?.message || 'Harvest failed'));
    } finally {
      setIsHarvesting(false);
    }
  };

  // 7. Distribute Payout Handler
  const handleDistributePayout = async () => {
    if (!vault) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to distribute payout.');
      return;
    }
    setIsDistributing(true);

    try {
      await ensureArcChain();
      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'distributePayout',
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(
        `Payout Distributed! Pot transferred to beneficiary on Arc Mainnet!`
      );
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert('Payout error: ' + (err?.shortMessage || err?.message || 'Could not distribute'));
    } finally {
      setIsDistributing(false);
    }
  };

  // 8. Advance Pre-Funding Handler
  const handleDepositAdvance = async () => {
    if (!vault) return;
    const val = parseFloat(advanceInput) || 0;
    if (val <= 0) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to buffer advance deposits.');
      return;
    }
    setIsAdvancing(true);

    try {
      await ensureArcChain();
      const advWei = parseUnits(advanceInput, 18);

      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'depositAdvance',
          value: advWei,
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(`Advance Pre-Funded! $${val.toFixed(2)} USDC buffered on Arc Mainnet.`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Advance error: ' + (err?.shortMessage || err?.message || 'Transaction failed'));
    } finally {
      setIsAdvancing(false);
    }
  };

  // 9. Voluntary Booster Savings Handler
  const handleDepositBooster = async () => {
    if (!vault) return;
    const val = parseFloat(boosterInput) || 0;
    if (val <= 0) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to deposit booster savings.');
      return;
    }
    setIsBoosterDepositing(true);

    try {
      await ensureArcChain();
      const valWei = parseUnits(boosterInput, 18);

      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'depositBoosterSavings',
          value: valWei,
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(`Booster Savings Added! $${val.toFixed(2)} USDC earning yield on Arc Mainnet.`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Booster deposit error: ' + (err?.shortMessage || err?.message || 'Transaction failed'));
    } finally {
      setIsBoosterDepositing(false);
    }
  };

  // 10. Withdraw Booster Savings Handler
  const handleWithdrawBooster = async () => {
    if (!vault || userBoosterSavings === BigInt(0)) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to withdraw booster savings.');
      return;
    }
    setIsBoosterDepositing(true);

    try {
      await ensureArcChain();
      const withdrawAmount = userBoosterSavings;

      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'withdrawBoosterSavings',
          args: [withdrawAmount],
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(`Booster Savings Withdrawn! $${formatUSDC(withdrawAmount)} USDC returned to wallet.`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Booster withdraw error: ' + (err?.shortMessage || err?.message || 'Withdrawal failed'));
    } finally {
      setIsBoosterDepositing(false);
    }
  };

  // 11. Multi-Share Membership Handler
  const handleBuyShares = async () => {
    if (!vault) return;
    const addCount = parseInt(sharesInput) || 1;
    if (addCount <= 0) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to purchase cooperative shares.');
      return;
    }
    setIsBuyingShares(true);

    try {
      await ensureArcChain();
      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'buyShares',
          args: [BigInt(addCount)],
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(`Cooperative Shares Acquired! Additional ${addCount} queue slots granted on Arc Mainnet.`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Buy shares error: ' + (err?.shortMessage || err?.message || 'Transaction failed'));
    } finally {
      setIsBuyingShares(false);
    }
  };

  // 12. Distribute Patronage Dividends Handler
  const handleDistributeDividends = async () => {
    if (!vault) return;
    const divVal = parseFloat(dividendInput) || 0;
    if (divVal <= 0) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to distribute dividends.');
      return;
    }
    setIsDistributingDividends(true);

    try {
      await ensureArcChain();
      const divWei = parseUnits(dividendInput, 18);

      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'distributePatronageDividends',
          args: [divWei],
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(`Patronage Dividends Distributed! $${divVal.toFixed(2)} USDC surplus disbursed to all savers on Arc!`);
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert('Dividend distribution error: ' + (err?.shortMessage || err?.message || 'Distribution failed'));
    } finally {
      setIsDistributingDividends(false);
    }
  };

  // 13. Setup Auto-Save Recurring Subscription Mandate
  const handleSetupAutoSave = async () => {
    if (!vault) return;
    if (autoSaveCycles <= 0) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to set up autopilot auto-saving.');
      return;
    }
    setIsSettingUpAutoSave(true);

    try {
      await ensureArcChain();
      const totalAmount = vault.contributionAmount * BigInt(autoSaveCycles);

      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'setupAutoSaveSubscription',
          args: [BigInt(autoSaveCycles)],
          value: totalAmount,
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(
        `⚡ Autopilot Activated! ${autoSaveCycles} cycles authorized on Arc Mainnet. Future cycles will auto-debit on schedule!`
      );
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert('Auto-save setup error: ' + (err?.shortMessage || err?.message || 'Transaction failed'));
    } finally {
      setIsSettingUpAutoSave(false);
    }
  };

  // 14. Cancel Auto-Save Recurring Subscription
  const handleCancelAutoSave = async () => {
    if (!vault || !userAutoSave || !userAutoSave.isActive) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to cancel auto-save.');
      return;
    }
    setIsCancellingAutoSave(true);

    try {
      await ensureArcChain();
      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'cancelAutoSaveSubscription',
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(
        `Autopilot Cancelled on Arc Mainnet. Any remaining buffer has been refunded to your wallet.`
      );
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert('Auto-save cancellation error: ' + (err?.shortMessage || err?.message || 'Cancellation failed'));
    } finally {
      setIsCancellingAutoSave(false);
    }
  };

  // 15. Trigger Auto-Debit on behalf of a subscribed member (Keeper role)
  const handleExecuteAutoDebit = async (targetMember: string) => {
    if (!vault) return;
    if (!isConnected || !userAddress) {
      alert('Please connect your Web3 wallet on Arc Mainnet to trigger auto-debit.');
      return;
    }
    setIsExecutingDebit(true);

    try {
      await ensureArcChain();
      if (writeContractAsync) {
        const hash = await writeContractAsync({
          address: vault.address,
          abi: GSCOOP_VAULT_ABI,
          functionName: 'executeAutoDebit',
          args: [targetMember as `0x${string}`],
          chainId: arcMainnet.id,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await loadVaultData();
      triggerConfetti();
      setActionSuccessMessage(
        `Auto-Debit Executed on Arc Mainnet! $0.25 USDC keeper bounty earned.`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error(err);
      alert('Execute auto-debit error: ' + (err?.shortMessage || err?.message || 'Execution failed'));
    } finally {
      setIsExecutingDebit(false);
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

      {/* Wrong Network Warning Banner */}
      {isWrongNetwork && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-200">
                Wallet Connected to Different Chain (ID: {chainId})
              </p>
              <p className="text-[11px] text-amber-300/80">
                This cooperative savings vault operates on Arc Mainnet (5042). Switch network to deposit, join, or manage your position.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              setIsSwitchingNetwork(true);
              try {
                await ensureArcNetwork(switchChainAsync);
              } catch (err: any) {
                alert(err?.message || 'Failed to switch network');
              } finally {
                setIsSwitchingNetwork(false);
              }
            }}
            disabled={isSwitchingNetwork}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>{isSwitchingNetwork ? 'Switching...' : 'Switch to Arc Mainnet'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
                    {vault.members.length === 0 ? (
                      <span className="text-zinc-400 font-sans text-xs">Waiting for first member to enroll</span>
                    ) : (
                      <>
                        {formatAddress(currentBeneficiary, 6)}{' '}
                        {isUserBeneficiary && (
                          <span className="ml-1 text-xs text-emerald-400 font-sans font-semibold">(You!)</span>
                        )}
                        {vault.currentHighestBid && (
                          <span className="ml-1 text-xs text-amber-300 font-sans font-semibold">(Auction Winner)</span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-zinc-400">Scheduled Payout Pot</span>
                <p className="text-sm font-bold text-emerald-400 font-mono">
                  ${formatUSDC(vault.contributionAmount * (vault.memberCount > BigInt(0) ? vault.memberCount : vault.maxMembers))} USDC
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
                  {userAutoSave?.isActive && (
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-cyan-950/40 border border-cyan-500/30 px-3 py-2 text-[11px]">
                      <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                        <Zap className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Autopilot Active</span>
                      </span>
                      <span className="font-mono text-zinc-300">
                        {userAutoSave.cyclesExecuted}/{userAutoSave.maxCycles} cycles (${formatUSDC(userAutoSave.prefundedStash)} left)
                      </span>
                    </div>
                  )}
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
            <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BadgeDollarSign className="h-5 w-5 text-emerald-400" />
                    <span>Cooperative Growth & Flexibility Hub</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Flexible timing pre-pay, voluntary booster savings, multi-share expansion, loans, auctions, and annual dividends.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 self-start sm:self-auto">
                  Season {currentSeason} • Cycle {cycleInSeason} of {vault.memberCount.toString()}
                </span>
              </div>

              {/* Scrollable Tabs Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: 'autosave', label: '⚡ Autopilot' },
                  { id: 'advance', label: '⏱️ Pre-Pay Buffer' },
                  { id: 'booster', label: '💰 Save More (Booster)' },
                  { id: 'shares', label: '🎟️ Buy Shares' },
                  { id: 'borrow', label: '💳 Turn Loan' },
                  { id: 'auction', label: '🏷️ Turn Auction' },
                  { id: 'yield', label: '📈 Float Yield' },
                  { id: 'dividends', label: '🎁 Annual Dividends' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFinanceTab(tab.id as any)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      activeFinanceTab === tab.id
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-sm'
                        : 'border-white/[0.06] bg-black/40 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB: AUTOPILOT RECURRING SAVINGS MANDATE */}
            {activeFinanceTab === 'autosave' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#0c0c0f] border border-white/[0.06] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-cyan-400" />
                      Autopilot Recurring Savings Mandate
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">
                      Subscription-Based
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Set up a hands-free savings subscription. Authorize an autopilot mandate with a pre-funded USDC buffer; the smart contract automatically debits your cycle contribution upon each round settlement. <strong>100% revocable: cancel anytime and refund all unspent funds instantly!</strong>
                  </p>

                  {/* Architecture & Security note */}
                  <div className="rounded-xl bg-cyan-950/15 border border-cyan-500/20 p-3 flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="text-[11px] text-zinc-300">
                      Auto-debits execute seamlessly each cycle from your pre-funded buffer. Cancel and refund unspent USDC anytime.
                    </span>
                  </div>

                  {/* Active Mandate Status Card (if user has one active) */}
                  {userAutoSave?.isActive ? (
                    <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Autopilot Subscription Active
                        </span>
                        <span className="text-xs font-mono text-emerald-300 font-semibold">
                          {userAutoSave.cyclesExecuted} of {userAutoSave.maxCycles} Cycles Debited
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="rounded-lg bg-black/40 border border-white/[0.04] p-2.5">
                          <span className="text-[10px] text-zinc-400 uppercase">Remaining Buffer</span>
                          <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                            ${formatUSDC(userAutoSave.prefundedStash)} USDC
                          </p>
                        </div>
                        <div className="rounded-lg bg-black/40 border border-white/[0.04] p-2.5">
                          <span className="text-[10px] text-zinc-400 uppercase">Per-Cycle Debit</span>
                          <p className="text-sm font-bold text-white font-mono mt-0.5">
                            ${formatUSDC(userAutoSave.cycleDebitAmount)} USDC
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-zinc-400">
                          <span>Subscription Progress</span>
                          <span className="font-mono text-zinc-300">
                            {userAutoSave.maxCycles > 0
                              ? Math.round((userAutoSave.cyclesExecuted / userAutoSave.maxCycles) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                            style={{
                              width: `${
                                userAutoSave.maxCycles > 0
                                  ? Math.min(100, Math.round((userAutoSave.cyclesExecuted / userAutoSave.maxCycles) * 100))
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleCancelAutoSave}
                          disabled={isCancellingAutoSave}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-900/30 transition-all cursor-pointer"
                        >
                          {isCancellingAutoSave ? (
                            <span>Refunding Unspent Buffer...</span>
                          ) : (
                            <>
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>Cancel Subscription & Refund ${formatUSDC(userAutoSave.prefundedStash)} USDC</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Setup New Subscription Form */
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-300">
                          Select Subscription Duration:
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { count: 3, label: '3 Cycles' },
                            { count: 5, label: '5 Cycles' },
                            { count: 10, label: '10 Cycles' },
                            {
                              count: Number(vault.memberCount) > 0 ? Number(vault.memberCount) : 8,
                              label: `Season (${vault.memberCount.toString()}x)`,
                            },
                          ].map((item) => (
                            <button
                              key={item.count}
                              type="button"
                              onClick={() => setAutoSaveCycles(item.count)}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                autoSaveCycles === item.count
                                  ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300'
                                  : 'border-white/[0.06] bg-black/40 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cost Summary */}
                      <div className="rounded-xl bg-black/40 border border-white/[0.04] p-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Contribution Quota per Cycle:</span>
                          <span className="text-white font-mono">${formatUSDC(vault.contributionAmount)} USDC</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Total Subscription Stash Required:</span>
                          <span className="text-cyan-400 font-mono font-bold">
                            ${formatUSDC(vault.contributionAmount * BigInt(autoSaveCycles))} USDC
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Initial Cycle Execution:</span>
                          <span className="text-zinc-300 font-mono">
                            {hasUserDepositedForCycle ? 'Cycle already paid (Autopilot starts next cycle)' : 'Cycle #auto-fulfilled immediately'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 border-t border-white/[0.04]">
                          <span className="text-zinc-400">Arc Network Gas Fee:</span>
                          <span className="text-emerald-400 font-mono">~$0.005 USDC</span>
                        </div>
                      </div>

                      <button
                        onClick={handleSetupAutoSave}
                        disabled={isSettingUpAutoSave || autoSaveCycles <= 0}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-xs font-bold text-black hover:bg-cyan-400 disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
                      >
                        {isSettingUpAutoSave ? (
                          <span>Authorizing Autopilot Mandate...</span>
                        ) : (
                          <>
                            <Zap className="h-4 w-4" />
                            <span>
                              Activate Autopilot (${formatUSDC(vault.contributionAmount * BigInt(autoSaveCycles))} USDC)
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Peer / Keeper Auto-Debit Execution Queue */}
                  <div className="pt-2 border-t border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Autopilot Keeper Queue</span>
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Autonomous cycle execution
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400">
                      Subscribed members have pre-authorized their balances. Any peer or Arc keeper can execute pending auto-debits without waiting for the user to be online.
                    </p>

                    {/* Check other members with active mandates who haven't deposited */}
                    {(() => {
                      const subscribedMembers = vault.members.filter((m) => {
                        const mandate = vault.autoSaveMandates?.[m.toLowerCase()];
                        return mandate?.isActive && mandate.prefundedStash >= vault.contributionAmount;
                      });

                      if (subscribedMembers.length === 0) {
                        return (
                          <div className="rounded-xl bg-black/30 border border-white/[0.04] p-3 text-center text-xs text-zinc-500">
                            No external members pending auto-debit for Cycle #{vault.currentCycle.toString()}.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1.5 pt-1">
                          {subscribedMembers.map((m) => {
                            const mandate = vault.autoSaveMandates![m.toLowerCase()];
                            return (
                              <div
                                key={m}
                                className="flex items-center justify-between rounded-xl bg-black/40 border border-white/[0.04] p-2.5 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-zinc-300">{formatAddress(m, 5)}</span>
                                  <span className="text-[10px] text-zinc-400">
                                    (${formatUSDC(mandate.prefundedStash)} buffered)
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleExecuteAutoDebit(m)}
                                  disabled={isExecutingDebit}
                                  className="flex items-center gap-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/25 transition-all cursor-pointer"
                                >
                                  <Zap className="h-3 w-3" />
                                  <span>Execute Auto-Debit</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

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

            {/* TAB 4: ADVANCE PRE-FUNDING BUFFER (FLEXIBLE TIMING) */}
            {activeFinanceTab === 'advance' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#0c0c0f] border border-white/[0.06] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-teal-400" />
                      Flexible Timing & Pre-Pay Buffer
                    </span>
                    <span className="text-xs font-mono text-teal-400 font-bold">
                      ${formatUSDC(userAdvanceBalance)} Pre-Funded
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Going on holiday, traveling, or busy? Pre-fund multiple cycles ahead. The smart contract holds your advance balance and auto-draws whenever a cycle matures, preventing missed deadlines.
                  </p>

                  <div className="rounded-xl bg-black/40 border border-white/[0.04] p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Your Current Buffer:</span>
                      <span className="text-white font-mono font-bold">${formatUSDC(userAdvanceBalance)} USDC</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Future Cycles Covered:</span>
                      <span className="text-teal-400 font-mono font-bold">
                        {vault.contributionAmount > BigInt(0)
                          ? Math.floor(Number(userAdvanceBalance) / Number(vault.contributionAmount))
                          : 0} Cycles Ahead
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">Add Advance Pre-Pay (USDC):</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 5].map((multiplier) => (
                          <button
                            key={multiplier}
                            type="button"
                            onClick={() => setAdvanceInput((Number(formatUSDC(vault.contributionAmount)) * multiplier).toString())}
                            className="text-[10px] text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded hover:bg-teal-500/20"
                          >
                            {multiplier}x Pot (${Number(formatUSDC(vault.contributionAmount)) * multiplier})
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">$</span>
                      <input
                        type="number"
                        min="1"
                        value={advanceInput}
                        onChange={(e) => setAdvanceInput(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.1] bg-[#141418] pl-7 pr-16 py-2.5 text-xs font-mono text-white focus:border-teal-500 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400">
                        USDC
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleDepositAdvance}
                    disabled={isAdvancing || parseFloat(advanceInput) <= 0}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-xs font-bold text-black hover:bg-teal-400 disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-teal-500/10"
                  >
                    {isAdvancing ? 'Pre-Funding Advance...' : 'Pre-Fund Advance Buffer (Native USDC)'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: VOLUNTARY BOOSTER SAVINGS ("SAVE MORE") */}
            {activeFinanceTab === 'booster' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#0c0c0f] border border-white/[0.06] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <HandCoins className="h-4 w-4 text-emerald-400" />
                      Voluntary Booster Savings (Save More & Earn)
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      ~5.2% APY Float
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Want to save more beyond the mandatory rotating circle? Deposit voluntary surplus capital into the cooperative float strategy. Earn compounding interest with 100% on-demand liquidity.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-xl bg-black/40 border border-white/[0.04] p-3">
                      <span className="text-[10px] text-zinc-400 uppercase">Your Booster Balance</span>
                      <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                        ${formatUSDC(userBoosterSavings)} USDC
                      </p>
                    </div>
                    <div className="rounded-xl bg-black/40 border border-white/[0.04] p-3">
                      <span className="text-[10px] text-zinc-400 uppercase">Total Circle Float</span>
                      <p className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                        ${formatUSDC(vault.totalBoosterSavings || BigInt(0))} USDC
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-zinc-300 font-medium block">
                      Booster Deposit Amount (Native USDC):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">$</span>
                      <input
                        type="number"
                        min="1"
                        value={boosterInput}
                        onChange={(e) => setBoosterInput(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.1] bg-[#141418] pl-7 pr-16 py-2.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400">
                        USDC
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDepositBooster}
                      disabled={isBoosterDepositing || parseFloat(boosterInput) <= 0}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                    >
                      {isBoosterDepositing ? 'Depositing...' : 'Deposit Booster'}
                    </button>
                    {userBoosterSavings > BigInt(0) && (
                      <button
                        onClick={handleWithdrawBooster}
                        disabled={isBoosterDepositing}
                        className="px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.04] text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                      >
                        Withdraw All
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: MULTI-SHARE MEMBERSHIP ("BUY SHARES") */}
            {activeFinanceTab === 'shares' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#0c0c0f] border border-white/[0.06] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-purple-400" />
                      Multi-Share Cooperative Membership
                    </span>
                    <span className="text-xs font-mono text-purple-400 font-bold">
                      {userShares} Share{userShares > 1 ? 's' : ''} Active
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Higher earners can buy additional shares in the cooperative. Each additional share awards you an extra scheduled payout turn per rotation season, allowing you to multiply your savings rate.
                  </p>

                  <div className="rounded-xl bg-black/40 border border-white/[0.04] p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Current Share Count:</span>
                      <span className="text-white font-mono font-bold">{userShares} Shares</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Scheduled Payouts per Season:</span>
                      <span className="text-purple-400 font-mono font-bold">{userShares} Turns</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-zinc-300 font-medium block">
                      Additional Shares to Acquire:
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSharesInput(num.toString())}
                          className={`flex-1 rounded-xl py-2 text-xs font-bold border transition-all ${
                            sharesInput === num.toString()
                              ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                              : 'border-white/[0.08] bg-[#141418] text-zinc-400 hover:text-white'
                          }`}
                        >
                          +{num} Share{num > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleBuyShares}
                    disabled={isBuyingShares}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-500 py-3 text-xs font-bold text-white hover:bg-purple-400 disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-purple-500/10"
                  >
                    {isBuyingShares ? 'Enrolling Additional Shares...' : `Acquire +${sharesInput} Cooperative Share(s)`}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 7: ANNUAL & SEASON PATRONAGE DIVIDENDS */}
            {activeFinanceTab === 'dividends' && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#0c0c0f] border border-white/[0.06] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      Annual Patronage Dividends
                    </span>
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      ${formatUSDC(vault.reserveFund)} Surplus
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    True cooperative credit unions reward faithful savers. Loan fees (2%), early auction discounts, and float yield pool into the community Reserve Fund. At the end of each season, surplus profits are distributed back to active members as cash patronage dividends!
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="rounded-xl bg-black/40 border border-white/[0.04] p-3">
                      <span className="text-[10px] text-zinc-400 uppercase">Reserve Fund Surplus</span>
                      <p className="text-base font-bold text-amber-400 font-mono mt-0.5">
                        ${formatUSDC(vault.reserveFund)} USDC
                      </p>
                    </div>
                    <div className="rounded-xl bg-black/40 border border-white/[0.04] p-3">
                      <span className="text-[10px] text-zinc-400 uppercase">Estimated / Member</span>
                      <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                        ${formatUSDC(
                          vault.reserveFund > BigInt(0) && vault.memberCount > BigInt(0)
                            ? vault.reserveFund / vault.memberCount
                            : BigInt(0)
                        )} USDC
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">Dividend Amount to Disburse (USDC):</span>
                      <button
                        type="button"
                        onClick={() => setDividendInput(formatUSDC(vault.reserveFund))}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Max Surplus (${formatUSDC(vault.reserveFund)})
                      </button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-xs">$</span>
                      <input
                        type="number"
                        min="1"
                        value={dividendInput}
                        onChange={(e) => setDividendInput(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.1] bg-[#141418] pl-7 pr-16 py-2.5 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400">
                        USDC
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleDistributeDividends}
                    disabled={isDistributingDividends || parseFloat(dividendInput) <= 0 || vault.reserveFund === BigInt(0)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-40 transition-all cursor-pointer shadow-lg shadow-amber-400/10"
                  >
                    {isDistributingDividends ? 'Distributing Cash Dividends...' : 'Distribute Patronage Dividends to Members'}
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
              {vault.members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#0c0c0f] p-6 text-center space-y-2">
                  <Users className="h-8 w-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-semibold text-white">No members enrolled yet</p>
                  <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                    Be the first member to join this cooperative queue and take Turn #1 in the payout rotation!
                  </p>
                </div>
              ) : (
                vault.members.map((member, index) => {
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
                })
              )}
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
