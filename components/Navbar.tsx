'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useBalance } from 'wagmi';
import { formatAddress, formatUSDC } from '@/lib/utils';
import { arcMainnet } from '@/lib/arcChain';
import { ensureArcNetwork } from '@/lib/switchNetwork';
import { useState, useEffect } from 'react';
import { useFarcaster } from './FarcasterProvider';
import { 
  ShieldCheck, 
  Sparkles, 
  Wallet, 
  ChevronDown, 
  ExternalLink, 
  Coins, 
  Bot, 
  Menu, 
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Share2,
  BookmarkPlus
} from 'lucide-react';

interface NavbarProps {
  onOpenAiAssistant?: () => void;
}

export function Navbar({ onOpenAiAssistant }: NavbarProps) {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { isInMiniApp, user: farcasterUser, isAdded, shareCast, addMiniApp } = useFarcaster();
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Automatically connect Farcaster wallet when opened inside a Farcaster client
  useEffect(() => {
    if (isInMiniApp && !isConnected && connectors.length > 0) {
      const fcConnector = connectors.find(
        (c) => c.id.toLowerCase().includes('farcaster') || c.name.toLowerCase().includes('farcaster')
      );
      if (fcConnector) {
        connect({ connector: fcConnector });
      }
    }
  }, [isInMiniApp, isConnected, connectors, connect]);

  const { data: balanceData } = useBalance({
    address,
    chainId: arcMainnet.id,
  });

  const isWrongNetwork = isConnected && chainId !== arcMainnet.id;

  const navLinks = [
    { name: 'Explore Pools', href: '/explore' },
    { name: 'Deploy Vault', href: '/create' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#09090b]/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0c0c0e]">
                <Coins className="h-5 w-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">GScoop</span>
                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  Arc Mainnet
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-normal">Global Synergy Cooperative</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white bg-white/[0.08] shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Status, AI trigger & Wallet */}
        <div className="flex items-center gap-2.5">
          
          {/* Share on Farcaster Button */}
          <button
            onClick={() => {
              const currentUrl = typeof window !== 'undefined' ? window.location.origin + pathname : 'https://gscoop.vercel.app';
              shareCast(
                'Saving and earning yield together with native USDC on Arc Mainnet via GScoop!',
                currentUrl
              );
            }}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-all"
            title="Share on Farcaster"
          >
            <Share2 className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Cast</span>
          </button>

          {/* AI Assistant Button */}
          {onOpenAiAssistant && (
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all shadow-sm shadow-cyan-500/10"
              title="Chat with GScoop AI Coop Assistant"
            >
              <Bot className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">Coop AI</span>
            </button>
          )}

          {/* Arc Zero-Friction Gas Indicator */}
          <div className="hidden lg:flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#121215] px-3 py-1.5 text-xs text-zinc-300">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span>Gas:</span>
            <span className="font-semibold text-emerald-400">Native USDC</span>
            <span className="text-[10px] text-zinc-400">($0.005/tx)</span>
          </div>

          {/* Network Switcher Alert or Status */}
          {isWrongNetwork ? (
            <button
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
              className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>{isSwitchingNetwork ? 'Switching...' : 'Switch to Arc'}</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-mono text-[11px]">Arc (5042)</span>
            </div>
          )}

          {/* Connect / User Wallet Menu */}
          {!isConnected ? (
            <button
              onClick={() => {
                if (isInMiniApp) {
                  const fcConnector = connectors.find(
                    (c) => c.id.toLowerCase().includes('farcaster') || c.name.toLowerCase().includes('farcaster')
                  );
                  if (fcConnector) {
                    connect({ connector: fcConnector });
                    return;
                  }
                }
                const injectedConnector =
                  connectors.find(
                    (c) => c.name.toLowerCase().includes('injected') || c.name.toLowerCase().includes('metamask')
                  ) || connectors[0];
                if (injectedConnector) {
                  connect({ connector: injectedConnector });
                }
              }}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-emerald-500/20 hover:opacity-95 active:scale-98 transition-all"
            >
              <Wallet className="h-4 w-4" />
              <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-2 rounded-xl border border-white/[0.12] bg-[#141418] px-3 py-1.5 text-xs font-medium text-white hover:border-white/20 transition-all shadow-sm"
              >
                {farcasterUser?.pfpUrl ? (
                  <img
                    src={farcasterUser.pfpUrl}
                    alt={farcasterUser.username || 'Farcaster'}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                )}
                <span className="font-mono">
                  {farcasterUser?.username ? `@${farcasterUser.username}` : formatAddress(address)}
                </span>
                {balanceData && (
                  <span className="border-l border-white/10 pl-2 text-emerald-400 font-semibold">
                    ${formatUSDC(balanceData.value)} USDC
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              </button>

              {showWalletMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/[0.1] bg-[#121215] p-2 shadow-2xl backdrop-blur-2xl z-50">
                  <div className="p-2 border-b border-white/[0.08]">
                    {farcasterUser && (
                      <div className="mb-2 flex items-center gap-2 rounded-lg bg-purple-500/10 border border-purple-500/20 px-2 py-1.5">
                        {farcasterUser.pfpUrl && (
                          <img
                            src={farcasterUser.pfpUrl}
                            alt={farcasterUser.username || 'FID'}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                        )}
                        <div className="truncate">
                          <p className="text-xs font-semibold text-purple-200 truncate">
                            {farcasterUser.displayName || `@${farcasterUser.username}`}
                          </p>
                          <p className="text-[10px] text-purple-400">FID #{farcasterUser.fid}</p>
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-zinc-400">Connected Wallet</p>
                    <p className="font-mono text-xs font-semibold text-white truncate mt-0.5">{address}</p>
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-black/40 p-2 text-xs">
                      <span className="text-zinc-400">Native USDC:</span>
                      <span className="font-semibold text-emerald-400 font-mono">
                        ${balanceData ? formatUSDC(balanceData.value) : '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    {isInMiniApp && !isAdded && (
                      <button
                        onClick={() => {
                          addMiniApp();
                          setShowWalletMenu(false);
                        }}
                        className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-purple-300 hover:bg-purple-500/10 transition-colors"
                      >
                        <span>Save Mini App to Farcaster</span>
                        <BookmarkPlus className="h-3.5 w-3.5 text-purple-400" />
                      </button>
                    )}
                    <a
                      href={`https://explorer.arc.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] transition-colors"
                    >
                      <span>View on Arc Explorer</span>
                      <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                    </a>
                  </div>

                  <div className="pt-1 border-t border-white/[0.08]">
                    <button
                      onClick={() => {
                        disconnect();
                        setShowWalletMenu(false);
                      }}
                      className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#09090b] px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
            <span>Arc Gas Token:</span>
            <span className="font-semibold text-emerald-400">USDC (18 Decimals)</span>
          </div>
        </div>
      )}
    </header>
  );
}
