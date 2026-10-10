"use strict";
// The layout bar: every section of a pane as a tile in its lane, Left or Right. Drag a tile to move
// it, inside its lane or across to the other; click a tile to hide or show it. With the focus, up
// and down pick a tile, left and right move it, space hides it. Tiles are boxes a fixed number of
// cells wide, so a pointer lands on the same tile on every surface, whatever width a font draws.
// The hint that says so is drawn by the hooks module under the bar, where it can wrap.
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
// The divider between the lanes in a posted sequence; the hooks module splits on the same mark.
var CUT = '|';
var GOLD = '#d4bf7c';
var RAISE = '#141417';
var DIM = '#8f9096';
var INK = '#050506';
var FG = '#ffffff';
var LEAD = 5;
var CUT_W = 6;
var Layout = function (p, s) {
    var _a;
    var _b = s.elements, Box = _b.Box, Text = _b.Text;
    var name = {};
    for (var _i = 0, _c = __spreadArray(__spreadArray([], p.main, true), p.side, true); _i < _c.length; _i++) {
        var t = _c[_i];
        name[t.id] = t.label;
    }
    var base = __spreadArray(__spreadArray(__spreadArray([], p.main.map(function (t) { return t.id; }), true), [CUT], false), p.side.map(function (t) { return t.id; }), true);
    var key = base.join(',');
    var st = (_a = s.state) !== null && _a !== void 0 ? _a : { drag: null, x0: 0, seq: null, was: key, pick: null };
    // A local order stands only until the props move on from the order it was made over.
    var seq = st.seq && st.was === key ? st.seq : base;
    var w = function (id) { var _a, _b; return (id === CUT ? CUT_W : ((_b = (_a = name[id]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 4) + 2); };
    var lefts = function (items) {
        var x = LEAD;
        return items.map(function (id) {
            var at = x;
            x += w(id) + 1;
            return at;
        });
    };
    var hit = function (x) {
        var _a;
        var xs = lefts(seq);
        return (_a = seq.find(function (id, i) { return id !== CUT && x >= xs[i] && x < xs[i] + w(id); })) !== null && _a !== void 0 ? _a : null;
    };
    // Where a dragged tile lands: before the first other item whose middle is right of the pointer.
    var place = function (id, x) {
        var rest = seq.filter(function (v) { return v !== id; });
        var xs = lefts(rest);
        var i = rest.findIndex(function (v, k) { return x < xs[k] + w(v) / 2; });
        var at = i < 0 ? rest.length : i;
        return __spreadArray(__spreadArray(__spreadArray([], rest.slice(0, at), true), [id], false), rest.slice(at), true);
    };
    // Set on every call, so a listener always maps through the order drawn now.
    s.onPointer(function (ev) {
        var _a;
        var cur = (_a = s.state) !== null && _a !== void 0 ? _a : st;
        if (ev.type === 'down' && ev.button === 'left') {
            var id = hit(ev.x);
            if (id)
                s.setState(__assign(__assign({}, cur), { drag: id, x0: ev.x, seq: null, was: key, pick: id }));
        }
        else if (ev.type === 'move' && cur.drag && Math.abs(ev.x - cur.x0) >= 2)
            s.setState(__assign(__assign({}, cur), { seq: place(cur.drag, ev.x), was: key }));
        else if (ev.type === 'up' && cur.drag) {
            if (cur.seq)
                s.post({ seq: cur.seq });
            else
                s.post({ toggle: cur.drag });
            s.setState(__assign(__assign({}, cur), { drag: null }));
        }
    });
    s.onKey(function (k) {
        var _a;
        var cur = (_a = s.state) !== null && _a !== void 0 ? _a : st;
        var tiles = seq.filter(function (v) { return v !== CUT; });
        var id = cur.pick && tiles.includes(cur.pick) ? cur.pick : tiles[0];
        if (!id)
            return;
        if (k.key === 'up' || k.key === 'down') {
            var i = tiles.indexOf(id);
            s.setState(__assign(__assign({}, cur), { pick: tiles[(i + (k.key === 'down' ? 1 : tiles.length - 1)) % tiles.length] }));
        }
        else if (k.key === 'left' || k.key === 'right') {
            var i = seq.indexOf(id);
            var j = i + (k.key === 'right' ? 1 : -1);
            if (j < 0 || j >= seq.length)
                return;
            var next = __spreadArray([], seq, true);
            next[i] = next[j];
            next[j] = id;
            s.setState(__assign(__assign({}, cur), { seq: next, was: key, pick: id }));
            s.post({ seq: next });
        }
        else if (k.key === ' ' || k.key === 'return')
            s.post({ toggle: id });
    });
    var hidden = new Set(p.hidden);
    var tile = function (id) {
        var _a;
        return id === CUT
            ? Box({ key: 'cut', width: CUT_W, children: Text({ color: DIM, children: ' Right' }) })
            : Box({
                key: "t-".concat(id),
                width: w(id),
                backgroundColor: st.drag === id ? GOLD : RAISE,
                children: Text({
                    color: st.drag === id ? INK : hidden.has(id) ? DIM : st.pick === id ? GOLD : FG,
                    strikethrough: hidden.has(id),
                    wrap: 'truncate-end',
                    children: " ".concat((_a = name[id]) !== null && _a !== void 0 ? _a : id),
                }),
            });
    };
    return Box({
        flexDirection: 'row',
        gap: 1,
        children: __spreadArray([
            Box({ key: 'lead', width: LEAD - 1, children: Text({ color: DIM, children: 'Left' }) })
        ], seq.map(tile), true),
    });
};
exports.default = Layout;
