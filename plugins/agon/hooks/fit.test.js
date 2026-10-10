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
var WIDTHS = [45, 60, 100, 160];
var SURFACES = ['terminal', 'desktop'];
// A desktop cell is about 7 px of the app font; an Svg's pixels are counted at that.
var PX = 7;
var cells = function (s) { return __spreadArray([], s, true).length; };
var isNode = function (c) { return typeof c === 'object' && c !== null && 'type' in c; };
var P = function (n) { var _a; return (_a = n.props) !== null && _a !== void 0 ? _a : {}; };
var kids = function (n) { return (Array.isArray(n.children) ? n.children : []).filter(isNode); };
var textOf = function (n) { return (typeof n === 'string' ? n : (Array.isArray(n.children) ? n.children : []).map(textOf).join('')); };
var num = function (v) { return (typeof v === 'number' ? v : 0); };
var side = function (p, s) { var _a, _b; return num((_b = (_a = p["padding".concat(s)]) !== null && _a !== void 0 ? _a : p.paddingX) !== null && _b !== void 0 ? _b : p.padding); };
var marg = function (p, s) { var _a, _b; return num((_b = (_a = p["margin".concat(s)]) !== null && _a !== void 0 ? _a : p.marginX) !== null && _b !== void 0 ? _b : p.margin); };
var label = function (n) { var _a; return String((_a = P(n).key) !== null && _a !== void 0 ? _a : (n.type === 'Text' ? "\"".concat(textOf(n).slice(0, 24), "\"") : n.type)); };
var out = function (n) { return P(n).display === 'none' || P(n).position === 'absolute'; };
function need(n, surface, misses, path) {
    var _a, _b, _c, _d, _e;
    var p = (_a = n.props) !== null && _a !== void 0 ? _a : {};
    var at = "".concat(path, "/").concat(label(n));
    switch (n.type) {
        case 'Text': {
            var s = textOf(n);
            if (p.wrap === 'wrap')
                return Math.max.apply(Math, __spreadArray([0], s.split(/\s+/).map(cells), false));
            // A mint cut in the middle is deliberate: both ends stay readable.
            if (p.wrap === 'truncate-middle')
                return Math.min(cells(s), 16);
            return Math.max.apply(Math, __spreadArray([0], s.split('\n').map(cells), false));
        }
        case 'Button': {
            var l = cells(String((_b = p.label) !== null && _b !== void 0 ? _b : textOf(n)));
            return l + (surface === 'terminal' ? (p.plain ? 0 : 4) : p.plain ? 2 : 4);
        }
        case 'Link':
            return cells(String((_c = p.label) !== null && _c !== void 0 ? _c : textOf(n))) + (surface === 'terminal' ? 0 : 2);
        case 'Input':
            return 12;
        case 'Raster':
            return num(p.columns);
        case 'Svg':
            return surface === 'terminal' ? 0 : Math.ceil(num(p.width) / PX);
        case 'Client':
            return typeof p.width === 'number' ? p.width : 0;
        case 'Box': {
            var flow = kids(n).filter(function (k) { return !out(k); });
            var ws = flow.map(function (k, i) { return need(k, surface, misses, "".concat(at, "[").concat(i, "]")); });
            var row = !String((_d = p.flexDirection) !== null && _d !== void 0 ? _d : 'row').startsWith('column');
            var gap = num((_e = p.columnGap) !== null && _e !== void 0 ? _e : p.gap);
            var inner = row && p.flexWrap !== 'wrap' ? ws.reduce(function (a, w) { return a + w; }, 0) + gap * Math.max(0, ws.length - 1) : Math.max.apply(Math, __spreadArray([0], ws, false));
            var frame = side(p, 'Left') + side(p, 'Right') + (p.borderStyle ? 2 : 0);
            if (typeof p.width === 'number') {
                if (inner + frame > p.width) {
                    var i = ws.indexOf(Math.max.apply(Math, ws));
                    misses.push({ at: at, need: inner + frame, room: p.width, widest: flow[i] ? "".concat(label(flow[i]), " ").concat(ws[i]) : undefined });
                }
                return p.width + marg(p, 'Left') + marg(p, 'Right');
            }
            return Math.max(num(p.minWidth), inner + frame) + marg(p, 'Left') + marg(p, 'Right');
        }
        default:
            return 0;
    }
}
// What does not fit: every fixed-width box too small for what it holds, then the whole tree against
// the room it is drawn in.
function overflow(tree, surface, room) {
    var misses = [];
    var total = need(tree, surface, misses, '');
    if (total > room)
        misses.push({ at: 'root', need: total, room: room });
    return misses;
}
// Controls that wrap onto a second line never touch it: a wrapping row holding a pill or a button
// keeps a row between its lines, and a column holding two control rows keeps one between them.
var controlish = function (n) { return n.type === 'Client' || (n.type === 'Button' && !P(n).plain) || kids(n).some(controlish); };
function touching(n, path) {
    var _a, _b, _c, _d;
    if (path === void 0) { path = ''; }
    var at = "".concat(path, "/").concat(label(n));
    var found = [];
    var p = (_a = n.props) !== null && _a !== void 0 ? _a : {};
    if (n.type === 'Box' && !out(n)) {
        var flow = kids(n).filter(function (k) { return !out(k); });
        var row = !String((_b = p.flexDirection) !== null && _b !== void 0 ? _b : 'row').startsWith('column');
        if (row && p.flexWrap === 'wrap' && flow.filter(controlish).length > 1 && num((_c = p.rowGap) !== null && _c !== void 0 ? _c : p.gap) < 1)
            found.push(at);
        if (!row && num((_d = p.rowGap) !== null && _d !== void 0 ? _d : p.gap) < 1)
            for (var i = 1; i < flow.length; i++)
                if (flow[i - 1].type === 'Box' && flow[i].type === 'Box' && pillRow(flow[i - 1]) && pillRow(flow[i]))
                    found.push("".concat(at, "[").concat(i, "]"));
    }
    for (var _i = 0, _e = kids(n); _i < _e.length; _i++) {
        var k = _e[_i];
        found.push.apply(found, touching(k, at));
    }
    return found;
}
var pillRow = function (n) { return (n.type === 'Client' && P(n).module === './switch.tsx') || kids(n).some(pillRow); };
// The deepest stack of bordered boxes: the page frame is one.
var frames = function (n) { return (n.type === 'Box' && !out(n) ? (P(n).borderStyle ? 1 : 0) : 0) + Math.max.apply(Math, __spreadArray([0], kids(n).map(frames), false)); };
var BONK = {
    id: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'Bonk',
    icon: 'https://example.com/bonk.png',
    usdPrice: 0.0000037,
    stats5m: { priceChange: 0.12 },
    stats1h: { priceChange: -1.4 },
    stats6h: { priceChange: 3.25 },
    stats24h: { priceChange: -12.5, buyVolume: 4e6, sellVolume: 3.5e6 },
    mcap: 3.1e8,
    liquidity: 1.2e7,
    holderCount: 912345,
    organicScore: 88,
    audit: { mintAuthorityDisabled: true, freezeAuthorityDisabled: false },
    decimals: 5,
};
var SOL = __assign(__assign({}, BONK), { id: 'So11111111111111111111111111111111111111112', symbol: 'SOL', usdPrice: 109.2, decimals: 9, mcap: 6.1e10, liquidity: 9.9e8 });
var JUP = __assign(__assign({}, BONK), { id: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', usdPrice: 0.4123, decimals: 6 });
var MCP_URL = 'https://agon-dev.onrender.com/mcp';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var world = function (on, placed) {
    if (placed === void 0) { placed = true; }
    testing_1.mock.clock(on, { now: Date.parse('2026-10-09T00:00:00Z') });
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
    on('ui.open', function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, ({ value: placed ? { isPlaced: true } : { isPlaced: false, reason: 'no side pane on this surface' } })];
    }); }); });
    on('http.fetch', function (_$, e) { return __awaiter(void 0, void 0, void 0, function () {
        var ok, body, arg, of, _a, i, o, usdIn;
        var _b;
        var _c, _d;
        return __generator(this, function (_e) {
            ok = function (text) { return ({ value: { status: 200, ok: true, headers: {}, text: text } }); };
            if (e.url === MCP_URL) {
                body = JSON.parse(String((_c = e.init) === null || _c === void 0 ? void 0 : _c.body));
                return [2 /*return*/, ok(body.method === 'tools/list' ? PF.LIST : ((_d = body.params) === null || _d === void 0 ? void 0 : _d.name) === 'paper_portfolio' ? PF.PORTFOLIO_AFTER_BUY : PF.BUY_FILLED)];
            }
            if (e.url.includes('/ultra/v1/holdings/'))
                return [2 /*return*/, ok(JSON.stringify({ uiAmount: 2.5, tokens: (_b = {}, _b[BONK.id] = [{ uiAmount: 12000000, excludeFromNetWorth: false }], _b[JUP.id] = [{ uiAmount: 830, excludeFromNetWorth: false }], _b) }))];
            if (e.url.includes('/pools?'))
                return [2 /*return*/, ok(JSON.stringify({ data: [{ attributes: { address: 'Pool1', reserve_in_usd: '5' } }] }))];
            if (e.url.includes('/ohlcv/'))
                return [2 /*return*/, ok(JSON.stringify({ data: { attributes: { ohlcv_list: Array.from({ length: 24 }, function (_, i) { return [1760000000 - i * 3600, 0, 0, 0, 100 + Math.sin(i) * 9, 1000 + i]; }) } } }))
                    // A quote at the token's price, 0.2% worse each way, in each side's own decimals.
                ];
            // A quote at the token's price, 0.2% worse each way, in each side's own decimals.
            if (e.url.includes('/swap/v1/quote?')) {
                arg = function (k) { var _a, _b; return (_b = (_a = e.url.match(new RegExp("[?&]".concat(k, "=([^&]+)")))) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : ''; };
                of = function (mint) { var _a; return (_a = [SOL, JUP, BONK].find(function (t) { return t.id === mint; })) !== null && _a !== void 0 ? _a : { usdPrice: 1, decimals: 6 }; };
                _a = [of(arg('inputMint')), of(arg('outputMint'))], i = _a[0], o = _a[1];
                usdIn = (Number(arg('amount')) / Math.pow(10, i.decimals)) * i.usdPrice;
                return [2 /*return*/, ok(JSON.stringify({ outAmount: String(Math.floor(((usdIn * 0.998) / o.usdPrice) * Math.pow(10, o.decimals))) }))];
            }
            if (e.url.includes('wsrv.nl'))
                return [2 /*return*/, ok('data:image/png;base64,AAAA')];
            return [2 /*return*/, ok(JSON.stringify([SOL, JUP, BONK]))];
        });
    }); });
    return store;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var pane = function ($, surface, bodyColumns, view) { return __awaiter(void 0, void 0, void 0, function () {
    var p;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, $.ui.mount({
                    plugin: 'agon',
                    surface: surface,
                    component: 'Pane',
                    requestId: 'agon',
                    props: { title: 'Agon', isFocused: true, bodyColumns: bodyColumns, placement: 'dock', scroll: { offset: 0, bodyRows: 200 } },
                })];
            case 1:
                p = _a.sent();
                return [4 /*yield*/, p.press({ key: "nav-".concat(view) })];
            case 2:
                _a.sent();
                return [2 /*return*/, p];
        }
    });
}); };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var band = function ($, surface, bodyColumns, maxRows) {
    if (maxRows === void 0) { maxRows = 12; }
    return $.ui.mount({ plugin: 'agon', surface: surface, component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: maxRows, bodyColumns: bodyColumns } });
};
// Loads the list, picks Bonk into Trade, turns paper on and starts one bot, so every view has its
// full content: rows, a chart, an order book, a paper account, a bot with its details.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fill($) {
    return __awaiter(this, void 0, void 0, function () {
        var first;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pane($, 'desktop', 100, 'discover')];
                case 1:
                    first = _a.sent();
                    return [4 /*yield*/, first.post({ pick: 0 }, { in: 'src' })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, first.press({ key: "lb-".concat(BONK.id) })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, first.press({ key: 'paper-check' })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, first.press({ key: 'paper-buy' })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, first.press({ key: 'signup-continue' })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, first.press({ key: 'nav-bots' })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, first.press({ key: 'start' })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, first.post({ pick: 1 }, { in: 'pm-switch' }).catch(function () { return undefined; })];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, first.press({ key: 'nav-portfolio' })];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, first.post({ pick: 1 }, { in: 'pm-switch' })];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, first.press({ key: 'port-refresh' })];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, first.post({ pick: 0 }, { in: 'pm-switch' })];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, first.unmount()];
                case 14:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Every miss as one line a person can act on: where, how much it needs, how much room it has.
var report = function (where, misses) { return misses.map(function (m) { return "".concat(where, ": ").concat(m.at, " needs ").concat(m.need, " cells, has ").concat(m.room).concat(m.widest ? " (widest: ".concat(m.widest, ")") : ''); }); };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function check(p, where, surface, room, bad) {
    return __awaiter(this, void 0, void 0, function () {
        var tree, inner, _i, _a, c, drawn;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, p.drawn()];
                case 1:
                    tree = (_b.sent());
                    bad.push.apply(bad, report(where, overflow(tree, surface, room)));
                    bad.push.apply(bad, touching(tree).map(function (t) { return "".concat(where, ": control rows touch at ").concat(t); }));
                    inner = room - (surface === 'desktop' ? 7 : 2);
                    _i = 0;
                    return [4 /*yield*/, p.findAll({ type: 'Client' })];
                case 2:
                    _a = (_b.sent());
                    _b.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    c = _a[_i];
                    if (c.props.module !== './switch.tsx' && c.props.module !== './layout.tsx')
                        return [3 /*break*/, 5];
                    return [4 /*yield*/, p.drawn({ in: c.key })];
                case 4:
                    drawn = (_b.sent());
                    bad.push.apply(bad, report("".concat(where, " client ").concat(c.key), overflow(drawn, surface, c.props.module === './switch.tsx' ? Number(c.props.width) : inner)));
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/, tree];
            }
        });
    });
}
var VIEWS = [
    ['start', 'start', null],
    ['discover list', 'discover', function (p) { return p.post({ pick: 0 }, { in: 'view' }); }],
    ['discover table', 'discover', function (p) { return p.post({ pick: 1 }, { in: 'view' }); }],
    ['discover cards', 'discover', function (p) { return p.post({ pick: 2 }, { in: 'view' }); }],
    ['discover sort open', 'discover', function (p) { return p.press({ key: 'sort' }); }],
    ['watch', 'watch', null],
    ['trade', 'trade', null],
    ['bots', 'bots', null],
    ['bots layout', 'bots', function (p) { return p.press({ key: 'lay' }); }],
    ['portfolio paper', 'portfolio', function (p) { return p.post({ pick: 0 }, { in: 'pm-switch' }); }],
    ['portfolio mainnet', 'portfolio', function (p) { return p.post({ pick: 1 }, { in: 'pm-switch' }); }],
];
(0, testing_1.test)('every view fits 45, 60, 100 and 160 cells on the terminal and the desktop: nothing cut, nothing wrapped mid-label, no control rows touching', { timeoutMs: 60000 }, function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var bad, _loop_1, _i, SURFACES_1, surface;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                world(on);
                return [4 /*yield*/, fill($)];
            case 1:
                _a.sent();
                bad = [];
                _loop_1 = function (surface) {
                    var _loop_2, _b, WIDTHS_1, width;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                _loop_2 = function (width) {
                                    var _loop_3, _d, VIEWS_1, _e, name_1, view, act;
                                    return __generator(this, function (_f) {
                                        switch (_f.label) {
                                            case 0:
                                                _loop_3 = function (name_1, view, act) {
                                                    var p;
                                                    return __generator(this, function (_g) {
                                                        switch (_g.label) {
                                                            case 0: return [4 /*yield*/, pane($, surface, width, view)];
                                                            case 1:
                                                                p = _g.sent();
                                                                if (!act) return [3 /*break*/, 3];
                                                                return [4 /*yield*/, act(p).catch(function (err) { return bad.push("".concat(surface, " ").concat(width, " ").concat(name_1, ": ").concat(String(err))); })];
                                                            case 2:
                                                                _g.sent();
                                                                _g.label = 3;
                                                            case 3: return [4 /*yield*/, check(p, "".concat(surface, " ").concat(width, " ").concat(name_1), surface, width, bad)
                                                                // Put a toggled layout bar or sort list back for the next mount.
                                                            ];
                                                            case 4:
                                                                _g.sent();
                                                                if (!(name_1 === 'bots layout')) return [3 /*break*/, 6];
                                                                return [4 /*yield*/, p.press({ key: 'lo-done' })];
                                                            case 5:
                                                                _g.sent();
                                                                _g.label = 6;
                                                            case 6:
                                                                if (!(name_1 === 'discover sort open')) return [3 /*break*/, 8];
                                                                return [4 /*yield*/, p.press({ key: 'sort' })];
                                                            case 7:
                                                                _g.sent();
                                                                _g.label = 8;
                                                            case 8: return [4 /*yield*/, p.unmount()];
                                                            case 9:
                                                                _g.sent();
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                };
                                                _d = 0, VIEWS_1 = VIEWS;
                                                _f.label = 1;
                                            case 1:
                                                if (!(_d < VIEWS_1.length)) return [3 /*break*/, 4];
                                                _e = VIEWS_1[_d], name_1 = _e[0], view = _e[1], act = _e[2];
                                                return [5 /*yield**/, _loop_3(name_1, view, act)];
                                            case 2:
                                                _f.sent();
                                                _f.label = 3;
                                            case 3:
                                                _d++;
                                                return [3 /*break*/, 1];
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                };
                                _b = 0, WIDTHS_1 = WIDTHS;
                                _c.label = 1;
                            case 1:
                                if (!(_b < WIDTHS_1.length)) return [3 /*break*/, 4];
                                width = WIDTHS_1[_b];
                                return [5 /*yield**/, _loop_2(width)];
                            case 2:
                                _c.sent();
                                _c.label = 3;
                            case 3:
                                _b++;
                                return [3 /*break*/, 1];
                            case 4: return [2 /*return*/];
                        }
                    });
                };
                _i = 0, SURFACES_1 = SURFACES;
                _a.label = 2;
            case 2:
                if (!(_i < SURFACES_1.length)) return [3 /*break*/, 5];
                surface = SURFACES_1[_i];
                return [5 /*yield**/, _loop_1(surface)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                (0, testing_1.expect)(bad).toEqual([]);
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('the band fits 45, 60, 100 and 160 cells with prices, more rows, bots and the list fallback', { timeoutMs: 60000 }, function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var bad, _i, SURFACES_2, surface, _a, WIDTHS_2, width, b;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                world(on);
                return [4 /*yield*/, fill($)];
            case 1:
                _b.sent();
                bad = [];
                _i = 0, SURFACES_2 = SURFACES;
                _b.label = 2;
            case 2:
                if (!(_i < SURFACES_2.length)) return [3 /*break*/, 17];
                surface = SURFACES_2[_i];
                _a = 0, WIDTHS_2 = WIDTHS;
                _b.label = 3;
            case 3:
                if (!(_a < WIDTHS_2.length)) return [3 /*break*/, 16];
                width = WIDTHS_2[_a];
                return [4 /*yield*/, band($, surface, width)];
            case 4:
                b = _b.sent();
                return [4 /*yield*/, check(b, "".concat(surface, " ").concat(width, " band prices"), surface, width, bad)];
            case 5:
                _b.sent();
                return [4 /*yield*/, b.find({ key: 'band-rows' })];
            case 6:
                if (!_b.sent()) return [3 /*break*/, 10];
                return [4 /*yield*/, b.press({ key: 'band-rows' })];
            case 7:
                _b.sent();
                return [4 /*yield*/, check(b, "".concat(surface, " ").concat(width, " band rows"), surface, width, bad)];
            case 8:
                _b.sent();
                return [4 /*yield*/, b.press({ key: 'band-rows' })];
            case 9:
                _b.sent();
                _b.label = 10;
            case 10: return [4 /*yield*/, b.press({ key: 'band-view-bots' })];
            case 11:
                _b.sent();
                return [4 /*yield*/, check(b, "".concat(surface, " ").concat(width, " band bots"), surface, width, bad)];
            case 12:
                _b.sent();
                return [4 /*yield*/, b.press({ key: 'band-view-prices' })];
            case 13:
                _b.sent();
                return [4 /*yield*/, b.unmount()];
            case 14:
                _b.sent();
                _b.label = 15;
            case 15:
                _a++;
                return [3 /*break*/, 3];
            case 16:
                _i++;
                return [3 /*break*/, 2];
            case 17:
                (0, testing_1.expect)(bad).toEqual([]);
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('with no side pane the band holds the list, and it fits at every width', { timeoutMs: 60000 }, function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var bad, _i, SURFACES_3, surface, _a, WIDTHS_3, width, b, _b;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                world(on, false);
                return [4 /*yield*/, fill($)];
            case 1:
                _d.sent();
                bad = [];
                _i = 0, SURFACES_3 = SURFACES;
                _d.label = 2;
            case 2:
                if (!(_i < SURFACES_3.length)) return [3 /*break*/, 13];
                surface = SURFACES_3[_i];
                _a = 0, WIDTHS_3 = WIDTHS;
                _d.label = 3;
            case 3:
                if (!(_a < WIDTHS_3.length)) return [3 /*break*/, 12];
                width = WIDTHS_3[_a];
                return [4 /*yield*/, band($, surface, width, 40)];
            case 4:
                b = _d.sent();
                return [4 /*yield*/, b.find({ key: 'sidebar' })];
            case 5:
                if (!(((_c = (_d.sent())) === null || _c === void 0 ? void 0 : _c.props.label) !== '✕ List')) return [3 /*break*/, 7];
                return [4 /*yield*/, b.press({ key: 'sidebar' })];
            case 6:
                _d.sent();
                _d.label = 7;
            case 7:
                _b = testing_1.expect;
                return [4 /*yield*/, b.find({ key: 'search' })];
            case 8:
                _b.apply(void 0, [_d.sent()]).toBeDefined();
                return [4 /*yield*/, check(b, "".concat(surface, " ").concat(width, " band list"), surface, width, bad)];
            case 9:
                _d.sent();
                return [4 /*yield*/, b.unmount()];
            case 10:
                _d.sent();
                _d.label = 11;
            case 11:
                _a++;
                return [3 /*break*/, 3];
            case 12:
                _i++;
                return [3 /*break*/, 2];
            case 13:
                (0, testing_1.expect)(bad).toEqual([]);
                return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('one frame per page while narrow: no card border nests inside the page frame under 72 cells', { timeoutMs: 60000 }, function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, SURFACES_4, surface, _a, _b, width, _c, _d, _e, name_2, view, act, p, tree;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                world(on);
                return [4 /*yield*/, fill($)];
            case 1:
                _f.sent();
                _i = 0, SURFACES_4 = SURFACES;
                _f.label = 2;
            case 2:
                if (!(_i < SURFACES_4.length)) return [3 /*break*/, 15];
                surface = SURFACES_4[_i];
                _a = 0, _b = [45, 60];
                _f.label = 3;
            case 3:
                if (!(_a < _b.length)) return [3 /*break*/, 14];
                width = _b[_a];
                _c = 0, _d = VIEWS.filter(function (v) { return v[0] !== 'bots layout'; });
                _f.label = 4;
            case 4:
                if (!(_c < _d.length)) return [3 /*break*/, 13];
                _e = _d[_c], name_2 = _e[0], view = _e[1], act = _e[2];
                return [4 /*yield*/, pane($, surface, width, view)];
            case 5:
                p = _f.sent();
                if (!act) return [3 /*break*/, 7];
                return [4 /*yield*/, act(p)];
            case 6:
                _f.sent();
                _f.label = 7;
            case 7: return [4 /*yield*/, p.drawn()];
            case 8:
                tree = (_f.sent());
                // The desktop draws the page frame; the terminal's pane is framed by the engine instead.
                (0, testing_1.expect)({ at: "".concat(surface, " ").concat(width, " ").concat(name_2), frames: frames(tree) }).toEqual({ at: "".concat(surface, " ").concat(width, " ").concat(name_2), frames: surface === 'desktop' ? 1 : 0 });
                if (!(name_2 === 'discover sort open')) return [3 /*break*/, 10];
                return [4 /*yield*/, p.press({ key: 'sort' })];
            case 9:
                _f.sent();
                _f.label = 10;
            case 10: return [4 /*yield*/, p.unmount()];
            case 11:
                _f.sent();
                _f.label = 12;
            case 12:
                _c++;
                return [3 /*break*/, 4];
            case 13:
                _a++;
                return [3 /*break*/, 3];
            case 14:
                _i++;
                return [3 /*break*/, 2];
            case 15: return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('wide panes keep Discover tight: rows capped, name, numbers and the 24h shape side by side, the star inside', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, SURFACES_5, surface, p, _a, _b, i, row, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                world(on);
                return [4 /*yield*/, fill($)];
            case 1:
                _d.sent();
                _i = 0, SURFACES_5 = SURFACES;
                _d.label = 2;
            case 2:
                if (!(_i < SURFACES_5.length)) return [3 /*break*/, 12];
                surface = SURFACES_5[_i];
                return [4 /*yield*/, pane($, surface, 160, 'discover')];
            case 3:
                p = _d.sent();
                _a = 0, _b = ['list', 'table'].entries();
                _d.label = 4;
            case 4:
                if (!(_a < _b.length)) return [3 /*break*/, 9];
                i = _b[_a][0];
                return [4 /*yield*/, p.post({ pick: i }, { in: 'view' })];
            case 5:
                _d.sent();
                return [4 /*yield*/, p.find({ key: i === 0 ? "L-".concat(BONK.id) : "r-".concat(BONK.id) })];
            case 6:
                row = (_d.sent());
                // A row is a fixed width well inside the pane, so the price sits next to the name.
                (0, testing_1.expect)(typeof row.props.width).toBe('number');
                (0, testing_1.expect)(Number(row.props.width)).toBeLessThanOrEqual(96);
                _c = testing_1.expect;
                return [4 /*yield*/, p.find({ key: "star-".concat(BONK.id) })];
            case 7:
                _c.apply(void 0, [_d.sent()]).toBeDefined();
                _d.label = 8;
            case 8:
                _a++;
                return [3 /*break*/, 4];
            case 9: return [4 /*yield*/, p.unmount()];
            case 10:
                _d.sent();
                _d.label = 11;
            case 11:
                _i++;
                return [3 /*break*/, 2];
            case 12: return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('a pill is one row of padded options with space between, the chosen one a soft highlight, and a click maps to the option under it', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, SURFACES_6, surface, p, client, drawn, opts, _a, opts_1, o, chosen, _b, _c, _d;
    var _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                world(on);
                return [4 /*yield*/, fill($)];
            case 1:
                _g.sent();
                _i = 0, SURFACES_6 = SURFACES;
                _g.label = 2;
            case 2:
                if (!(_i < SURFACES_6.length)) return [3 /*break*/, 15];
                surface = SURFACES_6[_i];
                return [4 /*yield*/, pane($, surface, 100, 'trade')];
            case 3:
                p = _g.sent();
                return [4 /*yield*/, p.find({ key: 'rng' })];
            case 4:
                client = (_g.sent());
                return [4 /*yield*/, p.drawn({ in: 'rng' })];
            case 5:
                drawn = (_g.sent());
                opts = kids(drawn);
                (0, testing_1.expect)(opts.map(function (o) { return textOf(o).trim(); })).toEqual(['1h', '24h', '7d', '30d']);
                // Padded: each option wider than its label; spaced: a gap between options.
                for (_a = 0, opts_1 = opts; _a < opts_1.length; _a++) {
                    o = opts_1[_a];
                    (0, testing_1.expect)(Number(o.props.width)).toBeGreaterThan(cells(textOf(o).trim()));
                }
                (0, testing_1.expect)(num((_e = drawn.props.gap) !== null && _e !== void 0 ? _e : drawn.props.columnGap)).toBeGreaterThanOrEqual(1);
                (0, testing_1.expect)(opts.reduce(function (a, o) { return a + Number(o.props.width); }, 0) + (opts.length - 1) * num((_f = drawn.props.gap) !== null && _f !== void 0 ? _f : drawn.props.columnGap)).toBe(Number(client.props.width));
                chosen = opts[1];
                (0, testing_1.expect)(chosen.props.backgroundColor).not.toBe('#d4bf7c');
                (0, testing_1.expect)(chosen.props.backgroundColor).toBeDefined();
                // A click on the last cell of 30d picks 30d, the 4th option; one on 1h's first cell picks 1h.
                return [4 /*yield*/, p.pointer({ type: 'down', x: Number(client.props.width) - 1, y: 0, button: 'left', in: 'rng' })];
            case 6:
                // A click on the last cell of 30d picks 30d, the 4th option; one on 1h's first cell picks 1h.
                _g.sent();
                _b = testing_1.expect;
                return [4 /*yield*/, p.find({ key: 'rng' })];
            case 7:
                _b.apply(void 0, [(_g.sent()).props.props.value]).toBe(3);
                return [4 /*yield*/, p.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'rng' })];
            case 8:
                _g.sent();
                _c = testing_1.expect;
                return [4 /*yield*/, p.find({ key: 'rng' })];
            case 9:
                _c.apply(void 0, [(_g.sent()).props.props.value]).toBe(0);
                return [4 /*yield*/, p.pointer({ type: 'down', x: 999, y: 0, button: 'left', in: 'rng' })];
            case 10:
                _g.sent();
                return [4 /*yield*/, p.pointer({ type: 'down', x: 6, y: 0, button: 'left', in: 'rng' })];
            case 11:
                _g.sent();
                _d = testing_1.expect;
                return [4 /*yield*/, p.find({ key: 'rng' })];
            case 12:
                _d.apply(void 0, [(_g.sent()).props.props.value]).toBe(1);
                return [4 /*yield*/, p.unmount()];
            case 13:
                _g.sent();
                _g.label = 14;
            case 14:
                _i++;
                return [3 /*break*/, 2];
            case 15: return [2 /*return*/];
        }
    });
}); });
(0, testing_1.test)('chart labels use the app font at a legible size, not tiny monospace', function ($, on) { return __awaiter(void 0, void 0, void 0, function () {
    var p, svg, _a, sizes;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                world(on);
                return [4 /*yield*/, fill($)];
            case 1:
                _c.sent();
                return [4 /*yield*/, pane($, 'desktop', 100, 'trade')];
            case 2:
                p = _c.sent();
                _a = String;
                return [4 /*yield*/, p.findAll({ type: 'Svg' })];
            case 3:
                svg = _a.apply(void 0, [(_b = (_c.sent()).find(function (x) { return String(x.props.alt).startsWith('price over'); })) === null || _b === void 0 ? void 0 : _b.props.source]);
                (0, testing_1.expect)(svg).toContain('</text>');
                (0, testing_1.expect)(svg).not.toMatch(/monospace/);
                sizes = __spreadArray([], svg.matchAll(/font-size="([\d.]+)"/g), true).map(function (m) { return Number(m[1]); });
                (0, testing_1.expect)(sizes.length).toBeGreaterThan(0);
                (0, testing_1.expect)(Math.min.apply(Math, sizes)).toBeGreaterThanOrEqual(11);
                return [4 /*yield*/, p.unmount()];
            case 4:
                _c.sent();
                return [2 /*return*/];
        }
    });
}); });
