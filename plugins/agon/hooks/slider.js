"use strict";
// A draggable slider in the Agon theme: drag or click the track, or focus it and use the arrow
// keys. The value lives here while dragging and is posted to the hooks module on release, so a
// drag redraws only this region, not the pane.
Object.defineProperty(exports, "__esModule", { value: true });
var EMBER = '#d4bf7c';
var TRACK = '#2f3239';
var TRACK_FILL = '#1d1f24';
var DIM = '#8f9096';
var LABEL_W = 9;
var VALUE_W = 9;
var Slider = function (p, s) {
    var _a, _b, _c;
    var _d = s.elements, Box = _d.Box, Text = _d.Text;
    var snap = function (x) { return Math.min(p.max, Math.max(p.min, Math.round(x / p.step) * p.step)); };
    var trackW = Math.max(8, s.columns - LABEL_W - VALUE_W);
    var at = function (col) { return snap(p.min + ((col - LABEL_W) / Math.max(1, trackW - 1)) * (p.max - p.min)); };
    // A local value stands only while the props still hold the value it was made over: a strategy
    // switch, or the hooks module taking the posted value, moves the props on.
    var v = s.state && s.state.was === p.value ? s.state.v : p.value;
    // Set on every call, so a drag maps through the range drawn now, not the first one.
    s.onPointer(function (ev) {
        var _a;
        var drag = ((_a = s.state) === null || _a === void 0 ? void 0 : _a.drag) === true && s.state.was === p.value;
        if (ev.type === 'down' && ev.button === 'left')
            s.setState({ v: at(ev.x), drag: true, was: p.value });
        else if (ev.type === 'move' && drag)
            s.setState({ v: at(ev.x), drag: true, was: p.value });
        else if (ev.type === 'up' && drag) {
            var next = at(ev.x);
            s.setState({ v: next, drag: false, was: p.value });
            s.post({ value: next });
        }
    });
    s.onKey(function (k) {
        var d = k.key === 'right' || k.key === 'up' ? p.step : k.key === 'left' || k.key === 'down' ? -p.step : 0;
        if (d === 0)
            return;
        var next = snap(v + (k.shift ? d * 10 : d));
        s.setState({ v: next, drag: false, was: p.value });
        s.post({ value: next });
    });
    var share = Math.min(1, Math.max(0, (v - p.min) / Math.max(p.step, p.max - p.min)));
    var digits = v.toFixed((_a = p.decimals) !== null && _a !== void 0 ? _a : 0).replace(/^(-?\d+)/, function (m) { return m.replace(/\B(?=(\d{3})+$)/g, ','); });
    var knob = Text({ color: EMBER, bold: true, children: '●' });
    // The terminal draws a cell per glyph, so the track is counted there. A desktop draws ━ wider
    // than a cell, and a block holding a run of them will not shrink but crushes the value beside
    // it; there the track is two solid capsules sized by share, gold then dark, a white knob between.
    var track;
    if (p.surface === 'terminal') {
        var fill = Math.round(share * (trackW - 1));
        track = Box({
            flexDirection: 'row',
            children: [Text({ color: EMBER, children: '━'.repeat(fill) }), knob, Text({ color: TRACK, children: '━'.repeat(Math.max(0, trackW - fill - 1)) })],
        });
    }
    else
        track = Box({
            flexGrow: 1,
            flexDirection: 'row',
            alignItems: 'center',
            children: [
                Box({ width: "".concat(Math.round(share * 100), "%"), borderStyle: 'round', borderColor: EMBER, backgroundColor: EMBER }),
                Text({ color: '#ffffff', bold: true, children: '●' }),
                Box({ flexGrow: 1, borderStyle: 'round', borderColor: TRACK, backgroundColor: TRACK_FILL }),
            ],
        });
    return Box({
        flexDirection: 'row',
        alignItems: 'center',
        children: [
            Box({ width: LABEL_W, flexShrink: 0, children: Text({ color: DIM, wrap: 'truncate-end', children: p.label }) }),
            track,
            Box({ width: VALUE_W, flexShrink: 0, justifyContent: 'flex-end', children: Text({ bold: true, children: "".concat((_b = p.prefix) !== null && _b !== void 0 ? _b : '').concat(digits).concat((_c = p.suffix) !== null && _c !== void 0 ? _c : '') }) }),
        ],
    });
};
exports.default = Slider;
