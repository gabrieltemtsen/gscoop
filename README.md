# GScoop (Global Synergy Cooperative)

<div align="center">

![GScoop Banner](https://raw.githubusercontent.com/gabrieltemtsen/gscoop/main/public/favicon.ico)

**Trust-Minimized Decentralized Cooperative Savings & Credit Protocol**  
*Natively Deployed on Arc Mainnet*

[![Network](https://img.shields.io/badge/Network-Arc%20Mainnet%20(5042)-10b981?style=flat-square)](https://explorer.arc.io)
[![Gas Token](https://img.shields.io/badge/Gas%20Token-Native%20USDC%20(18%20decimals)-06b6d4?style=flat-square)](https://arc.io)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-3b82f6?style=flat-square)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Tests-19%2F19%20Passing-emerald?style=flat-square)](https://github.com/foundry-rs/foundry)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20App%20Router-black?style=flat-square)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

</div>

---

## 📖 Executive Summary

**GScoop (Global Synergy Cooperative)** is a modern, trust-minimized Rotating Savings and Credit Association (ROSCA) protocol built directly on **Arc Mainnet**. 

For generations, informal cooperative savings groups have enabled communities, trade unions, and families to pool resources, finance ventures, and access mutual credit. However, traditional offline savings circles suffer from critical systemic vulnerabilities:
- **Counterparty & Custody Risk**: Fund holders or treasurers absconding with pooled funds.
- **Record-Keeping & Coordination Friction**: Disputes over turn schedules, missed payments, and ledger errors.
- **Capital Inefficiency**: Idle capital sitting dormant in cash boxes or checking accounts earning zero yield.
- **Rigidity**: Fixed, inflexible quotas and zero access to liquidity before one's assigned turn.

**GScoop solves these problems entirely on-chain** by executing all rules through immutable, audited smart contracts on **Arc Mainnet**, where **USDC is the native gas token**. Savers gain predictable FIFO payouts, automated recurring subscriptions (Autopilot), turn-collateralized emergency loans, discounted turn auctions, float yield compounding, and annual patronage dividends.

---

## 🌐 Arc Mainnet Network Parameters

GScoop is built natively for Arc Mainnet, taking advantage of predictable sub-cent transaction fees and native USDC gas:

| Parameter | Value |
| :--- | :--- |
| **Network Name** | Arc Mainnet |
| **Chain ID** | `5042` (`0x13b2`) |
| **RPC Endpoint** | `https://rpc.mainnet.arc.io` |
| **Block Explorer** | `https://explorer.arc.io` |
| **Native Gas Token** | USDC (`18` decimals at protocol layer) |
| **Average Gas Cost** | `~$0.005 USDC` per transaction |
| **Deployed GScoopFactory** | [`0xdA569a58DfF4c16251A30C8b496D7fB55e5fDDC8`](https://explorer.arc.io/address/0xdA569a58DfF4c16251A30C8b496D7fB55e5fDDC8) |
| **Showcase Cooperative Vault** | [`0x7bA5860a36A89ed9eB753afc1d99482BE548AdD3`](https://explorer.arc.io/address/0x7bA5860a36A89ed9eB753afc1d99482BE548AdD3) |
| **Deployment Block** | `22499249` |

---

## ⚡ Core Protocol Innovations

```
                                  +---------------------------------------+
                                  |            GScoop Vault               |
                                  +---------------------------------------+
                                   /       |            |        \       \
       +--------------------------+        |            |         \       +-------------------------+
       |                                   |            |          \                                |
       v                                   v            v           v                               v
[ ⚡ Autopilot Subscriptions ]   [ 💳 Turn Loans ]  [ 🏷️ Auctions ]  [ 📈 Float Yield ]  [ 🎁 Patronage Dividends ]
  • Pre-authorized Stash           • Up to 75% pot     • Instant cash   • ~5.2% APY         • Community surplus
  • Autonomous Keeper debits       • Auto-garnished      payouts        • Reserve Fund        disbursed back to
  • 100% Revocable Refund          • 2% protocol fee   • Yield to pool    compounding         faithful savers
```

### 1. Deterministic FIFO Rotating Payouts
- Members contribute an agreed quota (e.g., `50 USDC`) on a fixed cycle duration (e.g., 7 days).
- Upon deadline expiration or when all members have deposited, the accumulated pot automatically disburses to the scheduled turn beneficiary (`currentCycle % memberCount`).
- The cycle index increments deterministically and advances the round.

### 2. Autopilot Recurring Subscriptions (Auto-Save)
- **Web3 Push vs. Pull Gold Standard**: EVM consensus prohibits smart contracts from pulling funds from raw wallet balances without an active signature. GScoop solves this via **Pre-Authorized Mandate Stashing**.
- Members authorize a subscription (e.g., **3**, **5**, **10**, or **Season** cycles) and pre-fund their dedicated on-chain stash.
- The smart contract automatically fulfills the active cycle, then draws future cycle quotas autonomously as each round matures.
- **Autonomous Keeper Execution**: Any peer, automated keeper bot, or the payout distributor can trigger scheduled auto-debits on behalf of subscribed members.
- **100% Revocable with Instant Refund**: Members can cancel anytime in one click, instantly returning 100% of unspent stash to their wallet.

### 3. Turn-Collateralized Borrowing (Emergency Liquidity)
- Members in the queue can borrow up to **75% of their scheduled payout pot** ahead of time.
- The smart contract locks the loan and **automatically garnishes** the principal plus a 2% fee directly from the member's upcoming payout turn.
- Savers never default against the group because their future pot rights serve as on-chain collateral.

### 4. Turn-Bidding Auctions (Early Pot Access)
- Members who urgently require capital can bid an upfront discount (e.g., accept 90% of the pot).
- The highest bidder immediately claims the current cycle payout.
- The discounted spread is deposited straight into the pool as **instant cash yield for patient savers**.

### 5. Float Yield Compounding
- Contributions and buffered capital generate low-risk yield (~5.2% APY) via integration with Arc-compatible yield strategies (`IArcYieldStrategy`).
- Yield compounds in the cooperative **Reserve Fund** without locking liquidity or delaying cycle distributions.

### 6. Flexible Timing & Advance Pre-Pay Buffer
- Members traveling, going on holiday, or managing volatile schedules can deposit an advance buffer covering multiple cycles ahead (`depositAdvance`).
- When a new cycle commences, the vault auto-draws from the member's advance balance before checking default penalties.

### 7. Voluntary Booster Savings
- Members can voluntarily save more than the required quota (`depositBoosterSavings`).
- Booster deposits earn the floating yield rate and can be withdrawn back to the member's wallet at any time.

### 8. Multi-Share Cooperative Membership
- Savers can purchase multiple cooperative shares (`buyShares`).
- Holding multiple shares assigns the member multiple scheduled payout slots throughout each rotation cycle.

### 9. Perpetual Seasons & Annual Patronage Dividends
- Cooperatives operate across continuous, perpetual seasons.
- Accumulated surplus from loan fees (2%), early auction discounts, and float yield pools in the **Reserve Fund**.
- Surplus can be disbursed periodically to active members as **cash patronage dividends**.

### 10. AI Cooperative Assistant (Google Gemini 2.5 Flash)
- Built-in intelligent financial advisor running on **Google Gemini 2.5 Flash** via server-side `@google/genai` API routes.
- Answers cooperative questions, explains rotation economics, calculates loan costs, and provides speech synthesis.

---

## 🏛️ Smart Contract Architecture

The smart contracts are located in [`contracts/`](contracts):

```
contracts/
├── src/
│   ├── GScoopVault.sol        # Core vault: rotating savings, loans, auctions, autopilot, dividends
│   ├── GScoopFactory.sol      # Factory registry: permissionless creation & discovery of vaults
│   └── IArcYieldStrategy.sol  # Interface for yield-bearing float adapters
├── test/
│   ├── GScoop.t.sol           # Core ROSCA lifecycle unit tests (8 tests)
│   └── GScoopYieldLending.t.sol # Yield, lending, auctions, advance, autopilot tests (11 tests)
└── script/
    └── Deploy.s.sol           # Automated deployment script for Arc Mainnet
```

### Key Contract Interfaces & Functions

```solidity
// Core Lifecycle
function deposit() external payable;
function distributePayout() external;
function joinPool() external;

// Autopilot Recurring Subscriptions
function setupAutoSaveSubscription(uint256 totalCycles) external payable;
function executeAutoDebit(address member) external;
function cancelAutoSaveSubscription() external;
function getAutoSaveStatus(address member) external view returns (...);

// Flexible Timing & Multi-Shares
function depositAdvance() external payable;
function depositBoosterSavings() external payable;
function withdrawBoosterSavings(uint256 amount) external;
function buyShares(uint256 additionalShares) external;

// Credit & Yield
function borrowAgainstTurn(uint256 amount) external;
function repayTurnLoan() external payable;
function submitTurnBid(uint256 discountAmount) external;
function harvestYield() external;
function distributePatronageDividends(uint256 amount) external;
```

---

## 🧪 Automated Testing Suite

GScoop maintains **100% passing test coverage** across all core and extended smart contract modules via Foundry:

```bash
cd contracts
forge test
```

### Test Output (19/19 Passing)

```
Ran 8 tests for test/GScoop.t.sol:GScoopTest
[PASS] testDistributePayoutAfterDeadline() (gas: 343371)
[PASS] testDuplicateDepositReverts() (gas: 283816)
[PASS] testFactoryCreation() (gas: 33811)
[PASS] testFullCyclePayoutRotation() (gas: 636656)
[PASS] testIncorrectContributionReverts() (gas: 132294)
[PASS] testJoinPool() (gas: 118015)
[PASS] testMaxMembersEnforced() (gas: 304857)
[PASS] testPauseReverts() (gas: 41932)
Suite result: ok. 8 passed; 0 failed; 0 skipped

Ran 11 tests for test/GScoopYieldLending.t.sol:GScoopYieldLendingTest
[PASS] testAdvancePreFunding() (gas: 291421)
[PASS] testAutoSaveRecurringSubscription() (gas: 362585)
[PASS] testAutomatedGarnishmentOnPayout() (gas: 406782)
[PASS] testBorrowAgainstFutureTurn() (gas: 90293)
[PASS] testLargeMemberPoolScaling() (gas: 9599120)
[PASS] testManualEarlyLoanRepayment() (gas: 87531)
[PASS] testMultiShareMembership() (gas: 5752280)
[PASS] testPerpetualSeasonsAndPatronageDividends() (gas: 77188)
[PASS] testTurnBiddingAuctionWithDividends() (gas: 246627)
[PASS] testVoluntaryBoosterSavings() (gas: 92241)
[PASS] testYieldStrategyFloatAccrual() (gas: 40042)
Suite result: ok. 11 passed; 0 failed; 0 skipped

Ran 2 test suites: 19 passed, 0 failed, 0 skipped
```

---

## 💻 Frontend & Application Architecture

Built with a dark-mode fintech aesthetic (`#09090b` background, `#121215` cards, `border-white/10`, `#10b981` emerald and cyan accents):

- **Framework**: Next.js 16.3.5 with Turbopack and React 19.
- **Web3 Connectivity**: Wagmi v2 + Viem configured specifically for Arc Mainnet (`Chain ID: 5042`).
- **Interactive Pages**:
  - `/` — High-impact landing page featuring comparative analysis between traditional groups, Web3, and GScoop.
  - `/explore` — Vault directory with search filters (Micro, Standard, High-Yield tiers), live statistics, and instant access.
  - `/create` — Permissionless vault factory deployer with duration presets, member caps, and fee estimates.
  - `/vault/[address]` — Comprehensive pool dashboard, live countdown timers, deterministic rotating queue tracker, and the 8-tab Cooperative Growth Hub.
- **AI Integration**: Server-side `/api/chat` route utilizing `@google/genai` to connect to Gemini 2.5 Flash without exposing API keys to client browsers.

---

## 🚀 Quickstart Guide

### Prerequisites
- [Node.js](https://nodejs.org/) `>= 18.17.0`
- [Foundry](https://book.getfoundry.sh/) (`forge`, `cast`)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/gabrieltemtsen/gscoop.git
cd gscoop

# Install frontend dependencies
npm install

# Install contract dependencies
cd contracts
forge install
cd ..
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Optional: Google Gemini API Key for the AI Cooperative Assistant
GEMINI_API_KEY="your-gemini-api-key-here"

# Arc Mainnet RPC (Defaults to public endpoint)
NEXT_PUBLIC_ARC_RPC_URL="https://rpc.mainnet.arc.io"
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
```

---

## 📦 Deployment to Arc Mainnet

To deploy the contracts to Arc Mainnet using Foundry:

```bash
cd contracts

# Set your deployer private key
export PRIVATE_KEY="your-private-key-here"

# Execute deployment script
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.mainnet.arc.io \
  --broadcast \
  --verify
```

---

## 🔒 Security Invariants & Guarantees

1. **Deterministic Payout Resolution**: Payouts can only be claimed by the active cycle's deterministic turn beneficiary (or auction winner).
2. **Automated Debt Deduction**: Outstanding loans are garnished on-chain before funds are transferred to the borrower's wallet.
3. **Reentrancy Protection**: All state-modifying and token-transferring functions utilize OpenZeppelin `nonReentrant` guards.
4. **Non-Custodial Mandates**: Autopilot subscription stashes remain 100% revocable by their owners at all times.
5. **Circuit Breakers**: Vault creators can pause new deposits under emergency conditions using OpenZeppelin `Pausable`.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
