export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined;

export const ABI = [
  {
    type: 'function',
    name: 'addSuggestion',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'text', type: 'string' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'upvote',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getSuggestions',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'author', type: 'address' },
          { name: 'text', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'votes', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'voted',
    stateMutability: 'view',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'voter', type: 'address' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'event',
    name: 'SuggestionAdded',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'author', type: 'address', indexed: true },
      { name: 'text', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Upvoted',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'voter', type: 'address', indexed: true },
    ],
  },
] as const;

export const ETHERLINK_CHAIN = {
  id: 42793,
  name: 'Etherlink',
  nativeCurrency: { name: 'Tez', symbol: 'XTZ', decimals: 18 },
  rpcUrls: { default: { http: ['https://node.mainnet.etherlink.com'] } },
  blockExplorers: { default: { name: 'Etherlink Explorer', url: 'https://explorer.etherlink.com' } },
} as const;
