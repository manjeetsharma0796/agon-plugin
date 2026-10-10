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
var SF = require("./server-fixtures");
// Market data through the Agon server's cached routes (agon-dev T-C53), replayed from the bodies the
// running server answered (server-fixtures.ts), with Jupiter's direct answers as the fallback.
var SERVER = 'https://agon-dev.onrender.com';
var SOL = 'So11111111111111111111111111111111111111112';
var JUP = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
var BONK = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
var USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
// Jupiter's own answer, for Discover's list (only Jupiter sends it) and for the fallback: the 3
// watched tokens at prices the server never sent, so a price on screen says which path it took.
var JUP_LIST = JSON.stringify([
    { id: SOL, symbol: 'SOL', usdPrice: 50, stats24h: { priceChange: 1.5 }, decimals: 9 },
    { id: JUP, symbol: 'JUP', usdPrice: 0.5, decimals: 6 },
    { id: BONK, symbol: 'Bonk', usdPrice: 0.00001, decimals: 5 },
]);
// The recorded /tokens with every price set to 99: the band's prices can then only come from /price.
var TOKENS_AT_99 = (function () {
    var b = JSON.parse(SF.TOKENS);
    for (var _i = 0, _a = b.tokens; _i < _a.length; _i++) {
        var t = _a[_i];
        t.price.value = 99;
    }
    return JSON.stringify(b);
})();
var res = function (status, text, headers) {
    if (headers === void 0) { headers = {}; }
    return ({ value: { status: status, ok: status >= 200 && status < 300, headers: headers, text: text } });
};
// Every call the plugin makes, by kind; `server` answers the Agon server's routes, or throws for one
// that is down. Jupiter's market reads (search by mint, price, quote) are counted apart from the list.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var world = function (on, server) {
    var w = { server: [], jupMarket: [], jupList: [] };
    on('command.register', function (_$, e) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, ({ value: { command: e.name } })];
    }); }); });
    on('ui.open', function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, ({ value: { isPlaced: true } })];
    }); }); });
    on('http.fetch', function (_$, e) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (e.url.startsWith("".concat(SERVER, "/")) && !e.url.startsWith("".concat(SERVER, "/mcp"))) {
                w.server.push(e.url);
                return [2 /*return*/, server(e.url)];
            }
            if (/jup\.ag\//.test(e.url)) {
                if (/\/search\?query=|\/price\/|\/quote\?/.test(e.url))
                    w.jupMarket.push(e.url);
                else
                    w.jupList.push(e.url);
                return [2 /*return*/, res(200, JUP_LIST)];
            }
            return [2 /*return*/, res(200, '[]')];
        });
    }); });
    return w;
};
var ids = function (url) { var _a; return ((_a = new URL(url).searchParams.get('ids')) !== null && _a !== void 0 ? _a : '').split(','); };
var routeOf = function (url) { return new URL(url).pathname; };
var PANE = function (surface, bodyColumns) {
    if (bodyColumns === void 0) { bodyColumns = 100; }
    return ({
        plugin: 'agon',
        surface: surface,
        component: 'Pane',
        requestId: 'agon',
        props: { title: 'Agon', isFocused: true, bodyColumns: bodyColumns, placement: 'dock', scroll: { offset: 0, bodyRows: 80 } },
    });
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var open = function ($_1, view_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([$_1, view_1], args_1, true), void 0, function ($, view, surface) {
        var pane;
        if (surface === void 0) { surface = 'desktop'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, $.ui.mount(PANE(surface))];
                case 1:
                    pane = _a.sent();
                    return [4 /*yield*/, pane.press({ key: "nav-".concat(view) })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, pane];
            }
        });
    });
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var band = function ($, bodyColumns) {
    if (bodyColumns === void 0) { bodyColumns = 160; }
    return $.ui.mount({ plugin: 'agon', surface: 'terminal', component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 6, bodyColumns: bodyColumns } });
};
// Loading Discover's list refreshes the watchlist and polls its prices, as the 20 s timer does.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var refresh = function ($) { return __awaiter(void 0, void 0, void 0, function () {
    var pane;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, open($, 'discover')];
            case 1:
                pane = _a.sent();
                return [4 /*yield*/, pane.post({ pick: 0 }, { in: 'src' })];
            case 2:
                _a.sent();
                return [4 /*yield*/, pane.unmount()];
            case 3:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
(0, testing_1.test)('the band prices the watchlist from 1 /price call to the Agon server and says so, small', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var w, priceCalls, b, _a, _b, _c, _d, pane, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                w = world(on, function (url) { return (routeOf(url) === '/price' ? res(200, SF.PRICE) : routeOf(url) === '/tokens' ? res(200, TOKENS_AT_99) : res(404, '{}')); });
                return [4 /*yield*/, refresh($)
                    // 1 /price call holds all 3 watched mints; nothing is asked of Jupiter for them.
                ];
            case 1:
                _f.sent();
                priceCalls = w.server.filter(function (u) { return routeOf(u) === '/price'; });
                (0, testing_1.expect)(priceCalls.length).toBe(1);
                (0, testing_1.expect)(ids(priceCalls[0]).sort()).toEqual([BONK, JUP, SOL].sort());
                (0, testing_1.expect)(w.jupMarket).toEqual([]);
                return [4 /*yield*/, band($)];
            case 2:
                b = _f.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, b.find({ type: 'Text', text: /^SOL \$110\.52$/ })];
            case 3:
                _a.apply(void 0, [_f.sent()]).toBeDefined();
                _b = testing_1.expect;
                return [4 /*yield*/, b.find({ type: 'Text', text: /^▼3\.9%$/ })];
            case 4:
                _b.apply(void 0, [_f.sent()]).toBeDefined();
                _c = testing_1.expect;
                return [4 /*yield*/, b.find({ type: 'Text', text: /\$99\.00/ })];
            case 5:
                _c.apply(void 0, [_f.sent()]).toBeUndefined();
                _d = testing_1.expect;
                return [4 /*yield*/, b.find({ type: 'Text', text: /^via Agon, \d+ s ago$/ })];
            case 6:
                _d.apply(void 0, [_f.sent()]).toBeDefined();
                return [4 /*yield*/, b.unmount()
                    // The watchlist names the server and the host it read, with the age.
                ];
            case 7:
                _f.sent();
                return [4 /*yield*/, open($, 'watch')];
            case 8:
                pane = _f.sent();
                _e = testing_1.expect;
                return [4 /*yield*/, pane.find({ type: 'Text', text: /^Prices via Agon server from api\.jup\.ag, \d+ s ago$/ })];
            case 9:
                _e.apply(void 0, [_f.sent()]).toBeDefined();
                return [4 /*yield*/, pane.unmount()];
            case 10:
                _f.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('with the Agon server down or answering 5xx, prices come straight from Jupiter, and the server is asked again after 30 s', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var clock, answer, w, asked, b, _a, _b, pane, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                clock = testing_1.mock.clock(on, { now: Date.parse('2026-10-09T00:00:00Z') });
                answer = 'down';
                w = world(on, function () {
                    if (answer === 'down')
                        throw new Error('connect ECONNREFUSED 127.0.0.1:8787');
                    return res(503, JSON.stringify({ error: 'Service Unavailable' }));
                });
                return [4 /*yield*/, refresh($)
                    // Each route asked the server once; the rest of the refresh went to Jupiter without asking it again.
                ];
            case 1:
                _e.sent();
                asked = w.server.length;
                (0, testing_1.expect)(new Set(w.server.map(routeOf)).size).toBe(asked);
                (0, testing_1.expect)(w.server.map(routeOf)).toContain('/price');
                (0, testing_1.expect)(w.jupMarket.length).toBeGreaterThan(0);
                return [4 /*yield*/, band($)];
            case 2:
                b = _e.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, b.find({ type: 'Text', text: /^SOL \$50\.00$/ })];
            case 3:
                _a.apply(void 0, [_e.sent()]).toBeDefined();
                _b = testing_1.expect;
                return [4 /*yield*/, b.find({ type: 'Text', text: /^direct from Jupiter$/ })];
            case 4:
                _b.apply(void 0, [_e.sent()]).toBeDefined();
                return [4 /*yield*/, b.unmount()
                    // The test's throw reaches the plugin as the engine's own failure text, so the cause is matched loosely.
                ];
            case 5:
                _e.sent();
                return [4 /*yield*/, open($, 'watch')];
            case 6:
                pane = _e.sent();
                _c = testing_1.expect;
                return [4 /*yield*/, pane.find({ type: 'Text', text: /^Prices direct from Jupiter \(lite-api\.jup\.ag\), since nothing answers at https:\/\/agon-dev\.onrender\.com \(.+\)$/ })];
            case 7:
                _c.apply(void 0, [_e.sent()]).toBeDefined();
                return [4 /*yield*/, pane.unmount()
                    // Within 30 s the server is left alone; after, it is asked again, and a 503 falls back the same way.
                ];
            case 8:
                _e.sent();
                // Within 30 s the server is left alone; after, it is asked again, and a 503 falls back the same way.
                return [4 /*yield*/, clock.advance(10000)];
            case 9:
                // Within 30 s the server is left alone; after, it is asked again, and a 503 falls back the same way.
                _e.sent();
                return [4 /*yield*/, refresh($)];
            case 10:
                _e.sent();
                (0, testing_1.expect)(w.server.length).toBe(asked);
                answer = '503';
                return [4 /*yield*/, clock.advance(21000)];
            case 11:
                _e.sent();
                return [4 /*yield*/, refresh($)];
            case 12:
                _e.sent();
                (0, testing_1.expect)(w.server.length).toBeGreaterThan(asked);
                return [4 /*yield*/, open($, 'watch')];
            case 13:
                pane = _e.sent();
                _d = testing_1.expect;
                return [4 /*yield*/, pane.find({ type: 'Text', text: /^Prices direct from Jupiter \(lite-api\.jup\.ag\), since the Agon server at https:\/\/agon-dev\.onrender\.com answered 503 \(Service Unavailable\)$/ })];
            case 14:
                _d.apply(void 0, [_e.sent()]).toBeDefined();
                return [4 /*yield*/, pane.unmount()];
            case 15:
                _e.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)("a 429 from the Agon server is waited out for its Retry-After, asking neither it nor Jupiter meanwhile", function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var clock, busy, w, b, _a, pane, _b, back, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                clock = testing_1.mock.clock(on, { now: Date.parse('2026-10-09T00:00:00Z') });
                busy = true;
                w = world(on, function (url) { return (busy ? res(429, SF.SERVER_BUSY, { 'retry-after': '20' }) : routeOf(url) === '/price' ? res(200, SF.PRICE) : res(200, SF.TOKENS)); });
                return [4 /*yield*/, refresh($)];
            case 1:
                _d.sent();
                (0, testing_1.expect)(w.server.length).toBe(1);
                (0, testing_1.expect)(w.jupMarket).toEqual([]);
                return [4 /*yield*/, band($)];
            case 2:
                b = _d.sent();
                _a = testing_1.expect;
                return [4 /*yield*/, b.find({ key: 'band-prices' })];
            case 3:
                _a.apply(void 0, [_d.sent()]).toBeUndefined();
                return [4 /*yield*/, b.unmount()];
            case 4:
                _d.sent();
                return [4 /*yield*/, open($, 'watch')];
            case 5:
                pane = _d.sent();
                _b = testing_1.expect;
                return [4 /*yield*/, pane.find({
                        type: 'Text',
                        text: /^Prices not updated: the Agon server is over its 120 requests a minute and asked for 20 s of quiet, so nothing is asked of it or of Jupiter until then$/,
                    })];
            case 6:
                _b.apply(void 0, [_d.sent()]).toBeDefined();
                return [4 /*yield*/, pane.unmount()
                    // 19 s on, still waiting: not 1 call to the server or to Jupiter's market reads.
                ];
            case 7:
                _d.sent();
                // 19 s on, still waiting: not 1 call to the server or to Jupiter's market reads.
                busy = false;
                return [4 /*yield*/, clock.advance(19000)];
            case 8:
                _d.sent();
                return [4 /*yield*/, refresh($)];
            case 9:
                _d.sent();
                (0, testing_1.expect)(w.server.length).toBe(1);
                (0, testing_1.expect)(w.jupMarket).toEqual([]);
                // Past the 20 s, the server is asked again and the prices come back through it.
                return [4 /*yield*/, clock.advance(2000)];
            case 10:
                // Past the 20 s, the server is asked again and the prices come back through it.
                _d.sent();
                return [4 /*yield*/, refresh($)];
            case 11:
                _d.sent();
                (0, testing_1.expect)(w.server.length).toBeGreaterThan(1);
                (0, testing_1.expect)(w.jupMarket).toEqual([]);
                return [4 /*yield*/, band($)];
            case 12:
                back = _d.sent();
                _c = testing_1.expect;
                return [4 /*yield*/, back.find({ type: 'Text', text: /^SOL \$110\.52$/ })];
            case 13:
                _c.apply(void 0, [_d.sent()]).toBeDefined();
                return [4 /*yield*/, back.unmount()];
            case 14:
                _d.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('the order book reads its 8 quotes from /quote, names a size with no route, and asks Jupiter nothing', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var scaled, w, trade, before, quotes, _a, _b, _c, _d, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                scaled = function (fixture, amount) {
                    var q = JSON.parse(fixture);
                    return JSON.stringify(__assign(__assign({}, q), { inAmount: amount.toString(), outAmount: ((BigInt(q.outAmount) * amount) / BigInt(q.inAmount)).toString() }));
                };
                w = world(on, function (url) {
                    var q = new URL(url).searchParams;
                    if (routeOf(url) === '/price')
                        return res(200, SF.PRICE);
                    if (routeOf(url) === '/tokens')
                        return res(200, SF.TOKENS);
                    if (routeOf(url) === '/candles')
                        return res(200, SF.CANDLES);
                    if (routeOf(url) !== '/quote')
                        return res(404, '{}');
                    var amount = BigInt(q.get('amount'));
                    if (q.get('inputMint') === USDC)
                        return amount === 25000000000n ? res(502, SF.QUOTE_NO_ROUTE) : res(200, scaled(SF.QUOTE_BUY, amount));
                    return res(200, scaled(SF.QUOTE_SELL, amount));
                });
                return [4 /*yield*/, refresh($)];
            case 1:
                _f.sent();
                return [4 /*yield*/, open($, 'trade')];
            case 2:
                trade = _f.sent();
                before = w.server.length;
                return [4 /*yield*/, trade.press({ key: 'depth-refresh' })];
            case 3:
                _f.sent();
                quotes = w.server.slice(before).filter(function (u) { return routeOf(u) === '/quote'; });
                (0, testing_1.expect)(quotes.length).toBe(8);
                (0, testing_1.expect)(w.jupMarket).toEqual([]);
                // $100 of SOL bought at the recorded 904,495,681 lamports: $110.56; the server's price as the mid.
                _a = testing_1.expect;
                return [4 /*yield*/, trade.find({ type: 'Text', text: /^\$110\.56$/ })];
            case 4:
                // $100 of SOL bought at the recorded 904,495,681 lamports: $110.56; the server's price as the mid.
                _a.apply(void 0, [_f.sent()]).toBeDefined();
                _b = testing_1.expect;
                return [4 /*yield*/, trade.find({ type: 'Text', text: /^Jupiter price \$110\.52$/ })];
            case 5:
                _b.apply(void 0, [_f.sent()]).toBeDefined();
                // The $25,000 buy the server answered 502 "Jupiter answered 400" is a missing route, not an error.
                _c = testing_1.expect;
                return [4 /*yield*/, trade.find({ type: 'Text', text: /^no route$/ })];
            case 6:
                // The $25,000 buy the server answered 502 "Jupiter answered 400" is a missing route, not an error.
                _c.apply(void 0, [_f.sent()]).toBeDefined();
                _d = testing_1.expect;
                return [4 /*yield*/, trade.find({ type: 'Text', text: /^! Depth not read/ })];
            case 7:
                _d.apply(void 0, [_f.sent()]).toBeUndefined();
                _e = testing_1.expect;
                return [4 /*yield*/, trade.find({ type: 'Text', text: /^Quotes via Agon server from api\.jup\.ag, \d+ s ago; read again every 10 s at most while this view is open$/ })];
            case 8:
                _e.apply(void 0, [_f.sent()]).toBeDefined();
                return [4 /*yield*/, trade.unmount()];
            case 9:
                _f.sent();
                return [2 /*return*/];
        }
    });
}); });
