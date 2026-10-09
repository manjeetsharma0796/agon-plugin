# Agon for Claude Code

**Give your agent a budget, not your keys.**

Agon puts a crypto trading screen inside Claude Code: live Solana tokens and charts, a portfolio,
paper trading with pretend money, and paper bots. Every order is checked by Agon's guard before it
goes anywhere. Agon never asks for, stores or uses a private key.

## Before you start

- **Claude Code 2.1.286 or newer**, installed and signed in. If you do not have it yet, follow
  Anthropic's [install guide](https://code.claude.com/docs/en/setup). Check your version with
  `claude --version`; update with `claude update`.
- **A paid Claude plan** (Pro, Max, Team or Enterprise): the free claude.ai plan does not include
  Claude Code.
- **Optional: a Solana wallet address**, the public one only (for example from Phantom). It names
  your paper account.

## Quick install: paste one prompt

Start Claude Code (type `claude` in a terminal, or open the desktop app's **Code** tab), then copy
this whole box into the prompt and press Enter. Claude runs the install and asks before each command.

```
Install the Agon plugin for Claude Code for me:
1. Run: claude plugin marketplace add manjeetsharma0796/agon-plugin
2. Run: claude plugin install agon@agon
3. Run: claude plugin list, and check that agon@agon says enabled.
If a command fails, show me the exact error and what to do next. Do not change any other setting.
When it is installed, tell me to type /reload-plugins and then /agon.
```

When Claude is done, type these two in the prompt (Claude cannot run them for you):

```
/reload-plugins
```

```
/agon
```

## Step by step install

Prefer to do it yourself? In a terminal:

**1. Add the Agon marketplace**

```bash
claude plugin marketplace add manjeetsharma0796/agon-plugin
```

**2. Install the plugin**

```bash
claude plugin install agon@agon
```

It ends with `Successfully installed plugin: agon@agon`.

**3. Start Claude Code and open Agon**

```bash
claude
```

Then type this in the Claude prompt:

```
/agon
```

The Agon pane opens with its tabs along the top: **Start**, **Discover**, **Watchlist**, **Trade**,
**Bots** and **Portfolio**.

> The first time, Agon may take up to a minute to answer: its server sleeps when nobody is using it
> and wakes on the first request.

---

# Getting started

## 1. Save your wallet address (public only)

On the **Start** tab, paste your **public** Solana address into the box and press **Save** (or
Enter). Or type this in the Claude prompt, with your own address:

```
/agon-wallet YOUR_PUBLIC_WALLET_ADDRESS
```

This address only names your paper account. **Never paste a private key or seed phrase**: Agon
refuses anything that looks like one, and nobody should ever ask you for it.

## 2. Make your first paper trade

Paper trades use pretend money: every paper account starts with **1,000 USDC**.

1. Open the **Discover** tab and click a token. It opens in **Trade**.
2. In the **Paper trade** panel, choose **Buy**.
3. Type an amount in USDC, or press **25%**, **50%**, **75%** or **100%**.
4. Press **Buy**. The first time, a short sign-up note appears: press **Continue to paper trade**.

Agon's guard checks the trade first (price impact, slippage, and whether the token's mint or
freeze authority is still open). You see the result with each reason and its number. Press any
**ⓘ** button to read what a field means.

## 3. Look at your portfolio

Open the **Portfolio** tab:

- your balance, large, green when you are up and red when you are down;
- a chart of your balance over time (**Balance**, **P&L %** or **◔ Pie**, and **1H** to **All**);
- your allocation, with how many of each token you hold;
- **▸ Latest fills**: press it to see every trade.

## 4. Try a paper bot

Open the **Bots** tab, choose **DCA** or **Trail**, set the budget with the sliders and press
**▸ Start paper bot**. Every bot has an **On / Off** switch: flip it to **Off** to pause the bot at once, and
back to **On** to resume. Bots run only while Claude Code is open.

## 5. Ask Claude

You can also just ask, in plain words. Copy any of these into the Claude prompt and replace
`YOUR_PUBLIC_WALLET_ADDRESS` with the address you saved in step 1 (Claude needs it to find your
paper account):

```
What is my Agon paper balance? My paper account is YOUR_PUBLIC_WALLET_ADDRESS
```

```
Show my last Agon paper trades and how much I am up or down. My paper account is YOUR_PUBLIC_WALLET_ADDRESS
```

```
Paper buy 10 USDC of SOL in my Agon paper account YOUR_PUBLIC_WALLET_ADDRESS and show me the guard's verdict.
```

---

## Using the Claude desktop app

The desktop app and the terminal share the same plugins. In the app, open the **Code** tab, start a
session in any folder, and paste the [quick install prompt](#quick-install-paste-one-prompt). Then type
`/reload-plugins` and `/agon`.

---

## Keep Agon up to date

```bash
claude plugin marketplace update agon
```

```bash
claude plugin update agon@agon
```

Then start Claude Code again, or type `/reload-plugins` in an open session.

## Troubleshooting

| What you see | What to do |
|---|---|
| `claude: command not found` | Close the terminal, open a new one, try again. Still missing: see [Troubleshoot installation](https://code.claude.com/docs/en/troubleshoot-install). |
| `/agon` is not recognised | Run `claude plugin list` and check that `agon@agon` says **enabled**. Run `claude update`, then start Claude Code again. |
| `/agon` is still not recognised after that | Agon's screens use an early-access Claude Code feature. Add the setting below to `~/.claude/settings.json` (create the file if it is missing), then start Claude Code again. |
| "Agon needs Claude Code 2.1.286 or newer" | Run `claude update`, then start Claude Code again. |
| Agon is slow or says the server is not answering | Its server wakes from sleep on the first request. Wait a minute and press **↻ Refresh**. |
| "Paper trading starts when the Agon server is in paper mode" | The server is not in paper mode right now. Prices and charts still work; try paper trading later. |
| My paper balance went back to 1,000 USDC | Paper balances reset whenever the Agon server restarts. |

The setting for an unrecognised `/agon`:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"
  }
}
```

If the file already has an `"env"` section, add only the `"CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"`
line inside it.

## What works today, and what does not

**Works:**

- Live Solana tokens, prices, charts and order book depth from Jupiter.
- Paper trading at live Jupiter quotes, judged by Agon's guard, with pretend USDC.
- Paper bots (DCA and Trail) with an on/off switch.
- A portfolio with balance, P&L, charts, allocation and fills.
- Commands: `/agon`, `/agon-wallet`, `/agon-bots`, `/agon-band`.

**Not yet:**

- No real-money trading. Nothing in this plugin signs or sends a transaction.
- Wallet habit reports are sample data for now; every such result says so.

Optional: put Jupiter API keys, one per line, in `~/.agon/jupiter-keys` for higher rate limits.
They stay on your machine and are sent only to Jupiter. The bots web page (`/agon-bots`) needs
Node.js installed.

## Stay safe

- Agon never needs your **private key** or **seed phrase**. Never paste them anywhere.
- Your wallet address is public information; saving it only names your paper account.
- Paper trades are pretend: no real tokens move and nothing reaches the blockchain.

## Remove Agon

```bash
claude plugin uninstall agon@agon
```

```bash
claude plugin marketplace remove agon
```

Agon keeps only your saved public address in Claude Code's plugin storage, and reads
`~/.agon/jupiter-keys` if you made it; delete that file to remove your Jupiter keys.
