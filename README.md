# Agon for Claude Code

**Give your agent a budget, not your keys.**

Agon puts a crypto trading screen inside Claude Code: live Solana tokens and charts, a portfolio,
paper trading with pretend money, and paper bots. Every order is checked by Agon's guard before it
goes anywhere. Agon never asks for, stores or uses a private key.

New to Claude? Follow the steps below in order. Every command is in a grey box: press the copy
button at its top right, paste it, and press Enter.

---

## What you need

- **A Claude account on a paid plan**: Pro, Max, Team or Enterprise. The free claude.ai plan does
  not include Claude Code. Sign up or upgrade at [claude.ai](https://claude.ai).
- **A computer** running macOS 13 or newer, Windows 10 or newer, or Linux (Ubuntu 20.04 or newer).
- **Optional: a Solana wallet address**, the public one only (for example from Phantom). It names
  your paper account. You can also use Agon without one at first.

---

## Step 1. Open a terminal

The terminal is a window where you type commands.

- **macOS**: press `Cmd + Space`, type `Terminal`, press Enter.
- **Windows**: press the Windows key, type `PowerShell`, press Enter.
- **Linux**: press `Ctrl + Alt + T`.

## Step 2. Install Claude Code

Copy the command for your computer, paste it into the terminal and press Enter. It runs quietly
for a minute; wait until you can type again.

**macOS or Linux:**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://claude.ai/install.ps1 | iex
```

Then **close the terminal and open a new one**, so it finds the new command.

## Step 3. Check that it installed

```bash
claude --version
```

You should see a version number such as `2.1.292 (Claude Code)`. Agon needs **2.1.286 or newer**.
If yours is older, update it:

```bash
claude update
```

If the terminal says `claude` is not found, see
[Troubleshoot installation](https://code.claude.com/docs/en/troubleshoot-install).

## Step 4. Sign in to Claude

```bash
claude
```

A browser window opens. Sign in with your Claude account and allow access. When the terminal shows
a prompt box, you are signed in. Type `/exit` and press Enter to leave for now.

## Step 5. Install Agon

Run these two commands, one after the other:

```bash
claude plugin marketplace add manjeetsharma0796/agon-plugin
```

```bash
claude plugin install agon@agon
```

The second one ends with `Successfully installed plugin: agon@agon`.

## Step 6. Start Claude Code and open Agon

```bash
claude
```

Then type this in the Claude prompt and press Enter:

```
/agon
```

The Agon pane opens with its tabs along the top: **Start**, **Discover**, **Watchlist**, **Trade**,
**Bots** and **Portfolio**.

> The first time, Agon may take up to a minute to answer: its server sleeps when nobody is using it
> and wakes on the first request.

## Step 7. Save your wallet address (public only)

On the **Start** tab, paste your **public** Solana address into the box and press **Save** (or
Enter). Or type this in the Claude prompt, with your own address:

```
/agon-wallet YOUR_PUBLIC_WALLET_ADDRESS
```

This address only names your paper account. **Never paste a private key or seed phrase**: Agon
refuses anything that looks like one, and nobody should ever ask you for it.

## Step 8. Make your first paper trade

Paper trades use pretend money: every paper account starts with **1,000 USDC**.

1. Open the **Discover** tab and click a token. It opens in **Trade**.
2. In the **Paper trade** panel, choose **Buy**.
3. Type an amount in USDC, or press **25%**, **50%**, **75%** or **100%**.
4. Press **Buy**. The first time, a short sign-up note appears: press **Continue to paper trade**.

Agon's guard checks the trade first (price impact, slippage, and whether the token's mint or
freeze authority is still open). You see the result with each reason and its number. Press any
**ⓘ** button to read what a field means.

## Step 9. Look at your portfolio

Open the **Portfolio** tab:

- your balance, large, green when you are up and red when you are down;
- a chart of your balance over time (**Balance**, **P&L %** or **◔ Pie**, and **1H** to **All**);
- your allocation, with how many of each token you hold;
- **▸ Latest fills**: press it to see every trade.

## Step 10. Try a paper bot

Open the **Bots** tab, choose **DCA** or **Trail**, set the budget with the sliders and press
**▸ Start paper bot**. Every bot has an **On / Off** switch: flip it to **Off** to pause the bot at once, and
back to **On** to resume. Bots run only while Claude Code is open.

## Step 11. Ask Claude

You can also just ask, in plain words. Copy any of these into the Claude prompt and replace
`YOUR_PUBLIC_WALLET_ADDRESS` with the address you saved in Step 7 (Claude needs it to find your
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

## Using the Claude desktop app instead

If you prefer the desktop app, download it from [claude.com/download](https://claude.com/download),
sign in, open the **Code** tab, then:

1. Do **Step 5** once in a terminal (the desktop app and the terminal share the same plugins).
2. In the desktop app, start a new session in any folder and type `/agon`.

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
