"use strict";
// Agon's one-of-N pill: one row of options, each its label with a cell of padding either side and a
// cell between options. The chosen one sits on a soft raised ground in gold, the others dim and lift
// to that ground under the pointer. Click an option, or focus the pill and use the arrow keys or
// space. The choice is posted to the hooks module; a click maps to the option under it by the same
// widths drawn here. A click on the option already chosen is posted too, so picking the same source
// again reloads it. `compact` drops the cell between options, for a pane too narrow for the gaps.
// `outlined` draws each option in its own rounded border, gold on the chosen one, so every option
// reads as something to press; each then takes 2 more cells and 3 rows.
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
var GOLD = '#d4bf7c';
var RAISE = '#141417';
var DIM = '#8f9096';
var FG = '#ffffff';
var LINE = '#2f3239';
var Switch = function (p, s) {
    var _a = s.elements, Box = _a.Box, Text = _a.Text;
    var n = Math.max(1, p.options.length);
    var widths = p.options.map(function (l) { return __spreadArray([], l, true).length + 2 + (p.outlined ? 2 : 0); });
    var gap = p.compact ? 0 : 1;
    // A local choice stands only while the props still hold the value it was made over.
    var v = s.state && s.state.was === p.value ? s.state.v : p.value;
    var choose = function (i, again) {
        if (again === void 0) { again = false; }
        var next = Math.min(n - 1, Math.max(0, i));
        if (next === v && !again)
            return;
        if (next !== v)
            s.setState({ v: next, was: p.value });
        s.post({ pick: next });
    };
    // The option under a column: each option owns its cells and the gap after it.
    var at = function (x) {
        var _a;
        var end = 0;
        for (var i = 0; i < n; i++) {
            end += ((_a = widths[i]) !== null && _a !== void 0 ? _a : 2) + (i < n - 1 ? gap : 0);
            if (x < end)
                return i;
        }
        return n - 1;
    };
    // Set on every call, so the listeners always read the choice drawn now. The highlight moves on the
    // press itself, before the hooks module answers: that is the pressed feedback.
    s.onPointer(function (ev) {
        if (ev.type === 'down' && ev.button === 'left')
            choose(at(ev.x), true);
    });
    s.onKey(function (k) {
        if (k.key === 'left')
            choose(v - 1);
        else if (k.key === 'right')
            choose(v + 1);
        else if (k.key === ' ' || k.key === 'return')
            choose((v + 1) % n);
    });
    return Box({
        flexDirection: 'row',
        alignItems: 'center',
        gap: gap,
        children: p.options.map(function (label, i) {
            return Box(__assign(__assign({ key: "o-".concat(i), width: widths[i], flexShrink: 0, justifyContent: 'center' }, (p.outlined ? { borderStyle: 'round', borderColor: i === v ? GOLD : LINE } : {})), { backgroundColor: i === v ? RAISE : undefined, hover: i === v ? undefined : { backgroundColor: RAISE }, children: Text({ color: i === v ? GOLD : DIM, bold: i === v, hover: i === v ? undefined : { color: FG }, children: label }) }));
        }),
    });
};
exports.default = Switch;
