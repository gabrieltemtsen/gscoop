'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
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
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'assistant',
    text: "Hello! I am your GScoop Copilot. I can help answer questions about rotating savings cycles, native USDC on Arc, float yields, and turn-based borrowing.",
    time: 'Just now',
  },
];

const PRESET_TOPICS = [
  {
    label: '👥 Large Pools & Scaling',
    prompt: 'How do cooperative vaults scale to 50-100+ members?',
  },
  {
    label: '💰 Float Yield & Loans',
    prompt: 'How does float yield and turn borrowing work?',
  },
  {
    label: '⚡ Native USDC Gas',
    prompt: 'Why does Arc native USDC eliminate gas friction?',
  },
  {
    label: '🔄 Rotating Payouts',
    prompt: 'How does the queue work without a human treasurer?',
  },
  {
    label: '🛡️ Security & Deadlines',
    prompt: 'How are deadlines and defaults handled?',
  },
];

function formatMessageContent(text: string): ReactNode {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
        const cleanLine = isBullet ? trimmed.replace(/^[•\-]\s*/, '') : trimmed;

        // Split **bold** fragments
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 text-zinc-200">
              <span className="text-emerald-400 mt-1 text-xs">•</span>
              <span className="flex-1 leading-relaxed">{renderedLine}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed text-zinc-200">
            {renderedLine}
          </p>
        );
      })}
    </div>
  );
}

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isAiConnected, setIsAiConnected] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Check server environment capability on mount
  useEffect(() => {
    async function checkServerKey() {
      try {
        const res = await fetch('/api/chat');
        const data = await res.json();
        if (data.hasAiKey) {
          setIsAiConnected(true);
        }
      } catch (e) {
        // Fallback gracefully
      }
    }
    checkServerKey();
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`•\-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Concise expert fallback answers
  const generateFallbackAnswer = (question: string): string => {
    const q = question.toLowerCase();

    if (q.includes('member') || q.includes('big') || q.includes('scale') || q.includes('capacity') || q.includes('size')) {
      return (
        "**Scalability on Arc Mainnet:**\n" +
        "• **Fast Micro-Cycles**: Sub-cent gas allows daily cycles so 50 members complete rotation in 50 days.\n" +
        "• **Turn Borrowing**: Savers at turn #45 can borrow up to 75% immediately instead of waiting.\n" +
        "• **Constant Gas**: Contracts run in O(1) execution with zero EVM spikes regardless of pool size."
      );
    }

    if (q.includes('gas') || q.includes('usdc') || q.includes('friction') || q.includes('native')) {
      return (
        "**Native USDC Gas on Arc:**\n" +
        "• **Zero Token Bridging**: USDC is the protocol gas token with 18 decimals.\n" +
        "• **Dollar-Denominated**: Deposits, payouts, and ~$0.005 network fees are 100% USDC.\n" +
        "• **Zero Volatility**: Users never have to manage or bridge volatile tokens."
      );
    }

    if (q.includes('rotat') || q.includes('savings') || q.includes('payout') || q.includes('treasurer')) {
      return (
        "**Trust-Minimized State Machine:**\n" +
        "• **No Human Treasurer**: Payouts execute algorithmically via a deterministic FIFO queue.\n" +
        "• **Automated Rotation**: Each cycle rotates mathematically to `member[cycle % count]`.\n" +
        "• **Instant Settlement**: Distributed directly to the winner's wallet in <1 second."
      );
    }

    if (q.includes('yield') || q.includes('earn') || q.includes('loan') || q.includes('borrow') || q.includes('auction')) {
      return (
        "**Yield & Liquidity Architecture:**\n" +
        "• **Float APY**: Idle pot deposits earn ~5.2% APY in an ERC-4626 strategy to boost reserves.\n" +
        "• **Turn Loans**: Borrow up to 75% of your scheduled turn, auto-repaid when your turn arrives.\n" +
        "• **Turn Auctions**: Bid discounts to claim the pot early; discounts fund dividends for savers."
      );
    }

    if (q.includes('default') || q.includes('miss') || q.includes('deadline') || q.includes('security')) {
      return (
        "**Security & Deadlines:**\n" +
        "• **Cycle Deadlines**: Pots settle automatically when time expires, preventing trapped funds.\n" +
        "• **Smart Collateral**: Borrowed balances are automatically garnished from future pot payouts.\n" +
        "• **Audited Code**: Built with OpenZeppelin ReentrancyGuard and Pausable modules."
      );
    }

    if (q.includes('create') || q.includes('deploy') || q.includes('start')) {
      return (
        "**Deploy in 30 Seconds:**\n" +
        "• Click **Deploy Vault** in top navigation.\n" +
        "• Set contribution amount (e.g. 50 USDC), duration, and member count.\n" +
        "• Confirm on Arc Mainnet—your pool goes live with an instant shareable URL."
      );
    }

    return (
      "GScoop brings collaborative rotating savings circles on Arc Mainnet with native USDC and zero gas friction. Ask any question about pools, yields, or borrowing."
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }),
      });

      const data = await res.json();

      if (data.hasAiKey && data.reply) {
        setIsAiConnected(true);
        const aiMsg: Message = {
          role: 'assistant',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        speakText(data.reply);
      } else {
        const fallbackAnswer = generateFallbackAnswer(query);
        const aiMsg: Message = {
          role: 'assistant',
          text: fallbackAnswer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        speakText(fallbackAnswer);
      }
    } catch (err) {
      const fallbackAnswer = generateFallbackAnswer(query);
      const aiMsg: Message = {
        role: 'assistant',
        text: fallbackAnswer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
        className="relative flex flex-col w-full max-w-2xl h-[620px] rounded-2xl border border-white/[0.12] bg-[#0c0c0f] shadow-2xl overflow-hidden"
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
                <h3 className="text-sm font-semibold text-white">GScoop AI Copilot</h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Arc Mainnet</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Ask about cycles, savings, borrowing, yields, or pool setup</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
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
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
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
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow-md shadow-emerald-500/10'
                    : 'bg-[#15151a] border border-white/[0.08] text-zinc-200 shadow-sm'
                }`}
              >
                <div>{formatMessageContent(m.text)}</div>
                <div className="mt-2 text-right text-[10px] text-zinc-400">
                  {m.time}
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
                  <span>Copilot analyzing...</span>
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
              placeholder="Ask about cycles, savings, borrowing, yields, or pool setup..."
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
