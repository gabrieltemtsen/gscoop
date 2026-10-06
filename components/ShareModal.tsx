'use client';

import { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  MessageCircle, 
  Send,
  QrCode
} from 'lucide-react';
import { useFarcaster } from './FarcasterProvider';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultName: string;
  vaultAddress: string;
  contributionAmount: string;
}

export function ShareModal({
  isOpen,
  onClose,
  vaultName,
  vaultAddress,
  contributionAmount,
}: ShareModalProps) {
  const { shareCast } = useFarcaster();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/vault/${vaultAddress}`
      : `https://gscoop.xyz/vault/${vaultAddress}`;

  const shareText = `Join our "${vaultName}" collaborative USDC savings circle on Arc Mainnet ($${contributionAmount} USDC/cycle). 100% on-chain, non-custodial, and sub-cent fees!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFarcasterShare = () => {
    shareCast(shareText, url);
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText}\n\n${url}`
    )}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(
      url
    )}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    url
  )}&bgcolor=10-10-14&color=ffffff&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#101014] p-6 shadow-2xl relative text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Invite to Savings Circle</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{vaultName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Copy Link Input */}
        <div className="mt-5 space-y-2">
          <label className="text-xs font-medium text-zinc-300">Circle Invite Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 rounded-xl border border-zinc-800 bg-[#09090c] px-3.5 py-2 text-xs font-mono text-zinc-300 truncate focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 px-3.5 py-2 text-xs font-semibold shadow-sm transition-all shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="mt-5 space-y-2">
          <label className="text-xs font-medium text-zinc-300">Share Across Channels</label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* Farcaster */}
            <button
              onClick={handleFarcasterShare}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-purple-500/25 bg-purple-500/10 hover:bg-purple-500/20 p-3 text-purple-300 text-xs font-semibold transition-all"
            >
              <Share2 className="h-4 w-4 text-purple-400" />
              <span>Farcaster</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20 p-3 text-emerald-300 text-xs font-semibold transition-all"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleTelegramShare}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/20 p-3 text-cyan-300 text-xs font-semibold transition-all"
            >
              <Send className="h-4 w-4 text-cyan-400" />
              <span>Telegram</span>
            </button>
          </div>
        </div>

        {/* QR Code Toggle */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80">
          <button
            onClick={() => setShowQr(!showQr)}
            className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <QrCode className="h-4 w-4 text-zinc-400" />
              <span>{showQr ? 'Hide In-Person QR Code' : 'Show In-Person Mobile QR Code'}</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400">{showQr ? '▲' : '▼'}</span>
          </button>

          {showQr && (
            <div className="mt-3.5 flex flex-col items-center justify-center p-4 rounded-xl bg-[#09090c] border border-zinc-800 text-center animate-in fade-in duration-150">
              <img
                src={qrImageUrl}
                alt={`QR code for ${vaultName}`}
                className="h-40 w-40 rounded-lg border border-zinc-700/60 p-1 bg-white"
              />
              <p className="mt-2 text-[11px] text-zinc-400">
                Scan with any smartphone camera to open and join this circle
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
