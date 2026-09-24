import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are GScoop AI Copilot, the financial assistant for GScoop (Global Synergy Cooperative) deployed live on Arc Mainnet (Chain ID: 5042).

CRITICAL PROHIBITION:
Under NO circumstances may you write, mention, or suggest the words "Esusu" or "Ajo". You MUST always use modern financial terms like "Rotating Savings Circles", "Collaborative Savings Pools", or "ROSCAs".

LENGTH & FORMATTING RULES:
1. Keep answers SHORT and punchy: under 80 words total.
2. Structure answers with 2-3 clean bullet points or 1 brief paragraph. No long essays or walls of text.
3. Be direct, clear, professional, and accurate.

Key Platform Facts:
- Arc Mainnet uses native USDC for gas (18 decimals). Users never bridge ETH or pay volatile gwei; tx fees are ~$0.005 paid in USDC.
- Finality is sub-second (<1s).
- Immutable State Machine: Payouts rotate deterministically (FIFO queue) with zero human treasurer risk.
- Float Yield: Idle funds earn ~5.2% APY via ERC-4626 strategy compounding into community reserves.
- Emergency Borrowing: Savers can borrow up to 75% of future turns with automatic garnishment on their turn.
- Zero-Default Auctions: Members can bid discounts to take the pot early, distributing dividends to savers.
- Scalability: Pools easily scale to 25-100+ members through daily micro-cycles and turn-borrowing.`;

export async function GET() {
  const hasKey = !!(process.env.GEMINI_API_KEY?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim());
  return NextResponse.json({ hasAiKey: hasKey });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    // Server-side environment variable resolution
    const resolvedApiKey =
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();

    if (!resolvedApiKey) {
      return NextResponse.json({
        hasAiKey: false,
        error: 'AI service currently operating in local guided mode.',
      });
    }

    const ai = new GoogleGenAI({ apiKey: resolvedApiKey });

    const lastUserMessage = messages && messages.length > 0
      ? messages[messages.length - 1].text
      : 'What is GScoop?';

    // Concise conversation history
    const contextPrompt = messages && messages.length > 1
      ? messages
          .slice(-4)
          .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
          .join('\n\n') + `\n\nUser: ${lastUserMessage}`
      : lastUserMessage;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });

    const replyText = response.text || "GScoop enables trust-minimized collaborative savings circles on Arc Mainnet with native USDC.";

    return NextResponse.json({
      hasAiKey: true,
      reply: replyText,
    });
  } catch (err: any) {
    console.error('AI Generation Error:', err);
    return NextResponse.json(
      {
        hasAiKey: false,
        error: 'Unable to reach AI service, fallback mode active.',
      },
      { status: 500 }
    );
  }
}
