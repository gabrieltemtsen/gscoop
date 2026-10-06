'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Calculator, 
  ArrowRight, 
  Coins, 
  Zap, 
  TrendingUp, 
  Users, 
  Clock, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const PRESET_AMOUNTS = [25, 50, 100, 250];
const PRESET_MEMBERS = [5, 10, 15, 20];
const CADENCES = [
  { label: 'Weekly (7d)', days: 7, seconds: 7 * 86400 },
  { label: 'Bi-Weekly (14d)', days: 14, seconds: 14 * 86400 },
  { label: 'Monthly (30d)', days: 30, seconds: 30 * 86400 },
];

export function SavingsCalculator() {
  const [contribution, setContribution] = useState<number>(50);
  const [members, setMembers] = useState<number>(10);
  const [cadenceIndex, setCadenceIndex] = useState<number>(0);

  const selectedCadence = CADENCES[cadenceIndex];

  // Financial simulations
  const potSize = useMemo(() => contribution * members, [contribution, members]);
  const rotationDays = useMemo(() => selectedCadence.days * members, [selectedCadence, members]);
  
  // Approximate idle float yield generated across the whole pool duration at 5.2% APY
  const estimatedYield = useMemo(() => {
    const years = rotationDays / 365;
    const avgBalance = potSize * 0.5; // Average balance held throughout the cycle
    return (avgBalance * 0.052 * years).toFixed(2);
  }, [potSize, rotationDays]);

  // Network gas savings comparison:
  // Arc: ~0.005 per deposit * members * members
  const arcGasTotal = useMemo(() => (0.005 * members * members).toFixed(3), [members]);
  const ethGasTotal = useMemo(() => (18 * members * members).toFixed(0), [members]);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e12] p-6 sm:p-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 mb-2">
            <Calculator className="h-3.5 w-3.5" />
            <span>Interactive Protocol Simulator</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Collaborative Savings & Rotation Calculator
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Simulate turn payouts, full circle duration, float yield, and native Arc gas efficiency.
          </p>
        </div>

        <Link
          href={`/create?contribution=${contribution}&members=${members}&duration=${selectedCadence.seconds}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 px-4 py-2.5 text-xs font-semibold shadow-sm transition-all shrink-0"
        >
          <span>Deploy This Configuration</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Inputs */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* 1. Contribution Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-300">
                Contribution per Savers' Turn
              </label>
              <span className="font-mono text-xs font-bold text-white">
                ${contribution} USDC
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setContribution(amt)}
                  className={`rounded-lg py-1.5 text-xs font-mono font-medium border transition-all ${
                    contribution === amt
                      ? 'border-zinc-700 bg-zinc-800 text-white font-bold'
                      : 'border-zinc-800 bg-[#09090c] text-zinc-400 hover:text-white'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={contribution}
              onChange={(e) => setContribution(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* 2. Number of Savers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-300">
                Circle Size (Participants)
              </label>
              <span className="font-mono text-xs font-bold text-white">
                {members} Savers
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESET_MEMBERS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMembers(count)}
                  className={`rounded-lg py-1.5 text-xs font-mono font-medium border transition-all ${
                    members === count
                      ? 'border-zinc-700 bg-zinc-800 text-white font-bold'
                      : 'border-zinc-800 bg-[#09090c] text-zinc-400 hover:text-white'
                  }`}
                >
                  {count} savers
                </button>
              ))}
            </div>

            <input
              type="range"
              min="3"
              max="30"
              step="1"
              value={members}
              onChange={(e) => setMembers(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* 3. Cadence */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Rotation Cadence
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CADENCES.map((cadence, idx) => (
                <button
                  key={cadence.label}
                  type="button"
                  onClick={() => setCadenceIndex(idx)}
                  className={`rounded-xl p-2.5 text-left border transition-all ${
                    cadenceIndex === idx
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                      : 'border-zinc-800 bg-[#09090c] text-zinc-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-semibold text-zinc-200">{cadence.label}</p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">every {cadence.days}d</p>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Output Dashboard */}
        <div className="lg:col-span-6 space-y-4 rounded-xl border border-zinc-800/80 bg-[#09090c] p-5">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3.5">
              <span className="text-[11px] text-zinc-400 font-medium">Lump-Sum Turn Payout</span>
              <p className="text-xl font-bold text-white font-mono tabular-nums mt-0.5">
                ${potSize.toLocaleString()} <span className="text-xs text-zinc-400">USDC</span>
              </p>
              <span className="text-[10px] text-emerald-400 font-medium">
                100% On-Chain Settlement
              </span>
            </div>

            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3.5">
              <span className="text-[11px] text-zinc-400 font-medium">Full Rotation Span</span>
              <p className="text-xl font-bold text-zinc-200 font-mono tabular-nums mt-0.5">
                {rotationDays} Days
              </p>
              <span className="text-[10px] text-zinc-400">
                {members} recurring cycles
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3.5">
              <span className="text-[11px] text-zinc-400 font-medium">Float Yield (5.2% APY)</span>
              <p className="text-lg font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                +${estimatedYield} USDC
              </p>
              <span className="text-[10px] text-zinc-400">
                Cooperative buffer earned
              </span>
            </div>

            <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-3.5">
              <span className="text-[11px] text-zinc-400 font-medium">Turn Credit Limit (75%)</span>
              <p className="text-lg font-bold text-cyan-400 font-mono tabular-nums mt-0.5">
                ${(potSize * 0.75).toFixed(2)} USDC
              </p>
              <span className="text-[10px] text-zinc-400">
                Emergency advance facility
              </span>
            </div>
          </div>

          {/* Gas Overhead Comparison Callout */}
          <div className="rounded-xl bg-emerald-950/15 border border-emerald-500/20 p-3.5 flex items-start gap-3">
            <Zap className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-emerald-300">
                Arc Gas Cost: ~${arcGasTotal} USDC Total
              </span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                By settling in native USDC on Arc, your circle saves approximately <strong className="text-white">${ethGasTotal} in volatile gas fees</strong> compared to executing {members * members} transactions on Ethereum L1.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
