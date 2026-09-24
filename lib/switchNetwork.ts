import { arcMainnet } from './arcChain';

/**
 * Ensures the connected Web3 wallet is on Arc Mainnet (Chain ID: 5042).
 * Tries Wagmi's switchChainAsync first, then falls back to window.ethereum
 * with wallet_switchEthereumChain and wallet_addEthereumChain if not yet added.
 */
export async function ensureArcNetwork(
  switchChainAsync?: (args: { chainId: number }) => Promise<any>
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Try Wagmi switchChainAsync first if available
  if (switchChainAsync) {
    try {
      await switchChainAsync({ chainId: arcMainnet.id });
      return true;
    } catch (wagmiErr: any) {
      console.warn('Wagmi switchChainAsync warning:', wagmiErr);
      // User rejected prompt
      if (wagmiErr?.code === 4001 || wagmiErr?.message?.toLowerCase().includes('user rejected')) {
        throw new Error('Network switch cancelled. GScoop requires Arc Mainnet (Chain ID: 5042) to execute transactions.');
      }
      // If error is chain-not-found or connector-specific, fall through to window.ethereum
    }
  }

  // 2. Direct window.ethereum fallback
  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    throw new Error('No Web3 wallet detected. Please connect MetaMask or an injected wallet.');
  }

  const hexChainId = `0x${arcMainnet.id.toString(16)}`; // 5042 -> 0x13b2

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
    return true;
  } catch (switchError: any) {
    // Error code 4902: Unrecognized chain (needs to be added)
    if (
      switchError?.code === 4902 ||
      switchError?.data?.originalError?.code === 4902 ||
      switchError?.message?.includes('4902') ||
      switchError?.message?.toLowerCase().includes('unrecognized')
    ) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexChainId,
              chainName: 'Arc Mainnet',
              nativeCurrency: {
                name: 'USDC',
                symbol: 'USDC',
                decimals: 18,
              },
              rpcUrls: ['https://rpc.mainnet.arc.io'],
              blockExplorerUrls: ['https://explorer.arc.io'],
            },
          ],
        });
        return true;
      } catch (addError: any) {
        if (addError?.code === 4001 || addError?.message?.toLowerCase().includes('user rejected')) {
          throw new Error('Arc Mainnet addition rejected. Please approve adding Arc Mainnet to your wallet.');
        }
        throw new Error(`Failed to add Arc Mainnet to wallet: ${addError?.message || addError}`);
      }
    } else if (switchError?.code === 4001 || switchError?.message?.toLowerCase().includes('user rejected')) {
      throw new Error('Network switch cancelled. Please approve switching to Arc Mainnet in your wallet.');
    } else {
      throw new Error(`Failed to switch network: ${switchError?.message || switchError}`);
    }
  }
}
