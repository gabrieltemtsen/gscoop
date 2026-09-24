'use client';

import { useState, useEffect, useMemo } from 'react';
import { getStoredVaults, CoopVaultData } from '@/lib/vaultStore';
import { fetchAllOnChainVaults } from '@/lib/onChainVaults';
import { FACTORY_ADDRESS } from '@/lib/contracts';
import { VaultCard } from '@/components/VaultCard';
import { formatUnits } from 'viem';
import { 
  Search, 
  Filter, 
  Coins, 
  Layers, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  TrendingUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function ExplorePage() {
  const [vaults, setVaults] = useState<CoopVaultData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'micro' | 'standard' | 'high'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'payout_ready'>('all');
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

      // Status filter
      const now = Math.floor(Date.now() / 1000);
      const isPayoutReady =
        now >= Number(v.cycleDeadline) || (v.memberCount > 0 && v.cycleDeposits >= v.memberCount);

      if (statusFilter === 'active' && isPayoutReady) return false;
      if (statusFilter === 'payout_ready' && !isPayoutReady) return false;

      return true;
    });
  }, [vaults, searchQuery, tierFilter, statusFilter]);

  // Aggregate stats
  const totalVolumeUSDC = useMemo(() => {
    return vaults.reduce((acc, v) => acc + Number(formatUnits(v.balance, 18)), 0);
  }, [vaults]);

  const totalMembers = useMemo(() => {
    return vaults.reduce((acc, v) => acc + Number(v.memberCount), 0);
  }, [vaults]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400 mb-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Arc Mainnet On-Chain Registry</span>
            <a
              href={`https://explorer.arc.io/address/${FACTORY_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white font-mono transition-colors"
            >
              <span>{FACTORY_ADDRESS.slice(0, 6)}...{FACTORY_ADDRESS.slice(-4)}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Explore Cooperative Pools
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Browse verified collaborative savings circles operating on Arc Mainnet. Contribute exact USDC amounts with fractions of a cent network fees.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadVaults}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#141418] px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all"
            title="Refresh pool registry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/create"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Deploy New Vault</span>
          </Link>
        </div>
      </div>

      {/* Network Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Pools</span>
            <Layers className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{vaults.length}</p>
          <span className="text-[11px] text-zinc-400">Active Arc cooperatives</span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Pooled Liquidity</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            ${totalVolumeUSDC.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-400">Locked in native USDC</span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Coop Members</span>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{totalMembers}</p>
          <span className="text-[11px] text-zinc-400">Active participating wallets</span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Network Fee</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-400 mt-1 font-mono">~$0.005</p>
          <span className="text-[11px] text-zinc-400">Paid directly in USDC gas</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#121215] p-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cooperatives by name or 0x address..."
            className="w-full rounded-xl border border-white/[0.08] bg-[#0c0c0e] pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Tier filter */}
          <div className="flex items-center rounded-xl bg-[#0c0c0e] p-1 border border-white/[0.08]">
            {(['all', 'micro', 'standard', 'high'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                  tierFilter === tier
                    ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tier === 'all' ? 'All Tiers' : tier}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center rounded-xl bg-[#0c0c0e] p-1 border border-white/[0.08]">
            {(['all', 'active', 'payout_ready'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-white/[0.12] text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {status === 'all' ? 'All Status' : status === 'active' ? 'Active' : 'Payout Ready'}
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
        <div className="rounded-3xl border border-dashed border-white/[0.12] bg-[#0c0c0f] p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white mt-4">No matching pools found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or deploy the first cooperative in this tier.
          </p>
          <div className="mt-6">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-black"
            >
              <Plus className="h-4 w-4" />
              <span>Deploy New Cooperative</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
