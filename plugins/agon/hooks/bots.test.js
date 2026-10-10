"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("claude-code/testing");
var PF = require("./paper-fixtures");
var SF = require("./server-fixtures");
var paper_bots_1 = require("./paper-bots");
var WSOL = 'So11111111111111111111111111111111111111112';
var bot = function (over) {
    if (over === void 0) { over = {}; }
    return (__assign({ strategy: 'dca', mint: WSOL, symbol: 'SOL', budget: 50, p1: 1, p2: 5, mode: 'copilot', cap: 100, slip: 20, id: 'b1', status: 'running', created: 0, decimals: 9, book: (0, paper_bots_1.newBook)(), fills: [], events: [], nextAt: 0, retryAt: 0, strikes: 0, peak: null, price: null, priceAt: null, why: null }, over));
};
// The amounts are the real server's (paper-fixtures.ts): 10 USDC bought 91552862 lamports, and half
// of them sold for 4999996 USDC base units.
(0, testing_1.test)('P&L from fills is exact in base units: average cost, realized on each sell, unrealized at the live price', function () {
    var b = (0, paper_bots_1.applyFill)((0, paper_bots_1.newBook)(), 'buy', 10000000n, 91552862n);
    (0, testing_1.expect)(b).toEqual({ spent: '10000000', received: '0', held: '91552862', cost: '10000000', realized: '0', buys: 1, sells: 0 });
    b = (0, paper_bots_1.applyFill)(b, 'sell', 4999996n, 45776431n);
    // Half the units carry half the cost, 5000000; sold for 4999996, realized is -4 base units.
    (0, testing_1.expect)(b).toEqual({ spent: '10000000', received: '4999996', held: '45776431', cost: '5000000', realized: '-4', buys: 1, sells: 1 });
    var p = (0, paper_bots_1.pnlOf)(b, 9, 109.2, 50);
    (0, testing_1.expect)(p.realized).toBe(-0.000004);
    // 0.045776431 SOL at $109.20 is $4.9987862652, against a cost of $5.
    (0, testing_1.expect)(p.unrealized.toFixed(10)).toBe('-0.0012137348');
    (0, testing_1.expect)(p.total.toFixed(10)).toBe('-0.0012177348');
    (0, testing_1.expect)(p.roi.toFixed(8)).toBe('-0.00243547');
    // The rest sold for 5000010: its cost was the other 5000000, so realized ends at +6, nothing held.
    b = (0, paper_bots_1.applyFill)(b, 'sell', 5000010n, 45776431n);
    (0, testing_1.expect)(b).toEqual({ spent: '10000000', received: '10000006', held: '0', cost: '0', realized: '6', buys: 1, sells: 2 });
    var flat = (0, paper_bots_1.pnlOf)(b, 9, null, 50);
    (0, testing_1.expect)([flat.realized, flat.unrealized, flat.total, flat.value, flat.roi.toFixed(6)]).toEqual([0.000006, 0, 0.000006, 0, '0.000012']);
    // Held units with no live price: unrealized and total are unknown, never guessed.
    (0, testing_1.expect)((0, paper_bots_1.pnlOf)((0, paper_bots_1.applyFill)((0, paper_bots_1.newBook)(), 'buy', 10000000n, 91552862n), 9, null, 50).total).toBeNull();
});
(0, testing_1.test)('DCA slices the budget, never past the cap or what is left, and is done under 1 USDC', function () {
    (0, testing_1.expect)((0, paper_bots_1.sliceOf)(bot())).toBe(10000000n);
    (0, testing_1.expect)((0, paper_bots_1.sliceOf)(bot({ budget: 500, p2: 3, cap: 100 }))).toBe(100000000n);
    (0, testing_1.expect)((0, paper_bots_1.sliceOf)(bot({ budget: 100, p2: 3 }))).toBe(33333333n);
    (0, testing_1.expect)((0, paper_bots_1.decide)(bot({ nextAt: 60000 }), 100, 30000)).toEqual({ kind: 'wait', why: 'next slice in 1 min' });
    (0, testing_1.expect)((0, paper_bots_1.decide)(bot(), 100, 0)).toEqual({ kind: 'order', side: 'buy', amount: 10000000n, why: 'slice 1 of 5' });
    // 99.999999 spent of 100: the last base unit is under the 1 USDC least order, so the bot is done.
    var spent = bot({ budget: 100, p2: 3, book: __assign(__assign({}, (0, paper_bots_1.newBook)()), { spent: '99999999' }) });
    (0, testing_1.expect)((0, paper_bots_1.decide)(spent, 100, 0)).toEqual({ kind: 'done', why: 'budget spent: $100.00 of $100.00' });
    // A slice over what is left takes only what is left.
    var most = bot({ book: __assign(__assign({}, (0, paper_bots_1.newBook)()), { spent: '45000000', buys: 4 }) });
    (0, testing_1.expect)((0, paper_bots_1.decide)(most, 100, 0)).toEqual({ kind: 'order', side: 'buy', amount: 5000000n, why: 'slice 5 of 5' });
});
(0, testing_1.test)('Trail buys once at min(budget, cap), sells all on the trailing drop or the hard stop, and is done once flat', function () {
    var t = bot({ strategy: 'trail', budget: 500, cap: 100, p1: 6, p2: 10 });
    (0, testing_1.expect)((0, paper_bots_1.decide)(t, 100, 0)).toEqual({ kind: 'order', side: 'buy', amount: 100000000n, why: 'entry' });
    // 1 SOL bought for $100: entry $100, peak $120 seen since.
    var held = __assign(__assign({}, t), { book: (0, paper_bots_1.applyFill)((0, paper_bots_1.newBook)(), 'buy', 100000000n, 1000000000n), peak: 120 });
    (0, testing_1.expect)((0, paper_bots_1.decide)(held, 113, 0).kind).toBe('wait');
    (0, testing_1.expect)((0, paper_bots_1.decide)(held, 112.8, 0)).toEqual({ kind: 'order', side: 'sell', amount: 1000000000n, why: 'trail: $112.80 is 6.0% off the $120.00 peak' });
    // A tight hard stop under entry fires before the trail does.
    var tight = __assign(__assign({}, held), { p1: 25, p2: 5, peak: 100 });
    (0, testing_1.expect)((0, paper_bots_1.decide)(tight, 95, 0)).toEqual({ kind: 'order', side: 'sell', amount: 1000000000n, why: 'hard stop: $95.00 is 5.0% under the $100.00 entry' });
    var flat = __assign(__assign({}, held), { book: (0, paper_bots_1.applyFill)(held.book, 'sell', 113000000n, 1000000000n) });
    (0, testing_1.expect)((0, paper_bots_1.decide)(flat, 90, 0).kind).toBe('done');
});
(0, testing_1.test)('a fill resets the strikes and schedules the next slice; a refusal backs off, and 3 buy refusals pause the bot', function () {
    var f = (0, paper_bots_1.recordFill)(bot(), { side: 'buy', usdc: 10000000n, units: 91552862n, slot: 454699557, stamp: 'Data slot 1', why: 'slice 1 of 5' }, 30000, 109.2);
    (0, testing_1.expect)(f.nextAt).toBe(90000);
    (0, testing_1.expect)(f.fills[0].price.toFixed(4)).toBe('109.2265');
    (0, testing_1.expect)(f.status).toBe('running');
    (0, testing_1.expect)([1, 2, 3, 4, 5, 6].map(paper_bots_1.backoffMs)).toEqual([120000, 240000, 480000, 960000, 1800000, 1800000]);
    var m = (0, paper_bots_1.recordMiss)(bot(), 'buy', { kind: 'refused', text: 'refused', reasons: [], stamp: null }, 0);
    (0, testing_1.expect)(m.retryAt).toBe(120000);
    (0, testing_1.expect)(m.strikes).toBe(1);
    (0, testing_1.expect)((0, paper_bots_1.decide)(m, 100, 60000)).toEqual({ kind: 'wait', why: 'asks again in 1 min, after 1 refusal' });
    m = (0, paper_bots_1.recordMiss)(m, 'buy', { kind: 'refused', text: 'refused', reasons: [], stamp: null }, 120000);
    m = (0, paper_bots_1.recordMiss)(m, 'buy', { kind: 'refused', text: 'refused', reasons: [], stamp: null }, 360000);
    (0, testing_1.expect)(m.status).toBe('paused');
    (0, testing_1.expect)(m.why).toBe('Paused after 3 refusals in a row. Read the last reason, change the bot, then resume it.');
    // A sell that misses never pauses: the position would sit with no stop.
    var s = bot({ strategy: 'trail' });
    for (var i = 0; i < 5; i++)
        s = (0, paper_bots_1.recordMiss)(s, 'sell', { kind: 'error', text: 'no answer', reasons: [], stamp: null }, 0);
    (0, testing_1.expect)(s.status).toBe('running');
    // Kept bounded: 20 events.
    for (var i = 0; i < 30; i++)
        s = (0, paper_bots_1.recordMiss)(s, 'sell', { kind: 'error', text: "e".concat(i), reasons: [], stamp: null }, 0);
    (0, testing_1.expect)(s.events.length).toBe(20);
    (0, testing_1.expect)(s.events.at(-1).text).toBe('e29');
});
// The runner, end to end through the plugin: the Agon server's recorded answers (paper-fixtures.ts),
// Jupiter's price as the test sets it, and the clock moved by the test alone.
var MCP_URL = 'https://agon-dev.onrender.com/mcp';
var USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
var T0 = Date.parse('2026-10-09T00:00:00Z');
// A recorded fill with its amounts set to the order's: the shape is the server's own.
var scaled = function (fixture, inAmount, outAmount) {
    return fixture.replace(/(inAmount\W+)\d+/, "$1".concat(inAmount)).replace(/(outAmount\W+)\d+/, "$1".concat(outAmount));
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var world = function (on, trade, paper) {
    if (paper === void 0) { paper = true; }
    var clock = testing_1.mock.clock(on, { now: T0 });
    var store = new Map([['wallet', PF.PAPER_ACCOUNT]]);
    on('store.get', function (_$, e) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, ({ value: store.get(e.key) })];
    }); }); });
    on('store.set', function (_$, e) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            store.set(e.key, e.value);
            return [2 /*return*/, { value: undefined }];
        });
    }); });
    on('command.register', function (_$, e) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, ({ value: { command: e.name } })];
    }); }); });
    var up = new Set();
    on('ui.open', function (_$, e) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            up.add(e.id);
            return [2 /*return*/, { value: { isPlaced: true } }];
        });
    }); });
    on('ui.panes', function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, ({ value: __spreadArray([], up, true).map(function (id) { return ({ id: id, title: id, isShown: true, isFocused: true, isPlaced: true }); }) })];
    }); }); });
    on('ui.close', function (_$, e) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            up.delete(e.id);
            return [2 /*return*/, { value: undefined }];
        });
    }); });
    var toasts = [];
    on('ui.toast', function (_$, e) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            toasts.push(e.text);
            return [2 /*return*/, { value: undefined }];
        });
    }); });
    var w = { clock: clock, store: store, toasts: toasts, up: up, price: 109.2, stale: false, priceCalls: 0, directCalls: 0, trades: [] };
    on('http.fetch', function (_$, e) { return __awaiter(void 0, void 0, void 0, function () {
        var ok, body, body, stale;
        var _a;
        return __generator(this, function (_b) {
            ok = function (text) { return ({ value: { status: 200, ok: true, headers: {}, text: text } }); };
            if (e.url === MCP_URL) {
                body = JSON.parse(String((_a = e.init) === null || _a === void 0 ? void 0 : _a.body));
                if (body.method === 'tools/list')
                    return [2 /*return*/, ok(paper ? PF.LIST : JSON.stringify({ jsonrpc: '2.0', id: 1, result: { tools: [{ name: 'check_trade' }] } }))];
                if (body.params.name === 'paper_portfolio')
                    return [2 /*return*/, ok(PF.PORTFOLIO_NEW)];
                w.trades.push(body.params.arguments);
                return [2 /*return*/, ok(trade(body.params.arguments))];
            }
            // Prices come from the Agon server's /price: its recorded answer, at the price the test sets.
            if (e.url.startsWith('https://agon-dev.onrender.com/price?')) {
                w.priceCalls++;
                body = JSON.parse(SF.PRICE);
                body.prices[WSOL].usdPrice = w.price;
                stale = w.stale ? { stale: true, ageSeconds: 95, staleReason: 'Prices for 1 mint: Jupiter answered 503 from api.jup.ag. Showing the last good value, fetched 95 s ago.' } : {};
                return [2 /*return*/, ok(JSON.stringify(__assign(__assign({}, body), stale)))];
            }
            if (e.url.includes('/search?query='))
                w.directCalls++;
            return [2 /*return*/, ok(JSON.stringify([{ id: WSOL, symbol: 'SOL', usdPrice: w.price, decimals: 9 }]))];
        });
    }); });
    return w;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var botsPane = function ($, surface) { return __awaiter(void 0, void 0, void 0, function () {
    var pane;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, $.ui.mount({
                    plugin: 'agon',
                    surface: surface,
                    component: 'Pane',
                    requestId: 'agon',
                    props: { title: 'Agon', isFocused: true, bodyColumns: 100, placement: 'dock', scroll: { offset: 0, bodyRows: 80 } },
                })];
            case 1:
                pane = _a.sent();
                return [4 /*yield*/, pane.press({ key: 'nav-bots' })];
            case 2:
                _a.sent();
                return [2 /*return*/, pane];
        }
    });
}); };
var secs = function (w) { return (w.clock.now() - T0) / 1000; };
(0, testing_1.test)('a DCA paper bot places a 10 USDC slice every minute on live prices and stops at its 50 USDC budget', { timeoutMs: 30000 }, function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, pane, at, i, before, _i, _a, surface, p, _b, _c, _d, _e, _f, _g, kept;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                w = world(on, function (a) { return scaled(PF.BUY_FILLED, a.amount, '91552862'); });
                return [4 /*yield*/, botsPane($, 'desktop')];
            case 1:
                pane = _h.sent();
                return [4 /*yield*/, pane.press({ key: 'bots-check' })];
            case 2:
                _h.sent();
                return [4 /*yield*/, pane.post({ value: 50 }, { in: 'sl-budget' })];
            case 3:
                _h.sent();
                return [4 /*yield*/, pane.post({ value: 1 }, { in: 'sl-p1' })];
            case 4:
                _h.sent();
                return [4 /*yield*/, pane.post({ value: 5 }, { in: 'sl-p2' })];
            case 5:
                _h.sent();
                return [4 /*yield*/, pane.press({ key: 'start' })];
            case 6:
                _h.sent();
                return [4 /*yield*/, pane.unmount()];
            case 7:
                _h.sent();
                (0, testing_1.expect)(w.trades.length).toBe(0);
                at = [];
                i = 0;
                _h.label = 8;
            case 8:
                if (!(i < 24)) return [3 /*break*/, 11];
                before = w.trades.length;
                return [4 /*yield*/, w.clock.advance(30000)];
            case 9:
                _h.sent();
                if (w.trades.length > before)
                    at.push(secs(w));
                _h.label = 10;
            case 10:
                i++;
                return [3 /*break*/, 8];
            case 11:
                // One slice on the first tick, then one a minute, 5 in all: 50 USDC, and nothing after.
                (0, testing_1.expect)(at).toEqual([30, 90, 150, 210, 270]);
                (0, testing_1.expect)(w.trades.every(function (a) { return a.side === 'buy' && a.inputMint === USDC && a.outputMint === WSOL && a.amount === '10000000' && a.account === PF.PAPER_ACCOUNT; })).toBe(true);
                // One /price call to the Agon server a tick for every bot together, never more, and none to Jupiter.
                (0, testing_1.expect)(w.priceCalls).toBe(24);
                (0, testing_1.expect)(w.directCalls).toBe(0);
                _i = 0, _a = ['terminal', 'desktop'];
                _h.label = 12;
            case 12:
                if (!(_i < _a.length)) return [3 /*break*/, 22];
                surface = _a[_i];
                return [4 /*yield*/, botsPane($, surface)];
            case 13:
                p = _h.sent();
                _b = testing_1.expect;
                return [4 /*yield*/, p.find({ type: 'Text', text: /^ Paper $/ })];
            case 14:
                _b.apply(void 0, [_h.sent()]).toBeDefined();
                _c = testing_1.expect;
                return [4 /*yield*/, p.find({ type: 'Text', text: /Demo|sample/i })];
            case 15:
                _c.apply(void 0, [_h.sent()]).toBeUndefined();
                _d = testing_1.expect;
                return [4 /*yield*/, p.find({ type: 'Text', text: /^done$/ })];
            case 16:
                _d.apply(void 0, [_h.sent()]).toBeDefined();
                // 0.457764310 SOL for $50 at $109.20: $49.99, unrealized -$0.01, realized $0.00.
                _e = testing_1.expect;
                return [4 /*yield*/, p.find({ type: 'Text', text: /^Spent \$50\.00 of \$50\.00 in 5 fills$/ })];
            case 17:
                // 0.457764310 SOL for $50 at $109.20: $49.99, unrealized -$0.01, realized $0.00.
                _e.apply(void 0, [_h.sent()]).toBeDefined();
                _f = testing_1.expect;
                return [4 /*yield*/, p.find({ type: 'Text', text: /^Paper P&L -\$0\.01 \(-0\.02% on budget\): realized \$0\.00, unrealized -\$0\.01 at \$109\.20, Jupiter 00:12:00 UTC$/ })];
            case 18:
                _f.apply(void 0, [_h.sent()]).toBeDefined();
                _g = testing_1.expect;
                return [4 /*yield*/, p.find({ type: 'Text', text: /^Bots trade only while Claude Code is open\. Paper balances reset when the Agon server restarts\. Paper only, no real funds\.$/ })];
            case 19:
                _g.apply(void 0, [_h.sent()]).toBeDefined();
                return [4 /*yield*/, p.unmount()];
            case 20:
                _h.sent();
                _h.label = 21;
            case 21:
                _i++;
                return [3 /*break*/, 12];
            case 22:
                kept = w.store.get('bots');
                (0, testing_1.expect)(kept.length).toBe(1);
                (0, testing_1.expect)(kept[0].fills.length).toBe(5);
                (0, testing_1.expect)(kept[0].status).toBe('done');
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('a price the Agon server could only serve stale places no order, and the bot says why', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, pane, p, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                w = world(on, function (a) { return scaled(PF.BUY_FILLED, a.amount, '91552862'); });
                w.stale = true;
                return [4 /*yield*/, botsPane($, 'desktop')];
            case 1:
                pane = _b.sent();
                return [4 /*yield*/, pane.press({ key: 'bots-check' })];
            case 2:
                _b.sent();
                return [4 /*yield*/, pane.post({ value: 50 }, { in: 'sl-budget' })];
            case 3:
                _b.sent();
                return [4 /*yield*/, pane.post({ value: 1 }, { in: 'sl-p1' })];
            case 4:
                _b.sent();
                return [4 /*yield*/, pane.post({ value: 5 }, { in: 'sl-p2' })];
            case 5:
                _b.sent();
                return [4 /*yield*/, pane.press({ key: 'start' })];
            case 6:
                _b.sent();
                return [4 /*yield*/, pane.unmount()];
            case 7:
                _b.sent();
                return [4 /*yield*/, w.clock.advance(30000)];
            case 8:
                _b.sent();
                (0, testing_1.expect)(w.trades.length).toBe(0);
                return [4 /*yield*/, botsPane($, 'desktop')];
            case 9:
                p = _b.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, p.find({ type: 'Text', text: /No live price this tick \(the Agon server served a stale price \(Prices for 1 mint: Jupiter answered 503/ })];
            case 10:
                _a.apply(void 0, [_b.sent()]).toBeDefined();
                return [4 /*yield*/, p.unmount()
                    // A fresh price again: the slice goes out on the next tick.
                ];
            case 11:
                _b.sent();
                // A fresh price again: the slice goes out on the next tick.
                w.stale = false;
                return [4 /*yield*/, w.clock.advance(30000)];
            case 12:
                _b.sent();
                (0, testing_1.expect)(w.trades.length).toBe(1);
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('a Trail paper bot buys once, follows the peak and sells everything on the trailing drop', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, pane, _i, _a, p, _b, _c, surface, p, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                w = world(on, function (a) { return (a.side === 'buy' ? scaled(PF.BUY_FILLED, a.amount, '457764310') : scaled(PF.SELL_FILLED, a.amount, '51270000')); });
                return [4 /*yield*/, botsPane($, 'desktop')];
            case 1:
                pane = _e.sent();
                return [4 /*yield*/, pane.press({ key: 'bots-check' })];
            case 2:
                _e.sent();
                return [4 /*yield*/, pane.press({ key: 'st-trail' })];
            case 3:
                _e.sent();
                return [4 /*yield*/, pane.post({ value: 50 }, { in: 'sl-budget' })];
            case 4:
                _e.sent();
                return [4 /*yield*/, pane.post({ value: 6 }, { in: 'sl-p1' })];
            case 5:
                _e.sent();
                return [4 /*yield*/, pane.post({ value: 10 }, { in: 'sl-p2' })];
            case 6:
                _e.sent();
                return [4 /*yield*/, pane.press({ key: 'start' })];
            case 7:
                _e.sent();
                return [4 /*yield*/, pane.unmount()];
            case 8:
                _e.sent();
                return [4 /*yield*/, w.clock.advance(30000)];
            case 9:
                _e.sent();
                (0, testing_1.expect)(w.trades).toEqual([{ account: PF.PAPER_ACCOUNT, side: 'buy', symbol: 'SOL', inputMint: USDC, outputMint: WSOL, amount: '50000000' }]);
                _i = 0, _a = [115, 120, 114];
                _e.label = 10;
            case 10:
                if (!(_i < _a.length)) return [3 /*break*/, 13];
                p = _a[_i];
                w.price = p;
                return [4 /*yield*/, w.clock.advance(30000)];
            case 11:
                _e.sent();
                _e.label = 12;
            case 12:
                _i++;
                return [3 /*break*/, 10];
            case 13:
                (0, testing_1.expect)(w.trades.length).toBe(1);
                w.price = 112.8;
                return [4 /*yield*/, w.clock.advance(30000)];
            case 14:
                _e.sent();
                (0, testing_1.expect)(w.trades.at(-1)).toEqual({ account: PF.PAPER_ACCOUNT, side: 'sell', symbol: 'SOL', inputMint: WSOL, outputMint: USDC, amount: '457764310' });
                w.price = 90;
                return [4 /*yield*/, w.clock.advance(120000)];
            case 15:
                _e.sent();
                (0, testing_1.expect)(w.trades.length).toBe(2);
                (0, testing_1.expect)(w.toasts).toContain('Paper Trail SOL: sold 0.45776431 SOL for 51.27 USDC, trail: $112.80 is 6.0% off the $120.00 peak');
                _b = 0, _c = ['terminal', 'desktop'];
                _e.label = 16;
            case 16:
                if (!(_b < _c.length)) return [3 /*break*/, 21];
                surface = _c[_b];
                return [4 /*yield*/, botsPane($, surface)
                    // Realized: 51.27 for what cost 50, valued at the last price read while it held.
                ];
            case 17:
                p = _e.sent();
                // Realized: 51.27 for what cost 50, valued at the last price read while it held.
                _d = testing_1.expect;
                return [4 /*yield*/, p.find({ type: 'Text', text: /^Paper P&L \+\$1\.27 \(\+2\.54% on budget\): realized \+\$1\.27, unrealized \$0\.00 at \$112\.80, Jupiter 00:02:30 UTC$/ })];
            case 18:
                // Realized: 51.27 for what cost 50, valued at the last price read while it held.
                _d.apply(void 0, [_e.sent()]).toBeDefined();
                return [4 /*yield*/, p.unmount()];
            case 19:
                _e.sent();
                _e.label = 20;
            case 20:
                _b++;
                return [3 /*break*/, 16];
            case 21: return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('a refused paper order shows its reason with the number, backs off instead of asking every tick, and pauses after 3', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, pane, i, _i, _a, surface, p, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                w = world(on, function () { return PF.BUY_REFUSED; });
                return [4 /*yield*/, botsPane($, 'desktop')];
            case 1:
                pane = _e.sent();
                return [4 /*yield*/, pane.press({ key: 'bots-check' })];
            case 2:
                _e.sent();
                return [4 /*yield*/, pane.press({ key: 'start' })];
            case 3:
                _e.sent();
                return [4 /*yield*/, pane.unmount()];
            case 4:
                _e.sent();
                i = 0;
                _e.label = 5;
            case 5:
                if (!(i < 40)) return [3 /*break*/, 8];
                return [4 /*yield*/, w.clock.advance(30000)
                    // 20 minutes of ticks, 3 asks: at 0:30, then 2 and 4 minutes later; the third refusal pauses it.
                ];
            case 6:
                _e.sent();
                _e.label = 7;
            case 7:
                i++;
                return [3 /*break*/, 5];
            case 8:
                // 20 minutes of ticks, 3 asks: at 0:30, then 2 and 4 minutes later; the third refusal pauses it.
                (0, testing_1.expect)(w.trades.length).toBe(3);
                _i = 0, _a = ['terminal', 'desktop'];
                _e.label = 9;
            case 9:
                if (!(_i < _a.length)) return [3 /*break*/, 16];
                surface = _a[_i];
                return [4 /*yield*/, botsPane($, surface)];
            case 10:
                p = _e.sent();
                _b = testing_1.expect;
                return [4 /*yield*/, p.find({ type: 'Text', text: /^✗ Price impact 6\.37%, past your 1% band\. Trade smaller\. \(6\.37% against a limit of 1%\)$/ })];
            case 11:
                _b.apply(void 0, [_e.sent()]).toBeDefined();
                _c = testing_1.expect;
                return [4 /*yield*/, p.find({ type: 'Text', text: /^Paused after 3 refusals in a row\. Read the last reason, change the bot, then resume it\.$/ })];
            case 12:
                _c.apply(void 0, [_e.sent()]).toBeDefined();
                _d = testing_1.expect;
                return [4 /*yield*/, p.find({ type: 'Text', text: /^Data slot 454699528, rule version / })];
            case 13:
                _d.apply(void 0, [_e.sent()]).toBeDefined();
                return [4 /*yield*/, p.unmount()];
            case 14:
                _e.sent();
                _e.label = 15;
            case 15:
                _i++;
                return [3 /*break*/, 9];
            case 16: return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('with the Agon server not in paper mode, bots cannot start and the view says why and to set AGON_MODE=paper', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, _i, _a, surface, pane, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                w = world(on, function () { return PF.BUY_FILLED; }, false);
                _i = 0, _a = ['terminal', 'desktop'];
                _d.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 8];
                surface = _a[_i];
                return [4 /*yield*/, botsPane($, surface)];
            case 2:
                pane = _d.sent();
                return [4 /*yield*/, pane.press({ key: 'bots-check' })];
            case 3:
                _d.sent();
                _b = testing_1.expect;
                return [4 /*yield*/, pane.find({ key: 'start' })];
            case 4:
                _b.apply(void 0, [_d.sent()]).toBeUndefined();
                _c = testing_1.expect;
                return [4 /*yield*/, pane.find({ type: 'Text', text: /^Bots cannot start: the Agon server at \S+ is not in paper mode\. Run it with AGON_MODE=paper, then press Check again\.$/ })];
            case 5:
                _c.apply(void 0, [_d.sent()]).toBeDefined();
                return [4 /*yield*/, pane.unmount()];
            case 6:
                _d.sent();
                _d.label = 7;
            case 7:
                _i++;
                return [3 /*break*/, 1];
            case 8: return [4 /*yield*/, w.clock.advance(120000)];
            case 9:
                _d.sent();
                (0, testing_1.expect)(w.trades.length).toBe(0);
                return [2 /*return*/];
        }
    });
}); });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var band = function ($) {
    return $.ui.mount({ plugin: 'agon', surface: 'desktop', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 8, bodyColumns: 120 } });
};
(0, testing_1.test)('the band Bots view has + New bot (+ Make one when empty), which opens the one pane on Bots with the builder shown', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, empty, _a, pane, _b, _c, one, _d, back, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                w = world(on, function (a) { return scaled(PF.BUY_FILLED, a.amount, '91552862'); });
                return [4 /*yield*/, band($)];
            case 1:
                empty = _g.sent();
                return [4 /*yield*/, empty.press({ key: 'band-view-bots' })];
            case 2:
                _g.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, empty.find({ key: 'band-new-bot' })];
            case 3:
                _a.apply(void 0, [_g.sent()]).toBeUndefined();
                return [4 /*yield*/, empty.press({ key: 'band-make-bot' })];
            case 4:
                _g.sent();
                return [4 /*yield*/, empty.unmount()];
            case 5:
                _g.sent();
                (0, testing_1.expect)(__spreadArray([], w.up, true)).toEqual(['agon']);
                return [4 /*yield*/, $.ui.mount({
                        plugin: 'agon',
                        surface: 'desktop',
                        component: 'Pane',
                        requestId: 'agon',
                        props: { title: 'Agon', isFocused: true, bodyColumns: 100, placement: 'dock', scroll: { offset: 0, bodyRows: 80 } },
                    })];
            case 6:
                pane = _g.sent();
                _b = testing_1.expect;
                return [4 /*yield*/, pane.find({ key: 'sl-budget' })];
            case 7:
                _b.apply(void 0, [_g.sent()]).toBeDefined();
                return [4 /*yield*/, pane.press({ key: 'bots-check' })];
            case 8:
                _g.sent();
                return [4 /*yield*/, pane.press({ key: 'start' })
                    // Hidden again, then + New bot (a bot now exists) brings it back.
                ];
            case 9:
                _g.sent();
                // Hidden again, then + New bot (a bot now exists) brings it back.
                return [4 /*yield*/, pane.press({ key: 'lay' })];
            case 10:
                // Hidden again, then + New bot (a bot now exists) brings it back.
                _g.sent();
                return [4 /*yield*/, pane.post({ toggle: 'builder' }, { in: 'lay-bots' })];
            case 11:
                _g.sent();
                _c = testing_1.expect;
                return [4 /*yield*/, pane.find({ key: 'sl-budget' })];
            case 12:
                _c.apply(void 0, [_g.sent()]).toBeUndefined();
                return [4 /*yield*/, pane.press({ key: 'nav-portfolio' })];
            case 13:
                _g.sent();
                return [4 /*yield*/, pane.unmount()];
            case 14:
                _g.sent();
                return [4 /*yield*/, band($)];
            case 15:
                one = _g.sent();
                _d = testing_1.expect;
                return [4 /*yield*/, one.find({ key: 'band-make-bot' })];
            case 16:
                _d.apply(void 0, [_g.sent()]).toBeUndefined();
                return [4 /*yield*/, one.press({ key: 'band-new-bot' })];
            case 17:
                _g.sent();
                return [4 /*yield*/, one.unmount()];
            case 18:
                _g.sent();
                return [4 /*yield*/, $.ui.mount({
                        plugin: 'agon',
                        surface: 'desktop',
                        component: 'Pane',
                        requestId: 'agon',
                        props: { title: 'Agon', isFocused: true, bodyColumns: 100, placement: 'dock', scroll: { offset: 0, bodyRows: 80 } },
                    })];
            case 19:
                back = _g.sent();
                _e = testing_1.expect;
                return [4 /*yield*/, back.find({ key: 'sl-budget' })];
            case 20:
                _e.apply(void 0, [_g.sent()]).toBeDefined();
                _f = testing_1.expect;
                return [4 /*yield*/, back.find({ key: 'lay-bots' })];
            case 21:
                _f.apply(void 0, [_g.sent()]).toBeDefined();
                return [4 /*yield*/, back.unmount()];
            case 22:
                _g.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)("the draft rides on the next prompt as model-only context after a change, and while the builder is open", function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var sent, enter, pane, ctx, b, open;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                world(on, function () { return PF.BUY_FILLED; });
                sent = [];
                on('prompt.submit', function (_$, e) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        sent.push({ text: e.text, context: e.context });
                        return [2 /*return*/, { text: e.text, context: e.context }];
                    });
                }); });
                enter = function (text) { return $.prompt.submit({ text: text, wait: false, origin: { kind: 'composer' } }); };
                return [4 /*yield*/, botsPane($, 'desktop')];
            case 1:
                pane = _c.sent();
                return [4 /*yield*/, pane.post({ value: 1250 }, { in: 'sl-budget' })];
            case 2:
                _c.sent();
                return [4 /*yield*/, pane.unmount()];
            case 3:
                _c.sent();
                return [4 /*yield*/, enter('is this sensible?')];
            case 4:
                _c.sent();
                ctx = (_a = sent.at(-1).context) === null || _a === void 0 ? void 0 : _a.find(function (c) { return c.includes('Agon bot draft'); });
                (0, testing_1.expect)(ctx).toBeDefined();
                (0, testing_1.expect)(ctx).toContain('strategy DCA');
                (0, testing_1.expect)(ctx).toContain('token SOL (mint So11111111111111111111111111111111111111112)');
                (0, testing_1.expect)(ctx).toContain('budget $1,250 (50 to 5000 USD)');
                (0, testing_1.expect)(ctx).toContain('every 5 min (1 to 60 min)');
                (0, testing_1.expect)(ctx).toContain('orders 8 (2 to 20)');
                (0, testing_1.expect)(ctx).toContain('cap $100 an order (25 to 1000 USD)');
                (0, testing_1.expect)(ctx).toContain('paper mode not checked yet');
                (0, testing_1.expect)(sent.at(-1).text).toBe('is this sensible?');
                // Unchanged and with no pane open, the next prompt goes without it.
                return [4 /*yield*/, enter('thanks')];
            case 5:
                // Unchanged and with no pane open, the next prompt goes without it.
                _c.sent();
                (0, testing_1.expect)(sent.at(-1).context).toBeUndefined();
                return [4 /*yield*/, band($)];
            case 6:
                b = _c.sent();
                return [4 /*yield*/, b.press({ key: 'band-view-bots' })];
            case 7:
                _c.sent();
                return [4 /*yield*/, b.press({ key: 'band-make-bot' })];
            case 8:
                _c.sent();
                return [4 /*yield*/, b.unmount()];
            case 9:
                _c.sent();
                return [4 /*yield*/, botsPane($, 'desktop')];
            case 10:
                open = _c.sent();
                return [4 /*yield*/, enter('and now?')];
            case 11:
                _c.sent();
                (0, testing_1.expect)((_b = sent.at(-1).context) === null || _b === void 0 ? void 0 : _b.some(function (c) { return c.includes('Agon bot draft'); })).toBe(true);
                return [4 /*yield*/, open.unmount()];
            case 12:
                _c.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('bot_draft sets the draft the builder shows, refuses any field out of range changing nothing, and never starts a bot', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, call, text, set, pane, _a, draftNow, _b, _i, _c, bad, r, _d, _e, _f, _g, _h, _j, _k, dca, _l, after, _m;
    return __generator(this, function (_o) {
        switch (_o.label) {
            case 0:
                w = world(on, function () { return PF.BUY_FILLED; });
                call = function (input) { return $.tool.call(__assign({ tool: 'mcp__agon__bot_draft' }, input)); };
                text = function (r) { return JSON.stringify(r); };
                return [4 /*yield*/, call({ strategy: 'trail', budget: 300, trail: 8, stop: 12, cap: 150 })];
            case 1:
                set = _o.sent();
                (0, testing_1.expect)(text(set)).toContain('strategy Trail');
                (0, testing_1.expect)(text(set)).toContain('trail 8% (1 to 25%)');
                (0, testing_1.expect)(text(set)).toContain('not started');
                return [4 /*yield*/, botsPane($, 'desktop')];
            case 2:
                pane = _o.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, pane.find({ type: 'Text', text: /^↳ Buy \$150\.00 now, sell all 8% off the peak or 12% under entry$/ })];
            case 3:
                _a.apply(void 0, [_o.sent()]).toBeDefined();
                return [4 /*yield*/, pane.unmount()];
            case 4:
                _o.sent();
                _b = text;
                return [4 /*yield*/, call({ action: 'get' })];
            case 5:
                draftNow = _b.apply(void 0, [_o.sent()]);
                _i = 0, _c = [
                    { budget: 99999 },
                    { budget: 'abc' },
                    { budget: 120.5 },
                    { every: 5 },
                    { trail: 0 },
                    { mint: 'not a mint' },
                    { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
                    { strategy: 'grid' },
                    { action: 'start' },
                    { budget: 100, extra: 1 },
                ];
                _o.label = 6;
            case 6:
                if (!(_i < _c.length)) return [3 /*break*/, 10];
                bad = _c[_i];
                _d = text;
                return [4 /*yield*/, call(bad)];
            case 7:
                r = _d.apply(void 0, [_o.sent()]);
                (0, testing_1.expect)(r).not.toContain('Bot draft now');
                _e = testing_1.expect;
                _f = text;
                return [4 /*yield*/, call({ action: 'get' })];
            case 8:
                _e.apply(void 0, [_f.apply(void 0, [_o.sent()])]).toBe(draftNow);
                _o.label = 9;
            case 9:
                _i++;
                return [3 /*break*/, 6];
            case 10:
                _g = testing_1.expect;
                _h = text;
                return [4 /*yield*/, call({ budget: 99999 })];
            case 11:
                _g.apply(void 0, [_h.apply(void 0, [_o.sent()])]).toMatch(/budget.*99999.*50 to 5000/);
                _j = testing_1.expect;
                _k = text;
                return [4 /*yield*/, call({ every: 5 })];
            case 12:
                _j.apply(void 0, [_k.apply(void 0, [_o.sent()])]).toMatch(/every.*DCA.*trail and stop/);
                _l = text;
                return [4 /*yield*/, call({ strategy: 'dca', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', every: 15, orders: 4 })];
            case 13:
                dca = _l.apply(void 0, [_o.sent()]);
                (0, testing_1.expect)(dca).toContain('token JUP (mint JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN)');
                (0, testing_1.expect)(dca).toContain('every 15 min');
                return [4 /*yield*/, botsPane($, 'desktop')];
            case 14:
                after = _o.sent();
                _m = testing_1.expect;
                return [4 /*yield*/, after.find({ type: 'Text', text: /^No bots yet\./ })];
            case 15:
                _m.apply(void 0, [_o.sent()]).toBeDefined();
                return [4 /*yield*/, after.unmount()];
            case 16:
                _o.sent();
                (0, testing_1.expect)(w.store.get('bots')).toBeUndefined();
                (0, testing_1.expect)(w.trades.length).toBe(0);
                return [2 /*return*/];
        }
    });
}); });
