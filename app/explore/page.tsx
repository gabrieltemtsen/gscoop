'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { getStoredVaults, CoopVaultData } from '@/lib/vaultStore';
import { fetchAllOnChainVaults } from '@/lib/onChainVaults';
import { FACTORY_ADDRESS } from '@/lib/contracts';
import { VaultCard } from '@/components/VaultCard';
import { formatUnits } from 'viem';
import { 
  Search, 
  Coins, 
  Layers, 
  Plus, 
  ShieldCheck, 
  Zap,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  UserCheck,
  CheckCircle2,
  Filter
} from 'lucide-react';
import Link from 'next/link';

export default function ExplorePage() {
  const { address: userAddress } = useAccount();
  const [vaults, setVaults] = useState<CoopVaultData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'micro' | 'standard' | 'high'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'my_circles' | 'active' | 'payout_ready'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadVaults = async () => {
    setIsRefreshing(true);
    try {
      const onChainData = await fetchAllOnChainVaults();
      if (onChainData && onChainData.length > 0) {
        setVaults(onChainData);
      } else {
        const data = getStoredVaults();
        setVaults(data);
      }
    } catch (err) {
      console.warn('On-chain read error, using fallback:', err);
      const data = getStoredVaults();
      setVaults(data);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadVaults();
  }, []);

  const myVaults = useMemo(() => {
    if (!userAddress) return [];
    const lower = userAddress.toLowerCase();
    return vaults.filter((v) => v.members.some((m) => m.toLowerCase() === lower));
  }, [vaults, userAddress]);

  const myUnpaidCount = useMemo(() => {
    if (!userAddress) return 0;
    const lower = userAddress.toLowerCase();
    return myVaults.filter((v) => !v.cyclePaidMembers?.[lower]).length;
  }, [myVaults, userAddress]);

  const myExtraSavingsUSDC = useMemo(() => {
    if (!userAddress) return 0;
    const lower = userAddress.toLowerCase();
    return myVaults.reduce((acc, v) => {
      const adv = BigInt(v.advanceBalances?.[lower] || 0);
      const bst = BigInt(v.boosterBalances?.[lower] || 0);
      const lp = BigInt(v.memberShares?.[lower] || 0);
      return acc + Number(formatUnits(adv + bst + lp, 18));
    }, 0);
  }, [myVaults, userAddress]);

  const filteredVaults = useMemo(() => {
    return vaults.filter((v) => {
      // Search filter
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.address.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Contribution tier filter
      const amountUSD = Number(formatUnits(v.contributionAmount, 18));
      if (tierFilter === 'micro' && amountUSD >= 25) return false;
      if (tierFilter === 'standard' && (amountUSD < 25 || amountUSD > 100)) return false;
      if (tierFilter === 'high' && amountUSD <= 100) return false;

      // Status & My Circles filter
      if (statusFilter === 'my_circles') {
        if (!userAddress) return false;
        const isMember = v.members.some((m) => m.toLowerCase() === userAddress.toLowerCase());
        if (!isMember) return false;
      } else {
        const now = Math.floor(Date.now() / 1000);
        const isPayoutReady =
          now >= Number(v.cycleDeadline) || (v.memberCount > 0 && v.cycleDeposits >= v.memberCount);

        if (statusFilter === 'active' && isPayoutReady) return false;
        if (statusFilter === 'payout_ready' && !isPayoutReady) return false;
      }

      return true;
    });
  }, [vaults, searchQuery, tierFilter, statusFilter, userAddress]);

  // Aggregate stats
  const totalVolumeUSDC = useMemo(() => {
    return vaults.reduce((acc, v) => acc + Number(formatUnits(v.balance, 18)), 0);
  }, [vaults]);

  const totalMembers = useMemo(() => {
    return vaults.reduce((acc, v) => acc + Number(v.memberCount), 0);
  }, [vaults]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-0.5 text-xs text-zinc-300 mb-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Arc Mainnet Registry</span>
            <span className="text-zinc-500">•</span>
            <a
              href={`https://explorer.arc.io/address/${FACTORY_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-zinc-400 hover:text-white transition-colors"
            >
              <span>{FACTORY_ADDRESS.slice(0, 6)}...{FACTORY_ADDRESS.slice(-4)}</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Cooperative Circle Registry
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Browse and participate in verified rotating savings circles operating natively on Arc Mainnet. Settle in pure USDC with sub-cent gas overhead.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadVaults}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-[#121216] px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all"
            title="Refresh pool registry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/create"
            className="flex items-center justify-center gap-2 rounded-xl bg-white text-zinc-900 px-4 py-2.5 text-xs font-semibold hover:bg-zinc-200 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Deploy Cooperative</span>
          </Link>
        </div>
      </div>

      {/* Connected Member Portfolio Summary Banner */}
      {userAddress && myVaults.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-white">Your Circle Portfolio</h2>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  {myVaults.length} {myVaults.length === 1 ? 'Circle' : 'Circles'} Enrolled
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {myUnpaidCount > 0
                  ? `You have ${myUnpaidCount} cycle contribution${myUnpaidCount > 1 ? 's' : ''} currently due.`
                  : 'All your cycle contributions are paid and current.'}
                {myExtraSavingsUSDC > 0 && (
                  <span className="ml-1.5 text-cyan-300 font-semibold font-mono">
                    • +${myExtraSavingsUSDC.toFixed(2)} USDC in Extra Advance/Booster Reserves
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter(statusFilter === 'my_circles' ? 'all' : 'my_circles')}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              statusFilter === 'my_circles'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            {statusFilter === 'my_circles' ? 'Showing Enrolled Circles ✓' : `Filter Enrolled (${myVaults.length})`}
          </button>
        </div>
      )}

      {/* Network Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e12] p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Registered Pools</span>
            <Layers className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-mono tabular-nums">{vaults.length}</p>
          <span className="text-[11px] text-zinc-400">Active contracts on Arc</span>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e12] p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Total Pooled Volume</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-mono tabular-nums truncate">
            ${totalVolumeUSDC.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-400">Native USDC locked</span>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e12] p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Enrolled Participants</span>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-mono tabular-nums">{totalMembers}</p>
          <span className="text-[11px] text-zinc-400">Unique group positions</span>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e12] p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Average Network Fee</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 font-mono tabular-nums">~$0.005</p>
          <span className="text-[11px] text-zinc-400">USDC protocol gas</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-zinc-800/80 bg-[#0e0e12] p-3 sm:p-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search circles by name or contract address..."
            className="w-full rounded-xl border border-zinc-800 bg-[#09090c] pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Tier filter */}
          <div className="flex items-center overflow-x-auto no-scrollbar rounded-xl bg-[#09090c] p-1 border border-zinc-800 max-w-full">
            {(['all', 'micro', 'standard', 'high'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize whitespace-nowrap transition-all ${
                  tierFilter === tier
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tier === 'all' ? 'All Tiers' : tier === 'micro' ? '<$25' : tier === 'standard' ? '$25–$100' : '>$100'}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center overflow-x-auto no-scrollbar rounded-xl bg-[#09090c] p-1 border border-zinc-800 max-w-full">
            {(['all', 'my_circles', 'active', 'payout_ready'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  statusFilter === status
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {status === 'all'
                  ? 'All Circles'
                  : status === 'my_circles'
                  ? `My Circles${myVaults.length > 0 ? ` (${myVaults.length})` : ''}`
                  : status === 'active'
                  ? 'Active'
                  : 'Payout Ready'}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Pools Grid */}
      {filteredVaults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVaults.map((vault) => (
            <VaultCard key={vault.address} vault={vault} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-[#0e0e12] p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-white mt-4">No matching circles found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or deploy a new cooperative circle contract.
          </p>
          <div className="mt-6">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-zinc-900 px-4 py-2.5 text-xs font-semibold hover:bg-zinc-200 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Deploy New Circle</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
