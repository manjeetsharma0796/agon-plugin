# Agon for Claude Code

Give your agent a budget, not your keys.
Agon turns your own on-chain trading history into a spending limit your AI agent must trade inside, enforced on Solana. Your key never leaves your wallet.

## Install

In Claude Code:

```
/plugin marketplace add manjeetsharma0796/agon-plugin
/plugin install agon@agon
```

Or from a terminal: `claude plugin marketplace add manjeetsharma0796/agon-plugin` then `claude plugin install agon@agon`.

Restart Claude Code, then type `/agon`.

The plugin connects Claude to the hosted Agon server at `https://agon-dev.onrender.com/mcp` (it shows up as `plugin:agon:agon` in `/mcp`). The server sleeps when idle, so the first call after a quiet spell can take a minute.

## What works today

- **Read-only wallet.** Paste a public Solana address and the band above the prompt shows what your agent can spend now. Agon never asks for, stores or uses a private key, and refuses anything that looks like one.
- **Guard checks.** Check, Buy and Sell put a draft in your prompt box and never send it. You read it, change the amount, press Enter, and Claude runs Agon's `check_trade` before anything is built. A trade that cannot be verified does not go out.
- **Token pane.** Jupiter's trending, most traded, top organic and newest tokens, with prices, charts and order book depth. Commands: `/agon`, `/agon-band`, `/agon-wallet`, `/agon-bots`.
- **Paper trading**, when the Agon server runs in paper mode: a paper buy spends USDC and a paper sell receives it, at a live Jupiter quote judged by the same check_trade guard, under your saved wallet address as the paper account. Paper balances start at 1,000 USDC and reset when the server restarts. When the server is not in paper mode, the Trade tab says so and offers no paper buttons. Paper trades never reach the chain.

Optional: put Jupiter API keys, one per line, in `~/.agon/jupiter-keys` for higher rate limits. They are read on your machine only and never shown or sent anywhere but Jupiter. Without them Agon uses Jupiter's free endpoint. The bots page (`/agon-bots`) needs Node on your PATH.

## What does not work yet

- No mainnet trading. Nothing in this plugin signs or sends a transaction, and the server does not trade real funds yet.
- Wallet habit reports are sample data for now; every such result carries a note saying so.

## Remove it

```
/plugin uninstall agon@agon
/plugin marketplace remove agon
```

The plugin keeps only your saved public address in Claude Code's plugin storage, and reads `~/.agon/jupiter-keys` if you made it; delete that file to remove your Jupiter keys. Other files in `~/.agon/` (such as an agent key made during onboarding) belong to your agent setup, so revoke that agent's role before you delete them.
