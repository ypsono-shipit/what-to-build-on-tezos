/// <reference types="vite/client" />

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}` | undefined;

export const CATEGORIES = ['art', 'consumer', 'defi', 'infra', 'gaming', 'nft', 'wallet'] as const;
export type Category = typeof CATEGORIES[number];

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  art:      { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
  consumer: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  defi:     { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  infra:    { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  gaming:   { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
  nft:      { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  wallet:   { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' },
};

export const ABI = [
  {
    type: 'function',
    name: 'addSuggestion',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'text', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'category', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addSuggestionGuest',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'text', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'category', type: 'string' },
    ],
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
          { name: 'name', type: 'string' },
          { name: 'text', type: 'string' },
          { name: 'category', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'votes', type: 'uint256' },
          { name: 'verified', type: 'bool' },
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
    type: 'function',
    name: 'voteCount',
    stateMutability: 'view',
    inputs: [{ name: 'voter', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export const ETHERLINK_CHAIN = {
  id: 42793,
  name: 'Etherlink',
  nativeCurrency: { name: 'Tez', symbol: 'XTZ', decimals: 18 },
  rpcUrls: { default: { http: ['https://node.mainnet.etherlink.com'] } },
  blockExplorers: { default: { name: 'Etherlink Explorer', url: 'https://explorer.etherlink.com' } },
} as const;
