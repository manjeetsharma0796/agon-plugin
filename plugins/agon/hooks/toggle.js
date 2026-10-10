"use strict";
// Agon's on/off switch, as a trading app draws an agent's kill switch: a track with a knob, green with
// the knob at the right when on, grey with it at the left when off, and On or Off beside it so the
// state never rests on colour alone. A click, or Enter or space while it holds the focus, flips it at
// once on screen and posts the new state to the hooks module, which owns the bot and redraws from it.
Object.defineProperty(exports, "__esModule", { value: true });
var UP = '#3fbf8f';
var LINE = '#2f3239';
var FG = '#ffffff';
var DIM = '#8f9096';
var Toggle = function (p, s) {
    var _a = s.elements, Box = _a.Box, Text = _a.Text;
    // A local flip stands only while the props still hold the state it was made over.
    var on = s.state && s.state.was === p.on ? s.state.on : p.on;
    var flip = function () {
        s.setState({ on: !on, was: p.on });
        s.post({ on: !on });
    };
    s.onPointer(function (ev) {
        if (ev.type === 'down' && ev.button === 'left')
            flip();
    });
    s.onKey(function (k) {
        if (k.key === 'return' || k.key === ' ')
            flip();
    });
    return Box({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1,
        children: [
            Box({
                key: 'track',
                width: 4,
                flexShrink: 0,
                flexDirection: 'row',
                justifyContent: on ? 'flex-end' : 'flex-start',
                backgroundColor: on ? UP : LINE,
                children: Text({ color: FG, bold: true, children: '●' }),
            }),
            Text({ key: 'word', color: on ? UP : DIM, bold: on, children: on ? 'On' : 'Off' }),
        ],
    });
};
exports.default = Toggle;
