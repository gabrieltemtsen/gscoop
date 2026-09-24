import { createPublicClient, http } from 'viem';
import { arcMainnet } from './arcChain';

export const publicClient = createPublicClient({
  chain: arcMainnet,
  transport: http(process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.mainnet.arc.io'),
});
