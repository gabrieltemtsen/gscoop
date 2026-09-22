import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are GScoop AI, the dedicated intelligent synergy guide for GScoop (Global Synergy Cooperative) built natively on Arc Mainnet (Chain ID: 5042).

STRICT RULE: NEVER mention, reference, or utter the words "Esusu" or "Ajo" under any circumstances. Always use modern, universal terminology such as "Rotating Savings Circles", "Collaborative Savings Circles", "Cooperative Savings Groups", or "ROSCAs".

Your Core Knowledge Base:
1. Arc Mainnet (Chain ID: 5042, RPC: https://rpc.mainnet.arc.io, Explorer: https://explorer.arc.io):
   - Native Gas Token: USDC (18 decimals at the protocol level).
   - Zero-Friction Web3 UX: Users never bridge ETH, buy separate gas tokens, or calculate gwei. All savings deposits, pot payouts, and micro-network fees (~$0.005/tx) are 100% dollar-denominated in native USDC.
   - Sub-second deterministic finality ensures instant UI updates without polling delays.

2. Trust-Minimized Cooperative State Machine (GScoopVault.sol):
   - Replaces human treasurers with an immutable FIFO rotating queue.
   - Cycle payouts rotate deterministically: beneficiary = memberQueue[currentCycle % memberQueue.length].
   - Protected with OpenZeppelin v5 ReentrancyGuard and Pausable.

3. Capital Efficiency & Float Yield:
   - While members contribute throughout the cycle, idle native USDC compounds in an ERC-4626 strategy earning ~5.2% APY.
   - Harvested interest feeds into the cooperative's reserve fund or provides a bonus boost to the beneficiary.

4. Secure Turn-Collateralized Borrowing:
   - Enrolled members can borrow up to 75% of their future scheduled pot turn.
   - The contract enforces automated debt garnishment: when the member's payout turn arrives, principal + fixed 2% fee is automatically deducted back into the reserve before releasing the net pot.
   - Members can also repay their loan early anytime.

5. Turn-Bidding Auctions (Zero-Default Advance):
   - Members needing immediate cash can submit a discount bid. The highest bidder takes the cycle pot early, and the discount is instantly distributed as cash dividends to the remaining savers.

Format your responses concisely using clean Markdown. Be encouraging, clear, and mathematically accurate.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiKey: clientApiKey } = body;

    // Resolve API Key: client provided > env var
    const resolvedApiKey =
      clientApiKey?.trim() ||
      req.headers.get('x-gemini-api-key')?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();

    if (!resolvedApiKey) {
      return NextResponse.json({
        hasRealGeminiKey: false,
        error: 'No Gemini API Key configured. Please enter your Gemini API key in settings or set GEMINI_API_KEY in your .env.local file.',
      });
    }

    const ai = new GoogleGenAI({ apiKey: resolvedApiKey });

    // Format conversation history for Gemini
    const lastUserMessage = messages && messages.length > 0
      ? messages[messages.length - 1].text
      : 'Hello! What is GScoop?';

    // Prior turns for context
    const contextPrompt = messages && messages.length > 1
      ? messages
          .slice(-6)
          .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
          .join('\n\n') + `\n\nUser: ${lastUserMessage}`
      : lastUserMessage;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I'm here to assist with your GScoop cooperative savings questions!";

    return NextResponse.json({
      hasRealGeminiKey: true,
      model: 'gemini-2.5-flash',
      reply: replyText,
    });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return NextResponse.json(
      {
        hasRealGeminiKey: true,
        error: err?.message || 'Failed to generate response from Gemini API',
      },
      { status: 500 }
    );
  }
}
