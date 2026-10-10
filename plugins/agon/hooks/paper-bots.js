"use strict";
// The paper bots' rules and books: plain data in, a decision or a new bot out, no network and no
// clock of their own. register.tsx runs them on a timer against live Jupiter prices and sends what
// they decide to the Agon server's paper_trade. Money is in base units, as BigInt.
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
exports.sliceOf = exports.priceOf = exports.newBook = exports.microOf = exports.PAUSE_AFTER = exports.backoffMs = exports.EVENTS_KEPT = exports.FILLS_KEPT = exports.MIN_ORDER = exports.TICK_MS = exports.usd = exports.grouped = void 0;
exports.applyFill = applyFill;
exports.pnlOf = pnlOf;
exports.decide = decide;
exports.recordFill = recordFill;
exports.recordMiss = recordMiss;
exports.isBot = isBot;
// Thousands grouped in the integer part alone, as a terminal shows money: 1234.5 reads 1,234.5.
var grouped = function (n) { return n.replace(/^(-?\d+)/, function (m) { return m.replace(/\B(?=(\d{3})+$)/g, ','); }); };
exports.grouped = grouped;
// Under half a cent reads $0.00, never -$0.00.
var usd = function (v) { return "".concat(v <= -0.005 ? '-' : '', "$").concat((0, exports.grouped)(Math.abs(v).toFixed(2))); };
exports.usd = usd;
// A bot asks for live prices on this beat, one Jupiter call for every bot's token together.
exports.TICK_MS = 30000;
// No order under 1 USDC: what is left of a budget below it is left unspent.
exports.MIN_ORDER = 1000000n;
exports.FILLS_KEPT = 50;
exports.EVENTS_KEPT = 20;
// After a refusal or an error the bot waits 2, 4, 8, 16 then 30 minutes before it asks again.
var backoffMs = function (strikes) { return Math.min(30 * 60000, 2 * 60000 * Math.pow(2, Math.max(0, strikes - 1))); };
exports.backoffMs = backoffMs;
// Buys refused this many times in a row pause the bot; a sell never pauses, it keeps its stop.
exports.PAUSE_AFTER = 3;
var USDC_ONE = 1000000n;
var microOf = function (dollars) { return BigInt(Math.round(dollars)) * USDC_ONE; };
exports.microOf = microOf;
var big = function (s) { return BigInt(s); };
var minutes = function (ms) { return Math.max(1, Math.ceil(ms / 60000)); };
var newBook = function () { return ({ spent: '0', received: '0', held: '0', cost: '0', realized: '0', buys: 0, sells: 0 }); };
exports.newBook = newBook;
// One fill on the books, at average cost: a buy adds its units and what it cost; a sell takes its
// share of the cost off (all of it when it sells all) and realizes what it got against that share.
function applyFill(b, side, usdc, units) {
    if (side === 'buy')
        return __assign(__assign({}, b), { spent: String(big(b.spent) + usdc), held: String(big(b.held) + units), cost: String(big(b.cost) + usdc), buys: b.buys + 1 });
    var held = big(b.held);
    var q = units > held ? held : units;
    var off = held > 0n ? (big(b.cost) * q) / held : 0n;
    return __assign(__assign({}, b), { received: String(big(b.received) + usdc), held: String(held - q), cost: String(big(b.cost) - off), realized: String(big(b.realized) + usdc - off), sells: b.sells + 1 });
}
// USDC per whole token, from base units.
var priceOf = function (usdc, units, decimals) { return (units > 0n ? Number(usdc) / 1e6 / (Number(units) / Math.pow(10, decimals)) : 0); };
exports.priceOf = priceOf;
// The books valued at a live price: realized is exact, unrealized is what is held at that price
// against its cost. With units held and no price, unrealized and total are unknown (null).
function pnlOf(b, decimals, price, budget) {
    var realized = Number(big(b.realized)) / 1e6;
    var held = big(b.held);
    var value = held === 0n ? 0 : price == null ? null : (Number(held) / Math.pow(10, decimals)) * price;
    var unrealized = value == null ? null : held === 0n ? 0 : value - Number(big(b.cost)) / 1e6;
    var total = unrealized == null ? null : realized + unrealized;
    return { realized: realized, unrealized: unrealized, total: total, roi: total == null || budget <= 0 ? null : (total / budget) * 100, value: value };
}
// A DCA slice: the budget over the orders, never past the cap.
var sliceOf = function (b) {
    var even = (0, exports.microOf)(b.budget) / BigInt(Math.max(1, b.p2));
    var cap = (0, exports.microOf)(b.cap);
    return even < cap ? even : cap;
};
exports.sliceOf = sliceOf;
// What the rule says at this price and time. Pure arithmetic on the bot's own books.
function decide(b, price, now) {
    var _a;
    var held = big(b.book.held);
    if (b.strategy === 'dca') {
        var budget = (0, exports.microOf)(b.budget);
        var left = budget - big(b.book.spent);
        if (left < exports.MIN_ORDER)
            return { kind: 'done', why: "budget spent: ".concat((0, exports.usd)(Number(big(b.book.spent)) / 1e6), " of ").concat((0, exports.usd)(b.budget)) };
        if (now < b.retryAt)
            return { kind: 'wait', why: waitWords(b, now) };
        if (now < b.nextAt)
            return { kind: 'wait', why: "next slice in ".concat(minutes(b.nextAt - now), " min") };
        var slice = (0, exports.sliceOf)(b);
        var of = Number((budget + slice - 1n) / slice);
        return { kind: 'order', side: 'buy', amount: left < slice ? left : slice, why: "slice ".concat(b.book.buys + 1, " of ").concat(of) };
    }
    if (held === 0n && b.book.buys > 0)
        return { kind: 'done', why: 'sold out after its exit' };
    if (now < b.retryAt)
        return { kind: 'wait', why: waitWords(b, now) };
    if (held === 0n) {
        var budget = (0, exports.microOf)(b.budget);
        var cap = (0, exports.microOf)(b.cap);
        return { kind: 'order', side: 'buy', amount: budget < cap ? budget : cap, why: 'entry' };
    }
    var entry = (0, exports.priceOf)(big(b.book.cost), held, b.decimals);
    var peak = Math.max((_a = b.peak) !== null && _a !== void 0 ? _a : price, price);
    if (price <= (entry * (100 - b.p2)) / 100)
        return { kind: 'order', side: 'sell', amount: held, why: "hard stop: ".concat((0, exports.usd)(price), " is ").concat(((1 - price / entry) * 100).toFixed(1), "% under the ").concat((0, exports.usd)(entry), " entry") };
    if (price <= (peak * (100 - b.p1)) / 100)
        return { kind: 'order', side: 'sell', amount: held, why: "trail: ".concat((0, exports.usd)(price), " is ").concat(((1 - price / peak) * 100).toFixed(1), "% off the ").concat((0, exports.usd)(peak), " peak") };
    return { kind: 'wait', why: "holding; exits at ".concat((0, exports.usd)(Math.max((peak * (100 - b.p1)) / 100, (entry * (100 - b.p2)) / 100))) };
}
var waitWords = function (b, now) { return "asks again in ".concat(minutes(b.retryAt - now), " min, after ").concat(b.strikes, " ").concat(b.strikes === 1 ? 'refusal' : 'refusals'); };
// A fill the server recorded, on the bot: its books, its last fills, the next slice's time, the peak
// a trail starts from, and done once the rule has nothing left to do.
function recordFill(b, f, now, price) {
    var book = applyFill(b.book, f.side, f.usdc, f.units);
    var fill = { at: now, side: f.side, usdc: String(f.usdc), units: String(f.units), price: (0, exports.priceOf)(f.usdc, f.units, b.decimals), slot: f.slot, stamp: f.stamp, why: f.why };
    var next = __assign(__assign({}, b), { book: book, fills: __spreadArray(__spreadArray([], b.fills, true), [fill], false).slice(-exports.FILLS_KEPT), strikes: 0, retryAt: 0, why: null, nextAt: now + b.p1 * 60000 });
    if (b.strategy === 'trail')
        next.peak = f.side === 'buy' ? price : null;
    var done = b.strategy === 'dca' ? (0, exports.microOf)(b.budget) - big(book.spent) < exports.MIN_ORDER : f.side === 'sell' && big(book.held) === 0n;
    return done ? __assign(__assign({}, next), { status: 'done' }) : next;
}
// A refusal or an error: kept with its reasons, and the bot waits longer each time before it asks
// again. Buys refused PAUSE_AFTER times in a row pause it, with why.
function recordMiss(b, side, ev, now) {
    var strikes = b.strikes + 1;
    var next = __assign(__assign({}, b), { events: __spreadArray(__spreadArray([], b.events, true), [__assign(__assign({}, ev), { at: now })], false).slice(-exports.EVENTS_KEPT), strikes: strikes, retryAt: now + (0, exports.backoffMs)(strikes) });
    return side === 'buy' && strikes >= exports.PAUSE_AFTER
        ? __assign(__assign({}, next), { status: 'paused', why: "Paused after ".concat(strikes, " refusals in a row. Read the last reason, change the bot, then resume it.") }) : next;
}
// A bot read back from the store, checked field by field; anything else (an old demo bot) is dropped.
var isDigits = function (v, signed) {
    if (signed === void 0) { signed = false; }
    return typeof v === 'string' && (signed ? /^-?\d{1,30}$/ : /^\d{1,30}$/).test(v);
};
var isNum = function (v) { return typeof v === 'number' && Number.isFinite(v); };
function isBot(v) {
    if (typeof v !== 'object' || v === null)
        return false;
    var b = v;
    var book = b.book;
    return ((b.strategy === 'dca' || b.strategy === 'trail') &&
        typeof b.id === 'string' &&
        typeof b.mint === 'string' &&
        /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(b.mint) &&
        typeof b.symbol === 'string' &&
        (b.status === 'running' || b.status === 'paused' || b.status === 'done') &&
        [b.budget, b.p1, b.p2, b.cap, b.created, b.decimals, b.nextAt, b.retryAt, b.strikes].every(isNum) &&
        typeof book === 'object' &&
        book !== null &&
        isDigits(book.spent) &&
        isDigits(book.received) &&
        isDigits(book.held) &&
        isDigits(book.cost) &&
        isDigits(book.realized, true) &&
        isNum(book.buys) &&
        isNum(book.sells) &&
        Array.isArray(b.fills) &&
        Array.isArray(b.events));
}
