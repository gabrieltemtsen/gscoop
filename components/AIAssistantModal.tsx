'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Volume2, VolumeX, ShieldCheck, Zap, Coins } from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'assistant' | 'user';
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'assistant',
    text: "Hello! I am your GScoop AI Synergy Guide. I'm here to explain how decentralized rotating savings circles work on Arc Mainnet, why our native USDC gas model removes all Web3 onboarding friction, and how you can save together with zero treasurer risk.",
    time: 'Just now',
  },
];

const PRESET_TOPICS = [
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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const generateAnswer = (question: string): string => {
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

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const answer = generateAnswer(query);
      const aiMsg: Message = {
        role: 'assistant',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
      speakText(answer);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-2xl h-[640px] rounded-2xl border border-white/[0.12] bg-[#0c0c0f] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#121216]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-black">
                <Bot className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">GScoop AI Assistant</h3>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                  Arc Native
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Ask about rotating savings, Arc USDC gas, or coop rules</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

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
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow-md shadow-emerald-500/10'
                    : 'bg-[#15151a] border border-white/[0.08] text-zinc-200 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <span className={`block mt-1 text-[10px] ${m.role === 'user' ? 'text-emerald-200' : 'text-zinc-400'}`}>
                  {m.time}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-[#15151a] border border-white/[0.08] px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
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
              placeholder="Ask about Arc native gas, rotating payouts, or setting up a pool..."
              className="flex-1 rounded-xl border border-white/[0.1] bg-[#1a1a20] px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold shadow-lg shadow-emerald-500/20 hover:opacity-90 disabled:opacity-40 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
