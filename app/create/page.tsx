'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { parseUnits, parseEventLogs } from 'viem';
import { FACTORY_ADDRESS, GSCOOP_FACTORY_ABI } from '@/lib/contracts';
import { arcMainnet } from '@/lib/arcChain';
import { ensureArcNetwork } from '@/lib/switchNetwork';
import { publicClient } from '@/lib/publicClient';
import { fetchOnChainVault } from '@/lib/onChainVaults';
import { saveVault, CoopVaultData } from '@/lib/vaultStore';
import { triggerConfetti } from '@/components/ConfettiCelebration';
import { 
  Sparkles, 
  Layers, 
  Coins, 
  Clock, 
  Users, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const DURATION_PRESETS = [
  { label: 'Daily (24h)', seconds: 86400 },
  { label: '3 Days', seconds: 3 * 86400 },
  { label: 'Weekly (7d)', seconds: 7 * 86400 },
  { label: 'Bi-Weekly (14d)', seconds: 14 * 86400 },
  { label: 'Monthly (30d)', seconds: 30 * 86400 },
];

const CONTRIBUTION_PRESETS = ['10', '25', '50', '100', '250'];
const MEMBER_PRESETS = [5, 10, 25, 50, 100];

export default function CreateVaultPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contribution, setContribution] = useState('50');
  const [cycleDuration, setCycleDuration] = useState(7 * 86400);
  const [maxMembers, setMaxMembers] = useState(10);
  const [isCustomMember, setIsCustomMember] = useState(false);
  const [enableYield, setEnableYield] = useState(true);
  const [enableCredit, setEnableCredit] = useState(true);
  const [enableAuction, setEnableAuction] = useState(true);

  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedVault, setDeployedVault] = useState<CoopVaultData | null>(null);

  const { writeContractAsync } = useWriteContract();

  const isWrongNetwork = isConnected && chainId !== arcMainnet.id;

  // Financial calculations
  const numContribution = parseFloat(contribution) || 0;
  const totalPot = maxMembers > 0 ? numContribution * maxMembers : numContribution;
  const fullRotationDays = maxMembers > 0 ? Math.round((cycleDuration * maxMembers) / 86400) : 0;

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || numContribution <= 0) return;

    if (!isConnected || !address) {
      alert('Please connect your Web3 wallet on Arc Mainnet (Chain ID: 5042) to deploy this cooperative.');
      return;
    }

    setIsDeploying(true);

    try {
      // Automatically ensure wallet is on Arc Mainnet (Chain ID: 5042)
      if (chainId !== arcMainnet.id) {
        await ensureArcNetwork(switchChainAsync);
      }

      const contributionWei = parseUnits(contribution, 18);
      let vaultAddress: `0x${string}` | null = null;

      if (!writeContractAsync) {
        throw new Error('Wallet client writeContractAsync is not available.');
      }

      // Execute on-chain deployment via GScoopFactory on Arc Mainnet
      const hash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: GSCOOP_FACTORY_ABI,
        functionName: 'createCoop',
        args: [name.trim(), contributionWei, BigInt(cycleDuration), BigInt(maxMembers)],
        chainId: arcMainnet.id,
      });

      // Await confirmation on Arc Mainnet with publicClient
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Parse event log
      const logs = parseEventLogs({
        abi: GSCOOP_FACTORY_ABI,
        eventName: 'CoopCreated',
        logs: receipt.logs,
      });

      if (logs && logs.length > 0 && (logs[0] as any).args?.vaultAddress) {
        vaultAddress = (logs[0] as any).args.vaultAddress as `0x${string}`;
      } else {
        // Fallback: read all coops from factory and take the newest one
        const coops = (await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: GSCOOP_FACTORY_ABI,
          functionName: 'getCoops',
        })) as readonly `0x${string}`[];
        if (coops && coops.length > 0) {
          vaultAddress = coops[coops.length - 1];
        }
      }

      if (!vaultAddress) {
        throw new Error('Contract deployed but could not determine new vault address on Arc Mainnet.');
      }

      // Fetch on-chain state or construct initial verified record
      let liveVault = await fetchOnChainVault(vaultAddress);
      if (!liveVault) {
        liveVault = {
          address: vaultAddress,
          name: name.trim(),
          description: description.trim() || 'Custom community cooperative savings pool on Arc Mainnet.',
          contributionAmount: contributionWei,
          cycleDuration: BigInt(cycleDuration),
          cycleDeadline: BigInt(Math.floor(Date.now() / 1000) + cycleDuration),
          currentCycle: BigInt(0),
          balance: BigInt(0),
          memberCount: BigInt(1),
          maxMembers: BigInt(maxMembers),
          cycleDeposits: BigInt(0),
          beneficiary: address,
          creator: address,
          members: [address],
          createdAt: Date.now(),
          yieldEnabled: enableYield,
          yieldApy: enableYield ? 5.2 : undefined,
          accruedYield: BigInt(0),
          reserveFund: BigInt(0),
          currentHighestBid: null,
          activeDebts: {},
        };
      }

      saveVault(liveVault);
      setDeployedVault(liveVault);
      triggerConfetti();
    } catch (err: any) {
      console.error('Deployment failure:', err);
      alert(`Deployment failed: ${err?.shortMessage || err?.message || 'Transaction rejected'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="max-w-2xl mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400 mb-2">
          <Layers className="h-3.5 w-3.5" />
          <span>GScoop Factory V1</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Deploy a Cooperative Vault
        </h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          Configure an immutable rotating savings circle on Arc Mainnet. 
          Zero separate gas token required—fees are fractions of a cent paid directly in native USDC.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left: Interactive Creation Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleDeploy} className="space-y-6 rounded-3xl border border-white/[0.08] bg-[#121215] p-6 sm:p-8 shadow-xl">
            
            {/* Wrong Network Warning Banner */}
            {isWrongNetwork && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-200">
                      Wallet Connected to Different Chain (ID: {chainId})
                    </p>
                    <p className="text-[11px] text-amber-300/80">
                      GScoop vaults run on Arc Mainnet (Chain ID: 5042). Switch network to deploy.
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
                  <span>{isSwitchingNetwork ? 'Switching...' : 'Switch to Arc'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Pool Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Cooperative Pool Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lagos Tech Innovators Circle"
                className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c0e] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Mission / Circle Purpose
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of this savings group, rules, or community target..."
                className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c0e] px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Contribution Amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Contribution per Cycle (Native USDC) *
                </label>
                <span className="text-[11px] text-emerald-400 font-mono">18 decimals</span>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c0e] pl-8 pr-16 py-3 text-sm font-mono text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                  USDC
                </span>
              </div>

              {/* Quick Presets */}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">Quick:</span>
                {CONTRIBUTION_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setContribution(amt)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium border transition-all ${
                      contribution === amt
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:text-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Cycle Duration */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Rotation Frequency (Cycle Duration) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.seconds}
                    type="button"
                    onClick={() => setCycleDuration(preset.seconds)}
                    className={`rounded-xl p-3 text-left border transition-all ${
                      cycleDuration === preset.seconds
                        ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-md shadow-emerald-500/10'
                        : 'border-white/[0.08] bg-[#0c0c0e] text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <p className="text-xs font-bold text-zinc-200">{preset.label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                      Payout every {Math.round(preset.seconds / 86400)}d
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Max Member Capacity *
                </label>
                <span className="text-[11px] text-cyan-400 font-mono">
                  {maxMembers === 0 ? 'Open / Unlimited' : `${maxMembers} Participants`}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {MEMBER_PRESETS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setMaxMembers(count);
                      setIsCustomMember(false);
                    }}
                    className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                      !isCustomMember && maxMembers === count
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : 'border-white/[0.08] bg-[#0c0c0e] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {count}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCustomMember(true)}
                  className={`rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                    isCustomMember
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'border-white/[0.08] bg-[#0c0c0e] text-zinc-400 hover:text-white'
                  }`}
                >
                  Custom
                </button>
              </div>

              {isCustomMember && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="2"
                      max="1000"
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(Math.max(2, parseInt(e.target.value) || 2))}
                      placeholder="e.g. 50"
                      className="w-full rounded-xl border border-cyan-500/40 bg-[#0c0c0e] px-4 py-2 text-xs font-mono text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 font-mono">
                      members
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMaxMembers(0);
                      setIsCustomMember(true);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      maxMembers === 0
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-white/[0.08] bg-[#0c0c0e] text-zinc-400 hover:text-white'
                    }`}
                  >
                    Unlimited (0)
                  </button>
                </div>
              )}

              {/* Dynamic Advisory for Large Pools */}
              {maxMembers >= 20 && (
                <div className="mt-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 p-3 flex items-start gap-2.5">
                  <Users className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-zinc-300 leading-relaxed">
                    <span className="font-semibold text-cyan-300">Large Circle ({maxMembers} Members): </span>
                    <span className="text-zinc-400">
                      High-frequency cycles and turn-borrowing allow large pools to rotate smoothly without long wait times.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Yield & Credit Features */}
            <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#0c0c0e] p-4">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Capital Efficiency & Liquidity
              </span>

              {/* Toggle 1: Yield Strategy */}
              <label className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/[0.02] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={enableYield}
                  onChange={(e) => setEnableYield(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="text-xs space-y-0.5">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    Float Yield Compounding (~5.2% APY)
                  </span>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Idle cycle deposits earn yield to build cooperative reserves or boost pots.
                  </p>
                </div>
              </label>

              {/* Toggle 2: Turn-Collateralized Borrowing */}
              <label className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/[0.02] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={enableCredit}
                  onChange={(e) => setEnableCredit(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="text-xs space-y-0.5">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                    Turn-Collateralized Borrowing (Up to 75%)
                  </span>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Members can borrow liquidity against their scheduled turn with auto-garnishment upon payout.
                  </p>
                </div>
              </label>

              {/* Toggle 3: Turn-Bidding Auction */}
              <label className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/[0.02] cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={enableAuction}
                  onChange={(e) => setEnableAuction(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                />
                <div className="text-xs space-y-0.5">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-amber-400" />
                    Turn-Bidding Auctions (Zero-Default Advance)
                  </span>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Members can bid discounts to take the pot early; discounts fund dividends for other savers.
                  </p>
                </div>
              </label>
            </div>

            {/* Zero Gas Friction Notice */}
            <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/20 p-3.5 flex items-center gap-3">
              <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="text-xs text-zinc-300">
                <span>Arc Mainnet: Estimated deployment fee is </span>
                <strong className="text-emerald-400">~$0.008 USDC</strong>
                <span className="text-zinc-400">. Deducted directly in USDC with zero token bridging.</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isDeploying || !name.trim() || numContribution <= 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-4 text-sm font-bold text-black shadow-lg shadow-emerald-500/25 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isDeploying ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>
                    {isWrongNetwork ? 'Switching to Arc & Deploying...' : 'Deploying to Arc Mainnet...'}
                  </span>
                </>
              ) : isWrongNetwork ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Switch Network & Deploy Cooperative</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Deploy Cooperative Vault</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Live Preview & Summary Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-white/[0.1] bg-[#121215] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Live Vault Preview
              </span>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                Arc Deterministic
              </span>
            </div>

            {/* Visual Preview */}
            <div className="mt-5 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white truncate">
                  {name.trim() || 'Unnamed Cooperative'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {description.trim() || 'Trust-minimized cooperative savings pool on Arc Mainnet.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-black/40 p-4 border border-white/[0.06]">
                <div>
                  <span className="text-[11px] text-zinc-400">Cycle Contribution</span>
                  <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    ${numContribution.toFixed(2)} <span className="text-xs text-zinc-400">USDC</span>
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400">Total Pot / Cycle</span>
                  <p className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                    {maxMembers > 0 ? (
                      <>${totalPot.toFixed(2)} <span className="text-xs text-zinc-400">USDC</span></>
                    ) : (
                      <>Dynamic <span className="text-xs text-zinc-400">(Open)</span></>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-white/[0.06] pt-3">
                <div className="flex justify-between text-zinc-400">
                  <span>Cycle Duration:</span>
                  <span className="text-zinc-200 font-semibold">{Math.round(cycleDuration / 86400)} Days</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Full Circle Rotation:</span>
                  <span className="text-zinc-200 font-semibold">
                    {maxMembers > 0 ? `${fullRotationDays} Days (${maxMembers} cycles)` : 'Continuous Rotating Cycle'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Queue Settlement:</span>
                  <span className="text-emerald-400 font-semibold">FIFO Deterministic</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Reentrancy Protection:</span>
                  <span className="text-emerald-400 font-semibold">OpenZeppelin V5</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Yield Float Compounding:</span>
                  <span className={enableYield ? "text-emerald-400 font-semibold" : "text-zinc-500"}>
                    {enableYield ? "Active (~5.2% APY)" : "Disabled"}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Turn-Collateralized Loans:</span>
                  <span className={enableCredit ? "text-cyan-400 font-semibold" : "text-zinc-500"}>
                    {enableCredit ? "Enabled (Up to 75%)" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* How Arc Works Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0f] p-5 space-y-3 text-xs text-zinc-400">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Immutable Cooperative Guarantee
            </p>
            <p className="leading-relaxed">
              Once deployed via <code className="text-zinc-300">GScoopFactory</code>, no admin or treasurer has custody of funds. 
              Each cycle's total balance transfers automatically to that cycle's scheduled beneficiary upon settlement.
            </p>
          </div>
        </div>

      </div>

      {/* Success Modal */}
      {deployedVault && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/40 bg-[#121216] p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Vault Deployed!</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your cooperative savings vault <strong className="text-white">"{deployedVault.name}"</strong> is live on Arc Mainnet with sub-second finality.
              </p>
            </div>

            <div className="rounded-2xl bg-black/50 p-4 border border-white/[0.06] text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-400">Address:</span>
                <span className="text-emerald-400 truncate max-w-[200px]">{deployedVault.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Contribution:</span>
                <span className="text-white">${numContribution.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Network:</span>
                <span className="text-cyan-400">Arc (5042)</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => router.push(`/vault/${deployedVault.address}`)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all"
              >
                <span>Enter Vault Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setDeployedVault(null)}
                className="text-xs text-zinc-400 hover:text-white transition-colors py-1"
              >
                Deploy Another
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
