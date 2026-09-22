'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Zap, 
  Coins, 
  Key, 
  Settings, 
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'assistant' | 'user';
  text: string;
  time: string;
  isRealGemini?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'assistant',
    text: "Hello! I am your GScoop AI Synergy Guide powered by Google Gemini. I'm here to explain how decentralized rotating savings circles work on Arc Mainnet, why native USDC gas removes all Web3 friction, how idle funds earn float yield, and how you can securely borrow against your future turn.",
    time: 'Just now',
  },
];

const PRESET_TOPICS = [
  {
    label: '💰 Earning Yield & Loans',
    prompt: 'How can cooperative cycles earn on their savings and how can loans be securely taken?',
  },
  {
    label: '⚡ Why Native USDC Gas?',
    prompt: 'Why does Arc using USDC as the native gas token eliminate traditional crypto friction for savings pools?',
  },
  {
    label: '🔄 How Rotating Payouts Work',
    prompt: 'How does the GScoop smart contract state machine replace human treasurers in rotating savings groups?',
  },
  {
    label: '🛡️ Security & Defaults',
    prompt: 'What happens if a member defaults or misses a cycle deadline in a GScoop vault?',
  },
  {
    label: '🚀 How to Deploy a Vault',
    prompt: 'Walk me through how to deploy a new cooperative vault on Arc Mainnet in under 30 seconds.',
  },
];

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [isRealGeminiActive, setIsRealGeminiActive] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gscoop_gemini_api_key') || '';
      setSavedApiKey(stored);
      setApiKeyInput(stored);
      if (stored) setIsRealGeminiActive(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner speech output
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    setSavedApiKey(cleanKey);
    if (typeof window !== 'undefined') {
      if (cleanKey) {
        localStorage.setItem('gscoop_gemini_api_key', cleanKey);
        setIsRealGeminiActive(true);
      } else {
        localStorage.removeItem('gscoop_gemini_api_key');
        setIsRealGeminiActive(false);
      }
    }
    setShowKeyConfig(false);
  };

  // Local expert fallback generator if real Gemini API key is not yet set
  const generateFallbackAnswer = (question: string): string => {
    const q = question.toLowerCase();

    if (q.includes('gas') || q.includes('usdc') || q.includes('friction') || q.includes('native')) {
      return (
        "**The Arc Native USDC Advantage:**\n\n" +
        "On conventional EVM networks (like Ethereum or Polygon), everyday users who want to save in dollars are forced to undergo a tedious multi-step process: buy ETH or MATIC, bridge it, calculate gwei, and balance two separate token balances. This kills mainstream adoption.\n\n" +
        "On **Arc Mainnet**, USDC is the protocol-level native gas token with 18 decimals. When you deposit into a GScoop vault, your micro-network fee (around **~$0.005**) is deducted directly from your USDC balance. You never have to acquire a separate volatile gas token. It's pure, dollar-denominated, frictionless saving."
      );
    }

    if (q.includes('rotat') || q.includes('savings') || q.includes('payout') || q.includes('treasurer')) {
      return (
        "**Trust-Minimized State Machine (Algorithmic Rotating Payouts):**\n\n" +
        "In traditional Rotating Savings and Credit Associations (ROSCAs or savings circles), members contribute to a central pool, and one member takes home the lump sum each cycle.\n\n" +
        "However, traditional systems suffer from **human treasurer vulnerability**—the organizer can misappropriate funds, show favoritism, or abscond.\n\n" +
        "GScoop replaces the human treasurer with **`GScoopVault.sol`**, an immutable deterministic state machine. Member addresses are locked in an ordered FIFO queue. Every cycle, the beneficiary is computed mathematically (`currentCycle % memberQueue.length`). As soon as contributions are complete or the deadline passes, funds are disbursed instantaneously and directly to the beneficiary's wallet."
      );
    }

    if (q.includes('yield') || q.includes('earn') || q.includes('loan') || q.includes('borrow') || q.includes('auction') || q.includes('credit')) {
      return (
        "**Earning Yield & Secure Lending on GScoop:**\n\n" +
        "1. **Float Yield Compounding**: During active cycles, idle native USDC is routed into an ERC-4626 strategy earning ~5.2% APY. The accrued interest automatically builds the cooperative's reserve fund or boosts the beneficiary's pot!\n\n" +
        "2. **Turn-Collateralized Borrowing (Up to 75%)**: Enrolled members can borrow liquidity against their guaranteed future scheduled turn. The smart contract holds the future payout rights as collateral and **automatically garnishes principal + 2% fee** when their turn arrives.\n\n" +
        "3. **Turn-Bidding Auction (Zero-Risk Advance)**: Members in urgent need of capital can bid an upfront discount to claim the pot immediately. The discount is split and distributed as **instant cash dividends** to the patient savers!"
      );
    }

    if (q.includes('default') || q.includes('miss') || q.includes('deadline') || q.includes('security')) {
      return (
        "**Security & Automated Deadlines:**\n\n" +
        "1. **Pausable & Non-Reentrant**: GScoop contracts inherit OpenZeppelin's `ReentrancyGuard` and `Pausable` for battle-tested protection against reentrancy exploits.\n" +
        "2. **Cycle Deadlines**: Each vault defines a strict `cycleDuration` (e.g. 7 days). If a cycle reaches its timestamp deadline, the accumulated balance can be settled to the scheduled beneficiary even if some members lagged, preventing funds from being held hostage.\n" +
        "3. **Social & Sybil Security**: GScoop vaults are designed for curated affinity groups (families, coworkers, builder circles, guilds) where member addresses are verified by the group organizer."
      );
    }

    if (q.includes('create') || q.includes('deploy') || q.includes('start')) {
      return (
        "**Deploying a GScoop Vault in 3 Easy Steps:**\n\n" +
        "1. Click **'Deploy Vault'** in the top navigation.\n" +
        "2. Choose your pool name, fixed contribution per member (e.g., 50 USDC), cycle duration (e.g., 7 days), and max member capacity.\n" +
        "3. Submit the transaction via `GScoopFactory.createCoop()`. Thanks to Arc's sub-second finality, your vault is live in ~1 second with its own dedicated dashboard and shareable link!"
      );
    }

    return (
      "GScoop brings the time-tested **collaborative savings circle model** on-chain with zero Web3 gas barriers. " +
      "By utilizing Arc Mainnet's native USDC architecture, all deposits, claims, and micro-fees are 100% dollar-denominated. " +
      "Feel free to ask me anything about pool creation, the rotating state machine, or Arc's sub-second settlement!"
    );
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    try {
      // Attempt call to Real Gemini via /api/chat
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedApiKey ? { 'x-gemini-api-key': savedApiKey } : {}),
        },
        body: JSON.stringify({
          messages: newHistory,
          apiKey: savedApiKey,
        }),
      });

      const data = await res.json();

      if (data.hasRealGeminiKey && data.reply) {
        setIsRealGeminiActive(true);
        const aiMsg: Message = {
          role: 'assistant',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRealGemini: true,
        };
        setMessages((prev) => [...prev, aiMsg]);
        speakText(data.reply);
      } else {
        // Fallback to local expert engine
        const fallbackAnswer = generateFallbackAnswer(query);
        const aiMsg: Message = {
          role: 'assistant',
          text: fallbackAnswer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRealGemini: false,
        };
        setMessages((prev) => [...prev, aiMsg]);
        speakText(fallbackAnswer);
      }
    } catch (err) {
      console.warn('API route failed, using local expert fallback:', err);
      const fallbackAnswer = generateFallbackAnswer(query);
      const aiMsg: Message = {
        role: 'assistant',
        text: fallbackAnswer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRealGemini: false,
      };
      setMessages((prev) => [...prev, aiMsg]);
      speakText(fallbackAnswer);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-2xl h-[660px] rounded-2xl border border-white/[0.12] bg-[#0c0c0f] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#121216]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-black">
                <Bot className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">GScoop AI Assistant</h3>
                {isRealGeminiActive ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Gemini 2.5 Flash</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400 border border-cyan-500/20">
                    Arc Cooperative Guide
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">Ask about rotating savings, Arc USDC gas, yield, or borrowing</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Key Settings Button */}
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className={`p-2 rounded-lg border transition-all ${
                savedApiKey
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title="Configure Google Gemini API Key"
            >
              <Key className="h-4 w-4" />
            </button>

            {/* Speech synthesis toggle */}
            <button
              onClick={() => {
                const nextState = !speechEnabled;
                setSpeechEnabled(nextState);
                if (!nextState && typeof window !== 'undefined') {
                  window.speechSynthesis?.cancel();
                }
              }}
              className={`p-2 rounded-lg border transition-colors ${
                speechEnabled
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                  : 'border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title={speechEnabled ? 'Voice enabled (Click to mute)' : 'Enable voice responses'}
            >
              {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* API Key Configuration Dropdown */}
        {showKeyConfig && (
          <div className="p-4 bg-[#14141a] border-b border-white/[0.08] animate-in fade-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-emerald-400" />
                  Connect Real Google Gemini 2.5 Flash
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your Gemini API Key (or set GEMINI_API_KEY in .env.local)..."
                  className="flex-1 rounded-xl border border-white/[0.1] bg-black/60 px-3.5 py-2 text-xs font-mono text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-black hover:bg-emerald-400 transition-colors"
                >
                  Save
                </button>
              </div>

              <p className="text-[11px] text-zinc-400">
                Key is stored securely in your browser session or can be specified via <code className="text-zinc-200">GEMINI_API_KEY</code> on your server.
              </p>
            </form>
          </div>
        )}

        {/* Quick Topics */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/[0.04] bg-[#0f0f13] overflow-x-auto no-scrollbar">
          {PRESET_TOPICS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.prompt)}
              className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[84%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow-md shadow-emerald-500/10'
                    : 'bg-[#15151a] border border-white/[0.08] text-zinc-200 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{m.time}</span>
                  {m.isRealGemini && (
                    <span className="text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                      <Sparkles className="h-2.5 w-2.5" />
                      Gemini
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-[#15151a] border border-white/[0.08] px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>Gemini thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/[0.08] bg-[#121216]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Gemini about Arc native gas, float yield, borrowing against turns..."
              className="flex-1 rounded-xl border border-white/[0.1] bg-[#1a1a20] px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold shadow-lg shadow-emerald-500/20 hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
