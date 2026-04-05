# What to Build on Tezos

An on-chain idea pinboard for the Tezos community. XTZ holders can post draggable post-it notes with app ideas and upvote the best ones.

**Live:** Built on Etherlink (Tezos EVM L2) · Solidity contract · React + viem frontend

---

## Stack

- **Smart contract**: Solidity 0.8.20, deployed on Etherlink (chain ID 42793)
- **Frontend**: React 18 + TypeScript + Vite
- **Chain interaction**: viem v2
- **Wallet**: MetaMask (any EIP-1193 provider)
- **Styling**: Pure CSS — cork board texture, Caveat handwriting font

## Features

- Post-it notes with random pastel colours and rotation
- Drag notes anywhere on the cork board (position saved in localStorage)
- Upvote ideas (one vote per address, gated by holding ≥ 0.01 XTZ)
- Demo mode when `VITE_CONTRACT_ADDRESS` is unset (6 pre-filled ideas)

---

## Quick Start

```bash
npm install
npm run dev         # starts Vite dev server
```

## Deploy the Contract

```bash
cp .env.example .env
# fill in PRIVATE_KEY

npm run deploy:shadownet   # Etherlink Shadownet (testnet)
# or
npm run deploy:mainnet     # Etherlink Mainnet
```

Copy the deployed address into `.env`:
```
VITE_CONTRACT_ADDRESS=0x...
```

## Build & Deploy Frontend

```bash
npm run build       # outputs to dist/
```

Deploy `dist/` to Vercel, Netlify, or any static host.

---

## Contract

`contracts/WhatToBuild.sol`

```solidity
modifier holdsXTZ() {
    require(msg.sender.balance >= 0.01 ether, "Must hold at least 0.01 XTZ");
    _;
}

function addSuggestion(string calldata text) external holdsXTZ { ... }
function upvote(uint256 id) external holdsXTZ { ... }
function getSuggestions() external view returns (Suggestion[] memory) { ... }
```

## Etherlink Network

| | |
|---|---|
| Chain ID | 42793 |
| RPC | https://node.mainnet.etherlink.com |
| Explorer | https://explorer.etherlink.com |
| Native token | XTZ |
| Faucet (Shadownet) | https://faucet.etherlink.com |
